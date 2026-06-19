/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import {
  Sparkles,
  Truck,
  GraduationCap,
  Building2,
  Hotel as HotelIcon,
  Stethoscope,
  PiggyBank,
  ShoppingBag,
  Utensils,
  Wrench,
  Shield,
  ArrowRight
} from 'lucide-react';
import { IndustryType, SubscriptionPlan } from '../types.js';

interface OnboardingProps {
  onOnboardComplete: (tenant: any) => void;
  onViewDemo: (tenantId: string) => void;
}

const INDUSTRIES: { id: IndustryType; label: string; desc: string; icon: any }[] = [
  { id: 'delivery', label: 'Delivery Companies', desc: 'Auto route distance mapping, driver courier assignments & fare quote generators', icon: Truck },
  { id: 'school', label: 'Schools & Academies', desc: 'Tuition inquiry processing, admission circular dispatch & parent Q&As', icon: GraduationCap },
  { id: 'clinic', label: 'Medical Clinics', desc: 'Verify physician calendar slots, book checkup queues & send diagnostic info', icon: Stethoscope },
  { id: 'hotel', label: 'Hotels & Lodges', desc: 'Room reservation checkups, check-out support guides & room-service bots', icon: HotelIcon },
  { id: 'real_estate', label: 'Real Estate Agencies', desc: 'Instant rental quotes, properties schedules & buyer background details', icon: Building2 },
  { id: 'sacco', label: 'Savings & SACCOs', desc: 'Verify dividend statements, loan application procedures & savings checks', icon: PiggyBank },
  { id: 'retail', label: 'Retail Businesses', desc: 'Stock inventory lookup, branch directories & digital invoice delivery', icon: ShoppingBag },
  { id: 'restaurant', label: 'Restaurants & Cafes', desc: 'Process digital menu orders, takeaway table bookings & recipe info', icon: Utensils },
  { id: 'hardware', label: 'Hardware Shops', desc: 'Check materials stocks, construction bulk pricing & custom quotes', icon: Wrench },
  { id: 'security', label: 'Security Companies', desc: 'Emergency dispatchers logs, guard routing reports & client alarms', icon: Shield }
];

