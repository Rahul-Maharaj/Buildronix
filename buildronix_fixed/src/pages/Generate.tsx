import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Cpu, Lightbulb, Brain, Plus, X, Sparkles, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { generateProject } from '../services/geminiService';
import { PREMADE_PROJECTS } from '../constants/templates';

const PREDEFINED_COMPONENTS = [
  "ESP32", "Arduino Uno", "Raspberry Pi 4", "NodeMCU", "DHT11 (Temp/Humidity)", "DHT22 (Temp/Humidity)", 
  "Ultrasonic Sensor (HC-SR04)", "PIR Motion Sensor", "LDR (Photoresistor)", 
  "Active Buzzer", "Passive Buzzer", "Servo Motor (SG90)", "Stepper Motor (28BYJ-48)", "OLED Display 0.96\"", 
  "LCD 16x2 I2C", "Relay Module (1-Channel)", "Soil Moisture Sensor",
  "Flame Sensor", "MQ-2 Gas Sensor", "MQ-135 Air Quality Sensor", "RFID Reader (RC522)", "Bluetooth Module (HC-05)",
  "LED (Red)", "LED (Green)", "LED (Blue)", "RGB LED", "Push Button", "10k Ohm Resistor", "220 Ohm Resistor",
  "Breadboard (Half-Size)", "Jumper Wires (M-M)", "Jumper Wires (M-F)"
];

