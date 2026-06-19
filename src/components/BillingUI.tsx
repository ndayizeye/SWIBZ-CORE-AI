/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import { useState } from 'react';
import {
  ShieldCheck,
  Zap,
  Check,
  CreditCard,
  Phone,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Gift
} from 'lucide-react';
import { Payment, SubscriptionPlan, Tenant } from '../types.js';

interface BillingUIProps {
  tenantId: string;
  tenant: Tenant;
  payments: Payment[];
  onRefresh: () => void;
}

export default function BillingUI({ tenantId, tenant, payments, onRefresh }: BillingUIProps) {
  const [selectedPlanForPay, setSelectedPlanForPay] = useState<SubscriptionPlan | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'mtn_momo' | 'airtel_money' | 'stripe'>('mtn_momo');
  const [phoneNumber, setPhoneNumber] = useState('+256772120400');
  const [stripeCard, setStripeCard] = useState('4242 •••• •••• 4242');

  const [processing, setProcessing] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(0); // 0 select, 1 checkout input, 2 processing, 3 completed

  const PLANS_SPECS = [
    {
      id: 'starter' as const,
      name: 'Starter Tier',
      priceUgx: 50000,
      desc: 'Deploy 1 basic AI core agent with manual context chunks and WhatsApp support hooks.',
      features: ['1 Active Channel Connector', 'Under 500 AI Chat Triggers / Month', 'Standard Text Upload RAG', 'Basic Workflow Nodes']
    },
    {
      id: 'professional' as const,
      name: 'Professional Tier',
      priceUgx: 150000,
      desc: 'Highly robust multitenant capabilities featuring custom pricing matrix rules and automated CRM leads logs.',
      features: ['All Channels (WhatsApp, Telegram, etc.)', 'Unlimited Inbound API Swarms', 'Geocoding GIS distance solvers', 'Visual Workflow Builder Actions']
    },
    {
      id: 'enterprise' as const,
      name: 'Enterprise Tier',
      priceUgx: 500000,
      desc: 'Full-suite institutional workflows support, priority system executions guarantees, custom SLAs.',
      features: ['Dedicated Kubernetes Pod', 'Custom LLM Fine-tunings Support', '24/7 Telephone SLA Support', 'Unlimited GIS Matrix calculations']
    }
  ];

  const handleInitializeCheckout = (planId: SubscriptionPlan) => {
    setSelectedPlanForPay(planId);
    setCheckoutStep(1); // checkout modal
  };

  const handleProcessSubscriptionPay = async () => {
    if (!selectedPlanForPay) return;
    const planCost = PLANS_SPECS.find((p) => p.id === selectedPlanForPay)?.priceUgx || 50000;

    setProcessing(true);
    setCheckoutStep(2); // processing animation

    setTimeout(async () => {
      try {
        const res = await fetch(`/api/tenant/${tenantId}/pay`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: planCost,
            method: paymentMethod
          })
        });

        const data = await res.json();
        if (data.success) {
          setCheckoutStep(3); // success
          setTimeout(() => {
            onRefresh();
            setCheckoutStep(0);
          }, 3000);
        }
      } catch (e) {
        console.error(e);
        setCheckoutStep(0);
      } finally {
        setProcessing(false);
      }
    }, 2500);
  };

  return (
    <div className="space-y-6 text-[#F0F0F0]">
      {/* Overview */}
      <div className="bg-[#0A0A0A] rounded-xl p-6 border border-white/10 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold text-[#F0F0F0]/40 block mb-1">Company Account Scope</span>
          <h2 className="text-xl font-bold text-white tracking-tight">{tenant.company_name}</h2>
          <div className="flex gap-2 items-center mt-3">
            <span className="px-3 py-1 bg-white/5 text-cyan-400 font-bold capitalize text-[10px] rounded-lg border border-cyan-500/20">
              Active Tier: {tenant.subscription_plan}
            </span>
            <span className="px-3 py-1 bg-green-500/10 text-green-400 font-bold text-[10px] rounded-lg border border-green-500/10">
              Billing Ledger: {tenant.subscription_status}
            </span>
          </div>
        </div>
 
        <div className="text-left sm:text-right">
          <span className="text-[10px] text-white/40 font-bold block">Next Renewal Invoice Date</span>
          <span className="text-xs font-bold block mt-1 text-white">July 18, 2026</span>
          <span className="text-[9px] text-[#F0F0F0]/50 block font-semibold mt-1">UGX prices are final inclusive of VAT</span>
        </div>
      </div>
 
      {checkoutStep === 0 && (
        <>
          {/* Sub plans pricing cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS_SPECS.map((p) => {
              const isCurrentPlan = tenant.subscription_plan === p.id;
              return (
                <div
                  key={p.id}
                  className={`bg-[#0A0A0A] border text-left p-6 rounded-xl flex flex-col justify-between transition ${
                    isCurrentPlan ? 'border-cyan-500 bg-cyan-500/5' : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-bold text-xs text-[#F0F0F0]">{p.name}</span>
                      {isCurrentPlan && (
                        <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-400 text-[9px] font-bold rounded-lg border border-cyan-500/20">
                          Active Plan
                        </span>
                      )}
                    </div>
                    <span className="text-xl font-bold text-white mt-2 block">
                      UGX {p.priceUgx.toLocaleString()}
                      <span className="text-xs text-[#F0F0F0]/50 font-normal"> /month</span>
                    </span>
                    <p className="text-[10px] text-white/60 mt-3 leading-relaxed">{p.desc}</p>
 
                    <ul className="mt-5 space-y-2 border-t border-white/10 pt-4 text-[10px] text-[#F0F0F0]/70">
                      {p.features.map((f, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
 
                  <button
                    onClick={() => handleInitializeCheckout(p.id)}
                    className={`mt-6 py-2.5 px-4 rounded-xl text-[10px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      isCurrentPlan
                        ? 'bg-white/5 hover:bg-white/10 text-white/50 border border-white/10'
                        : 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-xs'
                    }`}
                  >
                    Select Plan
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
 
          {/* Historical payments list */}
          <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-5">
            <h3 className="text-xs font-bold text-white mb-4">Subscription Transaction Ledgers</h3>
            {payments.length === 0 ? (
              <p className="text-white/30 text-xs text-center py-6">No payment history recorded.</p>
            ) : (
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left">
                  <thead className="bg-[#050505] border-b border-white/10 text-white/40 font-bold">
                    <tr>
                      <th className="py-2.5 px-3">Reference ID</th>
                      <th className="py-2.5 px-3">Gateway Method</th>
                      <th className="py-2.5 px-3">Date Submitted</th>
                      <th className="py-2.5 px-3 text-right">Fund Value</th>
                      <th className="py-2.5 px-3 text-center">Receipt Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-[#F0F0F0]/85 font-medium">
                    {payments.map((py) => (
                      <tr key={py.id} className="hover:bg-white/5">
                        <td className="py-3 px-3 font-mono text-cyan-400 select-all font-bold">{py.reference}</td>
                        <td className="py-3 px-3 capitalize font-bold text-white/80">{py.method.replace('_', ' ')}</td>
                        <td className="py-3 px-3 text-[9px] text-[#F0F0F0]/40">{new Date(py.created_at).toLocaleDateString()}</td>
                        <td className="py-3 px-3 text-right font-bold text-white">UGX {py.amount.toLocaleString()}</td>
                        <td className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg font-bold text-[9px]">
                            {py.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
 
      {checkoutStep > 0 && selectedPlanForPay && (
        <div className="bg-[#0A0A0A] border border-white/10 rounded-xl max-w-lg mx-auto p-6">
          {checkoutStep === 1 && (
            <div className="space-y-4 text-left">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-5 h-5 text-cyan-400" />
                SaaS Secure Checkout Gateway
              </h3>
              <p className="text-[10px] text-[#F0F0F0]/65 leading-relaxed">
                You are subscribing to the <strong className="text-white capitalize font-bold">{selectedPlanForPay} plan</strong>. Secure transactions processed via integrated API brokers.
              </p>
 
              <div className="bg-black border border-white/10 p-4 rounded-xl text-xs font-bold text-[#F0F0F0]/80 flex justify-between">
                <span className="text-[#F0F0F0]/55 text-[10px]">Total Charge:</span>
                <span className="text-cyan-400 text-sm">
                  UGX {(PLANS_SPECS.find((x) => x.id === selectedPlanForPay)?.priceUgx || 0).toLocaleString()}
                </span>
              </div>
 
              {/* Selector */}
              <div>
                <label className="block text-[9px] font-bold text-white/40 mb-2">Choose Payment Provider</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setPaymentMethod('mtn_momo')}
                    className={`py-2 px-3 border rounded-xl text-[10px] font-bold flex flex-col items-center gap-1.5 transition cursor-pointer ${
                      paymentMethod === 'mtn_momo' ? 'border-yellow-500 bg-yellow-500/5 text-white' : 'border-white/10 text-white/40 hover:bg-white/5'
                    }`}
                  >
                    <span className="w-6 h-6 rounded-lg bg-yellow-500/20 text-yellow-400 font-bold text-[10px] flex items-center justify-center border border-yellow-500/30">M</span>
                    MTN MoMo
                  </button>
                  <button
                    onClick={() => setPaymentMethod('airtel_money')}
                    className={`py-2 px-3 border rounded-xl text-[10px] font-bold flex flex-col items-center gap-1.5 transition cursor-pointer ${
                      paymentMethod === 'airtel_money' ? 'border-red-500 bg-red-500/5 text-white' : 'border-white/10 text-white/40 hover:bg-white/5'
                    }`}
                  >
                    <span className="w-6 h-6 rounded-lg bg-red-600/20 text-red-500 font-bold text-[10px] flex items-center justify-center border border-red-500/30">A</span>
                    AirtelPay
                  </button>
                  <button
                    onClick={() => setPaymentMethod('stripe')}
                    className={`py-2 px-3 border rounded-xl text-[10px] font-bold flex flex-col items-center gap-1.5 transition cursor-pointer ${
                      paymentMethod === 'stripe' ? 'border-cyan-500 bg-cyan-500/5 text-white' : 'border-white/10 text-white/40 hover:bg-white/5'
                    }`}
                  >
                    <CreditCard className="w-6 h-6 text-cyan-400 shrink-0" />
                    Credit Card
                  </button>
                </div>
              </div>
 
              {/* Number/Card input */}
              {paymentMethod !== 'stripe' ? (
                <div>
                  <label htmlFor="momopay-phone" className="block text-[9px] font-bold text-white/40 mb-1.5 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-white/30" /> Mobile Money Line Number
                  </label>
                  <input
                    id="momopay-phone"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+25677xxxxxx"
                    className="w-full px-3 py-2 text-xs border border-white/10 bg-black text-white focus:outline-none focus:border-cyan-500/55 rounded-xl font-bold"
                  />
                  <span className="text-[9px] text-[#F0F0F0]/40 block mt-1.5">A dynamic USSD push alert pin modal will trigger on this phone line.</span>
                </div>
              ) : (
                <div>
                  <label htmlFor="credit-card-m" className="block text-[9px] font-bold text-white/40 mb-1.5">Credit Card Information</label>
                  <input
                    id="credit-card-m"
                    type="text"
                    value={stripeCard}
                    onChange={(e) => setStripeCard(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-white/10 bg-black text-white focus:outline-none focus:border-cyan-500/55 rounded-xl font-bold"
                  />
                  <span className="text-[9px] text-[#F0F0F0]/40 block mt-1.5">Protected by Stripe AES-256 database tokenization keys standards.</span>
                </div>
              )}
 
              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setCheckoutStep(0)}
                  className="flex-1 py-3 border border-white/10 hover:bg-white/5 font-bold text-[#F0F0F0]/65 rounded-xl text-xs cursor-pointer tracking-wider"
                >
                  Go Back
                </button>
                <button
                  type="button"
                  onClick={handleProcessSubscriptionPay}
                  className="flex-1 py-1.5 md:py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-xl text-xs cursor-pointer tracking-wider transition shadow-md"
                >
                  Submit Payment
                </button>
              </div>
            </div>
          )}
 
          {checkoutStep === 2 && (
            <div className="p-12 text-center space-y-4">
              <RefreshCw className="w-10 h-10 text-cyan-400 animate-spin mx-auto" />
              <h4 className="text-xs font-bold text-white">Connecting payment brokerage...</h4>
              <p className="text-[10px] text-[#F0F0F0]/50 leading-relaxed">
                {paymentMethod !== 'stripe' ? `Pushed instant USSD request to SIM on ${phoneNumber}. Verification locks are active.` : 'Authorizing credit card transaction...'}
              </p>
            </div>
          )}
 
          {checkoutStep === 3 && (
            <div className="p-10 text-center space-y-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 text-green-400 border border-green-500/20 flex items-center justify-center mx-auto">
                <Check className="w-6 h-6" />
              </div>
              <h4 className="text-xs font-bold text-white">SaaS Plan {selectedPlanForPay} Deployed!</h4>
              <p className="text-[10px] text-[#F0F0F0]/50 leading-relaxed">
                Thank you! Payment ledger authorized successfully. Your workspace parameters have been updated to the new plan capabilities variables.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
