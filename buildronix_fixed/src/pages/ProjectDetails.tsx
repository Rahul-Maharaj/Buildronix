import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, Code as CodeIcon, FileText, GraduationCap, 
  ChevronLeft, Copy, Check, Info, Cpu, Box,
  Play, Hammer, MousePointer2, Printer, Download, ExternalLink, MonitorPlay, Pause, RotateCcw, StepForward, StepBack, HelpCircle
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import ThreeDViewer from '../components/ThreeDViewer';

import jsPDF from 'jspdf';
import 'jspdf-autotable';

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('circuit');
  const [copied, setCopied] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  
  const [simPlaying, setSimPlaying] = useState(false);
  const [simStepIdx, setSimStepIdx] = useState(0);

  useEffect(() => {
    let interval: any;
    if (simPlaying && project?.simulationGuide?.setupSteps && simStepIdx < project.simulationGuide.setupSteps.length) {
      interval = setInterval(() => {
        setSimStepIdx(prev => {
          if (prev >= project.simulationGuide.setupSteps.length - 1) {
            setSimPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [simPlaying, simStepIdx, project]);

  const handleSimPlay = () => {
    if (simStepIdx >= (project?.simulationGuide?.setupSteps?.length || 0) - 1) {
      setSimStepIdx(0);
    }
    setSimPlaying(true);
  };
  
  const handleSimPause = () => setSimPlaying(false);
  
  const handleSimReset = () => {
    setSimPlaying(false);
    setSimStepIdx(0);
  };

  const handleSimNext = () => {
    setSimPlaying(false);
    if (simStepIdx < (project?.simulationGuide?.setupSteps?.length || 0) - 1) {
      setSimStepIdx(prev => prev + 1);
    }
  };

  const handleSimPrev = () => {
    setSimPlaying(false);
    if (simStepIdx > 0) {
      setSimStepIdx(prev => prev - 1);
    }
  };

  useEffect(() => {
    const fetchProject = async () => {
      if (!id) return;
      const snap = await getDoc(doc(db, 'projects', id));
      if (snap.exists()) {
        setProject(snap.data());
      }
      setLoading(false);
    };
    fetchProject();
  }, [id]);

  const handleGeneratePDF = async () => {
    if (!project) return;
    setIsGeneratingPDF(true);
    try {
      const pdf = new jsPDF() as any;
      const pageWidth = pdf.internal.pageSize.getWidth();
      
      // Title Page
      pdf.setFillColor(5, 5, 5);
      pdf.rect(0, 0, pageWidth, 40, 'F');
      pdf.setTextColor(16, 185, 129); // Brand Primary
      pdf.setFontSize(28);
      pdf.setFont("helvetica", "bold");
      pdf.text((project.title || 'Project').toUpperCase(), 20, 25);
      
      pdf.setTextColor(150, 150, 150);
      pdf.setFontSize(10);
      pdf.text(`BUILD LOG ID: ${id || 'N/A'} | DATE: ${new Date().toLocaleDateString()}`, 20, 35);

      // Abstract
      pdf.setTextColor(40, 40, 40);
      pdf.setFontSize(16);
      pdf.text("PROJECT OVERVIEW", 20, 55);
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(80, 80, 80);
      const splitAbstract = pdf.splitTextToSize(project.documentation.abstract, pageWidth - 40);
      pdf.text(splitAbstract, 20, 65);

      // Components Table
      pdf.setFontSize(16);
      pdf.setTextColor(40, 40, 40);
      pdf.text("BILL OF MATERIALS", 20, 110);
      pdf.autoTable({
        startY: 120,
        head: [['Item', 'Specifications', 'Qty']],
        body: project.components.map((c: any) => [c.item || c, c.specs || 'Standard', c.quantity || '1']),
        headStyles: { fillColor: [16, 185, 129] },
        alternateRowStyles: { fillColor: [245, 245, 245] }
      });

      // Pin Mapping
      pdf.addPage();
      pdf.setFontSize(16);
      pdf.text("PRECISION PIN MAPPING", 20, 20);
      pdf.autoTable({
        startY: 30,
        head: [['Hardware Component', 'Interface', 'Reference Pin']],
        body: project.circuit.pinMap.map((p: any) => [p.component, p.pin, p.arduinoPin]),
        headStyles: { fillColor: [16, 185, 129] }
      });

      // Code Section
      pdf.addPage();
      pdf.setFillColor(15, 15, 15);
      pdf.rect(0, 0, pageWidth, 20, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(14);
      pdf.text("CORE FIRMWARE SNAPSHOT", 20, 14);
      
      pdf.setTextColor(50, 50, 50);
      pdf.setFont("courier", "normal");
      pdf.setFontSize(8);
      const splitCode = pdf.splitTextToSize(project.code.snippet, pageWidth - 30);
      pdf.text(splitCode, 15, 30);

      // Documentation
      pdf.addPage();
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(16);
      pdf.setTextColor(40, 40, 40);
      pdf.text("ENGINEERING DOCUMENTATION", 20, 20);
      
      const docSections = [
        { t: "Objective", c: project.documentation.objective },
        { t: "Working Mechanism", c: project.documentation.working },
        { t: "System Conclusion", c: project.documentation.conclusion }
      ];

      let yPos = 35;
      docSections.forEach(s => {
        pdf.setFontSize(12);
        pdf.setTextColor(16, 185, 129);
        pdf.text(s.t.toUpperCase(), 20, yPos);
        yPos += 7;
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(60, 60, 60);
        const splitC = pdf.splitTextToSize(s.c, pageWidth - 40);
        pdf.text(splitC, 20, yPos);
        yPos += (splitC.length * 5) + 15;
      });

      pdf.save(`${project.title}_Technical_Dossier.pdf`);
    } catch (err) {
      console.error(err);
      alert("Failed to compile PDF dossier.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(project.code.snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleExpand = (id: string) => {
    setExpandedStep(expandedStep === id ? null : id);
  };

  const tabs = [
    { id: 'circuit', label: 'Circuitry', icon: <Zap size={18} /> },
    { id: '3d', label: '3D View', icon: <Box size={18} /> },
    { id: 'guide', label: 'Build Guide', icon: <Play size={18} /> },
    { id: 'simulation', label: 'Virtual Sim', icon: <MonitorPlay size={18} /> },
    { id: 'code', label: 'Code', icon: <CodeIcon size={18} /> },
    { id: 'docs', label: 'Documentation', icon: <FileText size={18} /> },
    { id: 'viva', label: 'Viva Prep', icon: <GraduationCap size={18} /> },
  ];

  if (loading) return <div className="p-8 flex justify-center"><div className="animate-spin h-8 w-8 border-b-2 border-brand-primary rounded-full" /></div>;
  if (!project) return <div className="p-8 text-center text-zinc-500">Project not found</div>;

  /** Build a safe layout3D for the ThreeDViewer, falling back to auto-layout from components */
  const getLayout3D = () => {
    if (
      typeof project.circuit?.layout3D === 'object' &&
      Array.isArray(project.circuit?.layout3D?.placements) &&
      project.circuit.layout3D.placements.length > 0
    ) {
      return project.circuit.layout3D;
    }
    return {
      placements: Array.isArray(project.components)
        ? project.components.map((c: any, i: number) => ({
            name: typeof c === 'object' ? (c.item || 'Component') : c,
            position: [i * 22 - (project.components.length * 11), 0, 0],
            size: [15, 5, 10],
            color: i === 0 ? '#10b981' : i % 3 === 1 ? '#3b82f6' : '#8b5cf6',
            type: 'component',
            specs: typeof c === 'object' ? (c.specs || 'Standard I/O Peripheral') : 'Standard I/O Peripheral',
          }))
        : [],
    };
  };


  return (
    <div className="p-8 md:p-[60px] max-w-5xl mx-auto pb-40">
      <button 
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-2 text-white/40 hover:text-white transition-colors mb-10 group"
      >
        <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-bold uppercase tracking-widest">Back to Systems</span>
      </button>

      <div className="flex justify-between items-start mb-16">
        <div className="max-w-3xl">
          <div className="web3-badge mb-6 w-fit">
            <Zap size={14} className="text-white" />
            Project Archive
          </div>
          <h1 className="text-4xl md:text-5xl font-medium tracking-tighter web3-gradient-text mb-6">{project.title}</h1>
          <p className="text-white/40 text-lg leading-relaxed">{project.description}</p>
        </div>
        
        <button 
          onClick={() => window.print()}
          className="btn-web3-outer"
        >
          <div className="btn-web3-inner-dark group px-6 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10">
            <Printer size={18} className="text-white/60 mr-2" />
            <span className="text-sm font-semibold text-white/80">Export</span>
          </div>
        </button>
      </div>

      {/* Tabs Layout */}
      <div className="flex gap-2 p-1 bg-white/5 border border-white/5 rounded-2xl mb-12 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all duration-300 ${
              activeTab === tab.id 
              ? 'bg-white text-black shadow-lg shadow-white/10' 
              : 'text-white/40 hover:text-white/80'
            }`}
          >
            <span className="text-xs uppercase tracking-widest">{tab.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
           key={activeTab}
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           exit={{ opacity: 0, y: -10 }}
           transition={{ duration: 0.2 }}
        >
          {activeTab === 'circuit' && (
            <div className="space-y-10">
              <div className="web3-card p-10">
                <h3 className="text-xl font-bold mb-8 flex items-center gap-3 uppercase tracking-widest text-white/80">
                  Bill of Materials (BOM)
                </h3>
                <div className="overflow-hidden rounded-xl border border-white/5">
                  <table className="w-full text-left">
                    <thead className="bg-white/5">
                      <tr>
                        <th className="px-6 py-4 font-bold text-white/40 text-[10px] uppercase tracking-wider">Item</th>
                        <th className="px-6 py-4 font-bold text-white/40 text-[10px] uppercase tracking-wider">Specifications</th>
                        <th className="px-6 py-4 font-bold text-white/40 text-[10px] uppercase tracking-wider text-right">Qty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {project.components.map((comp: any, i: number) => (
                        <tr key={i} className="hover:bg-white/[0.02]">
                          <td className="px-6 py-4 text-white font-medium">{comp.item || comp}</td>
                          <td className="px-6 py-4 text-white/40 text-sm">{comp.specs || 'Standard'}</td>
                          <td className="px-6 py-4 text-right text-white/60 font-mono text-sm">{comp.quantity || '1'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                 {/* Precision Pin Mapping */}
                 <div className="lg:col-span-2 web3-card p-0 overflow-hidden border-white/10 shadow-2xl">
                    <div className="p-8 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                             <Cpu size={20} />
                          </div>
                          <div>
                             <h3 className="text-sm font-bold uppercase tracking-[0.3em] text-white">Precision Pin Mapping</h3>
                             <p className="text-[10px] text-white/20 uppercase tracking-widest mt-1">Logic Layer Reference</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-2">
                          {['PWR', 'GND', 'SIG'].map(type => (
                             <div key={type} className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 border border-white/10">
                                <div className={`w-1.5 h-1.5 rounded-full ${type === 'PWR' ? 'bg-red-500' : type === 'GND' ? 'bg-zinc-500' : 'bg-brand-primary'}`} />
                                <span className="text-[8px] font-bold text-white/40 uppercase">{type}</span>
                             </div>
                          ))}
                       </div>
                    </div>
                     <div className="overflow-x-auto">
                       <table className="w-full text-left">
                         <thead className="bg-[#050505]">
                           <tr>
                             <th className="px-8 py-5 font-bold text-white/20 text-[9px] uppercase tracking-[0.3em]">Hardware Component</th>
                             <th className="px-8 py-5 font-bold text-white/20 text-[9px] uppercase tracking-[0.3em]">Instructions</th>
                           </tr>
                         </thead>
                         <tbody className="divide-y divide-white/5 bg-black/20">
                           {project.circuit.pinMap.map((item: any, i: number) => {
                             const isPower = item.pin.toLowerCase().includes('vcc') || item.pin.toLowerCase().includes('5v') || item.pin.toLowerCase().includes('3.3v');
                             const isGND = item.pin.toLowerCase().includes('gnd') || item.pin.toLowerCase().includes('ground');
                             
                             return (
                               <tr key={i} className="hover:bg-brand-primary/[0.03] transition-all group">
                                 <td className="px-8 py-6 font-semibold text-white/80 group-hover:text-white transition-colors">
                                   {item.component}
                                 </td>
                                 <td className="px-8 py-6">
                                   <div className="flex items-center gap-3">
                                      <span className="text-white/40 text-[10px] font-mono uppercase tracking-tighter">
                                         Connect <strong>{item.pin}</strong>
                                      </span>
                                      <span className="text-white/60">→</span>
                                      <div className="inline-flex items-center gap-3 bg-brand-primary/10 border border-brand-primary/20 px-4 py-2 rounded-xl">
                                         <div className={`w-2 h-2 rounded-full ${isPower ? 'bg-red-500' : isGND ? 'bg-white/40' : 'bg-brand-primary'}`} />
                                         <span className="text-brand-primary font-mono text-[13px] font-black uppercase tracking-widest">
                                           {item.arduinoPin}
                                         </span>
                                      </div>
                                   </div>
                                 </td>
                               </tr>
                             );
                           })}
                         </tbody>
                       </table>
                     </div>
                 </div>

                 {/* Safety & Pre-flight Checklist */}
                 <div className="space-y-6">
                    <div className="web3-card p-8 border-amber-500/20 bg-amber-500/[0.02] relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                          <Info size={80} />
                       </div>
                       <h4 className="text-amber-500 text-xs font-black uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                          <Zap size={14} fill="currentColor" /> Student Checklist
                       </h4>
                       <ul className="space-y-5">
                          {[
                            "Verify VCC vs VIN (Don't exceed 5V)",
                            "Common Ground (Share GND pin)",
                            "Check for loose breadboard rails",
                            "Pull-up resistors for I2C data"
                          ].map((check, i) => (
                            <li key={i} className="flex items-start gap-3 group">
                               <div className="mt-1 w-4 h-4 rounded border border-amber-500/30 flex items-center justify-center group-hover:border-amber-500 transition-colors">
                                  <Check size={10} className="text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                               </div>
                               <span className="text-white/60 text-xs font-medium leading-relaxed group-hover:text-white/90 transition-colors">{check}</span>
                            </li>
                          ))}
                       </ul>
                    </div>

                    <div className="web3-card p-8 border-brand-primary/20 bg-brand-primary/[0.01]">
                       <h4 className="text-white/20 text-[10px] font-black uppercase tracking-[0.4em] mb-4">Architecture</h4>
                       <div className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/5">
                          <Hammer size={18} className="text-brand-primary" />
                          <div>
                             <p className="text-white/80 text-[11px] font-bold uppercase tracking-widest">WIRING LOGIC</p>
                             <p className="text-white/30 text-[9px] font-mono">Master Schematic v1.0.4</p>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="web3-card p-10 border-white/10">
                <div className="flex items-center justify-between mb-10 pb-6 border-b border-white/5">
                  <h3 className="text-xl font-bold flex items-center gap-4 uppercase tracking-[0.3em] text-white/80">
                    <span className="w-10 h-1 bg-brand-primary rounded-full" />
                    Wiring Execution Steps
                  </h3>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
                     <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                     <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Active Instructions</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                   <div className="markdown-body p-8 rounded-2xl bg-black/40 border border-white/5 prose-invert prose-sm max-w-none">
                      <ReactMarkdown>{project.circuit.wiring}</ReactMarkdown>
                   </div>
                   <div className="space-y-6">
                      <div className="p-8 rounded-2xl bg-brand-primary/[0.03] border border-brand-primary/20 relative group">
                         <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary mb-6 group-hover:scale-110 transition-transform">
                            <Info size={24} />
                         </div>
                         <h5 className="text-white font-bold text-lg mb-2">Technical Warning</h5>
                         <p className="text-white/60 text-sm leading-relaxed">
                            Ensure all connections are made with the controller <strong>Disconnected</strong> from USB power. Miswiring a power rail can cause permanent hardware failure.
                         </p>
                      </div>
                      <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/5">
                         <h5 className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-4">Signal Integrity</h5>
                         <p className="text-white/40 text-[11px] leading-relaxed italic">
                            Keep data wires away from high-current power lines to minimize electromagnetic interference (EMI) during sensor data acquisition.
                         </p>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === '3d' && (
            <div className="space-y-10">
              <ThreeDViewer layout={getLayout3D()} />

              <div className="web3-card p-10 bg-white/[0.02]">
                <h3 className="text-sm font-bold uppercase tracking-[0.3em] text-white/20 mb-6">Simulation Metadata</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <span className="text-[10px] text-white/40 uppercase">Rendering Pipeline</span>
                    <p className="text-white font-mono text-xs">WebGL 2.0 / Three.js</p>
                  </div>
                  <div className="space-y-2">
                    <span className="text-[10px] text-white/40 uppercase">Coordinate System</span>
                    <p className="text-white font-mono text-xs">Cartesian (mm)</p>
                  </div>
                  <div className="space-y-2">
                    <span className="text-[10px] text-white/40 uppercase">Module Accuracy</span>
                    <p className="text-white font-mono text-xs">Precision High</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'guide' && (
            <div className="space-y-6">
              <div className="web3-card p-10 border-brand-primary/20 bg-brand-primary/[0.02]">
                <h3 className="text-2xl font-medium web3-gradient-text mb-2">Technical Implementation Sequence</h3>
                <p className="text-white/40 text-sm tracking-widest uppercase font-bold mb-10">Step-by-Step Hardware Instantiation</p>
                
                <div className="space-y-12">
                  {(project.buildGuide || []).map((item: any, i: number) => (
                    <div key={i} className="flex flex-col md:flex-row gap-10 group">
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center font-bold text-white group-hover:bg-brand-primary group-hover:text-black transition-all shrink-0 shadow-lg shadow-black">
                          {item.step || i + 1}
                        </div>
                        {i !== (project.buildGuide?.length || 0) - 1 && <div className="w-0.5 flex-1 bg-gradient-to-b from-brand-primary/20 to-transparent my-6" />}
                      </div>
                      <div className="pb-12 flex-1">
                        <div className="flex items-center gap-4 mb-4">
                           <h4 className="text-2xl font-bold text-white/90 uppercase tracking-tight">{item.title}</h4>
                           <div className="h-px flex-1 bg-white/5" />
                        </div>
                        <div className="bg-white/[0.03] border border-white/5 p-8 rounded-2xl space-y-8">
                           <p className="text-white text-lg font-medium leading-relaxed">{item.instruction || `Execute wiring sequence ${item.step || i + 1} per the master schematic.`}</p>
                           
                           <div className="grid grid-cols-1 gap-6">
                              {(item.materials || item.title) && (
                                 <div className="flex flex-col p-6 rounded-2xl bg-white/[0.02] border border-white/5 group/tooltip relative">
                                    <div className="flex gap-6 items-start">
                                      <div className="w-12 h-12 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary shrink-0 group-hover/tooltip:bg-brand-primary group-hover/tooltip:text-black transition-colors">
                                         <Hammer size={24} />
                                      </div>
                                      <div className="space-y-2 flex-1">
                                         <div className="flex items-center justify-between">
                                           <h5 className="text-[10px] font-bold text-brand-primary uppercase tracking-[0.2em] flex items-center gap-2">
                                              What to Use / Materials
                                           </h5>
                                         </div>
                                         <p className="text-white text-base font-bold leading-relaxed">
                                            {item.materials || "Standard components required for this physical interface."}
                                         </p>
                                         
                                         {/* Material Tooltip */}
                                         <div className="absolute bottom-full left-0 mb-4 w-full p-6 bg-[#0a0a0a] border border-brand-primary/30 rounded-2xl opacity-0 translate-y-2 pointer-events-none group-hover/tooltip:opacity-100 group-hover/tooltip:translate-y-0 transition-all z-50 shadow-2xl">
                                            <div className="flex items-center gap-2 mb-3">
                                               <Info size={14} className="text-brand-primary" />
                                               <span className="text-[9px] font-black text-brand-primary uppercase tracking-widest">Material Specs & Alternatives</span>
                                            </div>
                                            <p className="text-white text-xs leading-relaxed">
                                               {item.materialsDetails || "Standard components required. Can be substituted with equivalent high-tolerance sensors if primary inventory is depleted."}
                                            </p>
                                         </div>
                                      </div>
                                    </div>
                                 </div>
                              )}
                              {(item.method || item.instruction) && (
                                 <div className="flex flex-col p-6 rounded-2xl bg-white/5 border border-white/10 group/method relative mt-4">
                                    <div className="flex gap-6 items-start">
                                      <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-white/60 shrink-0 group-hover/method:bg-white group-hover/method:text-black transition-colors">
                                         <MousePointer2 size={24} />
                                      </div>
                                      <div className="space-y-2 flex-1">
                                         <div className="flex items-center justify-between">
                                           <h5 className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] flex items-center gap-2">
                                              How to Connect / Methodology
                                           </h5>
                                         </div>
                                         <p className="text-white/90 text-sm leading-relaxed">
                                            {item.method || "Ensure secure connections and verify continuity."}
                                         </p>

                                         {/* Logic Tooltip */}
                                         <div className="absolute bottom-full left-0 mb-4 w-full p-6 bg-[#0a0a0a] border border-white/30 rounded-2xl opacity-0 translate-y-2 pointer-events-none group-hover/method:opacity-100 group-hover/method:translate-y-0 transition-all z-50 shadow-2xl">
                                            <div className="flex items-center gap-2 mb-3">
                                               <Zap size={14} className="text-amber-500" />
                                               <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Electrical & Logical Reasoning</span>
                                            </div>
                                            <p className="text-white text-xs leading-relaxed">
                                               {item.methodReasoning || "This connection establishes a signal path defined by the system architecture. Verify impedance levels for sensitive data transfer."}
                                            </p>
                                         </div>
                                      </div>
                                    </div>
                                 </div>
                              )}
                           </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'simulation' && (
            <div className="space-y-6">
              <div className="web3-card p-10 border-brand-primary/20 bg-brand-primary/[0.02]">
                <h3 className="text-2xl font-medium web3-gradient-text mb-2">Virtual Simulation Guide</h3>
                <p className="text-white/40 text-sm tracking-widest uppercase font-bold mb-10">Safely prototype before physical execution</p>
                
                {project.simulationGuide ? (
                  <div className="space-y-10">
                    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden p-8 flex flex-col gap-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm uppercase tracking-[0.2em] text-white/40 font-bold mb-2">Recommended Platform</h4>
                          <p className="text-xl font-bold text-white">{project.simulationGuide.platform || "Wokwi or Tinkercad"}</p>
                        </div>
                        <MonitorPlay size={40} className="text-brand-primary opacity-50" />
                      </div>
                      
                      <div className="border border-white/10 rounded-xl overflow-hidden shadow-2xl relative h-[500px]">
                        <ThreeDViewer 
                          layout={getLayout3D()} 
                          visiblePercentage={
                            (project.simulationGuide?.setupSteps?.length ?? 0) > 0
                              ? Math.min(100, Math.ceil(((simStepIdx + 1) / project.simulationGuide.setupSteps.length) * 100))
                              : 100
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-bold text-brand-primary tracking-tight">Interactive Workspace Setup</h4>
                        
                        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full p-1">
                          <button 
                            onClick={handleSimPrev}
                            className={`p-2 rounded-full transition-colors flex items-center justify-center ${simStepIdx > 0 ? 'text-white/60 hover:text-white hover:bg-white/10' : 'text-white/20 cursor-not-allowed'}`}
                            title="Previous Step"
                            disabled={simStepIdx === 0}
                          >
                            <StepBack size={16} />
                          </button>
                          <button 
                            onClick={handleSimPlay}
                            className={`p-2 rounded-full transition-colors flex items-center justify-center ${simPlaying ? 'text-brand-primary bg-brand-primary/10' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
                            title="Play Simulation"
                          >
                            <Play size={16} className={simPlaying ? 'fill-current' : ''} />
                          </button>
                          <button 
                            onClick={handleSimPause}
                            className={`p-2 rounded-full transition-colors flex items-center justify-center ${!simPlaying && simStepIdx > 0 ? 'text-amber-500 bg-amber-500/10' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
                            title="Pause Simulation"
                          >
                            <Pause size={16} className={!simPlaying && simStepIdx > 0 ? 'fill-current' : ''} />
                          </button>
                          <button 
                            onClick={handleSimNext}
                            className={`p-2 rounded-full transition-colors flex items-center justify-center ${simStepIdx < (project?.simulationGuide?.setupSteps?.length || 0) - 1 ? 'text-white/60 hover:text-white hover:bg-white/10' : 'text-white/20 cursor-not-allowed'}`}
                            title="Next Step"
                            disabled={simStepIdx >= (project?.simulationGuide?.setupSteps?.length || 0) - 1}
                          >
                            <StepForward size={16} />
                          </button>
                          <div className="w-[1px] h-4 bg-white/10 mx-1"></div>
                          <button 
                            onClick={handleSimReset}
                            className="p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors flex items-center justify-center"
                            title="Reset Simulation"
                          >
                            <RotateCcw size={16} />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {(project.simulationGuide.setupSteps || []).map((step: string, i: number) => {
                          const isActive = simStepIdx === i;
                          const isPast = simStepIdx > i;
                          
                          return (
                            <div 
                              key={i} 
                              className={`flex gap-4 p-5 rounded-xl border transition-all duration-500 ${
                                isActive 
                                  ? 'bg-brand-primary/10 border-brand-primary/50 shadow-[0_0_15px_rgba(16,185,129,0.15)] scale-[1.02]' 
                                  : isPast
                                  ? 'bg-white/[0.02] border-white/5 opacity-50'
                                  : 'bg-white/[0.02] border-white/5'
                              }`}
                            >
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${isActive ? 'bg-brand-primary text-black' : 'bg-white/10 text-white/40'}`}>
                                {isPast ? <Check size={12} className="text-brand-primary" /> : i + 1}
                              </div>
                              <p className={`${isActive ? 'text-brand-primary' : 'text-white/80'} font-medium transition-colors`}>{step}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-6 pt-6 border-t border-white/10">
                      <h4 className="text-lg font-bold text-green-400 tracking-tight">Testing Routine</h4>
                      <div className="p-6 rounded-2xl bg-black/40 border border-green-500/20">
                        <p className="text-white/80 leading-relaxed font-mono text-sm leading-relaxed whitespace-pre-wrap">
                          {project.simulationGuide.testingInstructions}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-20 text-white/40">
                    <MonitorPlay size={48} className="mx-auto mb-6 opacity-20" />
                    <p>No virtual simulation guide was generated for this module.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'code' && (
            <div className="space-y-10">
              <div className="web3-card overflow-hidden !bg-[#050505] border-white/10">
                <div className="bg-white/[0.05] px-8 py-5 border-b border-white/5 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                      <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                      <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                    </div>
                    <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em] ml-6">Firmware Core</span>
                  </div>
                  <button 
                    onClick={copyCode}
                    className="flex items-center gap-2 text-[10px] font-bold text-white/40 hover:text-white transition-colors uppercase tracking-[0.2em]"
                  >
                    {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                    {copied ? 'Success' : 'Copy Payload'}
                  </button>
                </div>
                <pre className="p-10 text-white/60 font-mono text-sm leading-[1.8] overflow-x-auto">
                  <code>{project.code.snippet}</code>
                </pre>
              </div>

              <div className="web3-card p-10">
                <h3 className="text-sm font-bold uppercase tracking-widest text-white/40 mb-6">Algorithm Breakdown</h3>
                <p className="text-lg text-white/60 leading-relaxed italic border-l-2 border-white/20 pl-8 font-medium">
                  {project.code.explanation}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'docs' && (
            <div className="space-y-8">
              <div className="flex justify-end mb-4">
                <button 
                  onClick={handleGeneratePDF}
                  disabled={isGeneratingPDF}
                  className="flex items-center gap-3 px-8 py-4 bg-brand-primary text-black rounded-2xl font-bold uppercase tracking-widest text-[11px] hover:bg-brand-primary/80 transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                >
                  {isGeneratingPDF ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      Compiling Dossier...
                    </>
                  ) : (
                     <>
                      <Download size={16} />
                      Compile PDF Report
                     </>
                  )}
                </button>
              </div>
              {[
                { title: 'Abstract', content: project.documentation.abstract },
                { title: 'Objective', content: project.documentation.objective },
                { title: 'Working Framework', content: project.documentation.working },
                { title: 'Conclusion', content: project.documentation.conclusion },
              ].map((section, idx) => (
                <div key={idx} className="web3-card p-10">
                  <h3 className="text-xl font-bold mb-6 text-white/80 uppercase tracking-widest">{section.title}</h3>
                  <p className="text-white/40 leading-relaxed text-lg font-medium">{section.content}</p>
                </div>
              ))}
              
              <div className="web3-card p-16 flex flex-col items-center text-center !bg-white/5 border-dashed border-2 border-white/10">
                <h3 className="text-2xl font-medium mb-4 web3-gradient-text">Physical Documentation Archive</h3>
                <p className="text-white/40 mb-10 font-medium max-w-sm">Generating a high-fidelity report for institutional submission or physical archiving.</p>
                <button 
                  onClick={() => window.print()}
                  className="btn-web3-outer"
                >
                  <div className="btn-web3-inner-light px-12 py-4">
                    <Download size={20} className="text-black mr-2" />
                    <span className="text-sm font-bold text-black uppercase tracking-widest">Compile PDF Report</span>
                  </div>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'viva' && (
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="flex items-center justify-between mb-2">
                 <div>
                    <h3 className="text-2xl font-bold text-white uppercase tracking-tighter">Viva Examination Advisor</h3>
                    <p className="text-white/40 text-sm font-medium mt-1">Master your project interview with these common technical discussions.</p>
                 </div>
                 <div className="flex items-center gap-3">
                    <span className="px-3 py-1.5 rounded-lg bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-[10px] font-black uppercase tracking-widest">
                       {project.vivaQuestions.length} DISCUSSIONS
                    </span>
                 </div>
              </div>

              <div className="grid gap-6">
                {project.vivaQuestions.map((q: any, i: number) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    key={i} 
                    className="web3-card p-0 overflow-hidden border-white/5 hover:border-brand-primary/30 transition-colors group"
                  >
                    <details className="w-full">
                      <summary className="list-none px-8 py-8 flex justify-between items-center cursor-pointer select-none group-open:bg-white/[0.02]">
                        <div className="flex gap-6 items-center">
                           <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-brand-primary/10 transition-colors">
                              <span className="text-white/20 group-hover:text-brand-primary font-black text-xl italic">{String(i + 1).padStart(2, '0')}</span>
                           </div>
                           <span className="font-bold text-xl text-white/90 group-hover:text-white transition-colors leading-snug">{q.question}</span>
                        </div>
                        <div className="p-3 rounded-xl bg-white/5 text-white/20 group-open:rotate-180 transition-all duration-300 group-hover:bg-brand-primary/20 group-hover:text-brand-primary">
                          <ChevronLeft size={20} className="-rotate-90" />
                        </div>
                      </summary>
                      <div className="px-10 pb-10 pt-6 bg-brand-primary/[0.02] border-t border-white/5">
                        <div className="flex gap-4">
                           <div className="w-1 h-auto bg-brand-primary/30 rounded-full" />
                           <div className="flex-1 space-y-4">
                              <div className="flex items-center gap-2 mb-2">
                                 <Zap size={14} className="text-brand-primary" />
                                 <span className="text-[10px] font-black text-brand-primary uppercase tracking-[0.3em]">Technical Breakdown</span>
                              </div>
                              <p className="text-white/60 leading-relaxed text-lg font-medium italic">
                                 {q.answer}
                              </p>
                              <div className="pt-6 flex items-center gap-6 border-t border-white/5">
                                 <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500" />
                                    <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">Accuracy Verified</span>
                                 </div>
                                 <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                                    <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">Industry Standard</span>
                                 </div>
                              </div>
                           </div>
                        </div>
                      </div>
                    </details>
                  </motion.div>
                ))}
              </div>

              <div className="web3-card p-10 mt-12 bg-gradient-to-br from-brand-primary/5 to-transparent border-brand-primary/20">
                 <div className="flex gap-8 items-center">
                    <div className="w-16 h-16 rounded-3xl bg-brand-primary flex items-center justify-center text-black shadow-[0_0_30px_rgba(16,185,129,0.4)]">
                       <HelpCircle size={32} />
                    </div>
                    <div>
                       <h4 className="text-white font-bold text-xl mb-1 uppercase tracking-tight">Need deep-dive preparation?</h4>
                       <p className="text-white/40 text-sm font-medium">Generate extended theory questions based on your specific custom hardware choices.</p>
                       <button className="mt-4 px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all border border-white/10">
                          Launch AI Interviewer
                       </button>
                    </div>
                 </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
      
      {/* Simulation Links */}
      <div className="mt-40 pt-20 border-t border-white/5">
        <h3 className="text-sm font-bold text-white/20 uppercase tracking-[0.3em] mb-10 flex items-center gap-4">
            <div className="h-px flex-1 bg-white/5" />
            Emulated Environments
            <div className="h-px flex-1 bg-white/5" />
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <a href="https://wokwi.com" target="_blank" rel="noopener noreferrer" className="web3-card p-10 hover:bg-white/[0.08] group">
                <div className="flex justify-between items-start mb-4">
                   <h4 className="font-bold text-xl text-white group-hover:web3-gradient-text transition-all uppercase tracking-widest">Wokwi Engine</h4>
                   <ExternalLink size={20} className="text-white/20 group-hover:text-white transition-colors" />
                </div>
                <p className="text-sm text-white/40 font-medium">Professional silicon-level simulation for embedded firmware deployment.</p>
            </a>
            <a href="https://www.tinkercad.com" target="_blank" rel="noopener noreferrer" className="web3-card p-10 hover:bg-white/[0.08] group">
                <div className="flex justify-between items-start mb-4">
                   <h4 className="font-bold text-xl text-white group-hover:web3-gradient-text transition-all uppercase tracking-widest">Autodesk Cad</h4>
                   <ExternalLink size={20} className="text-white/20 group-hover:text-white transition-colors" />
                </div>
                <p className="text-sm text-white/40 font-medium">Visual schematic design and high-level behavioral circuit emulation.</p>
            </a>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetails;
