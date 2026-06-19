/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import {
  GitFork,
  Play,
  Pause,
  Plus,
  Trash2,
  Settings,
  Grid,
  Zap,
  CheckCircle,
  HelpCircle,
  ArrowDown
} from 'lucide-react';
import { Workflow, WorkflowNode } from '../types.js';

interface WorkflowBuilderProps {
  tenantId: string;
  workflows: Workflow[];
  onRefresh: () => void;
}

const PRESET_NODES_CATALOG = [
  { type: 'trigger', label: 'Inbound Conversation', desc: 'Activates when a message lands on WhatsApp or telegram.' },
  { type: 'trigger', label: 'Delivery Booking Requested', desc: 'Triggers on delivery courier commands.' },
  { type: 'action', label: 'Calculate Routing Fare', desc: 'Computes KM distances and quotes fare.' },
  { type: 'action', label: 'Search RAG Knowledge', desc: 'Queries vectors to solve facts.' },
  { type: 'action', label: 'Assign Nearest Courier', desc: 'Assigns riders from active fleets.' },
  { type: 'action', label: 'Log CRM Contact Lead', desc: 'Rates customer intent scores.' },
  { type: 'action', label: 'Dispatch SMS / WhatsApp confirmation', desc: 'Pushes mobile money codes and invoices.' }
];

