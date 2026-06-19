/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import { useState } from 'react';
import {
  Sparkles,
  TrendingUp,
  Award,
  CircleDollarSign,
  Briefcase,
  Layers,
  CheckCircle,
  XCircle,
  Users
} from 'lucide-react';
import { Customer, Lead } from '../types.js';

interface CrmUIProps {
  tenantId: string;
  customers: Customer[];
  leads: Lead[];
  onRefresh: () => void;
}

export default function CrmUI({ tenantId, customers, leads, onRefresh }: CrmUIProps) {
  const [activeTab, setActiveTab] = useState<'leads' | 'contacts'>('leads');

  const updateLeadStatus = async (leadId: string, status: Lead['status']) => {
    try {
      const res = await fetch(`/api/lead/${leadId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (data.success) {
        onRefresh();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Compute stats
  const totalLeadValue = leads.reduce((acc, curr) => acc + curr.estimated_value, 0);
  const conversionRate = leads.length > 0
    ? Math.round((leads.filter((l) => l.status === 'won').length / leads.length) * 100)
    : 0;

  return (
    <div className="space-y-6 text-[#F0F0F0]">
      {/* KPI Overviews */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Value */}
        <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-white/40 block tracking-wider">Estimated Pipeline Value</span>
            <span className="text-xl font-bold text-white mt-1 block">UGX {totalLeadValue.toLocaleString()}</span>
            <span className="text-[9px] text-cyan-400 font-bold block mt-1">Automated quotation cycles</span>
          </div>
          <div className="p-3 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-xl shrink-0">
            <CircleDollarSign className="w-5 h-5" />
          </div>
        </div>
 
        {/* Coversion */}
        <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-white/40 block tracking-wider">Win Conversion Ratio</span>
            <span className="text-xl font-bold text-white mt-1 block">{conversionRate}%</span>
            <span className="text-[9px] text-green-400 font-bold block mt-1">Won pipeline entities</span>
          </div>
          <div className="p-3 bg-green-500/10 text-green-400 border border-green-500/20 rounded-xl shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
 
        {/* High intent scale */}
        <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-white/40 block tracking-wider">AI Intent Index</span>
            <span className="text-xl font-bold text-white mt-1 block">
              {customers.length > 0 ? Math.round(customers.reduce((a, c) => a + c.lead_score, 0) / customers.length) : 0} / 100
            </span>
            <span className="text-[9px] text-purple-400 font-bold block mt-1">Avg RAG Intent score</span>
          </div>
          <div className="p-3 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-xl shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      </div>
 
      {/* Tabs */}
      <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-5">
        <div className="flex border-b border-white/10 mb-6">
          <button
            onClick={() => setActiveTab('leads')}
            className={`pb-3 px-4 font-semibold text-xs tracking-wide cursor-pointer border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'leads' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-[#F0F0F0]/40'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            Dynamic Pipeline Leads ({leads.length})
          </button>
          <button
            onClick={() => setActiveTab('contacts')}
            className={`pb-3 px-4 font-semibold text-xs tracking-wide cursor-pointer border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'contacts' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-[#F0F0F0]/40'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Core Customer Profiles ({customers.length})
          </button>
        </div>
 
        {activeTab === 'leads' ? (
          <div className="space-y-4">
            {leads.length === 0 ? (
              <p className="text-center py-10 text-[#F0F0F0]/30 text-xs italic">No leads created yet. Trigger chat inquiries to capture leads.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {leads.map((l) => (
                  <div key={l.id} className="p-4 border border-white/10 rounded-xl bg-black flex flex-col justify-between transition hover:border-white/20">
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <div>
                          <span className="font-bold text-white text-xs">Lead: {l.id}</span>
                          <span className="block text-[9px] text-[#F0F0F0]/40 mt-0.5">
                            Customer Ref: <span className="text-cyan-400">ID #{l.customer_id}</span>
                          </span>
                        </div>
                        <span className={`px-2 py-0.5 text-[8px] font-bold rounded-md border ${
                          l.status === 'won' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                          l.status === 'lost' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                          'bg-purple-500/10 text-purple-400 border-purple-500/20'
                        }`}>
                          {l.status}
                        </span>
                      </div>
 
                      <div className="p-3 bg-black rounded-lg border border-white/10 mb-3 text-xs text-[#F0F0F0]/80 space-y-1.5 leading-relaxed">
                        <div><strong className="text-white/40 text-[9px] font-bold tracking-wide">Concept Interest:</strong> {l.interest}</div>
                        <div><strong className="text-white/40 text-[9px] font-bold tracking-wide">Est. Pipeline:</strong> UGX {l.estimated_value.toLocaleString()}</div>
                        <div className="line-clamp-2"><strong className="text-white/40 text-[9px] font-bold tracking-wide">AI Scored Context:</strong> {l.summary}</div>
                      </div>
                    </div>
 
                     <div className="flex justify-between items-center pt-3 border-t border-white/10">
                      <div className="flex items-center gap-1 whitespace-nowrap">
                        <span className="text-[10px] text-white/40">AI Intent:</span>
                        <span className="text-xs font-bold text-cyan-400">{l.score}/100</span>
                      </div>
 
                      <div className="flex gap-1.5">
                        {l.status !== 'won' && (
                          <button
                            onClick={() => updateLeadStatus(l.id, 'won')}
                            className="p-1 px-2.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 font-bold rounded-lg text-[9px] tracking-wide flex items-center gap-1 cursor-pointer transition"
                          >
                            <CheckCircle className="w-3 h-3" /> Won
                          </button>
                        )}
                        {l.status !== 'lost' && (
                          <button
                            onClick={() => updateLeadStatus(l.id, 'lost')}
                            className="p-1 px-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-bold rounded-lg text-[9px] tracking-wide flex items-center gap-1 cursor-pointer transition"
                          >
                            <XCircle className="w-3 h-3" /> Lost
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#050505] border-b border-white/10 text-white/40 tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Full Name</th>
                  <th className="py-2.5 px-3">Contact Email</th>
                  <th className="py-2.5 px-3">Phone Line</th>
                  <th className="py-2.5 px-3">Enrolled At</th>
                  <th className="py-2.5 px-3 tracking-wider">AI Lead Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-[#F0F0F0]/80">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-white/5 transition">
                    <td className="py-3 px-3 font-bold text-white">{c.name}</td>
                    <td className="py-3 px-3 text-cyan-400">{c.email || 'N/A'}</td>
                    <td className="py-3 px-3">{c.phone}</td>
                    <td className="py-3 px-3 text-[9px] text-[#F0F0F0]/40">{new Date(c.created_at).toLocaleDateString()}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-white/10 h-1 rounded-full w-24 overflow-hidden">
                          <div
                            className={`h-full ${
                              c.lead_score >= 80 ? 'bg-cyan-400' : c.lead_score >= 50 ? 'bg-purple-400' : 'bg-white/40'
                            }`}
                            style={{ width: `${c.lead_score}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-bold text-cyan-400">{c.lead_score}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
