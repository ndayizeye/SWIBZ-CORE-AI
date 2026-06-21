/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import {
  Server,
  Users,
  Banknote,
  Activity,
  Briefcase,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Plus,
  Trash2,
  Edit,
  Check,
  BookOpen,
  Shield,
  FileText,
  X,
  Target,
  ClipboardList,
  Save
} from 'lucide-react';
import { AnalyticsSummary, Tenant, IndustryTemplate } from '../types.js';

interface AdminDashboardProps {
  onSelectTenant: (tenantId: string) => void;
}

export default function AdminDashboard({ onSelectTenant }: AdminDashboardProps) {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Tab State
  const [activeTab, setActiveTab] = useState<'tenants' | 'templates'>('tenants');

  // Templates Management State
  const [templates, setTemplates] = useState<IndustryTemplate[]>([]);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<IndustryTemplate | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<Partial<IndustryTemplate> | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // New item creators state
  const [newTerm, setNewTerm] = useState('');
  const [newService, setNewService] = useState('');
  const [newLeadField, setNewLeadField] = useState('');
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');

  const fetchAdminData = async () => {
    try {
      const res = await fetch('/api/admin/analytics');
      const data = await res.json();
      if (data.success) {
        setAnalytics(data.summary);
        setTenants(data.tenants);
      } else {
        setError(data.error || 'Failed to fetch centralized admin data.');
      }
    } catch (e) {
      setError('Connection failure loading superadmin system dashboards.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    setTemplateLoading(true);
    try {
      const res = await fetch('/api/admin/industry-templates');
      const data = await res.json();
      if (data.success) {
        setTemplates(data.templates);
      }
    } catch (e) {
      console.error('Error fetching templates:', e);
    } finally {
      setTemplateLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  useEffect(() => {
    if (activeTab === 'templates') {
      fetchTemplates();
    }
  }, [activeTab]);

  // Handle Edit Actions
  const handleStartEdit = (tpl: IndustryTemplate) => {
    setSelectedTemplate(tpl);
    setEditingTemplate({ ...tpl });
    setIsCreatingNew(false);
  };

  const handleStartCreate = () => {
    setSelectedTemplate(null);
    setEditingTemplate({
      id: '',
      name: '',
      terminology: [],
      services: [],
      faqs: [],
      suggested_responses: [],
      actions: [],
      lead_capture_fields: [],
      ai_instructions: ''
    });
    setIsCreatingNew(true);
  };

  const handleAddField = (field: 'terminology' | 'services' | 'lead_capture_fields', value: string, setter: (v: string) => void) => {
    if (!value.trim() || !editingTemplate) return;
    const currentList = editingTemplate[field] as string[] || [];
    if (!currentList.includes(value.trim())) {
      setEditingTemplate({
        ...editingTemplate,
        [field]: [...currentList, value.trim()]
      });
    }
    setter('');
  };

  const handleRemoveField = (field: 'terminology' | 'services' | 'lead_capture_fields', valueToRemove: string) => {
    if (!editingTemplate) return;
    const currentList = editingTemplate[field] as string[] || [];
    setEditingTemplate({
      ...editingTemplate,
      [field]: currentList.filter(v => v !== valueToRemove)
    });
  };

  const handleAddFAQ = () => {
    if (!newQuestion.trim() || !newAnswer.trim() || !editingTemplate) return;
    const currentFAQs = editingTemplate.faqs || [];
    setEditingTemplate({
      ...editingTemplate,
      faqs: [...currentFAQs, { question: newQuestion.trim(), answer: newAnswer.trim() }]
    });
    setNewQuestion('');
    setNewAnswer('');
  };

  const handleRemoveFAQ = (indexToRemove: number) => {
    if (!editingTemplate || !editingTemplate.faqs) return;
    setEditingTemplate({
      ...editingTemplate,
      faqs: editingTemplate.faqs.filter((_, i) => i !== indexToRemove)
    });
  };

  const handleSaveTemplate = async () => {
    if (!editingTemplate || !editingTemplate.name) {
      alert('Template Name is required.');
      return;
    }

    try {
      if (isCreatingNew) {
        const idPattern = editingTemplate.name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
        const finalPayload = { ...editingTemplate, id: idPattern };
        const res = await fetch('/api/admin/industry-templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(finalPayload)
        });
        const data = await res.json();
        if (data.success) {
          setEditingTemplate(null);
          setIsCreatingNew(false);
          fetchTemplates();
        } else {
          alert('Failed to save New Industry Profile: ' + (data.error || 'Server rejected.'));
        }
      } else {
        const res = await fetch(`/api/admin/industry-templates/${editingTemplate.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editingTemplate)
        });
        const data = await res.json();
        if (data.success) {
          setEditingTemplate(null);
          fetchTemplates();
        } else {
          alert('Failed to update: ' + (data.error || 'Sync mismatch.'));
        }
      }
    } catch (err: any) {
      alert('Network failure syncing updates: ' + err.message);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Are you absolutely sure you want to delete this industry sector template? Tenants mapped to this industry will fall back to basic templates.')) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/industry-templates/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        if (editingTemplate && editingTemplate.id === id) {
          setEditingTemplate(null);
        }
        fetchTemplates();
      }
    } catch (e) {
      alert('Error deleting template settings.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 min-h-[500px]">
        <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-slate-400 mt-4">Polling Swibz centralization registries...</p>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div id="central-registry-fatal-dialog" className="p-8 bg-red-950/20 border border-red-500/30 text-red-100 rounded-xl max-w-2xl mx-auto my-10">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <Shield className="text-red-500" />
          Registry Connection Status Fault
        </h3>
        <p className="text-xs mt-1 text-slate-300">{error}</p>
      </div>
    );
  }

  const channels = analytics.conversations_by_channel;
  const channelTotal = channels.whatsapp + channels.telegram + channels.webchat + channels.sms + channels.email || 1;

  return (
    <div id="swibz-admin-dash" className="p-6 max-w-7xl mx-auto bg-[#030303] text-white min-h-screen">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
        <div>
          <span className="text-[10px] font-bold text-cyan-400 flex items-center gap-2 tracking-wider uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse"></span>
            Swibz Central Registry Command Node
          </span>
          <h1 className="text-3xl font-extrabold text-white mt-1 tracking-tight">Enterprise Console</h1>
          <p className="text-slate-400 text-xs mt-1">Configure industry template training sets, manage RAG properties, and analyze system throughput.</p>
        </div>
        <button
          onClick={fetchAdminData}
          className="px-4 py-2 border border-cyan-500/20 bg-cyan-500/10 text-cyan-400 rounded-xl text-xs font-bold hover:bg-cyan-400 hover:text-black transition-all cursor-pointer flex items-center gap-2 shadow-[0_0_15px_rgba(34,211,238,0.05)]"
        >
          <Activity className="w-3.5 h-3.5 animate-pulse" />
          Synchronize Console State
        </button>
      </div>

      {/* Tabs Switchbar */}
      <div className="flex items-center gap-1 border-b border-white/10 mb-8 sm:flex-row flex-col">
        <button
          onClick={() => setActiveTab('tenants')}
          className={`w-full sm:w-auto px-5 py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 uppercase tracking-wide cursor-pointer ${
            activeTab === 'tenants'
              ? 'border-cyan-400 text-cyan-400 bg-white/[0.02]'
              : 'border-transparent text-slate-400 hover:text-white hover:bg-white/[0.01]'
          }`}
        >
          <Layers className="w-4 h-4" />
          Active Tenants Directory
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`w-full sm:w-auto px-5 py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 uppercase tracking-wide cursor-pointer ${
            activeTab === 'templates'
              ? 'border-cyan-400 text-cyan-400 bg-white/[0.02]'
              : 'border-transparent text-slate-400 hover:text-white hover:bg-white/[0.01]'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          Industry Template Manager
        </button>
      </div>

      {activeTab === 'tenants' ? (
        <>
          {/* Grid of KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-5 flex items-center gap-4 transition-all hover:border-white/20">
              <div className="p-3 border border-indigo-500/20 bg-indigo-500/5 text-indigo-400 rounded-xl">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">Total Tenants</span>
                <span className="text-2xl font-black text-white">{analytics.total_tenants}</span>
                <span className="text-[9px] text-indigo-400 block mt-0.5">Isolated Row Databases</span>
              </div>
            </div>

            <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-5 flex items-center gap-4 transition-all hover:border-white/20">
              <div className="p-3 border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 rounded-xl">
                <Banknote className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">Cumulative Revenue</span>
                <span className="text-2xl font-black text-white">UGX {analytics.total_revenue_ugx.toLocaleString()}</span>
                <span className="text-[9px] text-emerald-400 block mt-0.5">Processed Mobile Money</span>
              </div>
            </div>

            <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-5 flex items-center gap-4 transition-all hover:border-white/20">
              <div className="p-3 border border-sky-500/20 bg-sky-500/5 text-sky-400 rounded-xl">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">Global Customers</span>
                <span className="text-2xl font-black text-white">{analytics.active_customers.toLocaleString()}</span>
                <span className="text-[9px] text-sky-400 block mt-0.5">Activated CRM Records</span>
              </div>
            </div>

            <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-5 flex items-center gap-4 transition-all hover:border-white/20">
              <div className="p-3 border border-amber-500/20 bg-amber-500/5 text-amber-400 rounded-xl">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">API RAG Hits</span>
                <span className="text-2xl font-black text-white">{analytics.ai_api_calls.toLocaleString()}</span>
                <span className="text-[9px] text-amber-400 block mt-0.5">Server Decoupled Logs</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Column 1 & 2: Tenants Registry */}
            <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6 lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Server className="w-4.5 h-4.5 text-cyan-400" />
                    Active Multitenant Inbound Pools
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">Individual localized businesses running isolated data pipelines.</p>
                </div>
                <span className="px-3 py-1 bg-white/5 border border-white/15 rounded-full text-[10px] font-bold text-cyan-400 font-mono">
                  {tenants.length} INSTANCES LISTED
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="text-[10px] font-bold uppercase tracking-wider bg-white/[0.02] text-slate-400 border-b border-white/10">
                    <tr>
                      <th className="py-3 px-4">Business Identity</th>
                      <th className="py-3 px-4">Sector Type</th>
                      <th className="py-3 px-4">Tier Tiering</th>
                      <th className="py-3 px-4">Registry State</th>
                      <th className="py-3 px-4 text-center">Diagnostics</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {tenants.map((t) => (
                      <tr key={t.tenant_id} className="hover:bg-white/[0.02] transition-colors border-b border-white/5">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            {t.logo_url ? (
                              <img src={t.logo_url} alt="Logo" referrerPolicy="no-referrer" className="w-8 h-8 rounded-lg bg-slate-800 object-contain p-1 border border-white/10" />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-slate-900 border border-white/10 flex items-center justify-center font-bold text-cyan-400">
                                {t.company_name.charAt(0)}
                              </div>
                            )}
                            <div>
                              <span className="font-bold text-slate-100 block">{t.company_name}</span>
                              <span className="block font-mono text-[9px] text-cyan-400/80 font-normal mt-0.5">{t.tenant_id}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="px-2.5 py-0.5 text-[10px] uppercase tracking-wide bg-cyan-400/10 text-cyan-400 rounded-md border border-cyan-400/20 font-bold">
                            {t.industry_type}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-xs font-medium text-slate-300 uppercase">
                          {t.subscription_plan}
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                            t.subscription_status === 'active' ? 'text-green-400' : 'text-amber-400'
                          }`}>
                            <span className={`w-2 h-2 rounded-full ${
                              t.subscription_status === 'active' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-amber-500 animate-pulse'
                            }`}></span>
                            {t.subscription_status === 'active' ? 'Active' : 'Unpaid Plan'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <button
                            onClick={() => onSelectTenant(t.tenant_id)}
                            className="px-3 py-1.5 bg-cyan-400 text-black rounded-lg text-xs font-bold hover:bg-cyan-300 transition-all flex items-center gap-1 mx-auto"
                          >
                            Admin Dashboard
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Column 3: Global Channel Distribution */}
            <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6 flex flex-col justify-between">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Target className="w-4.5 h-4.5 text-cyan-400" />
                  Channel Connectors
                </h2>
                <p className="text-xs text-slate-400 mb-6">Aggregate real-time messaging distribution.</p>

                <div className="space-y-5">
                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-300 mb-1.5">
                      <span className="flex items-center gap-2 text-green-400">
                        <span className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_6px_#22c55e]"></span>
                        WhatsApp Node
                      </span>
                      <span>{channels.whatsapp} ({Math.round((channels.whatsapp / channelTotal) * 100)}%)</span>
                    </div>
                    <div className="w-full bg-[#121212] border border-white/10 h-2 rounded-full overflow-hidden">
                      <div className="bg-green-500 h-full" style={{ width: `${(channels.whatsapp / channelTotal) * 100}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-300 mb-1.5">
                      <span className="flex items-center gap-2 text-cyan-400">
                        <span className="w-2 h-2 bg-cyan-500 rounded-full shadow-[0_0_6px_#22d3ee]"></span>
                        Telegram Webhook
                      </span>
                      <span>{channels.telegram} ({Math.round((channels.telegram / channelTotal) * 100)}%)</span>
                    </div>
                    <div className="w-full bg-[#121212] border border-white/10 h-2 rounded-full overflow-hidden">
                      <div className="bg-cyan-500 h-full" style={{ width: `${(channels.telegram / channelTotal) * 100}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-300 mb-1.5">
                      <span className="flex items-center gap-2 text-indigo-400">
                        <span className="w-2 h-2 bg-indigo-500 rounded-full shadow-[0_0_6px_#6366f1]"></span>
                        Live Web Widget
                      </span>
                      <span>{channels.webchat} ({Math.round((channels.webchat / channelTotal) * 100)}%)</span>
                    </div>
                    <div className="w-full bg-[#121212] border border-white/10 h-2 rounded-full overflow-hidden">
                      <div className="bg-indigo-500 h-full" style={{ width: `${(channels.webchat / channelTotal) * 100}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-300 mb-1.5">
                      <span className="flex items-center gap-2 text-purple-400">
                        <span className="w-2 h-2 bg-purple-500 rounded-full shadow-[0_0_6px_#a855f7]"></span>
                        Telephony Gateway
                      </span>
                      <span>{channels.sms} ({Math.round((channels.sms / channelTotal) * 100)}%)</span>
                    </div>
                    <div className="w-full bg-[#121212] border border-white/10 h-2 rounded-full overflow-hidden">
                      <div className="bg-purple-500 h-full" style={{ width: `${(channels.sms / channelTotal) * 100}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-300 mb-1.5">
                      <span className="flex items-center gap-2 text-orange-400">
                        <span className="w-2 h-2 bg-orange-500 rounded-full shadow-[0_0_6px_#f97316]"></span>
                        E-Mail SMTP Dispatch
                      </span>
                      <span>{channels.email} ({Math.round((channels.email / channelTotal) * 100)}%)</span>
                    </div>
                    <div className="w-full bg-[#121212] border border-white/10 h-2 rounded-full overflow-hidden">
                      <div className="bg-orange-500 h-full" style={{ width: `${(channels.email / channelTotal) * 100}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-white/10 text-center mt-6">
                <span className="text-[10px] text-cyan-400/80 font-bold uppercase tracking-widest block">Core Gateway Online</span>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Industry Template Manager Section */
        <div id="industry-knowledge-management-workspace" className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* List Section of all pre-installed templates (span 5) */}
          <div className="lg:col-span-5 bg-[#0A0A0A] border border-white/10 rounded-xl p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-md font-bold text-white flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-cyan-400" />
                  Prepopulated Industry Schemes
                </h3>
                <p className="text-[10px] text-slate-400">All templates editable to system rules.</p>
              </div>
              <button
                onClick={handleStartCreate}
                className="px-2.5 py-1.5 bg-cyan-400 text-black text-xs font-bold rounded-lg hover:bg-cyan-300 transition-all flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Scheme
              </button>
            </div>

            {templateLoading ? (
              <div className="text-center py-10">
                <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <span className="text-xs text-slate-400 mt-2 block">Loading pre-installed lists...</span>
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scroll">
                {templates.map((tpl) => {
                  const isSelected = selectedTemplate?.id === tpl.id || (editingTemplate && editingTemplate.id === tpl.id);
                  return (
                    <div
                      key={tpl.id}
                      onClick={() => handleStartEdit(tpl)}
                      className={`p-3.5 rounded-lg border text-left cursor-pointer transition-all ${
                        isSelected
                          ? 'border-cyan-400 bg-cyan-500/[0.07] shadow-[0_0_15px_rgba(34,211,238,0.05)]'
                          : 'border-white/5 bg-[#0E0E0E] hover:border-white/10 hover:bg-white/[0.02]'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-bold text-xs text-white block uppercase tracking-wide">{tpl.name}</span>
                          <span className="text-[9px] text-slate-400 font-mono">ID: {tpl.id}</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTemplate(tpl.id);
                          }}
                          className="text-slate-400 hover:text-red-400 p-1 rounded-md transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mt-2.5 pt-2 border-t border-white/5 text-[9px] text-slate-400">
                        <div>
                          <span className="text-white block font-semibold">{tpl.faqs.length}</span>
                          Preloaded FAQs
                        </div>
                        <div>
                          <span className="text-white block font-semibold">{tpl.services.length}</span>
                          Core Services
                        </div>
                        <div>
                          <span className="text-white block font-semibold">{tpl.terminology.length}</span>
                          Keywords Terms
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Edit/Create workspace Form (span 7) */}
          <div className="lg:col-span-7 bg-[#0A0A0A] border border-white/10 rounded-xl p-6">
            {editingTemplate ? (
              <div className="space-y-5">
                
                {/* Section Header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      {isCreatingNew ? 'Create New Sector Profile' : `Modify Sector: ${selectedTemplate?.name}`}
                    </h3>
                    <p className="text-[10px] text-slate-400">Configure pre-installed dictionary and instant RAG training vectors.</p>
                  </div>
                  <button
                    onClick={handleSaveTemplate}
                    className="px-4 py-1.5 bg-cyan-400 text-black text-xs font-bold rounded-lg hover:bg-cyan-300 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save Template Settings
                  </button>
                </div>

                {/* Main Fields Form */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Industry Profile Name *</label>
                    <input
                      type="text"
                      placeholder="e.g., Microfinance"
                      value={editingTemplate.name || ''}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                      className="w-full bg-[#121212] border border-white/10 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-cyan-400/50"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Category Identifier (Immutable)</label>
                    <input
                      type="text"
                      disabled={!isCreatingNew}
                      placeholder={editingTemplate.name ? editingTemplate.name.toLowerCase().replace(/[^a-z0-9]+/g, '_') : 'Auto-computed'}
                      value={editingTemplate.id || ''}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, id: e.target.value })}
                      className="w-full bg-[#121212]/50 border border-white/10 rounded-lg py-2 px-3 text-xs text-slate-400 focus:outline-none disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Core AI Guardrails Prompting */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                    Custom Instruction & Tone Guidelines
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Provide strict directives on how the AI agent must behave for this industry sector (e.g. Tone: warm, cautious, exact; Guidelines: Never suggest medical consults without state certificates...)"
                    value={editingTemplate.ai_instructions || ''}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, ai_instructions: e.target.value })}
                    className="w-full bg-[#121212] border border-white/10 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-cyan-400/50 resize-y"
                  />
                </div>

                {/* Industry Terms & Tags creator lists */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Specialized Terminology */}
                  <div className="border border-white/5 p-4 rounded-lg bg-[#0D0D0D]">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Industry Terminology</label>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        placeholder="Add term (e.g., premium)"
                        value={newTerm}
                        onChange={(e) => setNewTerm(e.target.value)}
                        className="w-full bg-black border border-white/10 rounded-md py-1 px-2.5 text-[11px] text-white focus:outline-none focus:border-cyan-400/50"
                      />
                      <button
                        onClick={() => handleAddField('terminology', newTerm, setNewTerm)}
                        className="px-2.5 bg-white/10 border border-white/10 rounded-md text-xs font-bold hover:bg-white/20"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1 max-h-[80px] overflow-y-auto pr-1">
                      {editingTemplate.terminology?.map((term) => (
                        <span key={term} className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-indigo-500/10 text-[10px] text-indigo-300 rounded border border-indigo-500/20 font-medium">
                          {term}
                          <X className="w-2.5 h-2.5 hover:text-white cursor-pointer" onClick={() => handleRemoveField('terminology', term)} />
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Services offered */}
                  <div className="border border-white/5 p-4 rounded-lg bg-[#0D0D0D]">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Common Workflows/Services</label>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        placeholder="Add service (e.g., Booking)"
                        value={newService}
                        onChange={(e) => setNewService(e.target.value)}
                        className="w-full bg-black border border-white/10 rounded-md py-1 px-2.5 text-[11px] text-white focus:outline-none focus:border-cyan-400/50"
                      />
                      <button
                        onClick={() => handleAddField('services', newService, setNewService)}
                        className="px-2.5 bg-white/10 border border-white/10 rounded-md text-xs font-bold hover:bg-white/20"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1 max-h-[80px] overflow-y-auto pr-1">
                      {editingTemplate.services?.map((svc) => (
                        <span key={svc} className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-500/10 text-[10px] text-emerald-300 rounded border border-emerald-500/20 font-medium">
                          {svc}
                          <X className="w-2.5 h-2.5 hover:text-white cursor-pointer" onClick={() => handleRemoveField('services', svc)} />
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Lead Capture Fields */}
                <div className="border border-white/5 p-4 rounded-lg bg-[#0D0D0D]">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Industry-specific Lead Capture Fields</label>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      placeholder="e.g., physical_address, budget_limit"
                      value={newLeadField}
                      onChange={(e) => setNewLeadField(e.target.value)}
                      className="w-full bg-black border border-white/10 rounded-md py-1 px-2.5 text-[11px] text-white focus:outline-none focus:border-cyan-400/50"
                    />
                    <button
                      onClick={() => handleAddField('lead_capture_fields', newLeadField, setNewLeadField)}
                      className="px-2.5 bg-white/10 border border-white/10 rounded-md text-xs font-bold hover:bg-white/20"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(editingTemplate.lead_capture_fields || []).map((fld) => (
                      <span key={fld} className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-amber-500/10 text-[10px] text-amber-300 rounded border border-amber-500/20 font-medium font-mono uppercase">
                        {fld}
                        <X className="w-2.5 h-2.5 hover:text-white cursor-pointer" onClick={() => handleRemoveField('lead_capture_fields', fld)} />
                      </span>
                    ))}
                    {(editingTemplate.lead_capture_fields || []).length === 0 && (
                      <span className="text-[10px] text-slate-500 italic">Default onboarding fields: "customer_name" and "telephone" only.</span>
                    )}
                  </div>
                </div>

                {/* Preloaded FAQs Config (Accordion row editor) */}
                <div className="border border-white/5 p-4 rounded-lg bg-[#0D0D0D] space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Frequently Asked Questions & Answers</label>
                    <span className="text-[10px] px-2 py-0.5 bg-slate-900 border border-white/10 rounded text-slate-300">
                      {editingTemplate.faqs?.length || 0} pre-installed
                    </span>
                  </div>

                  {/* FAQs List Table row */}
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {editingTemplate.faqs?.map((faq, i) => (
                      <div key={i} className="p-2.5 bg-black rounded border border-white/5 relative group">
                        <span className="block text-[10px] font-bold text-cyan-400">Q: {faq.question}</span>
                        <span className="block text-[10px] text-slate-300 mt-1 pl-2 border-l border-white/10">A: {faq.answer}</span>
                        <button
                          onClick={() => handleRemoveFAQ(i)}
                          className="absolute right-2 top-2 text-slate-400 hover:text-red-400 p-0.5 rounded transition-colors bg-white/5 opacity-0 group-hover:opacity-100"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {(!editingTemplate.faqs || editingTemplate.faqs.length === 0) && (
                      <span className="text-[10px] text-slate-500 italic block text-center py-4">No preloaded industry answers yet.</span>
                    )}
                  </div>

                  {/* Add Row block */}
                  <div className="border-t border-white/5 pt-3 space-y-2">
                    <span className="block text-[10px] font-bold text-white uppercase tracking-widest text-[#999]">Add Another FAQ Row</span>
                    <input
                      type="text"
                      placeholder="Input FAQ Question"
                      value={newQuestion}
                      onChange={(e) => setNewQuestion(e.target.value)}
                      className="w-full bg-black border border-white/10 rounded-md py-1.5 px-2.5 text-xs text-white focus:outline-none focus:border-cyan-400/50"
                    />
                    <textarea
                      rows={2}
                      placeholder="Input FAQ Definitive Answer"
                      value={newAnswer}
                      onChange={(e) => setNewAnswer(e.target.value)}
                      className="w-full bg-black border border-white/10 rounded-md py-1.5 px-2.5 text-xs text-white focus:outline-none focus:border-cyan-400/50 resize-y"
                    />
                    <button
                      onClick={handleAddFAQ}
                      className="w-full py-1.5 border border-cyan-400/30 bg-cyan-400/10 hover:bg-cyan-400 hover:text-black transition-all text-cyan-400 rounded-lg text-xs font-semibold uppercase flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add FAQ Card
                    </button>
                  </div>
                </div>

              </div>
            ) : (
              <div className="text-center py-24 flex flex-col items-center justify-center">
                <BookOpen className="w-12 h-12 text-slate-600 mb-3" />
                <h4 className="text-sm font-bold text-slate-300">No Target Scheme Selected</h4>
                <p className="text-xs text-slate-500 max-w-sm mt-1">Select an industry template from the left directory to adjust FAQs, terminology, actions, and custom guidelines.</p>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
