import React, { useState, useEffect } from 'react';
import {
  Building2,
  MapPin,
  Users,
  CheckCircle2,
  Calendar,
  Plus,
  DollarSign,
  FileText,
  Clock,
  Eye,
  ArrowRight,
  TrendingUp,
  Layers
} from 'lucide-react';
import { OfficeLocation, CoworkingProvider, ExpansionSummary } from '../types';
import { api } from '../services/api';

export const ExpansionPage: React.FC = () => {
  const [summary, setSummary] = useState<ExpansionSummary | null>(null);
  const [selectedCity, setSelectedCity] = useState<'Ahmedabad' | 'Bangalore'>('Ahmedabad');
  const [loading, setLoading] = useState(true);

  // Modals
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [selectedProviderForVisit, setSelectedProviderForVisit] = useState<string>('');

  // Form states
  const [newProvider, setNewProvider] = useState({
    provider_name: '',
    location_address: '',
    contact_person: '',
    contact_details: '',
    monthly_rent: 75000,
    security_deposit: 150000,
    capacity: 10,
    facilities: 'High-speed internet, conference rooms, pantry, parking',
    comparison_notes: '',
    agreement_status: 'pending',
  });

  const [newVisit, setNewVisit] = useState({
    visit_date: '',
    attendees: 'Amit Patel (Head of BD)',
    observations: '',
    next_action: '',
    status: 'planned',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await api.getExpansionSummary();
      setSummary(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const currentCityData = summary?.locations.find((l) => l.city === selectedCity);
  const providers = currentCityData?.providers || [];

  const handleCreateProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCityData) return;
    try {
      await api.createProvider({
        office_location_id: currentCityData.id,
        ...newProvider,
      });
      setShowProviderModal(false);
      setNewProvider({
        provider_name: '',
        location_address: '',
        contact_person: '',
        contact_details: '',
        monthly_rent: 75000,
        security_deposit: 150000,
        capacity: 10,
        facilities: 'High-speed internet, conference rooms, pantry, parking',
        comparison_notes: '',
        agreement_status: 'pending',
      });
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProviderForVisit) return;
    try {
      await api.createSiteVisit({
        coworking_provider_id: selectedProviderForVisit,
        ...newVisit,
      });
      setShowVisitModal(false);
      setNewVisit({
        visit_date: '',
        attendees: 'Amit Patel (Head of BD)',
        observations: '',
        next_action: '',
        status: 'planned',
      });
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectProvider = async (providerId: string, isSelected: boolean) => {
    try {
      await api.updateProvider(providerId, { is_selected: isSelected });
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

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            GOAL 02: Geographic Expansion
          </h1>
          <p className="text-sm text-slate-500">
            Independent office setup and local Business Development hiring in Ahmedabad & Bangalore
          </p>
        </div>
        <button
          onClick={() => setShowProviderModal(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition shadow-xs"
        >
          <Plus size={14} /> Add Coworking Proposal
        </button>
      </div>

      {/* City Switcher Tabs (Independent Views) */}
      <div className="flex items-center gap-3">
        {(['Ahmedabad', 'Bangalore'] as const).map((city) => {
          const loc = summary?.locations.find((l) => l.city === city);
          const isSelected = selectedCity === city;
          return (
            <button
              key={city}
              onClick={() => setSelectedCity(city)}
              className={`flex-1 sm:flex-none sm:w-64 p-4 rounded-xl border text-left transition ${
                isSelected
                  ? 'bg-white border-teal-500 ring-2 ring-teal-500/20 shadow-sm'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
                  <MapPin size={15} className={isSelected ? 'text-teal-600' : 'text-slate-400'} />
                  {city}
                </span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                  {loc?.status.replace('_', ' ') || 'Planning'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
                <span>Target: {loc?.target_operational_date || 'Q2 2026'}</span>
                <span className="font-semibold text-slate-800 tabular-nums">
                  BD Team: {loc?.bd_current_headcount} / {loc?.bd_target_headcount}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* City Status Banner & BD Hiring Meter */}
      {currentCityData && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase block mb-1">Target Operational Date</span>
            <span className="text-base font-bold text-slate-900">{currentCityData.target_operational_date || 'May 31, 2026'}</span>
            <span className="text-xs text-slate-500 block mt-0.5">Status: <strong className="capitalize">{currentCityData.status.replace('_', ' ')}</strong></span>
          </div>

          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase block mb-1">Shortlisted Coworking</span>
            <span className="text-base font-bold text-slate-900 tabular-nums">{providers.length} Options</span>
            <span className="text-xs text-teal-600 font-medium block mt-0.5">
              {providers.filter(p => p.is_selected).length > 0 ? 'Provider Finalized' : 'Evaluation in progress'}
            </span>
          </div>

          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase block mb-1">BD Team Headcount</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 tabular-nums">{currentCityData.bd_current_headcount}</span>
              <span className="text-xs text-slate-500">/ Target: {currentCityData.bd_target_headcount || 3}</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1.5">
              <div
                className="bg-teal-500 h-full rounded-full"
                style={{ width: `${Math.min(((currentCityData.bd_current_headcount / (currentCityData.bd_target_headcount || 1)) * 100), 100)}%` }}
              ></div>
            </div>
          </div>

          <div className="flex flex-col justify-center">
            <span className="text-xs text-slate-400 font-semibold uppercase block mb-1">Site Visits Conducted</span>
            <span className="text-base font-bold text-slate-900 tabular-nums">
              {providers.reduce((acc, p) => acc + (p.site_visits?.length || 0), 0)} Site Visits
            </span>
            <span className="text-xs text-slate-500 block mt-0.5">Physical inspection on-ground</span>
          </div>
        </div>
      )}

      {/* Side-by-Side Coworking Space Comparison Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Building2 size={16} className="text-teal-600" />
            Coworking Space Proposal Comparison ({selectedCity})
          </h2>
          <span className="text-xs text-slate-400">Side-by-side commercial & facility benchmarking</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Provider Name</th>
                <th className="py-3 px-4">Address / Micro-market</th>
                <th className="py-3 px-4">Capacity</th>
                <th className="py-3 px-4">Monthly Rent (₹)</th>
                <th className="py-3 px-4">Security Deposit (₹)</th>
                <th className="py-3 px-4">Agreement Status</th>
                <th className="py-3 px-4">Site Visits</th>
                <th className="py-3 px-4">Final Selection</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {providers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No coworking space proposals recorded yet for {selectedCity}. Click "Add Coworking Proposal" above.
                  </td>
                </tr>
              ) : (
                providers.map((p) => {
                  const visitCount = p.site_visits?.length || 0;
                  return (
                    <tr key={p.id} className={`hover:bg-slate-50 transition ${p.is_selected ? 'bg-teal-50/30' : ''}`}>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {p.provider_name}
                        {p.is_selected && (
                          <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800">
                            SELECTED
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 max-w-xs">{p.location_address || '—'}</td>
                      <td className="py-3.5 px-4 tabular-nums font-semibold">{p.capacity || '—'} Desks</td>
                      <td className="py-3.5 px-4 tabular-nums font-bold text-slate-900">
                        ₹{(p.monthly_rent || 0).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 tabular-nums text-slate-600">
                        ₹{(p.security_deposit || 0).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-slate-100 text-slate-700">
                          {p.agreement_status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 tabular-nums">
                        <button
                          onClick={() => {
                            setSelectedProviderForVisit(p.id);
                            setShowVisitModal(true);
                          }}
                          className="font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1"
                        >
                          <Eye size={13} /> {visitCount} Logged
                        </button>
                      </td>
                      <td className="py-3.5 px-4">
                        <input
                          type="checkbox"
                          checked={p.is_selected}
                          onChange={(e) => handleSelectProvider(p.id, e.target.checked)}
                          className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedProviderForVisit(p.id);
                            setShowVisitModal(true);
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded text-[11px] transition"
                        >
                          + Log Visit
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Proposal Modal */}
      {showProviderModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <h2 className="text-base font-bold text-slate-900 mb-4">Add Coworking Proposal ({selectedCity})</h2>
            <form onSubmit={handleCreateProvider} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Coworking Provider Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. WeWork / Awfis / Innov8"
                  value={newProvider.provider_name}
                  onChange={(e) => setNewProvider({ ...newProvider, provider_name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Location Address / Micro-market</label>
                <input
                  type="text"
                  placeholder="e.g. SG Highway or Indiranagar"
                  value={newProvider.location_address}
                  onChange={(e) => setNewProvider({ ...newProvider, location_address: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Monthly Rent (₹)</label>
                  <input
                    type="number"
                    value={newProvider.monthly_rent}
                    onChange={(e) => setNewProvider({ ...newProvider, monthly_rent: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Security Deposit (₹)</label>
                  <input
                    type="number"
                    value={newProvider.security_deposit}
                    onChange={(e) => setNewProvider({ ...newProvider, security_deposit: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Seating Capacity</label>
                  <input
                    type="number"
                    value={newProvider.capacity}
                    onChange={(e) => setNewProvider({ ...newProvider, capacity: parseInt(e.target.value) || 10 })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Agreement Status</label>
                  <select
                    value={newProvider.agreement_status}
                    onChange={(e) => setNewProvider({ ...newProvider, agreement_status: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="pending">Pending</option>
                    <option value="negotiated">Negotiated</option>
                    <option value="signed">Signed</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Commercial Comparison Notes</label>
                <textarea
                  rows={2}
                  value={newProvider.comparison_notes}
                  onChange={(e) => setNewProvider({ ...newProvider, comparison_notes: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Key differentiators, parking, electricity inclusion"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowProviderModal(false)}
                  className="px-3 py-1.5 border rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800"
                >
                  Save Proposal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Site Visit Modal */}
      {showVisitModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <h2 className="text-base font-bold text-slate-900 mb-4">Log Site Visit & Observations</h2>
            <form onSubmit={handleCreateVisit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Visit Date *</label>
                <input
                  type="date"
                  required
                  value={newVisit.visit_date}
                  onChange={(e) => setNewVisit({ ...newVisit, visit_date: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Attendees</label>
                <input
                  type="text"
                  value={newVisit.attendees}
                  onChange={(e) => setNewVisit({ ...newVisit, attendees: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Observations & Feedback</label>
                <textarea
                  rows={3}
                  value={newVisit.observations}
                  onChange={(e) => setNewVisit({ ...newVisit, observations: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Infrastructure quality, network speed, noise levels, expansion flexibility"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Next Action Required</label>
                <input
                  type="text"
                  placeholder="e.g. Request commercial discount for 12 months"
                  value={newVisit.next_action}
                  onChange={(e) => setNewVisit({ ...newVisit, next_action: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowVisitModal(false)}
                  className="px-3 py-1.5 border rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800"
                >
                  Save Site Visit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
