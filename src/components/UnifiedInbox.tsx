/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Send,
  Sparkles,
  Smartphone,
  Check,
  Globe,
  Plus,
  Compass,
  Zap,
  Clock,
  SendHorizontal,
  Phone,
  ArrowRight,
  RefreshCw,
  Mail,
  User,
  MessagesSquare
} from 'lucide-react';
import { Conversation, Message, Customer } from '../types.js';

interface UnifiedInboxProps {
  tenantId: string;
  conversations: Conversation[];
  customers: Customer[];
  onRefresh: () => void;
}

export default function UnifiedInbox({ tenantId, conversations, customers, onRefresh }: UnifiedInboxProps) {
  const [selectedConvId, setSelectedConvId] = useState<string>(conversations[0]?.id || '');
  const [messages, setMessages] = useState<Message[]>([]);
  const [replyInput, setReplyInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [resolvingChat, setResolvingChat] = useState(false);

  // SANBOX CONNECTOR SIMULATOR STATES
  const [sandboxChannel, setSandboxChannel] = useState<'whatsapp' | 'telegram' | 'webchat' | 'sms' | 'email'>('whatsapp');
  const [sandboxSenderName, setSandboxSenderName] = useState('Benon');
  const [sandboxMessage, setSandboxMessage] = useState('Deliver package from Ntinda to Kololo');
  const [sandboxPhone, setSandboxPhone] = useState('+256772400300');
  const [sandboxEmail, setSandboxEmail] = useState('benon@gmail.com');

  const [sandboxLog, setSandboxLog] = useState<string[]>([]);
  const [sendingSandbox, setSendingSandbox] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  // End / Resolve conversation
  const handleResolveChat = async () => {
    if (!selectedConvId) return;
    setResolvingChat(true);
    try {
      const res = await fetch(`/api/conversation/${selectedConvId}/resolve`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        onRefresh();
        fetchMessages(selectedConvId);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setResolvingChat(false);
    }
  };

  // Fetch conversation messages
  const fetchMessages = async (convId: string) => {
    if (!convId) return;
    setChatLoading(true);
    try {
      const res = await fetch(`/api/conversation/${convId}/messages`);
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    if (selectedConvId) {
      fetchMessages(selectedConvId);
    } else {
      setMessages([]);
    }
  }, [selectedConvId, conversations]);

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Manual Staff message reply
  const handleSendReply = async () => {
    if (!replyInput.trim() || !selectedConvId) return;

    try {
      // Create mockup post for manual responses
      const res = await fetch('/api/channels/webchat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenantId,
          session_id: selectedConvId,
          message: replyInput,
          customer_name: 'Human Operator',
          phone: '+256701000100' // mock human number
        })
      });
      const data = await res.json();
      if (data.success) {
        setReplyInput('');
        fetchMessages(selectedConvId);
        onRefresh();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // EXECUTE CONNECTOR WEBHOOK CALL SIMULATOR
  const handleSendSandboxMessage = async () => {
    if (!sandboxMessage.trim()) return;

    setSendingSandbox(true);
    const endpointMap = {
      whatsapp: '/api/channels/whatsapp/webhook',
      telegram: '/api/channels/telegram/webhook',
      webchat: '/api/channels/webchat/message',
      sms: '/api/channels/sms/webhook',
      email: '/api/channels/email/webhook'
    };

    const endpoint = endpointMap[sandboxChannel];
    let payload = {};

    if (sandboxChannel === 'whatsapp') {
      payload = {
        tenant_id: tenantId,
        phone: sandboxPhone,
        sender_name: sandboxSenderName,
        message: sandboxMessage
      };
    } else if (sandboxChannel === 'telegram') {
      payload = {
        tenant_id: tenantId,
        telegram_user_id: sandboxPhone.slice(-6),
        first_name: sandboxSenderName,
        message: sandboxMessage
      };
    } else if (sandboxChannel === 'webchat') {
      payload = {
        tenant_id: tenantId,
        session_id: `Session-${Math.random().toString(36).substring(2, 8)}`,
        customer_name: sandboxSenderName,
        message: sandboxMessage,
        phone: sandboxPhone,
        email: sandboxEmail
      };
    } else if (sandboxChannel === 'sms') {
      payload = {
        tenant_id: tenantId,
        sender_phone: sandboxPhone,
        text: sandboxMessage
      };
    } else if (sandboxChannel === 'email') {
      payload = {
        tenant_id: tenantId,
        from_email: sandboxEmail,
        from_name: sandboxSenderName,
        subject: 'Inquiry via Swibz Portal',
        body: sandboxMessage
      };
    }

    const logEntry = `[${sandboxChannel.toUpperCase()} POST] calling ${endpoint}...`;
    setSandboxLog((prev) => [...prev, logEntry]);

    try {
      const start = Date.now();
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const duration = Date.now() - start;

      const data = await res.json();
      if (data.success) {
        const replyText = data.ai_response.reply;
        const toolStr = data.ai_response.tool_calls?.length > 0 ? ` (Tools Triggered: ${data.ai_response.tool_calls[0].name})` : '';
        const workflowStr = data.ai_response.workflow_triggered ? ` (Workflow Executed: ${data.ai_response.workflow_triggered})` : '';

        setSandboxLog((prev) => [
          ...prev,
          `✅ 200 OK (${duration}ms): NLP score is ${data.customer?.lead_score}/100${workflowStr}${toolStr}`,
          `📝 SWIBZ AGENT REPLY: "${replyText.slice(0, 50)}..."`
        ]);

        setSandboxMessage('');
        onRefresh(); // Refresh parents metrics
        // Auto select this conversation
        setSelectedConvId(data.conversation_id);
      } else {
        setSandboxLog((prev) => [...prev, `❌ ERROR: ${data.error || 'API execution crash'}`]);
      }
    } catch (e: any) {
      setSandboxLog((prev) => [...prev, `❌ CONNECTION FAILED: ${e.message}`]);
    } finally {
      setSendingSandbox(false);
    }
  };

  const selectedConv = conversations.find((c) => c.id === selectedConvId);
  const selectedCustomerName = selectedConv ? (customers.find((u) => u.id === selectedConv.customer_id)?.name || 'Loading Customer') : '';

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 min-h-[550px] items-stretch">
      {/* Col 1: Chats Feed */}
      <div className="bg-[#0A0A0A] border border-white/10 rounded-xl flex flex-col p-4">
        <h3 className="text-[11px] font-bold text-white/40 mb-4">Inbox Stream Channels</h3>

        <div className="flex-1 overflow-y-auto space-y-2 max-h-[450px]">
          {conversations.length === 0 ? (
            <p className="text-center py-10 text-white/30 italic text-xs">No active chats in queue. Submit sandbox test in tab.</p>
          ) : (
            conversations.map((c) => {
              const customer = customers.find((cust) => cust.id === c.customer_id);
              const isSelected = c.id === selectedConvId;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedConvId(c.id)}
                  className={`w-full p-3.5 rounded-xl border text-left transition relative select-none cursor-pointer group outline-none ${
                    isSelected
                      ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                      : 'bg-black border-white/10 text-white/70 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs tracking-tight">{customer?.name || 'Customer Profile'}</span>
                      {c.status === 'resolved' && (
                        <span className="px-1.5 py-0.5 bg-zinc-850 text-zinc-400 text-[8px] font-bold border border-white/5 rounded leading-none">
                          Ended
                        </span>
                      )}
                    </div>
                    <span className={`px-2 py-0.5 text-[8px] font-bold rounded-lg border capitalize ${
                      isSelected ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400' : 'border-white/10 bg-black text-white/50'
                    }`}>
                      {c.channel}
                    </span>
                  </div>
                  <p className={`text-[10px] line-clamp-2 leading-relaxed ${isSelected ? 'text-[#F0F0F0]' : 'text-[#F0F0F0]/60'}`}>
                    {c.last_message || 'Inbound inquiry received...'}
                  </p>
                  <div className="flex justify-between items-center mt-2.5 text-[9px]">
                    <span className={isSelected ? 'text-cyan-400' : 'text-purple-400'}>
                      Score: <span className="font-bold">{customer?.lead_score || 'N/A'}/100</span>
                    </span>
                    <span className="text-white/40">
                      {new Date(c.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Col 2 & 3: Selected Chat Conversation */}
      <div className="xl:col-span-2 bg-[#0A0A0A] border border-white/10 rounded-xl flex flex-col p-4">
        {selectedConvId && selectedConv ? (
          <>
            {/* Thread Header */}
            <div className="pb-3 border-b border-white/10 flex justify-between items-center mb-4">
              <div>
                <span className="text-[10px] font-semibold text-white/40">Core Interaction Thread</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <h4 className="font-bold text-sm text-white">{selectedCustomerName}</h4>
                  {selectedConv.status === 'resolved' && (
                    <span className="px-1.5 py-0.5 bg-zinc-800 text-zinc-400 border border-white/5 rounded text-[8px] font-bold leading-none">
                      Ended
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {selectedConv.status !== 'resolved' ? (
                  <button
                    onClick={handleResolveChat}
                    disabled={resolvingChat}
                    className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/30 rounded-lg text-[9px] font-bold transition cursor-pointer select-none"
                  >
                    {resolvingChat ? 'Ending...' : 'End Chat'}
                  </button>
                ) : (
                  <span className="px-2 py-1 bg-[#1A1A1A] text-zinc-400 border border-white/5 rounded-lg text-[9px] font-bold">
                    Resolved & Frozen
                  </span>
                )}
                {selectedConv.status !== 'resolved' && (
                  <span className="px-2.5 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg text-[9px] font-bold shadow-[0_0_6px_rgba(34,197,94,0.1)]">
                    Active
                  </span>
                )}
              </div>
            </div>
 
            {/* Conversation Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 p-2 select-text max-h-[380px] min-h-[300px]">
              {chatLoading ? (
                <div className="text-center py-20 text-white/40 text-[10px] animate-pulse">Loading database messages...</div>
              ) : messages.length === 0 ? (
                <div className="text-center py-20 text-white/40 text-[10px]">Beginning stream history...</div>
              ) : (
                messages.map((m) => {
                  const isCustomer = m.sender === 'customer';
                  const isAi = m.sender === 'ai';
                  return (
                    <div key={m.id} className={`flex flex-col ${isCustomer ? 'items-start' : 'items-end'}`}>
                      <div className={`max-w-[85%] p-3.5 rounded-xl border text-xs leading-relaxed transition ${
                        isCustomer
                          ? 'bg-black text-[#F0F0F0] border-white/10'
                          : isAi
                          ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                          : 'bg-purple-950/20 text-purple-300 border-purple-500/20'
                      }`}>
                        {/* Header metadata */}
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span className="text-[9px] font-bold opacity-60">
                            {m.sender === 'customer' ? 'Incoming Prompt' : m.sender === 'ai' ? 'Swibz AI Core' : 'Lead Manager'}
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap text-[11px] leading-relaxed">{m.content}</p>
 
                        {/* Visual details on execution tools triggers in messaging card */}
                        {m.metadata?.workflow_triggered && (
                          <div className={`mt-3 pt-2 border-t border-dashed text-[9px] flex flex-col gap-1.5 ${isAi ? 'border-cyan-500/30 text-cyan-400' : 'border-white/10 text-white/60'}`}>
                            <span className="flex items-center gap-1 font-bold">
                              <Zap className="w-3 h-3 text-cyan-400 animate-pulse" />
                              Workflow Activated: {m.metadata.workflow_triggered}
                            </span>
                            {m.metadata?.tool_calls && m.metadata.tool_calls.map((t: any, tid: number) => (
                              <span key={tid} className="block text-[8px] opacity-80 leading-tight">
                                Method call payload: {t.name}({JSON.stringify(t.args)})
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <span className="text-[8px] text-white/30 mt-1">
                        {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
 
            {/* Manual Reply input */}
            <div className="pt-4 border-t border-white/10 flex gap-2">
              <input
                type="text"
                placeholder="Submit manual supporting human operator intervention message..."
                value={replyInput}
                onChange={(e) => setReplyInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                className="flex-1 px-3.5 py-3 border border-white/10 bg-black text-white focus:outline-none focus:border-cyan-500/50 text-xs rounded-lg"
              />
              <button
                onClick={handleSendReply}
                className="p-3 bg-cyan-500 text-black rounded-lg hover:bg-cyan-400 transition cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-white/30 p-12 text-center border border-dashed border-white/10 rounded-xl bg-black">
            <MessageSquare className="w-10 h-10 mb-4 text-white/20 animate-pulse" />
            <span className="font-bold text-xs text-white block mb-1">Interactive Inbox Interface</span>
            <p className="text-[10px] text-white/40 max-w-sm">No thread active. Select an active conversation or execute the Channel Simulator on the right to trigger API flows!</p>
          </div>
        )}
      </div>

      {/* Col 4: Channel Connectors Simulator Sandbox */}
      <div className="bg-[#0A0A0A] text-[#F0F0F0] border border-white/10 rounded-xl flex flex-col justify-between p-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#ffffff_1px,transparent_1px)] bg-[size:16px_16px]"></div>
 
        <div className="z-10 space-y-4">
          <div className="flex items-center gap-2 border-b border-white/10 pb-3">
            <Smartphone className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="text-xs font-bold text-white">Sandbox API Simulator</span>
          </div>
 
          <p className="text-[10px] text-[#F0F0F0]/50 leading-relaxed">
            Transmit messages directly into Swibz connector webhook routes. Observe live webhook execution logs and RAG mappings.
          </p>
 
          <div className="space-y-4 text-xs">
            {/* Channel Select */}
            <div>
              <label htmlFor="connector-sel" className="block text-[10px] font-semibold text-white/40 mb-1">Select Connector Route</label>
              <select
                id="connector-sel"
                value={sandboxChannel}
                onChange={(e) => setSandboxChannel(e.target.value as any)}
                className="w-full bg-[#050505] border border-white/10 text-white px-3 py-1.5 rounded-lg font-bold"
              >
                <option value="whatsapp">POST: /whatsapp/webhook</option>
                <option value="telegram">POST: /telegram/webhook</option>
                <option value="webchat">POST: /webchat/message</option>
                <option value="sms">POST: /sms/webhook</option>
                <option value="email">POST: /email/webhook</option>
              </select>
            </div>
 
            {/* Payload Configs */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="user-sandbox-name" className="block text-[10px] font-semibold text-white/40 mb-1">User Profile</label>
                <input
                  id="user-sandbox-name"
                  type="text"
                  value={sandboxSenderName}
                  onChange={(e) => setSandboxSenderName(e.target.value)}
                  className="w-full bg-[#050505] border border-white/10 text-white px-2.5 py-1.5 rounded-lg text-[10px]"
                />
              </div>
              <div>
                <label htmlFor="user-sandbox-phone" className="block text-[10px] font-semibold text-white/40 mb-1">Phone Line</label>
                <input
                  id="user-sandbox-phone"
                  type="text"
                  value={sandboxPhone}
                  onChange={(e) => setSandboxPhone(e.target.value)}
                  className="w-full bg-[#050505] border border-white/10 text-white px-2.5 py-1.5 rounded-lg text-[10px]"
                />
              </div>
                        {/* Text Inbound Prompt */}
            <div>
              <label htmlFor="user-sandbox-query" className="block text-[10px] font-semibold text-white/40 mb-1">Inbound Message Prompt</label>
              <textarea
                id="user-sandbox-query"
                rows={2}
                value={sandboxMessage}
                onChange={(e) => setSandboxMessage(e.target.value)}
                placeholder="Type customer question..."
                className="w-full bg-[#050505] border border-white/10 text-white px-2.5 py-1.5 rounded-lg text-xs text-[#F0F0F0]"
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => setSandboxMessage('Deliver package from Ntinda to Kololo')}
                  className="text-[8px] border border-cyan-500/20 hover:border-cyan-500/50 hover:text-cyan-400 px-1.5 py-0.5 rounded-lg bg-black cursor-pointer text-white/60 transition"
                >
                  🚚 logistics query
                </button>
                <button
                  onClick={() => setSandboxMessage('Do you have dental slots tomorrow?')}
                  className="text-[8px] border border-cyan-500/20 hover:border-cyan-500/50 hover:text-cyan-400 px-1.5 py-0.5 rounded-lg bg-black cursor-pointer text-white/60 transition"
                >
                  🩺 medical check
                </button>
              </div>
            </div>
 
            <button
              onClick={handleSendSandboxMessage}
              disabled={sendingSandbox}
              className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 cursor-pointer transition shadow-[0_0_12px_rgba(34,211,238,0.15)]"
            >
              {sendingSandbox ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Routing prompt...
                </>
              ) : (
                <>
                  <SendHorizontal className="w-3.5 h-3.5" />
                  Submit Webhook POST
                </>
              )}
            </button>
          </div>
        </div>
 
        {/* Console Webhook diagnostics logs in sidebar */}
        <div className="mt-4 pt-4 border-t border-white/10 z-10 flex-1 flex flex-col justify-end min-h-[140px]">
          <span className="text-[9px] text-cyan-400 font-bold block mb-1">Diagnostics logs stream:</span>
          <div className="bg-black rounded-lg p-2 max-h-[140px] overflow-y-auto border border-white/10 space-y-1">
            {sandboxLog.length === 0 ? (
              <span className="text-[8px] text-white/30 block">Console listening recursively on port 3000...</span>
            ) : (
              sandboxLog.map((log, lidx) => (
                <span key={lidx} className="block text-[8px] leading-relaxed select-text text-white/80 border-b border-white/5 pb-1">
                  {log}
                </span>
              ))
            )}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
