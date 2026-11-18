import React, { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  FileCheck,
  ChevronRight,
  TrendingUp,
  Tag,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { Product, ProductMilestone } from '../types';
import { api } from '../services/api';

export const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showProductModal, setShowProductModal] = useState(false);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<ProductMilestone | null>(null);

  // Form states
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'PMS',
    target_launch_date: '',
    description: '',
  });

  const [milestoneForm, setMilestoneForm] = useState({
    name: '',
    target_date: '',
    status: 'pending',
    completion_percentage: 0,
    evidence: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await api.getProducts();
      setProducts(data);
      if (data.length > 0 && !selectedProduct) {
        setSelectedProduct(data[0]);
      } else if (selectedProduct) {
        const updated = data.find((p) => p.id === selectedProduct.id);
        if (updated) setSelectedProduct(updated);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name) return;
    try {
      await api.createProduct(newProduct as any);
      setShowProductModal(false);
      setNewProduct({ name: '', category: 'PMS', target_launch_date: '', description: '' });
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenMilestoneEdit = (m: ProductMilestone) => {
    setEditingMilestone(m);
    setMilestoneForm({
      name: m.name,
      target_date: m.target_date || '',
      status: m.status,
      completion_percentage: m.completion_percentage || 0,
      evidence: m.evidence || '',
    });
    setShowMilestoneModal(true);
  };

  const handleSaveMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMilestone) return;
    try {
      await api.updateProductMilestone(editingMilestone.id, {
        status: milestoneForm.status as any,
        completion_percentage: Number(milestoneForm.completion_percentage),
        evidence: milestoneForm.evidence,
        target_date: milestoneForm.target_date ? milestoneForm.target_date : undefined,
      });
      setShowMilestoneModal(false);
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center min-h-[50vh]">
        <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const milestones = selectedProduct?.milestones || [];
  const completedCount = milestones.filter((m) => m.status === 'completed').length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            GOAL 03: Product Development & Launch
          </h1>
          <p className="text-sm text-slate-500">
            End-to-end development milestone tracking for PMS, CAT II AIF, and CAT III initiatives
          </p>
        </div>
        <button
          onClick={() => setShowProductModal(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition shadow-xs"
        >
          <Plus size={14} /> Add Product Initiative
        </button>
      </div>

      {/* Product Selection Tabs */}
      <div className="flex items-center gap-3 overflow-x-auto pb-1">
        {products.map((prod) => {
          const isSelected = selectedProduct?.id === prod.id;
          return (
            <button
              key={prod.id}
              onClick={() => setSelectedProduct(prod)}
              className={`p-4 rounded-xl border text-left min-w-[240px] transition ${
                isSelected
                  ? 'bg-white border-teal-500 ring-2 ring-teal-500/20 shadow-sm'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  {prod.category}
                </span>
                <span className="text-xs font-bold text-teal-600 tabular-nums">
                  {prod.overall_progress_pct || 0}% Ready
                </span>
              </div>
              <h3 className="font-bold text-slate-900 text-sm truncate">{prod.name}</h3>
              <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
                <span>Target: {prod.target_launch_date || 'Q3 2026'}</span>
                <span className="capitalize text-slate-600 font-medium">{prod.status}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Product Progress & Details */}
      {selectedProduct && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6 shadow-xs">
          {/* Header Summary */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-900 text-white">
                  {selectedProduct.category}
                </span>
                <span className="text-xs font-semibold capitalize text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded">
                  Status: {selectedProduct.status}
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900">{selectedProduct.name}</h2>
              <p className="text-xs text-slate-500 mt-0.5">{selectedProduct.description || 'Configured management product milestone pipeline.'}</p>
            </div>

            <div className="flex items-center gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
              <div className="text-right">
                <span className="text-[11px] text-slate-400 font-semibold block uppercase">Overall Progress</span>
                <span className="text-2xl font-bold text-teal-600 tabular-nums">
                  {selectedProduct.overall_progress_pct || 0}%
                </span>
              </div>
              <div className="h-8 w-px bg-slate-200"></div>
              <div>
                <span className="text-[11px] text-slate-400 font-semibold block uppercase">Milestones Completed</span>
                <span className="text-lg font-bold text-slate-800 tabular-nums">
                  {completedCount} / {milestones.length}
                </span>
              </div>
            </div>
          </div>

          {/* 11 Launch Readiness Milestones Checklist */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Layers size={14} className="text-slate-600" />
              Standard Milestone Gates (Concept to Product Launch)
            </h3>

            <div className="space-y-2.5">
              {milestones.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No milestones configured.</p>
              ) : (
                milestones.map((m, idx) => {
                  const isDone = m.status === 'completed';
                  const inProgress = m.status === 'in_progress';
                  return (
                    <div
                      key={m.id}
                      className={`p-4 rounded-xl border transition flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                        isDone
                          ? 'bg-emerald-50/20 border-emerald-200'
                          : inProgress
                          ? 'bg-sky-50/20 border-sky-200'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                            isDone
                              ? 'bg-emerald-500 text-white'
                              : inProgress
                              ? 'bg-sky-500 text-white'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {isDone ? '✓' : idx + 1}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-900 text-sm">{m.name}</h4>
                            <span
                              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                                isDone
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : inProgress
                                  ? 'bg-sky-100 text-sky-800'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {m.status.replace('_', ' ')}
                            </span>
                          </div>
                          {m.description && <p className="text-xs text-slate-500 mt-0.5">{m.description}</p>}
                          {m.evidence && (
                            <p className="text-[11px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded mt-1.5 inline-block border border-teal-100">
                              Evidence: {m.evidence}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 justify-between md:justify-end">
                        <div className="text-right text-xs">
                          <span className="text-slate-400 block text-[10px]">Target Date</span>
                          <span className="font-semibold text-slate-700">{m.target_date || '—'}</span>
                        </div>

                        <div className="w-24">
                          <div className="flex justify-between text-[11px] mb-1 font-semibold text-slate-600">
                            <span>Progress</span>
                            <span>{m.completion_percentage}%</span>
                          </div>
                          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-teal-500 h-full rounded-full"
                              style={{ width: `${m.completion_percentage}%` }}
                            ></div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleOpenMilestoneEdit(m)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition"
                        >
                          Update
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <h2 className="text-base font-bold text-slate-900 mb-4">Add Product Initiative</h2>
            <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Special Opportunities CAT III Fund"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Category</label>
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="PMS">Discretionary PMS</option>
                    <option value="CAT_II_AIF">CAT II AIF</option>
                    <option value="CAT_III_AIF">CAT III AIF</option>
                    <option value="Other">Other Product</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Target Launch Date</label>
                  <input
                    type="date"
                    value={newProduct.target_launch_date}
                    onChange={(e) => setNewProduct({ ...newProduct, target_launch_date: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Scope & Description</label>
                <textarea
                  rows={2}
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Investment mandate, regulatory approval timeline"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-3 py-1.5 border rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800"
                >
                  Initialize Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Milestone Modal */}
      {showMilestoneModal && editingMilestone && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <h2 className="text-base font-bold text-slate-900 mb-1">Update Milestone Gate</h2>
            <p className="text-xs text-slate-500 mb-4">{editingMilestone.name}</p>

            <form onSubmit={handleSaveMilestone} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Status</label>
                  <select
                    value={milestoneForm.status}
                    onChange={(e) => {
                      const st = e.target.value;
                      setMilestoneForm({
                        ...milestoneForm,
                        status: st,
                        completion_percentage: st === 'completed' ? 100 : milestoneForm.completion_percentage,
                      });
                    }}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="delayed">Delayed</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Completion %</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={milestoneForm.completion_percentage}
                    onChange={(e) => setMilestoneForm({ ...milestoneForm, completion_percentage: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Target Date</label>
                <input
                  type="date"
                  value={milestoneForm.target_date}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, target_date: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Evidence / Deliverable Notes</label>
                <textarea
                  rows={3}
                  value={milestoneForm.evidence}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, evidence: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Record documented decisions, approval memos, or compliance approval numbers"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowMilestoneModal(false)}
                  className="px-3 py-1.5 border rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800"
                >
                  Save Progress
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