export default function Onboarding({ onOnboardComplete, onViewDemo }: OnboardingProps) {
  const [companyName, setCompanyName] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryType | null>(null);
  const [plan, setPlan] = useState<SubscriptionPlan>('starter');
  const [preloadTemplates, setPreloadTemplates] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!companyName.trim()) {
      setError('Please provide a descriptive company name.');
      return;
    }
    if (!selectedIndustry) {
      setError('Please select your business core industry classification.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: companyName,
          industry_type: selectedIndustry,
          plan: plan,
          preload_templates: preloadTemplates
        })
      });

      const data = await res.json();
      if (data.success) {
        onOnboardComplete(data.tenant);
      } else {
        setError(data.error || 'Failed to complete tenant onboarding.');
      }
    } catch (e) {
      setError('Server connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="swibz-onboarding" className="min-h-screen bg-[#050505] text-[#F0F0F0] flex flex-col justify-between p-6 antialiased font-sans">
      <div className="max-w-5xl mx-auto w-full my-auto py-12">
        {/* Header Block */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-900/10 border border-cyan-500/20 rounded-full text-cyan-400 text-[10px] font-semibold tracking-wider mb-4 shadow-[0_0_8px_rgba(34,211,238,0.1)]">
            <Sparkles className="w-3.5 h-3.5" />
            Swibz AI Core SaaS Platform
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight sm:text-[52px] leading-tight mb-4">
            Empower Your Business with Autonomous AI
          </h1>
          <p className="mt-4 text-white/50 text-sm tracking-wide">
            Deploy intelligent RAG-driven assistants connected directly to WhatsApp, Telegram, SMS, or Webchat. Automatically pre-configured for your industry.
          </p>
        </div>

        {/* Input Details */}
        <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 sm:p-10 max-w-4xl mx-auto mb-8">
          <h2 className="text-lg font-bold text-[#F0F0F0] tracking-wide mb-6 flex items-center gap-3">
            <span className="flex items-center justify-center w-6 h-6 border border-cyan-500 bg-cyan-500/10 text-cyan-400 text-xs font-bold rounded-full">1</span>
            Business Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label htmlFor="comp-name" className="block text-xs font-bold tracking-wide text-white/40 mb-2">Company / Organization Name</label>
              <input
                id="comp-name"
                type="text"
                placeholder="e.g., Pearl Logistics Services"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-4 py-3 bg-black border border-white/10 rounded-xl focus:outline-none focus:border-cyan-500 text-white text-[13px] placeholder-white/25"
              />
            </div>
            <div>
              <label htmlFor="sub-plan" className="block text-xs font-bold tracking-wide text-white/40 mb-2">Select Subscription Plan</label>
              <div className="grid grid-cols-3 gap-2">
                {(['starter', 'professional', 'enterprise'] as SubscriptionPlan[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPlan(p)}
                    className={`py-3 capitalize text-xs font-bold tracking-wide rounded-xl border transition-all ${
                      plan === p
                        ? 'bg-cyan-500 text-black border-cyan-500 font-bold shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                        : 'bg-black text-white/60 border-white/10 hover:border-white/30'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <h2 className="text-lg font-bold text-[#F0F0F0] tracking-wide mb-2 flex items-center gap-3">
            <span className="flex items-center justify-center w-6 h-6 border border-cyan-500 bg-cyan-500/10 text-cyan-400 text-xs font-bold rounded-full">2</span>
            Choose Your Industry Classification
          </h2>
          <p className="text-white/40 text-xs mb-6 leading-relaxed">
            Swibz workspace will automatically synthesize targeted virtual nodes and seed custom knowledge data.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
            {INDUSTRIES.map((ind) => {
              const Icon = ind.icon;
              const isSelected = selectedIndustry === ind.id;
              return (
                <button
                  key={ind.id}
                  type="button"
                  onClick={() => setSelectedIndustry(ind.id)}
                  className={`flex flex-col text-left p-4 rounded-xl border transition-all relative outline-none cursor-pointer ${
                    isSelected
                      ? 'bg-[#121212] border-cyan-500 border-2 text-white shadow-[0_0_15px_rgba(6,182,212,0.15)] scale-[1.02]'
                      : 'bg-[#0A0A0A] border-white/5 hover:border-white/20 text-white/80'
                  }`}
                >
                  <Icon className={`w-6 h-6 mb-3 ${isSelected ? 'text-cyan-400' : 'text-white/40'}`} />
                  <span className="font-bold text-xs tracking-tight">{ind.label}</span>
                  <span className={`text-[10px] mt-2 line-clamp-3 leading-snug font-sans ${isSelected ? 'text-white/65' : 'text-white/40'}`}>
                    {ind.desc}
                  </span>
                </button>
              );
            })}
          </div>

          <h2 className="text-lg font-bold text-[#F0F0F0] tracking-wide mb-2 flex items-center gap-3">
            <span className="flex items-center justify-center w-6 h-6 border border-cyan-500 bg-cyan-500/10 text-cyan-400 text-xs font-bold rounded-full">3</span>
            AI Bot Configuration & Training Strategy
          </h2>
          <p className="text-white/40 text-xs mb-6 leading-relaxed">
            Choose whether to pre-load our expert preloaded knowledge-base templates, or start training your own custom AI with clean slates.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <button
              type="button"
              onClick={() => setPreloadTemplates(true)}
              className={`flex flex-col text-left p-4 rounded-xl border transition-all relative outline-none cursor-pointer ${
                preloadTemplates
                  ? 'bg-[#121212] border-cyan-500 border-2 text-white shadow-[0_0_15px_rgba(6,182,212,0.15)] scale-[1.01]'
                  : 'bg-[#0A0A0A] border-white/5 hover:border-white/20 text-white/80'
              }`}
            >
              <span className="font-bold text-xs tracking-tight text-white mb-1">Preload Expert Knowledge Base Templates</span>
              <span className="text-[10px] text-white/40 leading-snug">
                Recommended. Pre-seeds full diagnostic FAQs, price guidelines, and default branch catalogs to make your AI instantly active.
              </span>
            </button>
            <button
              type="button"
              onClick={() => setPreloadTemplates(false)}
              className={`flex flex-col text-left p-4 rounded-xl border transition-all relative outline-none cursor-pointer ${
                !preloadTemplates
                  ? 'bg-[#121212] border-cyan-500 border-2 text-white shadow-[0_0_15px_rgba(6,182,212,0.15)] scale-[1.01]'
                  : 'bg-[#0A0A0A] border-white/5 hover:border-white/20 text-white/80'
              }`}
            >
              <span className="font-bold text-xs tracking-tight text-white mb-1">Start Clean & Custom Training</span>
              <span className="text-[10px] text-white/40 leading-snug">
                Starts with an empty draft. Upload your own operational manuals, directories, PDFs, and train your specific custom AI bot.
              </span>
            </button>
          </div>

          {error && (
            <div className="p-4 bg-red-950/20 border border-red-500/30 rounded-xl text-red-400 text-xs mb-6">
              ⚠️ Warning: {error}
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 border-t border-white/10">
            <div className="text-left">
              <span className="text-[10px] font-bold text-white/30 block tracking-wide mb-1.5">Default Sandbox Demos</span>
              <div className="flex flex-wrap gap-4">
                <button
                  type="button"
                  onClick={() => onViewDemo('t-delivery-001')}
                  className="text-xs font-bold text-cyan-400 hover:text-cyan-300 underline cursor-pointer tracking-wide"
                >
                  [Logistics Demo]
                </button>
                <button
                  type="button"
                  onClick={() => onViewDemo('t-school-002')}
                  className="text-xs font-bold text-cyan-400 hover:text-cyan-300 underline cursor-pointer tracking-wide"
                >
                  [Academy Demo]
                </button>
                <button
                  type="button"
                  onClick={() => onViewDemo('t-clinic-003')}
                  className="text-xs font-bold text-cyan-400 hover:text-cyan-300 underline cursor-pointer tracking-wide"
                >
                  [Clinical Demo]
                </button>
              </div>
            </div>

            <button
              onClick={handleRegister}
              disabled={loading}
              className="w-full sm:w-auto px-8 py-3.5 bg-cyan-500 hover:bg-cyan-400 disabled:bg-cyan-900 disabled:text-cyan-600 text-black font-bold rounded-xl border border-cyan-300/30 text-xs tracking-wide cursor-pointer transition-all flex items-center justify-center gap-2"
            >
              {loading ? 'Synthesizing Tenant Pod...' : 'Launch AI Core Engine'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Informational specs Footer */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="bg-[#080808] border border-white/10 p-5 rounded-xl">
            <h3 className="text-[11px] font-bold text-cyan-400 mb-1">Row Isolation</h3>
            <p className="text-[11px] text-[#F0F0F0]/40 leading-relaxed font-sans">Mandatory multi-tenant tenant_id isolation layers prevent crossed database memory scans.</p>
          </div>
          <div className="bg-[#080808] border border-white/10 p-5 rounded-xl">
            <h3 className="text-[11px] font-bold text-cyan-400 mb-1">RAG Context Mapping</h3>
            <p className="text-[11px] text-[#F0F0F0]/40 leading-relaxed font-sans">Direct dynamic embedding matcher queries PDF/text file vectors on consumer prompts.</p>
          </div>
          <div className="bg-[#080808] border border-white/10 p-5 rounded-xl">
            <h3 className="text-[11px] font-bold text-cyan-400 mb-1">NLP Function Hooks</h3>
            <p className="text-[11px] text-[#F0F0F0]/40 leading-relaxed font-sans">Express Webhooks invoke routing price metrics tools, calendar boards, or CRM scores.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
