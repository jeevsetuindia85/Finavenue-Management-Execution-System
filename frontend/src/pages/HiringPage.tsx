import React, { useState, useEffect } from 'react';
import {
  UserPlus,
  Building,
  PhoneCall,
  Calendar,
  Users,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Filter,
  FileText,
  Briefcase
} from 'lucide-react';
import {
  HiringAgency,
  Candidate,
  ProfessionalReference,
  Conference,
  HiringSummary
} from '../types';
import { api } from '../services/api';

export const HiringPage: React.FC = () => {
  const [summary, setSummary] = useState<HiringSummary | null>(null);
  const [agencies, setAgencies] = useState<HiringAgency[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [references, setReferences] = useState<ProfessionalReference[]>([]);
  const [conferences, setConferences] = useState<Conference[]>([]);
  const [loading, setLoading] = useState(true);

  // Active section tab
  const [section, setSection] = useState<'pipeline' | 'agencies' | 'references' | 'conferences'>('pipeline');
  const [positionFilter, setPositionFilter] = useState<string>('all');

  // Modals
  const [showAgencyModal, setShowAgencyModal] = useState(false);
  const [showCandidateModal, setShowCandidateModal] = useState(false);
  const [showRefModal, setShowRefModal] = useState(false);
  const [showConfModal, setShowConfModal] = useState(false);

  // Form states
  const [newAgency, setNewAgency] = useState({
    name: '',
    contact_person: '',
    contact_email: '',
    contact_phone: '',
    position_assigned: 'Senior Analyst',
    target_cvs: 10,
    status: 'active',
  });

  const [newCandidate, setNewCandidate] = useState({
    full_name: '',
    email: '',
    phone: '',
    position: 'Senior Analyst',
    source_type: 'agency',
    current_stage: 'cv_received',
    expected_compensation: '',
    remarks: '',
  });

  const [newRef, setNewRef] = useState({
    contact_person: '',
    company_background: '',
    potential_candidate_name: '',
    role_fit: 'Senior Analyst',
    outcome: '',
    followup_date: '',
  });

  const [newConf, setNewConf] = useState({
    name: '',
    event_date: '',
    location: '',
    attendance_status: 'planned',
    people_met: '',
    relevance_notes: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sumData, agData, candData, refData, confData] = await Promise.all([
        api.getHiringSummary(),
        api.getAgencies(),
        api.getCandidates(),
        api.getReferences(),
        api.getConferences(),
      ]);
      setSummary(sumData);
      setAgencies(agData);
      setCandidates(candData);
      setReferences(refData);
      setConferences(confData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateAgency = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createAgency(newAgency as any);
      setShowAgencyModal(false);
      setNewAgency({ name: '', contact_person: '', contact_email: '', contact_phone: '', position_assigned: 'Senior Analyst', target_cvs: 10, status: 'active' });
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createCandidate(newCandidate as any);
      setShowCandidateModal(false);
      setNewCandidate({ full_name: '', email: '', phone: '', position: 'Senior Analyst', source_type: 'agency', current_stage: 'cv_received', expected_compensation: '', remarks: '' });
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateRef = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createReference({ ...newRef, date_of_contact: new Date().toISOString().split('T')[0] } as any);
      setShowRefModal(false);
      setNewRef({ contact_person: '', company_background: '', potential_candidate_name: '', role_fit: 'Senior Analyst', outcome: '', followup_date: '' });
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateConf = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createConference(newConf as any);
      setShowConfModal(false);
      setNewConf({ name: '', event_date: '', location: '', attendance_status: 'planned', people_met: '', relevance_notes: '' });
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleStageChange = async (candidateId: string, nextStage: string) => {
    try {
      await api.updateCandidate(candidateId, { current_stage: nextStage as any });
      setCandidates(candidates.map(c => c.id === candidateId ? { ...c, current_stage: nextStage as any } : c));
    } catch (err) {
      console.error(err);
    }
  };

  // Pipeline stages
  const stages = [
    { key: 'source', label: '1. Sourced' },
    { key: 'cv_received', label: '2. CV Received' },
    { key: 'screening', label: '3. Screening' },
    { key: 'interview_completed', label: '4. Interview' },
    { key: 'selected', label: '5. Selected' },
    { key: 'offer_released', label: '6. Offer' },
    { key: 'joined', label: '7. Joined' },
  ];

  const filteredCandidates = candidates.filter((c) => {
    if (positionFilter !== 'all' && c.position !== positionFilter) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center min-h-[50vh]">
        <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            GOAL 01: Hiring & Talent Acquisition
          </h1>
          <p className="text-sm text-slate-500">
            Priority roles: Senior Analyst, Senior Business Development, CAT II Fund Manager
          </p>
        </div>
        <div className="flex items-center gap-2">
          {section === 'pipeline' && (
            <button
              onClick={() => setShowCandidateModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition"
            >
              <Plus size={14} /> Add Candidate
            </button>
          )}
          {section === 'agencies' && (
            <button
              onClick={() => setShowAgencyModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition"
            >
              <Plus size={14} /> Appoint Agency
            </button>
          )}
          {section === 'references' && (
            <button
              onClick={() => setShowRefModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition"
            >
              <Plus size={14} /> Log Reference Call
            </button>
          )}
          {section === 'conferences' && (
            <button
              onClick={() => setShowConfModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition"
            >
              <Plus size={14} /> Add Conference
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards for 3 Sourcing Channels + Pipeline */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium uppercase">Active Agencies</span>
            <Building size={16} className="text-slate-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 tabular-nums">{summary?.active_agencies || 0}</span>
            <span className="text-xs text-slate-500">/ {summary?.total_agencies || 0} total</span>
          </div>
          <span className="text-[11px] text-teal-600 font-medium mt-1 block">
            {summary?.total_cvs_received || 0} CVs received to date
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium uppercase">Ref Calls (Wk)</span>
            <PhoneCall size={16} className="text-teal-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 tabular-nums">{summary?.reference_calls_this_week || 0}</span>
            <span className="text-xs text-slate-500">/ Target: {summary?.reference_calls_target || 4}</span>
          </div>
          <span className={`text-[11px] font-medium mt-1 block ${
            (summary?.reference_calls_this_week || 0) >= 4 ? 'text-emerald-600' : 'text-amber-600'
          }`}>
            {(summary?.reference_calls_this_week || 0) >= 4 ? 'Target Met This Week' : 'Below 4 calls target'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium uppercase">Conferences (Mo)</span>
            <Calendar size={16} className="text-purple-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 tabular-nums">{summary?.conferences_this_month || 0}</span>
            <span className="text-xs text-slate-500">/ Target: 2</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Cadence: 1 every 15 days</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium uppercase">Total Candidates</span>
            <Users size={16} className="text-sky-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 tabular-nums">{summary?.total_candidates || 0}</span>
            <span className="text-xs text-emerald-600 font-medium">Active Funnel</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">3 Priority Profiles</span>
        </div>
      </div>

      {/* Navigation Controls: Tabs & Position Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 overflow-x-auto text-xs font-medium">
          <button
            onClick={() => setSection('pipeline')}
            className={`px-3 py-1.5 rounded-lg transition ${
              section === 'pipeline' ? 'bg-slate-900 text-white font-semibold' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Candidate Pipeline Funnel
          </button>
          <button
            onClick={() => setSection('agencies')}
            className={`px-3 py-1.5 rounded-lg transition ${
              section === 'agencies' ? 'bg-slate-900 text-white font-semibold' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            A. Hiring Agency CRM ({agencies.length})
          </button>
          <button
            onClick={() => setSection('references')}
            className={`px-3 py-1.5 rounded-lg transition ${
              section === 'references' ? 'bg-slate-900 text-white font-semibold' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            B. Professional Network (4/wk)
          </button>
          <button
            onClick={() => setSection('conferences')}
            className={`px-3 py-1.5 rounded-lg transition ${
              section === 'conferences' ? 'bg-slate-900 text-white font-semibold' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            C. Conference Tracker (1/15 days)
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Position:</span>
          <select
            value={positionFilter}
            onChange={(e) => setPositionFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium"
          >
            <option value="all">All 3 Positions</option>
            <option value="Senior Analyst">Senior Analyst</option>
            <option value="Senior BD">Senior BD</option>
            <option value="CAT II Fund Manager">CAT II Fund Manager</option>
          </select>
        </div>
      </div>

      {/* SECTION 1: CANDIDATE PIPELINE FUNNEL */}
      {section === 'pipeline' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3 overflow-x-auto pb-4">
            {stages.map((st) => {
              const stageCandidates = filteredCandidates.filter((c) => c.current_stage === st.key);
              return (
                <div key={st.key} className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 min-w-[150px] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">{st.label}</span>
                      <span className="w-5 h-5 rounded-full bg-white border border-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center">
                        {stageCandidates.length}
                      </span>
                    </div>

                    <div className="space-y-2 mt-2">
                      {stageCandidates.map((cand) => (
                        <div
                          key={cand.id}
                          className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-xs hover:border-teal-500 transition text-xs space-y-1"
                        >
                          <p className="font-bold text-slate-900">{cand.full_name}</p>
                          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 font-medium">
                            {cand.position}
                          </span>
                          <span className="block text-[10px] text-slate-400 capitalize">
                            Source: {cand.source_type}
                          </span>

                          {/* Quick stage transition button */}
                          <div className="pt-2 border-t border-slate-100 flex justify-end">
                            <select
                              value={cand.current_stage}
                              onChange={(e) => handleStageChange(cand.id, e.target.value)}
                              className="text-[10px] bg-slate-50 border border-slate-200 rounded px-1 py-0.5"
                            >
                              {stages.map((s) => (
                                <option key={s.key} value={s.key}>{s.label}</option>
                              ))}
                              <option value="rejected">Rejected</option>
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 2: HIRING AGENCY CRM */}
      {section === 'agencies' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Agency Name</th>
                <th className="py-3 px-4">Position Assigned</th>
                <th className="py-3 px-4">Contact Person</th>
                <th className="py-3 px-4">CV Target</th>
                <th className="py-3 px-4">Total CVs</th>
                <th className="py-3 px-4">Last CV Date</th>
                <th className="py-3 px-4">Next Follow-up</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Remarks / Reason if No CV</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {agencies.map((ag) => (
                <tr key={ag.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-4 font-bold text-slate-900">{ag.name}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                      {ag.position_assigned}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    <div>{ag.contact_person || '—'}</div>
                    <div className="text-[10px] text-slate-400">{ag.contact_email}</div>
                  </td>
                  <td className="py-3 px-4 tabular-nums font-semibold">{ag.target_cvs || 10}</td>
                  <td className="py-3 px-4 tabular-nums font-bold text-emerald-600">{ag.total_cvs_received}</td>
                  <td className="py-3 px-4 tabular-nums text-slate-500">{ag.last_cv_received_date || '—'}</td>
                  <td className="py-3 px-4 tabular-nums font-medium text-slate-700">{ag.next_followup_date || '—'}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      ag.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                      {ag.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                    {ag.reason_for_no_cv || ag.remarks || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* SECTION 3: PROFESSIONAL REFERENCES (Target: 4 calls per week) */}
      {section === 'references' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 bg-teal-50/50 border-b border-teal-100 flex items-center justify-between text-xs">
            <span className="font-semibold text-teal-900 flex items-center gap-1.5">
              <PhoneCall size={14} className="text-teal-600" />
              Professional Reference Calls — Proposed Target: 4 calls per week
            </span>
            <span className="font-bold text-teal-700 tabular-nums">
              {references.length} calls logged
            </span>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Contact Person</th>
                <th className="py-3 px-4">Company / Professional Background</th>
                <th className="py-3 px-4">Potential Candidate</th>
                <th className="py-3 px-4">Role Fit</th>
                <th className="py-3 px-4">Contact Date</th>
                <th className="py-3 px-4">Outcome / Next Action</th>
                <th className="py-3 px-4">Follow-up Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {references.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">No reference calls logged yet.</td>
                </tr>
              ) : (
                references.map((ref) => (
                  <tr key={ref.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-bold text-slate-900">{ref.contact_person}</td>
                    <td className="py-3 px-4 text-slate-600">{ref.company_background || '—'}</td>
                    <td className="py-3 px-4 font-medium text-slate-800">{ref.potential_candidate_name || '—'}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                        {ref.role_fit || 'Senior Analyst'}
                      </span>
                    </td>
                    <td className="py-3 px-4 tabular-nums text-slate-500">{ref.date_of_contact || '—'}</td>
                    <td className="py-3 px-4 text-slate-700 max-w-xs">{ref.outcome || '—'}</td>
                    <td className="py-3 px-4 tabular-nums font-semibold text-slate-700">{ref.followup_date || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* SECTION 4: CONFERENCE TRACKER (Target: 1 every 15 days) */}
      {section === 'conferences' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 bg-purple-50/50 border-b border-purple-100 flex items-center justify-between text-xs">
            <span className="font-semibold text-purple-900 flex items-center gap-1.5">
              <Calendar size={14} className="text-purple-600" />
              Industry Conference Tracker — Proposed Cadence: One event every 15 days
            </span>
            <span className="font-bold text-purple-700 tabular-nums">
              {conferences.length} events tracked
            </span>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Event Name</th>
                <th className="py-3 px-4">Conference Date</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Attendance Status</th>
                <th className="py-3 px-4">People Met / Network Contacts</th>
                <th className="py-3 px-4">Post-Event Follow-up</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {conferences.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">No industry events logged yet.</td>
                </tr>
              ) : (
                conferences.map((conf) => (
                  <tr key={conf.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-bold text-slate-900">{conf.name}</td>
                    <td className="py-3 px-4 tabular-nums text-slate-600">{conf.event_date || '—'}</td>
                    <td className="py-3 px-4 text-slate-600">{conf.location || '—'}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        conf.attendance_status === 'attended'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : conf.attendance_status === 'registered'
                          ? 'bg-sky-50 text-sky-700 border border-sky-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {conf.attendance_status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 max-w-xs">{conf.people_met || '—'}</td>
                    <td className="py-3 px-4 text-slate-700 max-w-xs">{conf.post_event_followups || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Candidate Modal */}
      {showCandidateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <h2 className="text-base font-bold text-slate-900 mb-4">Add Candidate to Pipeline</h2>
            <form onSubmit={handleCreateCandidate} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Candidate full name"
                  value={newCandidate.full_name}
                  onChange={(e) => setNewCandidate({ ...newCandidate, full_name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Target Position</label>
                  <select
                    value={newCandidate.position}
                    onChange={(e) => setNewCandidate({ ...newCandidate, position: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="Senior Analyst">Senior Analyst</option>
                    <option value="Senior BD">Senior BD</option>
                    <option value="CAT II Fund Manager">CAT II Fund Manager</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Source Type</label>
                  <select
                    value={newCandidate.source_type}
                    onChange={(e) => setNewCandidate({ ...newCandidate, source_type: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="agency">Agency</option>
                    <option value="network">Professional Network</option>
                    <option value="conference">Conference Lead</option>
                    <option value="direct">Direct Sourcing</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="email@example.com"
                    value={newCandidate.email}
                    onChange={(e) => setNewCandidate({ ...newCandidate, email: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Phone</label>
                  <input
                    type="text"
                    placeholder="+91..."
                    value={newCandidate.phone}
                    onChange={(e) => setNewCandidate({ ...newCandidate, phone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Expected Compensation</label>
                <input
                  type="text"
                  placeholder="e.g. 24 LPA"
                  value={newCandidate.expected_compensation}
                  onChange={(e) => setNewCandidate({ ...newCandidate, expected_compensation: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCandidateModal(false)}
                  className="px-3 py-1.5 border rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800"
                >
                  Add Candidate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Agency Modal */}
      {showAgencyModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <h2 className="text-base font-bold text-slate-900 mb-4">Appoint Recruitment Agency</h2>
            <form onSubmit={handleCreateAgency} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Agency Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ExecSearch Global"
                  value={newAgency.name}
                  onChange={(e) => setNewAgency({ ...newAgency, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Position Assigned</label>
                  <select
                    value={newAgency.position_assigned}
                    onChange={(e) => setNewAgency({ ...newAgency, position_assigned: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="Senior Analyst">Senior Analyst</option>
                    <option value="Senior BD">Senior BD</option>
                    <option value="CAT II Fund Manager">CAT II Fund Manager</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Target CV Count</label>
                  <input
                    type="number"
                    value={newAgency.target_cvs}
                    onChange={(e) => setNewAgency({ ...newAgency, target_cvs: parseInt(e.target.value) || 10 })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={newAgency.contact_person}
                    onChange={(e) => setNewAgency({ ...newAgency, contact_person: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Contact Email</label>
                  <input
                    type="email"
                    value={newAgency.contact_email}
                    onChange={(e) => setNewAgency({ ...newAgency, contact_email: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAgencyModal(false)}
                  className="px-3 py-1.5 border rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800"
                >
                  Appoint Agency
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reference Call Modal */}
      {showRefModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <h2 className="text-base font-bold text-slate-900 mb-4">Log Reference Call (Target: 4/week)</h2>
            <form onSubmit={handleCreateRef} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Contact Person *</label>
                <input
                  type="text"
                  required
                  placeholder="Senior professional / industry peer"
                  value={newRef.contact_person}
                  onChange={(e) => setNewRef({ ...newRef, contact_person: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Company / Background</label>
                <input
                  type="text"
                  placeholder="e.g. Partner at Matrix Capital"
                  value={newRef.company_background}
                  onChange={(e) => setNewRef({ ...newRef, company_background: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Potential Candidate Referred</label>
                  <input
                    type="text"
                    placeholder="Candidate name"
                    value={newRef.potential_candidate_name}
                    onChange={(e) => setNewRef({ ...newRef, potential_candidate_name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Role Fit</label>
                  <select
                    value={newRef.role_fit}
                    onChange={(e) => setNewRef({ ...newRef, role_fit: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="Senior Analyst">Senior Analyst</option>
                    <option value="Senior BD">Senior BD</option>
                    <option value="CAT II Fund Manager">CAT II Fund Manager</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Outcome / Discussion Notes</label>
                <textarea
                  rows={2}
                  value={newRef.outcome}
                  onChange={(e) => setNewRef({ ...newRef, outcome: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Details of call and candidate interest"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowRefModal(false)}
                  className="px-3 py-1.5 border rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800"
                >
                  Save Call Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Conference Modal */}
      {showConfModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <h2 className="text-base font-bold text-slate-900 mb-4">Track Conference / Event (1/15 days)</h2>
            <form onSubmit={handleCreateConf} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Conference Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. IVCA Conclave 2026"
                  value={newConf.name}
                  onChange={(e) => setNewConf({ ...newConf, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Date</label>
                  <input
                    type="date"
                    value={newConf.event_date}
                    onChange={(e) => setNewConf({ ...newConf, event_date: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Location</label>
                  <input
                    type="text"
                    placeholder="Mumbai / Bangalore"
                    value={newConf.location}
                    onChange={(e) => setNewConf({ ...newConf, location: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Status</label>
                <select
                  value={newConf.attendance_status}
                  onChange={(e) => setNewConf({ ...newConf, attendance_status: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="planned">Planned</option>
                  <option value="registered">Registered</option>
                  <option value="attended">Attended</option>
                  <option value="missed">Missed</option>
                </select>
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">People Met / Contacts Identified</label>
                <textarea
                  rows={2}
                  value={newConf.people_met}
                  onChange={(e) => setNewConf({ ...newConf, people_met: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Names, firms and potential candidate leads"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowConfModal(false)}
                  className="px-3 py-1.5 border rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800"
                >
                  Save Conference
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
