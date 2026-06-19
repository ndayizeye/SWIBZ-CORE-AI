/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import { useState } from 'react';
import {
  Sparkles,
  Server,
  Building2,
  Users,
  Compass,
  ArrowRight,
  UserCheck,
  Briefcase,
  Sun,
  Moon
} from 'lucide-react';
import Onboarding from './components/Onboarding.js';
import AdminDashboard from './components/AdminDashboard.js';
import BusinessDashboard from './components/BusinessDashboard.js';

type AppRole = 'super_admin' | 'business_owner' | 'onboarding';

export default function App() {
  const [activeRole, setActiveRole] = useState<AppRole>('onboarding');
  const [activeTenantId, setActiveTenantId] = useState<string>('t-delivery-001');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  const handleOnboardComplete = (tenant: any) => {
    setActiveTenantId(tenant.tenant_id);
    setActiveRole('business_owner');
  };

  const handleLaunchSample = (tenantId: string) => {
    setActiveTenantId(tenantId);
    setActiveRole('business_owner');
  };

  return (
    <div id="swibz-root-container" className={`min-h-screen flex flex-col justify-between antialiased font-sans select-none transition-colors duration-200 ${
      theme === 'light' ? 'bg-[#F9FAFB] text-[#111827] light-theme' : 'bg-[#050505] text-[#F0F0F0]'
    }`}>
      {/* 1. Global Navigation Top bar for roles selectors */}
      <header className="h-16 border-b border-white/10 flex items-center justify-between px-4 sm:px-6 bg-[#0A0A0A] z-50 shrink-0 sticky top-0">
        <div className="flex items-center gap-2 sm:gap-4">
          <span className="text-base sm:text-lg md:text-xl font-black tracking-tighter text-cyan-400">
            SWIBZ <span className="hidden sm:inline font-black select-none text-cyan-400">// AI CORE</span>
          </span>
          <div className="h-4 w-[1px] bg-white/20 hidden sm:block"></div>
          <span className="hidden md:inline text-[9px] font-bold tracking-[0.2em] text-white/50 uppercase font-mono">Orchestration Engine v4.0.1</span>
        </div>

        {/* Workspace Switcher */}
        <div className="flex items-center gap-2 sm:gap-4">
          <span className="hidden lg:inline text-[10px] uppercase font-bold tracking-widest text-white/40 font-mono">
            PORTAL SWITCH:
          </span>

          <div className="flex bg-black border border-white/10 p-0.5 sm:p-1 rounded-sm gap-0.5 sm:gap-1">
            <button
              onClick={() => setActiveRole('onboarding')}
              className={`px-2 py-1 text-[10px] font-black tracking-wider uppercase transition-all rounded-sm cursor-pointer flex items-center gap-1 border ${
                activeRole === 'onboarding'
                  ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                  : 'border-transparent text-white/60 hover:text-white hover:border-white/10'
              }`}
              title="Onboard New Workspace"
            >
              <PlusIcon className="w-3 h-3" />
              <span className="hidden sm:inline">Onboard</span>
            </button>
            <button
              onClick={() => setActiveRole('business_owner')}
              className={`px-2 py-1 text-[10px] font-black tracking-wider uppercase transition-all rounded-sm cursor-pointer flex items-center gap-1 border ${
                activeRole === 'business_owner'
                  ? 'bg-green-500/10 border-green-500/30 text-green-400'
                  : 'border-transparent text-white/60 hover:text-white hover:border-white/10'
              }`}
              title="Business Portal"
            >
              <BusinessIcon className="w-3 h-3" />
              <span className="hidden sm:inline">Biz App</span>
            </button>
            <button
              onClick={() => setActiveRole('super_admin')}
              className={`px-2 py-1 text-[10px] font-black tracking-wider uppercase transition-all rounded-sm cursor-pointer flex items-center gap-1 border ${
                activeRole === 'super_admin'
                  ? 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                  : 'border-transparent text-white/60 hover:text-white hover:border-white/10'
              }`}
              title="Super Admin Control"
            >
              <AdminIcon className="w-3 h-3" />
              <span className="hidden sm:inline">Admin</span>
            </button>
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="p-1 px-1.5 sm:p-1.5 border border-white/10 rounded-sm hover:border-white/20 transition cursor-pointer text-white/60 hover:text-white flex items-center justify-center bg-black h-[28px] w-[28px] sm:h-[32px] sm:w-[32px]"
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            {theme === 'light' ? (
              <Sun className="w-3.5 h-3.5 text-amber-500" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-cyan-400" />
            )}
          </button>
        </div>
      </header>

      {/* 2. Primary Layout viewport */}
      <div id="swibz-workspace-body" className={`flex-1 flex flex-col min-h-0 ${theme === 'light' ? 'bg-[#F9FAFB]' : 'bg-[#050505]'}`}>
        {activeRole === 'onboarding' && (
          <Onboarding
            onOnboardComplete={handleOnboardComplete}
            onViewDemo={handleLaunchSample}
          />
        )}

        {activeRole === 'super_admin' && (
          <AdminDashboard
            onSelectTenant={(tenantId) => {
              setActiveTenantId(tenantId);
              setActiveRole('business_owner');
            }}
          />
        )}

        {activeRole === 'business_owner' && (
          <BusinessDashboard
            tenantId={activeTenantId}
            onExit={() => setActiveRole('onboarding')}
          />
        )}
      </div>

      {/* 3. Global sandboxed footer status */}
      <footer className="h-10 border-t border-white/10 bg-[#0A0A0A] flex items-center px-6 justify-between shrink-0 select-none">
        <div className="w-full flex flex-col md:flex-row items-center justify-between text-[9px] font-mono tracking-widest gap-2">
          <span className="flex items-center gap-2 text-white/50 uppercase font-bold">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_8px_#22c55e] animate-pulse"></span>
            Database Cluster: 12 Nodes Healthy
          </span>
          <span className="text-white/30 hidden md:inline">© 2026 SWIBZ NETWORKS LTD • KAMPALA DEPLOYMENT</span>
          <span className="text-cyan-400 uppercase font-black">
            SWIBZ_CORE_ID: d029-44e2-b9e1-6623ff
          </span>
        </div>
      </footer>
    </div>
  );
}

// Minimalist local icons
function PlusIcon(props: any) {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" className={props.className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function BusinessIcon(props: any) {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" className={props.className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
    </svg>
  );
}

function AdminIcon(props: any) {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" className={props.className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
    </svg>
  );
}
