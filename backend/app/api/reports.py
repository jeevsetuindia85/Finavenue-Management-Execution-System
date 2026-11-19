import io
import csv
from datetime import date, datetime, timedelta
from typing import Optional, Literal
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.goal import Goal, GoalMilestone
from app.models.activity import Activity
from app.models.hiring import HiringAgency, Candidate, ProfessionalReference, Conference
from app.models.expansion import OfficeLocation, CoworkingProvider, SiteVisit
from app.models.product import Product, ProductMilestone
from app.models.review import WeeklyReview, ActionItem

import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

router = APIRouter(prefix="/reports", tags=["Reports & Analytics"])

# --- EXCEL EXPORT (.xlsx) ---
@router.get("/export/excel")
async def export_excel_report(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    wb = openpyxl.Workbook()
    # Remove default sheet
    wb.remove(wb.active)
    
    header_fill = PatternFill(start_color="0F172A", end_color="0F172A", fill_type="solid")
    header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
    title_font = Font(name="Calibri", size=14, bold=True, color="0F172A")
    border_thin = Border(
        left=Side(style='thin', color='E2E8F0'),
        right=Side(style='thin', color='E2E8F0'),
        top=Side(style='thin', color='E2E8F0'),
        bottom=Side(style='thin', color='E2E8F0')
    )
    
    # 1. Executive Summary Sheet
    ws_exec = wb.create_sheet(title="Executive Summary")
    ws_exec.append(["ExecFlow — Executive Management Execution Report"])
    ws_exec["A1"].font = title_font
    ws_exec.append([f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} by {current_user.full_name} ({current_user.role})"])
    ws_exec.append([])
    
    # KPIs
    today = date.today()
    goals_res = await db.execute(select(Goal))
    goals = goals_res.scalars().all()
    acts_res = await db.execute(select(Activity))
    acts = acts_res.scalars().all()
    revs_res = await db.execute(select(WeeklyReview))
    revs = revs_res.scalars().all()
    
    ws_exec.append(["Metric", "Value"])
    for cell in ws_exec[4]:
        cell.fill = header_fill
        cell.font = header_font
        
    ws_exec.append(["Total Active Goals", len([g for g in goals if g.status != 'archived'])])
    ws_exec.append(["Completed Goals", len([g for g in goals if g.status == 'completed'])])
    ws_exec.append(["Goals at Risk", len([g for g in goals if g.status == 'at_risk'])])
    ws_exec.append(["Total Tracked Activities", len(acts)])
    ws_exec.append(["Completed Activities", len([a for a in acts if a.status == 'completed'])])
    ws_exec.append(["Overdue Activities", len([a for a in acts if a.due_date and a.due_date < today and a.status != 'completed'])])
    ws_exec.append(["Weekly Reviews Conducted", len([r for r in revs if r.conducted])])
    
    # 2. Goals Sheet
    ws_goals = wb.create_sheet(title="Goals Master")
    headers_goals = ["Goal Code", "Goal Name", "Priority", "Status", "Start Date", "Target Date", "Annual Target"]
    ws_goals.append(headers_goals)
    for col_idx, cell in enumerate(ws_goals[1], 1):
        cell.fill = header_fill
        cell.font = header_font
    for g in goals:
        ws_goals.append([g.goal_code, g.name, g.priority, g.status, str(g.start_date or ''), str(g.target_completion_date or ''), g.annual_target or ''])

    # 3. Activities Sheet
    ws_acts = wb.create_sheet(title="Activities")
    headers_acts = ["Activity Name", "Module", "Priority", "Status", "RAG", "Due Date", "Target Qty", "Actual Qty"]
    ws_acts.append(headers_acts)
    for col_idx, cell in enumerate(ws_acts[1], 1):
        cell.fill = header_fill
        cell.font = header_font
    for a in acts:
        ws_acts.append([a.name, a.module or 'general', a.priority, a.status, a.rag_status, str(a.due_date or ''), a.target_quantity or 0, a.actual_quantity])

    # 4. Hiring Sheet
    ws_hire = wb.create_sheet(title="Hiring Pipeline")
    ag_res = await db.execute(select(HiringAgency))
    agencies = ag_res.scalars().all()
    ws_hire.append(["Agency Name", "Position Assigned", "Status", "Target CVs", "Total Received", "Last CV Date", "Next Follow-up"])
    for cell in ws_hire[1]:
        cell.fill = header_fill
        cell.font = header_font
    for ag in agencies:
        ws_hire.append([ag.name, ag.position_assigned, ag.status, ag.target_cvs or 0, ag.total_cvs_received, str(ag.last_cv_received_date or ''), str(ag.next_followup_date or '')])
        
    cand_res = await db.execute(select(Candidate))
    candidates = cand_res.scalars().all()
    ws_hire.append([])
    ws_hire.append(["Candidate Name", "Position", "Source", "Current Stage", "Offer Status", "Joining Date"])
    header_row_idx = ws_hire.max_row
    for cell in ws_hire[header_row_idx]:
        cell.fill = header_fill
        cell.font = header_font
    for c in candidates:
        ws_hire.append([c.full_name, c.position, c.source_type, c.current_stage, c.offer_status or '', str(c.joining_date or '')])

    # 5. Office Expansion Sheet
    ws_exp = wb.create_sheet(title="Office Expansion")
    loc_res = await db.execute(select(OfficeLocation).options(selectinload(OfficeLocation.providers)))
    locations = loc_res.scalars().all()
    ws_exp.append(["City", "Status", "Target Operational Date", "Actual Operational Date", "Target BD Team", "Current BD Team"])
    for cell in ws_exp[1]:
        cell.fill = header_fill
        cell.font = header_font
    for loc in locations:
        ws_exp.append([loc.city, loc.status, str(loc.target_operational_date or ''), str(loc.actual_operational_date or ''), loc.bd_target_headcount or 0, loc.bd_current_headcount])
        
    # Auto-adjust column widths
    for sheet in wb.worksheets:
        for col in sheet.columns:
            max_len = max(len(str(cell.value or '')) for cell in col)
            col_letter = openpyxl.utils.get_column_letter(col[0].column)
            sheet.column_dimensions[col_letter].width = max(max_len + 3, 12)

    output = io.BytesIO()
    wb.save(output)
    output.seek(0)
    
    filename = f"ExecFlow_Management_Report_{datetime.now().strftime('%Y%m%d')}.xlsx"
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

# --- CSV EXPORT ---
@router.get("/export/csv")
async def export_csv_report(
    entity: Literal["activities", "candidates", "agencies", "reviews"] = Query("activities"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    output = io.StringIO()
    writer = csv.writer(output)
    
    if entity == "activities":
        writer.writerow(["ID", "Activity Name", "Module", "Priority", "Status", "RAG", "Due Date", "Target Qty", "Actual Qty"])
        res = await db.execute(select(Activity).order_by(Activity.due_date))
        for a in res.scalars().all():
            writer.writerow([a.id, a.name, a.module, a.priority, a.status, a.rag_status, a.due_date, a.target_quantity, a.actual_quantity])
    elif entity == "candidates":
        writer.writerow(["ID", "Name", "Position", "Source", "Stage", "Offer Status", "Joining Date"])
        res = await db.execute(select(Candidate).order_by(Candidate.created_at.desc()))
        for c in res.scalars().all():
            writer.writerow([c.id, c.full_name, c.position, c.source_type, c.current_stage, c.offer_status, c.joining_date])
    elif entity == "agencies":
        writer.writerow(["ID", "Agency Name", "Position Assigned", "Status", "Target CVs", "Total Received", "Next Followup"])
        res = await db.execute(select(HiringAgency).order_by(HiringAgency.name))
        for ag in res.scalars().all():
            writer.writerow([ag.id, ag.name, ag.position_assigned, ag.status, ag.target_cvs, ag.total_cvs_received, ag.next_followup_date])
    elif entity == "reviews":
        writer.writerow(["ID", "Week Start", "Scheduled Date", "Actual Meeting Date", "Status", "Conducted", "Decisions"])
        res = await db.execute(select(WeeklyReview).order_by(WeeklyReview.week_start_date.desc()))
        for r in res.scalars().all():
            writer.writerow([r.id, r.week_start_date, r.scheduled_date, r.actual_meeting_date, r.status, r.conducted, r.decisions])

    output.seek(0)
    filename = f"ExecFlow_{entity}_{datetime.now().strftime('%Y%m%d')}.csv"
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

# --- PDF EXPORT (.pdf) ---
@router.get("/export/pdf")
async def export_pdf_report(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=landscape(letter), rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
    elements = []
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=18,
        leading=22,
        textColor=colors.HexColor("#0F172A"),
        spaceAfter=6
    )
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#64748B"),
        spaceAfter=14
    )
    h2_style = ParagraphStyle(
        'Heading2',
        parent=styles['Heading2'],
        fontSize=13,
        leading=17,
        textColor=colors.HexColor("#0F172A"),
        spaceBefore=10,
        spaceAfter=6
    )
    
    elements.append(Paragraph("ExecFlow — Management Execution Executive Summary", title_style))
    elements.append(Paragraph(f"Generated on {datetime.now().strftime('%B %d, %Y at %H:%M')} | Prepared for: {current_user.full_name} ({current_user.role.upper()})", subtitle_style))
    elements.append(Spacer(1, 10))
    
    # Executive KPIs Table
    today = date.today()
    goals_res = await db.execute(select(Goal))
    goals = goals_res.scalars().all()
    acts_res = await db.execute(select(Activity))
    acts = acts_res.scalars().all()
    overdue_count = len([a for a in acts if a.due_date and a.due_date < today and a.status != 'completed'])
    completed_count = len([a for a in acts if a.status == 'completed'])
    
    elements.append(Paragraph("Core Program Execution KPIs", h2_style))
    kpi_data = [
        ["Active Goals", "Completed Goals", "Goals at Risk", "Total Activities", "Completed Activities", "Overdue Activities"],
        [
            str(len([g for g in goals if g.status != 'archived'])),
            str(len([g for g in goals if g.status == 'completed'])),
            str(len([g for g in goals if g.status == 'at_risk'])),
            str(len(acts)),
            str(completed_count),
            str(overdue_count)
        ]
    ]
    kpi_table = Table(kpi_data, colWidths=[120, 120, 120, 120, 120, 120])
    kpi_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#0F172A")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ('FONTNAME', (0, 1), (-1, 1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 1), (-1, 1), 11),
    ]))
    elements.append(kpi_table)
    elements.append(Spacer(1, 14))
    
    # Goals Summary Table
    elements.append(Paragraph("Annual Business Goals Status", h2_style))
    goal_table_data = [["Code", "Goal Name", "Priority", "Status", "Target Date", "Annual Target"]]
    for g in goals:
        goal_table_data.append([
            g.goal_code,
            g.name[:45] + ("..." if len(g.name) > 45 else ""),
            g.priority.capitalize(),
            g.status.replace("_", " ").capitalize(),
            str(g.target_completion_date or "—"),
            (g.annual_target or "—")[:40] + ("..." if len(g.annual_target or '') > 40 else "")
        ])
    goal_table = Table(goal_table_data, colWidths=[50, 200, 70, 90, 80, 230])
    goal_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#1E293B")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    elements.append(goal_table)
    elements.append(Spacer(1, 14))

    # Overdue & High Priority Activities
    elements.append(Paragraph("Priority & Urgent Activities", h2_style))
    urgent_acts = [a for a in acts if a.priority in ("high", "critical") or (a.due_date and a.due_date < today and a.status != 'completed')]
    act_table_data = [["Activity", "Module", "Priority", "Status", "RAG", "Due Date"]]
    for a in urgent_acts[:8]:
        act_table_data.append([
            a.name[:50] + ("..." if len(a.name) > 50 else ""),
            (a.module or "general").capitalize(),
            a.priority.capitalize(),
            a.status.replace("_", " ").capitalize(),
            a.rag_status.upper(),
            str(a.due_date or "—")
        ])
    if len(act_table_data) > 1:
        act_table = Table(act_table_data, colWidths=[260, 90, 80, 90, 80, 120])
        act_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#334155")),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ]))
        elements.append(act_table)
        
    doc.build(elements)
    buffer.seek(0)
    filename = f"ExecFlow_Summary_{datetime.now().strftime('%Y%m%d')}.pdf"
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
