/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import { useState, useEffect } from 'react';
import {
  Building2,
  Sparkles,
  Inbox,
  GitFork,
  MapPin,
  Database,
  Users,
  CreditCard,
  LogOut,
  RefreshCw,
  Plus,
  Briefcase,
  Layers,
  PhoneCall,
  Activity,
  UserCheck,
  Menu,
  X
} from 'lucide-react';
import UnifiedInbox from './UnifiedInbox.js';
import WorkflowBuilder from './WorkflowBuilder.js';
import DeliveryModule from './DeliveryModule.js';
import KnowledgeBaseUI from './KnowledgeBaseUI.js';
import CrmUI from './CrmUI.js';
import BillingUI from './BillingUI.js';

import {
  Tenant,
  User,
  Customer,
  Lead,
  Conversation,
  Message,
  KnowledgeBaseItem,
  Workflow,
  Order,
  Rider,
  Payment
} from '../types.js';

interface BusinessDashboardProps {
  tenantId: string;
  onExit: () => void;
}

type TabType = 'overview' | 'inbox' | 'workflow' | 'delivery' | 'knowledge' | 'crm' | 'billing';

export default function BusinessDashboard({ tenantId, onExit }: BusinessDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Loaded database items
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [knowledge, setKnowledge] = useState<KnowledgeBaseItem[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  const fetchTenantData = async () => {
    try {
      const res = await fetch(`/api/tenant/${tenantId}/dashboard`);
      const data = await res.json();
      if (data.success) {
        setTenant(data.tenant);
        setCustomers(data.customers || []);
        setLeads(data.leads || []);
        setConversations(data.conversations || []);
        setKnowledge(data.knowledge || data.kbItems || []);
        setWorkflows(data.workflows || []);
        setOrders(data.orders || []);
        setRiders(data.riders || []);
        setPayments(data.payments || []);
      } else {
        setError(data.error || 'Failed to fetch centralized tenant workspace.');
      }
    } catch (e) {
      setError('Server connection failure loading multi-tenant dashboard modules.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenantData();
  }, [tenantId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 min-h-screen bg-[#050505] text-[#F0F0F0]">
        <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-bold text-white/40 mt-4">Initializing tenant secure workspace namespaces...</p>
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className="p-8 bg-[#0C0505] border border-red-500/30 text-red-400 rounded-xl max-w-2xl mx-auto my-14 text-center">
        <h3 className="font-bold text-lg">Namespace Resolution Failed</h3>
        <p className="text-xs mt-2 text-white/60">{error}</p>
        <button
          onClick={onExit}
          className="mt-6 px-4 py-2 bg-red-500 text-black font-bold rounded-xl text-xs cursor-pointer hover:bg-red-400 transition"
        >
          Return to Hub Menu
        </button>
      </div>
    );
  }

  const activeDeliveriesCount = orders.filter((o) => o.status !== 'completed').length;
  const activeLeadsCount = leads.filter((l) => l.status !== 'won' && l.status !== 'lost').length;
  const totalLKVectors = knowledge.reduce((acc, curr) => acc + curr.chunk_count, 0);

  return (
    <div id="swibz-biz-workspace" className="min-h-screen bg-[#050505] flex text-[#F0F0F0] antialiased font-sans relative">
      {/* Dimmed backdrop when sidebar opened on mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden transition-opacity cursor-pointer" 
          onClick={() => setIsSidebarOpen(false)} 
        />
      )}

      {/* 1. Left Sidebar Navigation rail */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-[260px] border-r border-white/10 bg-[#070707] flex flex-col justify-between shrink-0 select-none transition-transform duration-300 md:relative md:translate-x-0 md:flex ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-5 flex flex-col h-full">
          {/* Company branding logo */}
          <div className="flex items-center justify-between pb-5 border-b border-white/10 mb-6">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 shrink-0 border border-cyan-500 bg-cyan-500/10 text-cyan-400 rounded-xl flex items-center justify-center font-black text-lg shadow-[0_0_8px_rgba(34,211,238,0.15)]">
                {tenant.company_name.substring(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0">
                <span className="font-bold text-white text-sm block truncate">{tenant.company_name}</span>
                <span className="text-[10px] text-cyan-500 block truncate font-bold capitalize">{tenant.industry_type} core mode</span>
              </div>
            </div>

            {/* Mobile close sidebar button */}
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden p-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-sm cursor-pointer text-white/60 hover:text-white"
              title="Close Menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Nav list options */}
          <nav className="flex-1 space-y-2">
            <button
              onClick={() => { setActiveTab('overview'); setIsSidebarOpen(false); }}
              className={`w-full py-2 px-3 rounded-xl text-xs font-bold leading-none flex items-center gap-3 transition cursor-pointer border outline-none ${
                activeTab === 'overview'
                  ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.1)]'
                  : 'text-white/60 border-transparent hover:text-white hover:border-white/10'
              }`}
            >
              <Building2 className="w-4 h-4" />
              Overview Studio
            </button>

            <button
              onClick={() => { setActiveTab('inbox'); setIsSidebarOpen(false); }}
              className={`w-full py-2 px-3 rounded-xl text-xs font-bold leading-none flex items-center gap-3 transition cursor-pointer border outline-none ${
                activeTab === 'inbox'
                  ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.15)]'
                  : 'text-white/60 border-transparent hover:text-white hover:border-white/10'
              }`}
            >
              <Inbox className="w-4 h-4" />
              Unified Inbox
              {conversations.length > 0 && (
                <span className="ml-auto bg-cyan-500 text-black px-1.5 py-0.5 rounded-lg text-[9px] font-bold">
                  {conversations.length}
                </span>
              )}
            </button>

            <button
              onClick={() => { setActiveTab('workflow'); setIsSidebarOpen(false); }}
              className={`w-full py-2 px-3 rounded-xl text-xs font-bold leading-none flex items-center gap-3 transition cursor-pointer border outline-none ${
                activeTab === 'workflow'
                  ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.15)]'
                  : 'text-white/60 border-transparent hover:text-white hover:border-white/10'
              }`}
            >
              <GitFork className="w-4 h-4" />
              Automation Canvas
            </button>

            <button
              onClick={() => { setActiveTab('delivery'); setIsSidebarOpen(false); }}
              className={`w-full py-2 px-3 rounded-xl text-xs font-bold leading-none flex items-center gap-3 transition cursor-pointer border outline-none ${
                activeTab === 'delivery'
                  ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.15)]'
                  : 'text-white/60 border-transparent hover:text-white hover:border-white/10'
              }`}
            >
              <MapPin className="w-4 h-4" />
              Logistics GIS Route
              {activeDeliveriesCount > 0 && (
                <span className="ml-auto bg-green-500 text-black px-1.5 py-0.5 rounded-lg text-[9px] font-bold shadow-[0_0_6px_#22c55e]">
                  {activeDeliveriesCount}
                </span>
              )}
            </button>

            <button
              onClick={() => { setActiveTab('knowledge'); setIsSidebarOpen(false); }}
              className={`w-full py-2 px-3 rounded-xl text-xs font-bold leading-none flex items-center gap-3 transition cursor-pointer border outline-none ${
                activeTab === 'knowledge'
                  ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.15)]'
                  : 'text-white/60 border-transparent hover:text-white hover:border-white/10'
              }`}
            >
              <Database className="w-4 h-4" />
              Knowledge Assets
            </button>

            <button
              onClick={() => { setActiveTab('crm'); setIsSidebarOpen(false); }}
              className={`w-full py-2 px-3 rounded-xl text-xs font-bold leading-none flex items-center gap-3 transition cursor-pointer border outline-none ${
                activeTab === 'crm'
                  ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.15)]'
                  : 'text-white/60 border-transparent hover:text-white hover:border-white/10'
              }`}
            >
              <Users className="w-4 h-4" />
              Leads Pipeline
            </button>

            <button
              onClick={() => { setActiveTab('billing'); setIsSidebarOpen(false); }}
              className={`w-full py-2 px-3 rounded-xl text-xs font-bold leading-none flex items-center gap-3 transition cursor-pointer border outline-none ${
                activeTab === 'billing'
                  ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.15)]'
                  : 'text-white/60 border-transparent hover:text-white hover:border-white/10'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              Plans & Ledger
            </button>
          </nav>

          {/* Quick exit footer */}
          <div className="pt-4 border-t border-white/10 flex flex-col gap-2">
            <button
              onClick={fetchTenantData}
              className="w-full py-2.5 border border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/10 text-cyan-400 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Sync Pod Databases
            </button>
            <button
              onClick={onExit}
              className="w-full py-2.5 bg-red-950/20 border border-red-500/30 text-red-400 hover:bg-red-950/40 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              Exit Workspace
            </button>
          </div>
        </div>
      </aside>

      {/* 2. Main Content viewport */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 select-text bg-[#050505]">
        {/* Mobile Header Menu Trigger */}
        <div className="flex md:hidden items-center justify-between pb-4 mb-4 border-b border-white/10">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-1 px-2.5 border border-white/10 rounded-sm bg-[#0A0A0A] text-white/80 hover:text-white flex items-center gap-1.5 cursor-pointer text-[10px] font-black uppercase tracking-wider h-[32px]"
          >
            <Menu className="w-4 h-4 text-cyan-400" />
            <span>Menu Panel</span>
          </button>
          <div className="text-[10px] font-black tracking-widest text-cyan-400 select-none uppercase font-mono">
            {tenant.company_name}
          </div>
          <div className="w-[60px]" />
        </div>
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Header branding info */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold text-cyan-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_8px_#22d3ee] animate-pulse"></span>
                  Multi-tenant Secure Workspace Deployed
                </span>
                <h1 className="text-3xl font-bold text-white mt-1">{tenant.company_name} HQ Overview</h1>
                <p className="text-white/40 text-[10px] mt-1">Custom NLP configurations corresponding to the <strong className="text-cyan-400 capitalize">{tenant.industry_type}</strong> workflow catalog preset guides.</p>
              </div>
            </div>

            {/* Quick KPI stats blocks dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* GIS courier count */}
              <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-5">
                <span className="text-[10px] font-bold text-white/40 block">Unfulfilled Deliveries</span>
                <span className="text-2xl font-bold text-white mt-1 block">{activeDeliveriesCount} Orders</span>
                <span className="text-[9px] text-cyan-400 block mt-1">Real-time GPS tracking enabled</span>
              </div>

              {/* RAG library count */}
              <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-5">
                <span className="text-[10px] font-bold text-white/40 block">Embedded KB Vectors</span>
                <span className="text-2xl font-bold text-white mt-1 block">{totalLKVectors} segments</span>
                <span className="text-[9px] text-purple-400 block mt-1">RAG prompt extraction matches ready</span>
              </div>

              {/* CRM leads pipeline count */}
              <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-5">
                <span className="text-[10px] font-bold text-white/40 block">Open Pipeline Leads</span>
                <span className="text-2xl font-bold text-[#F0F0F0] mt-1 block">{activeLeadsCount} prospects</span>
                <span className="text-[9px] text-green-400 block mt-1">Intent rates automated via NLP</span>
              </div>

              {/* Subscription ledger tier */}
              <div className="bg-[#111] border border-white/20 text-white rounded-xl p-5 flex flex-col justify-between">
                <div>
                  <span className="text-[9px] font-bold text-white/40 block">Enterprise Subscription</span>
                  <span className="text-lg font-bold mt-0.5 block capitalize text-cyan-400">{tenant.subscription_plan} Plan</span>
                </div>
                <span className="text-[10px] text-cyan-400 font-bold block mt-2.5">Status: {tenant.subscription_status}</span>
              </div>
            </div>

            {/* Sub-panels details */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Industry Preset details card */}
              <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6 lg:col-span-2">
                <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-1.5 animate-none">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  Synthesis Profile workflows for '{tenant.industry_type}'
                </h3>
                <p className="text-[10px] text-[#F0F0F0]/50 mb-6 font-semibold">Our system maps conversational hooks dynamically into standard tools libraries. Read workflow nodes below:</p>

                <div className="space-y-4">
                  {tenant.industry_type === 'delivery' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="bg-black p-4 rounded-xl border border-white/10">
                        <strong className="text-cyan-400 font-bold block mb-1">🚚 Logistics Dispatch</strong>
                        <p className="text-[#F0F0F0]/60 text-[11px] leading-relaxed">Auto intercepts requests representing moving items, extracts origin and final addresses coordinates, quotes fares.</p>
                      </div>
                      <div className="bg-black p-4 rounded-xl border border-white/10">
                        <strong className="text-purple-400 font-bold block mb-1">📍 Realtime Tracking Channels</strong>
                        <p className="text-[#F0F0F0]/60 text-[11px] leading-relaxed">Pushes SMS coordinate telemetry nodes directly to the active customer as soon as dispatcher assigns rider.</p>
                      </div>
                    </div>
                  )}

                  {tenant.industry_type === 'school' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="bg-black p-4 rounded-xl border border-white/10">
                        <strong className="text-cyan-400 font-bold block mb-1">🏫 Circular Inquiries</strong>
                        <p className="text-[#F0F0F0]/60 text-[11px] leading-relaxed">Queries indexed academic curriculum calendars, term schedules, or administrative circulars dynamically to answer parents.</p>
                      </div>
                      <div className="bg-black p-4 rounded-xl border border-white/10">
                        <strong className="text-purple-400 font-bold block mb-1">🎫 Admissions Lead Scoring</strong>
                        <p className="text-[#F0F0F0]/60 text-[11px] leading-relaxed">Extracts enrollment interests values from conversations and rates scores directly into the school CRM.</p>
                      </div>
                    </div>
                  )}

                  {tenant.industry_type === 'clinic' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="bg-black p-4 rounded-xl border border-white/10">
                        <strong className="text-cyan-400 font-bold block mb-1">🩺 Checkup Scheduler</strong>
                        <p className="text-[#F0F0F0]/60 text-[11px] leading-relaxed">Intercepts appointment interest prompts. Calls scheduling logic algorithms, verifying physician slots.</p>
                      </div>
                      <div className="bg-black p-4 rounded-xl border border-white/10">
                        <strong className="text-purple-400 font-bold block mb-1">💊 Drug Vector Lookup</strong>
                        <p className="text-[#F0F0F0]/60 text-[11px] leading-relaxed">References specialized health documents embedded in your Knowledge Base structure safely.</p>
                      </div>
                    </div>
                  )}

                  {/* Fallback info for other industries */}
                  {!['delivery', 'school', 'clinic'].includes(tenant.industry_type) && (
                    <div className="p-4 bg-black rounded-xl border border-white/10 text-xs text-[#F0F0F0]/60">
                      We loaded the general assistant context. It extracts facts from your ingested files, logs contacts automatically into CRM, rating scores on structured intent parameters.
                    </div>
                  )}

                  <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-xl flex items-center justify-between text-xs text-cyan-400">
                    <span className="font-bold flex items-center gap-1.5">
                      <PhoneCall className="w-3.5 h-3.5" />
                      Dynamic APIs connected directly to WhatsApp routing nodes.
                    </span>
                    <button
                      onClick={() => setActiveTab('inbox')}
                      className="text-[11px] font-black underline uppercase tracking-wider cursor-pointer hover:text-cyan-300"
                    >
                      Fire Sandbox Simulator
                    </button>
                  </div>
                </div>
              </div>

              {/* Right: Active Workflows status */}
              <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white mb-1">Central Automation Engines</h3>
                  <p className="text-[10px] text-[#F0F0F0]/50 mb-4">Workflow routines active inside your tenant isolated sandbox.</p>

                  <div className="space-y-3.5">
                    {workflows.map((w) => (
                      <div key={w.id} className="flex justify-between items-center text-xs border bg-black border-white/10 p-3.5 rounded-xl">
                        <div>
                          <span className="font-bold text-[#F0F0F0] block">{w.name}</span>
                          <span className="text-[9px] text-cyan-400 block mt-1">{w.nodes.length} structural steps mapped</span>
                        </div>
                        <span className={`px-2 py-0.5 text-[9px] font-bold rounded-lg border ${
                          w.is_active
                            ? 'bg-green-500/10 text-green-400 border-green-500/20 shadow-[0_0_6px_rgba(34,197,94,0.15)]'
                            : 'bg-white/5 text-white/40 border-white/10'
                        }`}>
                          {w.is_active ? 'Live' : 'Off'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-white/10 flex items-center gap-2 text-[9px] text-cyan-400 font-bold mt-6">
                  <Activity className="w-4 h-4 text-cyan-500 animate-pulse" />
                  SaaS Isolation row filters: ON
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'inbox' && (
          <UnifiedInbox
            tenantId={tenantId}
            conversations={conversations}
            customers={customers}
            onRefresh={fetchTenantData}
          />
        )}

        {activeTab === 'workflow' && (
          <WorkflowBuilder
            tenantId={tenantId}
            workflows={workflows}
            onRefresh={fetchTenantData}
          />
        )}

        {activeTab === 'delivery' && (
          <DeliveryModule
            tenantId={tenantId}
            orders={orders}
            riders={riders}
            onRefresh={fetchTenantData}
          />
        )}

        {activeTab === 'knowledge' && (
          <KnowledgeBaseUI
            tenantId={tenantId}
            items={knowledge}
            onRefresh={fetchTenantData}
          />
        )}

        {activeTab === 'crm' && (
          <CrmUI
            tenantId={tenantId}
            customers={customers}
            leads={leads}
            onRefresh={fetchTenantData}
          />
        )}

        {activeTab === 'billing' && (
          <BillingUI
            tenantId={tenantId}
            tenant={tenant}
            payments={payments}
            onRefresh={fetchTenantData}
          />
        )}
      </main>
    </div>
  );
}