export default function WorkflowBuilder({ tenantId, workflows, onRefresh }: WorkflowBuilderProps) {
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>(workflows[0]?.id || '');

  const activeWorkflow = workflows.find((w) => w.id === selectedWorkflowId) || workflows[0];

  const handleToggleActive = async () => {
    if (!activeWorkflow) return;
    try {
      const res = await fetch(`/api/workflow/${activeWorkflow.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodes: activeWorkflow.nodes,
          edges: activeWorkflow.edges,
          is_active: !activeWorkflow.is_active
        })
      });
      const data = await res.json();
      if (data.success) {
        onRefresh();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddNode = async (preset: { type: string; label: string; desc: string }) => {
    if (!activeWorkflow) return;

    const newNode: WorkflowNode = {
      id: `n-${Math.random().toString(36).substring(2, 6)}`,
      label: preset.label,
      type: preset.type as any,
      description: preset.desc
    };

    const updatedNodes = [...activeWorkflow.nodes, newNode];
    const lastNode = activeWorkflow.nodes[activeWorkflow.nodes.length - 1];

    const updatedEdges = [...activeWorkflow.edges];
    if (lastNode) {
      updatedEdges.push({ from: lastNode.id, to: newNode.id });
    }

    try {
      const res = await fetch(`/api/workflow/${activeWorkflow.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodes: updatedNodes,
          edges: updatedEdges,
          is_active: activeWorkflow.is_active
        })
      });
      const data = await res.json();
      if (data.success) {
        onRefresh();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteNode = async (nodeId: string) => {
    if (!activeWorkflow) return;

    const updatedNodes = activeWorkflow.nodes.filter((n) => n.id !== nodeId);
    // filter edges related to this node
    const updatedEdges = activeWorkflow.edges.filter((e) => e.from !== nodeId && e.to !== nodeId);

    // reconstruct connections sequentially mapping remaining nodes if helpful
    try {
      const res = await fetch(`/api/workflow/${activeWorkflow.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodes: updatedNodes,
          edges: updatedEdges,
          is_active: activeWorkflow.is_active
        })
      });
      const data = await res.json();
      if (data.success) {
        onRefresh();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetWorkflow = async () => {
    if (!activeWorkflow) return;
    const defaultNodes = [
      { id: 'dn1', type: 'trigger' as const, label: 'WHEN customer requests delivery', description: 'Triggers when prompt implies dispatch interest.' },
      { id: 'dn2', type: 'action' as const, label: 'THEN calculate distance', description: 'Calls Geocoding and distance matrices.' },
      { id: 'dn3', type: 'action' as const, label: 'THEN generate quote', description: 'Triggers core pricing engine solvers.' },
      { id: 'dn4', type: 'action' as const, label: 'THEN notify dispatcher', description: 'Alert available couriers.' },
      { id: 'dn5', type: 'action' as const, label: 'THEN create order', description: 'Log order directly into multi-tenant core.' },
      { id: 'dn6', type: 'action' as const, label: 'THEN send confirmation', description: 'Submit confirmation alerts via SMS webhook.' }
    ];
    const defaultEdges = [
      { from: 'dn1', to: 'dn2' },
      { from: 'dn2', to: 'dn3' },
      { from: 'dn3', to: 'dn4' },
      { from: 'dn4', to: 'dn5' },
      { from: 'dn5', to: 'dn6' }
    ];

    try {
      const res = await fetch(`/api/workflow/${activeWorkflow.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodes: defaultNodes,
          edges: defaultEdges,
          is_active: true
        })
      });
      const data = await res.json();
      if (data.success) {
        onRefresh();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!activeWorkflow) {
    return (
      <div className="p-10 text-center border text-[#F0F0F0]/50 border-white/10 bg-[#0A0A0A] rounded-none font-mono tracking-widest text-xs uppercase">
        Bootstrapping workspace nodes. Please register an organization state.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 font-mono text-[#F0F0F0]">
      {/* Sidebar Selector & Blocks Catalog */}
      <div className="space-y-6">
        {/* Selector */}
        <div className="bg-black border border-white/10 rounded-none p-5">
          <label htmlFor="workflow-picker" className="block text-[9px] font-bold text-[#F0F0F0]/40 uppercase tracking-widest mb-1.5">Active Workflow</label>
          <select
            id="workflow-picker"
            value={selectedWorkflowId}
            onChange={(e) => setSelectedWorkflowId(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-white/10 rounded-none focus:outline-none focus:border-cyan-500 font-bold bg-black text-[#F0F0F0]"
          >
            {workflows.map((w) => (
              <option key={w.id} value={w.id} className="bg-black text-white">{w.name}</option>
            ))}
          </select>

          <div className="mt-4 flex flex-col gap-2">
            <button
              onClick={handleToggleActive}
              className={`py-2 px-3 rounded-none text-[10px] uppercase tracking-wider font-bold flex items-center justify-center gap-1.5 cursor-pointer border transition-all ${
                activeWorkflow.is_active
                  ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20'
                  : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10'
              }`}
            >
              {activeWorkflow.is_active ? (
                <>
                  <Play className="w-3.5 h-3.5 fill-green-400 text-green-400" />
                  Engine: ACTIVE (LIVE)
                </>
              ) : (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  Engine: STOPPED (OFF)
                </>
              )}
            </button>
            <button
              onClick={handleResetWorkflow}
              className="py-2 px-3 border border-white/10 hover:bg-white/5 text-[#F0F0F0]/80 font-bold rounded-none text-[10px] uppercase tracking-wider cursor-pointer transition-all"
            >
              Deploy Standard Matrix
            </button>
          </div>
        </div>

        {/* Node Builder blocks */}
        <div className="bg-black border border-white/10 rounded-none p-5 space-y-4">
          <h3 className="text-[9px] font-bold text-[#F0F0F0]/40 uppercase tracking-widest mb-1">Workflow Elements Catalog</h3>
          <div className="space-y-2">
            {PRESET_NODES_CATALOG.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => handleAddNode(preset)}
                className="w-full p-3 border border-white/10 bg-[#0A0A0A] hover:border-cyan-500/50 rounded-none text-left transition-all flex items-start gap-3 group outline-none cursor-pointer"
              >
                <div className={`p-1.5 rounded-none shrink-0 mt-0.5 ${
                  preset.type === 'trigger' ? 'bg-amber-500/10 text-amber-400' : 'bg-cyan-500/10 text-cyan-400'
                }`}>
                  <Zap className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <span className="font-extrabold text-xs text-white block group-hover:text-cyan-400 transition-colors uppercase tracking-tight">{preset.label}</span>
                  <p className="text-[9px] text-[#F0F0F0]/50 line-clamp-2 mt-1 leading-normal font-sans lowercase">{preset.desc}</p>
                </div>
                <Plus className="w-3.5 h-3.5 ml-auto text-white/30 group-hover:text-cyan-400 shrink-0 self-center" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Visual Canvas Layout */}
      <div className="xl:col-span-3 bg-black border border-white/10 rounded-none overflow-hidden flex flex-col min-h-[500px]">
        {/* Canvas Toolbar */}
        <div className="p-4 border-b border-white/10 bg-[#0A0A0A] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Grid className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-xs uppercase text-white tracking-widest">Visual Node Canvas Designer</span>
          </div>
          <div className="flex gap-2">
            <span className="px-2.5 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-none text-[8px] font-mono font-bold flex items-center gap-1 uppercase tracking-wider">
              <span className="w-1 h-1 rounded-full bg-green-400 animate-pulse"></span>
              Auto-Compiled
            </span>
            <span className="px-2.5 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-none text-[8px] font-mono font-bold flex items-center gap-1 uppercase tracking-wider">
              <GitFork className="w-3 h-3" />
              Isolated Rows
            </span>
          </div>
        </div>

        {/* Flow Visual Area */}
        <div className="flex-1 overflow-auto bg-[radial-gradient(#222222_1px,transparent_1px)] bg-[size:16px_16px] p-8 flex flex-col items-center gap-4 relative justify-center bg-black/40">
          {activeWorkflow.nodes.length === 0 ? (
            <div className="text-center p-12 text-[#F0F0F0]/30 font-bold uppercase tracking-wider text-xs">
              Canvas empty. Inject elements from the catalog catalog.
            </div>
          ) : (
            activeWorkflow.nodes.map((node, index) => (
              <div key={node.id} className="flex flex-col items-center">
                {/* Node Box */}
                <div className="w-[310px] border border-white/10 bg-[#0A0A0A] rounded-none overflow-hidden hover:border-cyan-500/40 transition-all flex select-none relative group">
                  {/* Handle Accent Color bar */}
                  <div className={`w-1.5 shrink-0 ${node.type === 'trigger' ? 'bg-amber-500' : 'bg-cyan-500'}`}></div>

                  {/* Body details */}
                  <div className="p-3.5 flex-1 flex items-start gap-2.5 min-w-0">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[8px] uppercase tracking-widest font-black px-1.5 py-0.5 rounded-none ${
                          node.type === 'trigger' ? 'bg-amber-500/10 text-amber-400' : 'bg-cyan-500/10 text-cyan-400'
                        }`}>
                          {node.type}
                        </span>
                        <span className="font-mono text-[8px] text-[#F0F0F0]/40">{node.id}</span>
                      </div>
                      <h4 className="font-extrabold text-xs text-white tracking-wider uppercase mt-1.5 truncate">{node.label}</h4>
                      <p className="text-[10px] text-[#F0F0F0]/50 mt-1 leading-relaxed font-sans">{node.description}</p>
                    </div>

                    <button
                      onClick={() => handleDeleteNode(node.id)}
                      className="p-1.5 text-[#F0F0F0]/30 hover:text-red-400 rounded-none hover:bg-white/5 transition-colors cursor-pointer self-start opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Draw sequential arrow unless last item */}
                {index < activeWorkflow.nodes.length - 1 && (
                  <div className="my-2 text-cyan-500/40 animate-pulse flex flex-col items-center">
                    <ArrowDown className="w-5 h-5 shrink-0" />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