const Generate = () => {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadStep, setLoadStep] = useState(0);
  const [formData, setFormData] = useState({
    idea: '',
    components: [] as string[],
  });
  const [tempComp, setTempComp] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const filteredComponents = tempComp.trim() 
    ? PREDEFINED_COMPONENTS.filter(c => c.toLowerCase().includes(tempComp.toLowerCase()) && !formData.components.includes(c))
    : PREDEFINED_COMPONENTS.filter(c => !formData.components.includes(c)).slice(0, 5); // show top 5 when empty

  const addComponent = (compName?: string) => {
    const targetComp = compName || tempComp.trim();
    if (targetComp && !formData.components.includes(targetComp)) {
      setFormData({ ...formData, components: [...formData.components, targetComp] });
      setTempComp('');
      setShowDropdown(false);
    }
  };

  const removeComponent = (comp: string) => {
    setFormData({ ...formData, components: formData.components.filter(c => c !== comp) });
  };

  const loadingSteps = [
    "Analyzing System Requirements...",
    "Synthesizing Hardware Architecture...",
    "Engineering Firmware Logic...",
    "Architecting 3D Spatial Blueprint...",
    "Generating Technical Documentation...",
    "Finalizing Integrated Solution..."
  ];

  const handleGenerate = async (e?: React.FormEvent, ideaRef?: string, componentsRef?: string[]) => {
    if (e) e.preventDefault();
    if (!user) return;
    
    const finalIdea = ideaRef || formData.idea;
    const finalComponents = componentsRef || formData.components;

    if (!finalIdea) {
      alert("Please define a project concept first.");
      return;
    }

    setLoading(true);
    setLoadStep(0);

    // Progress Simulation
    const stepInterval = setInterval(() => {
      setLoadStep(prev => prev < loadingSteps.length - 1 ? prev + 1 : prev);
    }, 2500);

    try {
      const projectData = await generateProject(finalIdea, finalComponents);
      
      const docRef = await addDoc(collection(db, 'projects'), {
        ...projectData,
        userId: user.uid,
        idea: finalIdea,
        createdAt: serverTimestamp(),
      });

      clearInterval(stepInterval);
      setLoadStep(loadingSteps.length - 1);
      setTimeout(() => navigate(`/project/${docRef.id}`), 1000);
    } catch (error) {
      clearInterval(stepInterval);
      console.error(error);
      alert('Failed to generate project. Please try again.');
      setLoading(false);
    }
  };

  const useTemplate = (project: any) => {
    setFormData({
      idea: project.description,
      components: project.components
    });
    // Optional: Auto trigger generation
    // handleGenerate(undefined, project.description, project.components);
  };

  return (
    <div className="p-8 md:p-[60px] max-w-4xl">
      <div className="mb-16">
        <div className="web3-badge mb-6 w-fit">
          <Sparkles size={14} className="text-white" />
          Neural Engine v2.0
        </div>
        <h1 className="text-4xl md:text-5xl font-medium tracking-tighter web3-gradient-text mb-4">Initialize New System</h1>
        <p className="text-white/40 text-lg">Define your parameters to architect a production-grade IoT solution.</p>
      </div>

      <form onSubmit={handleGenerate} className="space-y-10">
        <div className="web3-card p-10 space-y-10">
          {/* Idea */}
          <div className="space-y-6">
            <label className="flex items-center gap-3 font-semibold text-white tracking-tight uppercase text-xs">
              <Lightbulb size={16} className="text-white/40" />
              Project Concept
            </label>
            <textarea 
              value={formData.idea}
              onChange={(e) => setFormData({ ...formData, idea: e.target.value })}
              className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-5 focus:border-white/30 focus:ring-4 focus:ring-white/5 outline-none transition-all text-white font-medium min-h-[120px]"
              placeholder="What would you like to build? (e.g. A smart plant watering system with mobile alerts)"
            />
          </div>

          {/* Components */}
          <div className="space-y-6">
            <label className="flex items-center gap-3 font-semibold text-white tracking-tight uppercase text-xs">
              <Cpu size={16} className="text-white/40" />
              Hardware Stack
            </label>
            <div className="flex flex-col gap-2 relative">
              <div className="flex gap-3 relative">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-white/40">
                  <Search size={18} />
                </div>
                <input 
                  type="text" 
                  value={tempComp}
                  onChange={(e) => {
                    setTempComp(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addComponent())}
                  className="flex-1 bg-white/5 border border-white/5 rounded-2xl pl-14 pr-6 py-5 focus:border-brand-primary/50 focus:ring-4 focus:ring-brand-primary/10 outline-none transition-all text-white font-medium placeholder:text-white/20"
                  placeholder="Search and add board, sensors, displays..."
                />
                <button 
                  type="button"
                  onClick={() => addComponent()}
                  className="bg-brand-primary text-black px-6 rounded-2xl hover:bg-white transition-all font-bold flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                >
                  <Plus size={20} />
                </button>
              </div>

              {/* Autocomplete Dropdown */}
              <AnimatePresence>
                {showDropdown && filteredComponents.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full mt-2 w-full max-h-[220px] overflow-y-auto bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] z-50 flex flex-col p-2"
                  >
                    {filteredComponents.map((comp) => (
                      <button
                        key={comp}
                        type="button"
                        onClick={() => addComponent(comp)}
                        className="text-left px-4 py-3 rounded-xl hover:bg-white/10 transition-colors text-white font-medium flex items-center justify-between group"
                      >
                        {comp}
                        <Plus size={16} className="text-white/30 group-hover:text-white" />
                      </button>
                    ))}
                    {tempComp.trim() && !PREDEFINED_COMPONENTS.find(c => c.toLowerCase() === tempComp.toLowerCase()) && (
                      <button
                        type="button"
                        onClick={() => addComponent()}
                        className="text-left px-4 py-3 rounded-xl hover:bg-brand-primary/10 transition-colors text-brand-primary font-bold flex items-center justify-between"
                      >
                        Add custom: "{tempComp}"
                        <Plus size={16} />
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <AnimatePresence>
                {formData.components.map(comp => (
                  <motion.span 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    key={comp} 
                    className="bg-brand-primary/10 border border-brand-primary/20 px-4 py-2.5 rounded-full text-xs font-bold text-white flex items-center gap-3 group hover:border-brand-primary/50 hover:bg-brand-primary/20 transition-all shadow-[0_0_10px_rgba(255,255,255,0.05)]"
                  >
                    {comp}
                    <button type="button" onClick={() => removeComponent(comp)} className="text-white/40 hover:text-white hover:bg-white/10 rounded-full p-1 transition-colors">
                      <X size={14} />
                    </button>
                  </motion.span>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-web3-outer w-full !scale-100 hover:!scale-[1.01]"
        >
          <div className={`btn-web3-inner-light py-6 group ${loading ? 'opacity-80' : ''}`}>
            <div className="btn-glow" />
            {loading ? (
              <div className="flex flex-col items-center gap-4 w-full px-10">
                <div className="w-full h-1 bg-black/10 rounded-full overflow-hidden relative border border-black/5">
                  <motion.div 
                    className="h-full bg-black shadow-[0_0_10px_rgba(0,0,0,0.2)]"
                    initial={{ width: "0%" }}
                    animate={{ width: `${((loadStep + 1) / loadingSteps.length) * 100}%` }}
                    transition={{ duration: 1.5 }}
                  />
                </div>
                <div className="flex items-center gap-3">
                   <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                   <span className="text-sm font-bold text-black uppercase tracking-[0.2em]">{loadingSteps[loadStep]}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Sparkles size={24} className="text-black" />
                <span className="text-lg font-bold text-black uppercase tracking-widest">Execute AI Generation</span>
              </div>
            )}
          </div>
        </button>
      </form>

      {/* Templates Section */}
      {!loading && (
        <div className="mt-32 space-y-12">
           <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-white/5" />
              <h2 className="text-white/20 uppercase tracking-[0.4em] font-bold text-xs">Standard Templates</h2>
              <div className="h-px flex-1 bg-white/5" />
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-40">
             {PREMADE_PROJECTS.map(project => (
               <div 
                 key={project.id}
                 onClick={() => useTemplate(project)}
                 className="web3-card p-8 group cursor-pointer hover:border-brand-primary/20 hover:bg-brand-primary/5 transition-all flex flex-col"
               >
                 <div className="flex justify-between items-start mb-6">
                    <h3 className="text-xl font-bold text-white group-hover:text-brand-primary transition-colors">{project.title}</h3>
                    <div className="p-2 bg-white/5 rounded-lg text-white/40 group-hover:text-brand-primary transition-colors">
                       <Plus size={16} />
                    </div>
                 </div>
                 <p className="text-white/40 text-sm leading-relaxed mb-6 flex-1">{project.description}</p>
                 <div className="flex flex-wrap gap-2">
                    {project.components.slice(0, 3).map(c => (
                      <span key={c} className="text-[10px] bg-white/5 px-3 py-1 rounded-full text-white/20 font-mono">{c}</span>
                    ))}
                    {project.components.length > 3 && <span className="text-[10px] text-white/10 font-mono mt-1">+{project.components.length - 3} more</span>}
                 </div>
               </div>
             ))}
           </div>
        </div>
      )}
    </div>
  );
};

export default Generate;
