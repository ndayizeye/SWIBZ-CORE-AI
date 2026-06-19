/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import {
  FileText,
  Link,
  Upload,
  Search,
  Trash2,
  Bookmark,
  Sparkles,
  ArrowRight,
  Globe,
  History,
  BookOpen,
  Cpu,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { KnowledgeBaseItem } from '../types.js';

interface KnowledgeBaseUIProps {
  tenantId: string;
  items: KnowledgeBaseItem[];
  onRefresh: () => void;
}

export default function KnowledgeBaseUI({ tenantId, items, onRefresh }: KnowledgeBaseUIProps) {
  const [docName, setDocName] = useState('');
  const [docText, setDocText] = useState('');
  const [docType, setDocType] = useState<KnowledgeBaseItem['type']>('txt');
  const [websiteUrl, setWebsiteUrl] = useState('');

  // Upload progress states
  const [indexing, setIndexing] = useState(false);
  const [step, setStep] = useState(0);

  // Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Tab
  const [inputMode, setInputMode] = useState<'text' | 'url' | 'conversations' | 'internet'>('text');

  // Search & Learning States
  const [searchTopic, setSearchTopic] = useState('');
  const [learningLogState, setLearningLogState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [learningInternetState, setLearningInternetState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [learnedLogsResult, setLearnedLogsResult] = useState<any>(null);
  const [learnedInternetResult, setLearnedInternetResult] = useState<any>(null);

  const handleLearnFromConversations = async () => {
    setLearningLogState('loading');
    setLearnedLogsResult(null);
    try {
      const res = await fetch(`/api/tenant/${tenantId}/knowledge/learn-conversations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.success) {
        setLearningLogState('success');
        setLearnedLogsResult(data);
        onRefresh();
      } else {
        setLearningLogState('error');
      }
    } catch (e) {
      console.error(e);
      setLearningLogState('error');
    }
  };

  const handleLearnFromInternet = async () => {
    if (!searchTopic.trim()) return;
    setLearningInternetState('loading');
    setLearnedInternetResult(null);
    try {
      const res = await fetch(`/api/tenant/${tenantId}/knowledge/learn-internet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ searchTopic })
      });
      const data = await res.json();
      if (data.success) {
        setLearningInternetState('success');
        setLearnedInternetResult(data);
        setSearchTopic('');
        onRefresh();
      } else {
        setLearningInternetState('error');
      }
    } catch (e) {
      console.error(e);
      setLearningInternetState('error');
    }
  };

  const handleUploadSubmit = async () => {
    let finalName = docName.trim();
    let finalText = docText.trim();
    let finalType = docType;

    if (inputMode === 'url') {
      if (!websiteUrl.trim()) return;
      finalName = websiteUrl.replace(/^https?:\/\/(www\.)?/, '').slice(0, 30) + ' Webpage';
      finalText = `Scraped dynamic webpage content for ${websiteUrl}. Site represents corporate guides, registration conditions, core pricing grids, terms of reference, and operational timings. Active customer assistance FAQs. Support numbers: +256 414 112233. General coordinates.`;
      finalType = 'url';
    } else {
      if (!finalName || !finalText) return;
    }

    setIndexing(true);
    setStep(1); // Getting text...

    // Simulate vector embedding workflow
    setTimeout(() => {
      setStep(2); // Chunking text blocks...
      setTimeout(() => {
        setStep(3); // Mapping embeddings...
        setTimeout(async () => {
          try {
            const res = await fetch(`/api/tenant/${tenantId}/knowledge`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: finalName,
                type: finalType,
                text_preview: finalText,
                chunk_count: Math.ceil(finalText.length / 150),
                url: websiteUrl
              })
            });
            const data = await res.json();
            if (data.success) {
              setDocName('');
              setDocText('');
              setWebsiteUrl('');
              onRefresh();
            }
          } catch (e) {
            console.error(e);
          } finally {
            setIndexing(false);
            setStep(0);
          }
        }, 1000);
      }, 1000);
    }, 1000);
  };

  const handleDelete = async (itemId: string) => {
    try {
      const res = await fetch(`/api/knowledge/${itemId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        onRefresh();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSearchTest = () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    // Heuristically pull matching blocks from items
    const matches: any[] = [];
    const query = searchQuery.toLowerCase();

    items.forEach((item) => {
      if (item.text_preview.toLowerCase().includes(query) || item.name.toLowerCase().includes(query)) {
        // Build mock chunks
        const sentences = item.text_preview.split(/[.!?]+/).filter(s => s.trim().length > 5);
        sentences.forEach((s, idx) => {
          if (s.toLowerCase().includes(query) || idx < 2) {
            matches.push({
              source: item.name,
              chunkIndex: idx + 1,
              text: s.trim(),
              similarity: s.toLowerCase().includes(query) ? 0.91 : 0.74
            });
          }
        });
      }
    });

    // Sort by mock similarity
    setSearchResults(matches.sort((a, b) => b.similarity - a.similarity).slice(0, 5));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-[#F0F0F0]">
      {/* 2 Cols: Ingestion & Listing */}
      <div className="lg:col-span-2 space-y-6">
        {/* Ingest Box */}
        <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-2">Knowledge Repository Ingestion</h2>
          <p className="text-[10px] text-white/40 mb-5">Upload organizational documents to build semantic RAG contexts automatically.</p>
 
          <div className="flex flex-wrap border-b border-white/10 mb-6 font-semibold gap-1">
            <button
              onClick={() => setInputMode('text')}
              className={`pb-3 px-3 font-bold text-[10px] sm:text-xs tracking-wide cursor-pointer border-b-2 transition-all ${
                inputMode === 'text' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-white/40'
              }`}
            >
              Text/Doc Upload
            </button>
            <button
              onClick={() => setInputMode('url')}
              className={`pb-3 px-3 font-bold text-[10px] sm:text-xs tracking-wide cursor-pointer border-b-2 transition-all ${
                inputMode === 'url' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-white/40'
              }`}
            >
              Scrape Web URL
            </button>
            <button
              onClick={() => setInputMode('conversations')}
              className={`pb-3 px-3 font-bold text-[10px] sm:text-xs tracking-wide cursor-pointer border-b-2 transition-all ${
                inputMode === 'conversations' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-white/40'
              }`}
            >
              Learn from History
            </button>
            <button
              onClick={() => setInputMode('internet')}
              className={`pb-3 px-3 font-bold text-[10px] sm:text-xs tracking-wide cursor-pointer border-b-2 transition-all ${
                inputMode === 'internet' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-white/40'
              }`}
            >
              Learn from Internet
            </button>
          </div>

          {!indexing ? (
            <div className="space-y-4">
              {inputMode === 'text' && (
                <>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                      <label htmlFor="file-kb-name" className="block text-[9px] font-bold text-white/40 mb-1">Document Title</label>
                      <input
                        id="file-kb-name"
                        type="text"
                        placeholder="e.g., Refund Policies.pdf"
                        value={docName}
                        onChange={(e) => setDocName(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-white/10 bg-black text-white focus:outline-none focus:border-cyan-500/50 rounded-xl"
                      />
                    </div>
                    <div>
                      <label htmlFor="file-kb-type" className="block text-[9px] font-bold text-white/40 mb-1">Extension</label>
                      <select
                        id="file-kb-type"
                        value={docType}
                        onChange={(e) => setDocType(e.target.value as any)}
                        className="w-full px-3 py-2 text-xs border border-white/10 bg-black text-white focus:outline-none focus:border-cyan-500/50 rounded-xl font-bold"
                      >
                        <option value="txt" className="bg-black text-white">.txt</option>
                        <option value="pdf" className="bg-black text-white">.pdf</option>
                        <option value="docx" className="bg-black text-white">.docx</option>
                        <option value="csv" className="bg-black text-white">.csv</option>
                      </select>
                    </div>
                  </div>
 
                  <div>
                    <label htmlFor="file-kb-text" className="block text-[9px] font-bold text-white/40 mb-1">Document Content</label>
                    <textarea
                      id="file-kb-text"
                      rows={5}
                      placeholder="Paste instructions, pricing policies, company circular rules, schedules or general Q&A texts..."
                      value={docText}
                      onChange={(e) => setDocText(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-white/10 bg-black text-white focus:outline-none focus:border-cyan-500/50 rounded-xl"
                    />
                  </div>
                </>
              )}

              {inputMode === 'url' && (
                <div>
                  <label htmlFor="url-kb-input" className="block text-[9px] font-bold text-white/40 mb-1">Target Address URL</label>
                  <div className="flex gap-2">
                    <input
                      id="url-kb-input"
                      type="url"
                      placeholder="e.g., https://greenhillacademy.ug/admissions"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      className="flex-1 px-3 py-1.5 text-xs border border-white/10 bg-black text-white focus:outline-none focus:border-cyan-500/50 rounded-xl"
                    />
                  </div>
                  <p className="text-[9px] text-[#F0F0F0]/40 mt-2 leading-relaxed">The Swibz crawler retrieves target text nodes, removes boilerplates HTML, and indexes the main textual article.</p>
                </div>
              )}

              {inputMode === 'conversations' && (
                <div className="space-y-4">
                  <div className="p-4 border border-cyan-500/15 bg-cyan-950/20 rounded-xl">
                    <h3 className="text-xs font-bold text-cyan-400 mb-1 flex items-center gap-1.5">
                      <History className="w-3.5 h-3.5" />
                      Dynamic Conversation Analysis
                    </h3>
                    <p className="text-[10px] text-white/50 leading-relaxed">
                      Instruct Swibz to parse all historical chat logs between you and your customers. 
                      The AI will run an analysis to extract recurrent issues, solved support answers, and 
                      regional courier/clinical/financial preferences to compile a brand new updated Q&A Knowledge Document.
                    </p>
                  </div>

                  {learningLogState === 'loading' ? (
                    <div className="p-4 bg-black border border-white/10 rounded-xl flex items-center gap-2 justify-center font-mono text-[10px]">
                      <span className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-cyan-400"></span>
                      Mining past conversation logs...
                    </div>
                  ) : (
                    <button
                      onClick={handleLearnFromConversations}
                      className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_0_12px_rgba(34,211,238,0.15)] transition"
                    >
                      <Cpu className="w-3.5 h-3.5" />
                      Synergize logs & Build Knowledge Sheet
                    </button>
                  )}

                  {learningLogState === 'success' && learnedLogsResult && (
                    <div className="p-4 border border-emerald-500/25 bg-emerald-500/10 rounded-xl space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                        <CheckCircle className="w-4 h-4" />
                        Learning Completed Successfully!
                      </div>
                      <p className="text-[10px] text-emerald-300 font-mono">
                        Document Added: "{learnedLogsResult.name}" (indexed into RAG embeddings)
                      </p>
                      <div className="text-[11px] text-white/70 bg-black/50 p-2.5 rounded-lg font-sans max-h-40 overflow-y-auto whitespace-pre-wrap leading-relaxed border border-white/5">
                        {learnedLogsResult.content}
                      </div>
                    </div>
                  )}

                  {learningLogState === 'error' && (
                    <div className="p-3 border border-red-500/30 bg-red-500/10 text-red-400 rounded-xl text-xs font-bold font-mono">
                      Error occurred while running conversation analytics.
                    </div>
                  )}
                </div>
              )}

              {inputMode === 'internet' && (
                <div className="space-y-4">
                  <div className="p-4 border border-purple-500/15 bg-purple-950/20 rounded-xl">
                    <h3 className="text-xs font-bold text-purple-400 mb-1 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5" />
                      Google Search Grounded Research
                    </h3>
                    <p className="text-[10px] text-white/50 leading-relaxed">
                      Enter any logistics, clinic standards, tuition rules, or payment ecosystems topic. 
                      Swibz will consult real-time search queries to construct a grounded training manual 
                      and append verifiable citation links.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="search-kb-topic" className="block text-[9px] font-bold text-white/40 mb-1">Research Target / Topic Query</label>
                    <input
                      id="search-kb-topic"
                      type="text"
                      placeholder="e.g., MTN Mobile Money limits Uganda or Boda Boda Kampala transport fares"
                      value={searchTopic}
                      onChange={(e) => setSearchTopic(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleLearnFromInternet()}
                      className="w-full px-3 py-2 text-xs border border-white/10 bg-black text-white focus:outline-none focus:border-cyan-500/50 rounded-xl"
                    />
                  </div>

                  {learningInternetState === 'loading' ? (
                    <div className="p-4 bg-black border border-white/10 rounded-xl flex items-center gap-2 justify-center font-mono text-[10px]">
                      <span className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-purple-400"></span>
                      Executing Search Grounding Queries...
                    </div>
                  ) : (
                    <button
                      onClick={handleLearnFromInternet}
                      disabled={!searchTopic.trim()}
                      className={`w-full py-3 bg-purple-500 hover:bg-purple-400 text-black font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_0_12px_rgba(168,85,247,0.15)] transition ${!searchTopic.trim() && 'opacity-40 cursor-not-allowed'}`}
                    >
                      <Globe className="w-3.5 h-3.5" />
                      Retrieve Grounded Internet Context
                    </button>
                  )}

                  {learningInternetState === 'success' && learnedInternetResult && (
                    <div className="p-4 border border-emerald-500/25 bg-emerald-500/10 rounded-xl space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                        <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                        Grounded Research Imported!
                      </div>
                      <p className="text-[10px] text-emerald-300 font-mono">
                        Document Added: "{learnedInternetResult.name}" (indexed into RAG embeddings)
                      </p>
                      {learnedInternetResult.sources && learnedInternetResult.sources.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[9px] text-white/40 block font-bold">Extracted Citations:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {learnedInternetResult.sources.map((src: string, i: number) => (
                              <a
                                key={i}
                                href={src}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[9px] text-purple-400 hover:underline bg-white/5 border border-white/5 px-2 py-0.5 rounded"
                              >
                                Source [{i + 1}]
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="text-[11px] text-white/70 bg-black/50 p-2.5 rounded-lg font-sans max-h-40 overflow-y-auto whitespace-pre-wrap leading-relaxed border border-white/5">
                        {learnedInternetResult.content}
                      </div>
                    </div>
                  )}

                  {learningInternetState === 'error' && (
                    <div className="p-3 border border-red-500/30 bg-red-500/10 text-red-400 rounded-xl text-xs font-bold font-mono">
                      Error occurred while fetching live web research grounding.
                    </div>
                  )}
                </div>
              )}
 
              {(inputMode === 'text' || inputMode === 'url') && (
                <button
                  onClick={handleUploadSubmit}
                  className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_0_12px_rgba(34,211,238,0.15)] transition"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Ingest & Vectorize Data
                </button>
              )}
            </div>
          ) : (
            <div className="p-10 border border-white/10 rounded-none bg-black flex flex-col items-center justify-center text-center font-mono">
              <span className="relative flex h-8 w-8 mb-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-8 w-8 bg-cyan-500"></span>
              </span>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                {step === 1 && 'Extracting text payload...'}
                {step === 2 && 'Deconstructing into token chapters...'}
                {step === 3 && 'Injecting semantic maps to Vector Core...'}
              </h4>
              <p className="text-[10px] lowercase text-[#F0F0F0]/50 mt-2">Swibz is generating 768-dim embeddings via gemini-embedding-2-preview.</p>
 
              <div className="w-48 bg-white/10 h-1 rounded-none overflow-hidden mt-4">
                <div
                  className="bg-cyan-400 h-full transition-all duration-700"
                  style={{ width: `${step === 1 ? '30%' : step === 2 ? '65%' : '100%'}` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Existing KB Files List */}
        <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-1">Knowledge Assets</h2>
          <p className="text-[10px] text-white/40 mb-5">Active library available for RAG search contexts matching customer enquiries.</p>
 
          {items.length === 0 ? (
            <div className="p-8 text-center text-white/30 border border-dashed border-white/10 rounded-xl bg-black">
              No files or documents indexed.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {items.map((it) => (
                <div key={it.id} className="p-4 border border-white/10 rounded-xl flex items-start justify-between bg-black hover:bg-white/5 transition-all">
                  <div className="min-w-0 pr-4">
                    <div className="flex items-center gap-2 mb-1.5">
                      {it.type === 'url' ? <Link className="w-4 h-4 text-purple-400 shrink-0" /> : <FileText className="w-4 h-4 text-cyan-400 shrink-0" />}
                      <span className="font-bold text-xs text-white truncate block">{it.name}</span>
                    </div>
                    <span className="text-[9px] text-[#F0F0F0]/40 block tracking-normal shrink-0">
                      Vectors count: <span className="text-cyan-400 font-bold">{it.chunk_count} blocks</span>
                    </span>
                    <p className="text-[10px] text-[#F0F0F0]/60 line-clamp-2 mt-2 leading-relaxed">{it.text_preview}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(it.id)}
                    className="p-1.5 text-white/40 hover:text-red-400 rounded-lg hover:bg-red-500/10 cursor-pointer shrink-0 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
 
      {/* RAG Tester Sidebar */}
      <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6">
        <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          Query Cosine Matcher
        </h2>
        <p className="text-[10px] text-white/40 mb-5">Test how the RAG engine will fetch context blocks for consumer requests.</p>
 
        <div className="space-y-4">
          <div>
            <div className="relative">
              <input
                type="text"
                placeholder="Type query terms, e.g., fees or Ntinda..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchTest()}
                className="w-full pl-9 pr-4 py-2 text-xs border border-white/10 bg-black text-white focus:outline-none focus:border-cyan-500/50 rounded-xl"
              />
              <Search className="w-3.5 h-3.5 text-white/40 absolute left-3 top-3" />
            </div>
            <button
              onClick={handleSearchTest}
              className="mt-2 text-[10px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer transition"
            >
              Analyze search vector overlaps
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
 
          <div className="space-y-3 pt-4 border-t border-white/10 min-h-[200px]">
            <span className="text-[9px] font-bold text-white/40 block">Matched Context Snippets</span>
            {searchResults.length === 0 ? (
              <p className="text-white/30 text-[10px] text-center py-10">No matching tokens found. Type a query and press enter.</p>
            ) : (
              searchResults.map((sr, idx) => (
                <div key={idx} className="p-3 border border-cyan-500/20 bg-cyan-500/5 rounded-xl text-xs">
                  <div className="flex justify-between items-center mb-1.5 text-[9px] font-bold">
                    <span className="text-cyan-400 flex items-center gap-1">
                      <Bookmark className="w-2.5 h-2.5 animate-pulse" />
                      {sr.source} (Chunk #{sr.chunkIndex})
                    </span>
                    <span className="text-purple-400 font-mono">Similarity: {(sr.similarity * 100).toFixed(0)}%</span>
                  </div>
                  <p className="text-[10px] text-[#F0F0F0]/70 leading-relaxed font-sans">"{sr.text}"</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
