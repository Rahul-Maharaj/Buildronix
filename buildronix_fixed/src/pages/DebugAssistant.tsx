import React, { useState, useRef } from 'react';
import { Bug, Send, Sparkles, Code, AlertCircle, Upload, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

import { debugCode } from '../services/geminiService';

const DebugAssistant = () => {
  const [errorMessage, setErrorMessage] = useState('');
  const [currentCode, setCurrentCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [expanded, setExpanded] = useState({
    fault: true,
    analysis: true,
    source: true,
    restoration: true
  });

  const toggleSection = (key: keyof typeof expanded) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCurrentCode(content);
    };
    reader.readAsText(file);
  };

  const handleDebug = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const data = await debugCode(errorMessage, currentCode);
      setResult(data);
    } catch (err) {
      console.error(err);
      alert('Debugging failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 md:p-[60px] max-w-7xl h-full flex flex-col">
       <div className="mb-16">
          <div className="web3-badge mb-6 w-fit">
            <Bug size={14} className="text-white" />
            Kernel Debugger v1.4
          </div>
          <h1 className="text-4xl md:text-5xl font-medium tracking-tighter web3-gradient-text mb-4">Diagnostics Interface</h1>
          <p className="text-white/40 text-lg leading-relaxed">Stream your logs and source to resolve system-level firmware inconsistencies.</p>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 flex-1 min-h-0">
          <div className="space-y-8 flex flex-col min-h-0">
            <div className="web3-card p-8 space-y-6">
                <label className="flex items-center gap-3 font-bold text-white/40 uppercase tracking-[0.2em] text-[10px]">
                    <AlertCircle size={14} />
                    System Log Stream (Error / Fault Details)
                </label>
                <textarea 
                    value={errorMessage}
                    onChange={(e) => setErrorMessage(e.target.value)}
                    placeholder="Describe the fault or paste your Serial Monitor error output here..."
                    className="w-full h-32 bg-white/[0.02] border border-white/5 rounded-2xl p-6 font-mono text-sm focus:border-white/20 outline-none resize-none transition-all text-white/60"
                />
            </div>

            <div className="web3-card p-8 space-y-6 flex-1 flex flex-col min-h-0 relative">
                <div className="flex items-center justify-between">
                    <label className="flex items-center gap-3 font-bold text-white/40 uppercase tracking-[0.2em] text-[10px]">
                        <Code size={14} />
                        Source Controller (Sketch)
                    </label>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 text-[10px] font-bold text-brand-primary uppercase tracking-[0.2em] hover:text-white transition-colors"
                    >
                      <Upload size={14} />
                      Upload Project File
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileUpload} 
                      className="hidden" 
                      accept=".ino,.cpp,.c,.h,.py,.txt,.js,.ts" 
                    />
                </div>
                <textarea 
                    value={currentCode}
                    onChange={(e) => setCurrentCode(e.target.value)}
                    placeholder="// Paste your code here or upload a project file..."
                    className="w-full flex-1 bg-white/[0.02] border border-white/5 rounded-2xl p-6 font-mono text-sm focus:border-white/20 outline-none resize-none transition-all text-white/60 leading-relaxed"
                />
            </div>

            <button 
                onClick={handleDebug}
                disabled={loading || !errorMessage || !currentCode}
                className="btn-web3-outer w-full !scale-100 hover:!scale-[1.01]"
            >

                <div className={`btn-web3-inner-light py-5 group ${loading ? 'opacity-80' : ''}`}>
                    <div className="btn-glow" />
                    {loading ? (
                        <div className="flex items-center gap-4">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black" />
                            <span className="text-sm font-bold text-black uppercase tracking-widest">Processing Stack...</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <Send size={18} className="text-black" />
                            <span className="text-sm font-bold text-black uppercase tracking-widest">Execute Diagnostics</span>
                        </div>
                    )}
                </div>
            </button>
          </div>

          <div className="flex flex-col h-full min-h-0">
             {result ? (
               <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6 overflow-y-auto pr-4 scrollbar-hide pb-10"
               >
                  <div className="web3-card border-l-2 border-l-red-500/50 bg-red-500/[0.02]">
                    <div 
                      className="p-8 pb-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors"
                      onClick={() => toggleSection('fault')}
                    >
                      <h3 className="font-bold text-sm text-red-400/80 uppercase tracking-[0.3em] flex items-center gap-3">
                          <AlertCircle size={14} />
                          Fault Location Identified
                      </h3>
                      <div className="text-red-400/40">
                        {expanded.fault ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </div>
                    <AnimatePresence initial={false}>
                      {expanded.fault && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="px-8 pb-8 pt-2">
                            <p className="text-lg text-white/80 leading-relaxed font-mono">
                                {result.faultLocation}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="web3-card border-l-2 border-l-white/40">
                    <div 
                      className="p-8 pb-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors"
                      onClick={() => toggleSection('analysis')}
                    >
                      <h3 className="font-bold text-sm text-white/40 uppercase tracking-[0.3em] flex items-center gap-3">
                          <Sparkles size={14} />
                          Root Analysis
                      </h3>
                      <div className="text-white/40">
                        {expanded.analysis ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </div>
                    <AnimatePresence initial={false}>
                      {expanded.analysis && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="px-8 pb-8 pt-2">
                            <p className="text-xl text-white/60 leading-relaxed font-medium tracking-tight">
                                {result.analysis}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="web3-card overflow-hidden !bg-[#050505] border-white/5">
                    <div 
                      className="bg-white/[0.05] px-8 py-5 border-b border-white/5 flex justify-between items-center text-[10px] font-bold text-white/20 uppercase tracking-[0.3em] cursor-pointer hover:bg-white/[0.08] transition-colors"
                      onClick={() => toggleSection('source')}
                    >
                      <span>Patched Source</span>
                      <div className="text-white/40">
                        {expanded.source ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </div>
                    </div>
                    <AnimatePresence initial={false}>
                      {expanded.source && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="text-[13px]">
                            <SyntaxHighlighter
                              language="cpp"
                              style={vscDarkPlus}
                              customStyle={{ margin: 0, background: 'transparent', padding: '2rem' }}
                              wrapLines={true}
                              showLineNumbers={true}
                            >
                              {result.correctedCode || '// No corrections applied'}
                            </SyntaxHighlighter>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="web3-card">
                    <div 
                      className="p-8 pb-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors"
                      onClick={() => toggleSection('restoration')}
                    >
                       <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em]">Restoration Procedure</h3>
                       <div className="text-white/40">
                         {expanded.restoration ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                       </div>
                    </div>
                    <AnimatePresence initial={false}>
                      {expanded.restoration && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="px-8 pb-8 pt-2">
                            <p className="text-white/60 whitespace-pre-wrap leading-relaxed italic text-lg font-medium">
                                {result.steps}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
               </motion.div>
            ) : (
                <div className="h-full web3-card border-dashed border-2 flex flex-col items-center justify-center text-center p-12">
                   <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-8 text-white/10">
                      <Bug size={32} />
                   </div>
                   <h4 className="text-white/60 font-medium text-lg mb-2">Standby for Input</h4>
                   <p className="text-white/20 text-sm max-w-xs font-medium">
                      Initialize a diagnostic sequence by providing your system logs and current sketch source.
                   </p>
                </div>
            )}
          </div>
       </div>
    </div>
  );
};

export default DebugAssistant;
