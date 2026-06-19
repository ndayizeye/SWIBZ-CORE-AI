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
  ChevronRight
} from 'lucide-react';
import { AnalyticsSummary, Tenant } from '../types.js';

interface AdminDashboardProps {
  onSelectTenant: (tenantId: string) => void;
}

export default function AdminDashboard({ onSelectTenant }: AdminDashboardProps) {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  useEffect(() => {
    fetchAdminData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 min-h-[500px]">
        <div className="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-slate-500 mt-4">Polling Swibz centralization registries...</p>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="p-8 bg-red-50 border border-red-200 text-red-700 rounded-xl max-w-2xl mx-auto my-10">
        <h3 className="font-bold">Registry Connection Fault</h3>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  // Calculate percentage ratios for channel charts
  const channels = analytics.conversations_by_channel;
  const channelTotal = channels.whatsapp + channels.telegram + channels.webchat + channels.sms + channels.email || 1;

  return (
    <div id="swibz-admin-dash" className="p-6 max-w-7xl mx-auto bg-[#050505] text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-[10px] font-bold text-cyan-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_8px_#22d3ee] animate-pulse"></span>
            Swibz Central Command
          </span>
          <h1 className="text-3xl font-bold text-white mt-1">Platform Central Registry</h1>
          <p className="text-white/40 text-[10px] mt-1">Global operations node, subscription revenues, and multitenancy isolation verifications.</p>
        </div>
        <button
          onClick={fetchAdminData}
          className="px-4 py-2 border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 rounded-xl text-xs font-bold hover:bg-cyan-500 hover:text-black transition-colors cursor-pointer flex items-center gap-2"
        >
          <Activity className="w-3.5 h-3.5" />
          Refresh Registry
        </button>
      </div>

      {/* Grid of KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {/* Total Tenants */}
        <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-5 flex items-center gap-4">
          <div className="p-3 border border-indigo-500/20 bg-indigo-500/5 text-indigo-400 rounded-xl">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-white/40 block">Total Tenants</span>
            <span className="text-2xl font-bold text-white">{analytics.total_tenants}</span>
            <span className="text-[9px] text-cyan-400 font-bold block mt-0.5">Isolated Row Databases</span>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-5 flex items-center gap-4">
          <div className="p-3 border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 rounded-xl">
            <Banknote className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-white/40 block">Cumulative Revenue</span>
            <span className="text-2xl font-bold text-white">UGX {analytics.total_revenue_ugx.toLocaleString()}</span>
            <span className="text-[9px] text-emerald-400 font-bold block mt-0.5">Mobile Money & Cards</span>
          </div>
        </div>

        {/* Unified Customers */}
        <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-5 flex items-center gap-4">
          <div className="p-3 border border-sky-500/20 bg-sky-500/5 text-sky-400 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-white/40 block">Global Customers</span>
            <span className="text-2xl font-bold text-white">{analytics.active_customers.toLocaleString()}</span>
            <span className="text-[9px] text-sky-400 font-bold block mt-0.5">Unique Contacts</span>
          </div>
        </div>

        {/* AI Inbound Requests */}
        <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-5 flex items-center gap-4">
          <div className="p-3 border border-amber-500/20 bg-amber-500/5 text-amber-400 rounded-xl">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-white/40 block">AI API Requests</span>
            <span className="text-2xl font-bold text-white">{analytics.ai_api_calls.toLocaleString()}</span>
            <span className="text-[9px] text-amber-400 font-bold block mt-0.5">Gemini RAG Operations</span>
          </div>
        </div>
      </div>

      {/* Two Columns Analytics detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Column 1 & 2: Tenants Registry */}
        <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-white animate-none">Active Tenant Registry</h2>
              <p className="text-xs text-white/40">Row-isolated instances deployed within Cloud Run namespaces.</p>
            </div>
            <span className="px-3 py-1 border border-white/10 bg-black rounded-xl text-[10px] font-bold text-cyan-400">
              {tenants.length} Instances
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs bg-[#121212] text-white/45 border-b border-white/10">
                <tr>
                  <th className="py-3 px-4">Company Profile</th>
                  <th className="py-3 px-4">Core Industry</th>
                  <th className="py-3 px-4">Subscription Plan</th>
                  <th className="py-3 px-4">Live Status</th>
                  <th className="py-3 px-4 text-center">Open Dashboard</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {tenants.map((t) => (
                  <tr key={t.tenant_id} className="hover:bg-white/5 transition-colors border-b border-white/5">
                    <td className="py-3 px-4 font-bold text-white">
                      <div>
                        {t.company_name}
                        <span className="block font-mono text-[9px] text-cyan-400 font-normal">{t.tenant_id}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 text-xs bg-black text-slate-300 rounded-lg border border-white/10 font-bold">
                        {t.industry_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-white/50">
                      {t.subscription_plan} plan
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                        t.subscription_status === 'active' ? 'text-green-400' : 'text-amber-400'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${
                          t.subscription_status === 'active' ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-amber-500 animate-pulse'
                        }`}></span>
                        {t.subscription_status === 'active' ? 'Active' : 'Trial'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center border-none">
                      <button
                        onClick={() => onSelectTenant(t.tenant_id)}
                        className="px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-black rounded-xl text-xs font-bold transition-all flex items-center gap-1 mx-auto cursor-pointer"
                      >
                        Launch
                        <ExternalLink className="w-3 h-3" />
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
            <h2 className="text-lg font-bold text-white mb-1">Channel Connector Share</h2>
            <p className="text-xs text-white/40 mb-6">Aggregate conversational routing across integrated endpoints.</p>

            <div className="space-y-4">
              {/* WhatsApp bar */}
              <div>
                <div className="flex justify-between text-xs font-bold text-white/80 mb-1.5">
                  <span className="flex items-center gap-1.5 text-green-400">
                    <span className="w-2.5 h-2.5 bg-green-500 rounded-lg"></span>
                    WhatsApp Webhook
                  </span>
                  <span>{channels.whatsapp} ({Math.round((channels.whatsapp / channelTotal) * 100)}%)</span>
                </div>
                <div className="w-full bg-black border border-white/10 h-2 rounded-full overflow-hidden">
                  <div className="bg-green-500 h-full shadow-[0_0_8px_#22c55e]" style={{ width: `${(channels.whatsapp / channelTotal) * 100}%` }}></div>
                </div>
              </div>

              {/* Telegram bar */}
              <div>
                <div className="flex justify-between text-xs font-bold text-white/80 mb-1.5">
                  <span className="flex items-center gap-1.5 text-cyan-400">
                    <span className="w-2.5 h-2.5 bg-cyan-500 rounded-lg"></span>
                    Telegram Connector
                  </span>
                  <span>{channels.telegram} ({Math.round((channels.telegram / channelTotal) * 100)}%)</span>
                </div>
                <div className="w-full bg-black border border-white/10 h-2 rounded-full overflow-hidden">
                  <div className="bg-cyan-500 h-full shadow-[0_0_8px_#22d3ee]" style={{ width: `${(channels.telegram / channelTotal) * 100}%` }}></div>
                </div>
              </div>

              {/* Website Chat bar */}
              <div>
                <div className="flex justify-between text-xs font-bold text-white/80 mb-1.5">
                  <span className="flex items-center gap-1.5 text-indigo-400">
                    <span className="w-2.5 h-2.5 bg-indigo-500 rounded-lg"></span>
                    Website Embed
                  </span>
                  <span>{channels.webchat} ({Math.round((channels.webchat / channelTotal) * 100)}%)</span>
                </div>
                <div className="w-full bg-black border border-white/10 h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full shadow-[0_0_8px_#6366f1]" style={{ width: `${(channels.webchat / channelTotal) * 100}%` }}></div>
                </div>
              </div>

              {/* SMS bar */}
              <div>
                <div className="flex justify-between text-xs font-bold text-white/80 mb-1.5">
                  <span className="flex items-center gap-1.5 text-purple-400">
                    <span className="w-2.5 h-2.5 bg-purple-500 rounded-lg"></span>
                    SMS Webhook
                  </span>
                  <span>{channels.sms} ({Math.round((channels.sms / channelTotal) * 100)}%)</span>
                </div>
                <div className="w-full bg-black border border-white/10 h-2 rounded-full overflow-hidden">
                  <div className="bg-purple-500 h-full shadow-[0_0_8px_#a855f7]" style={{ width: `${(channels.sms / channelTotal) * 100}%` }}></div>
                </div>
              </div>

              {/* Email bar */}
              <div>
                <div className="flex justify-between text-xs font-bold text-white/80 mb-1.5">
                  <span className="flex items-center gap-1.5 text-gray-400">
                    <span className="w-2.5 h-2.5 bg-gray-500 rounded-lg"></span>
                    Inbound Email SMTP
                  </span>
                  <span>{channels.email} ({Math.round((channels.email / channelTotal) * 100)}%)</span>
                </div>
                <div className="w-full bg-black border border-white/10 h-2 rounded-full overflow-hidden">
                  <div className="bg-gray-500 h-full shadow-[0_0_8px_#6b7280]" style={{ width: `${(channels.email / channelTotal) * 100}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-white/10 text-center mt-6">
            <div className="text-[10px] text-cyan-400 flex items-center justify-center gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_6px_#22d3ee] animate-pulse"></span>
              Core System Running
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
