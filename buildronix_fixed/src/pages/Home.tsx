import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Sparkles, Menu, X, ArrowRight, Github, Cpu, Binary, LayoutTemplate, Zap, FileText, Blocks, MonitorPlay, ShieldCheck, Terminal, Droplets, Shield, Wind } from 'lucide-react';
import { Logo } from '../components/Logo';
import { signInWithGoogle, auth } from '../lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useNavigate, Link } from 'react-router-dom';
import { PREMADE_PROJECTS } from '../constants/templates';

const ActionButton = ({ onClick, label, variant = 'dark' }: { onClick?: () => void, label: string, variant?: 'dark' | 'light' }) => {
  const isDark = variant === 'dark';
  
  return (
    <button 
      onClick={onClick}
      className={`relative group cursor-pointer rounded-full p-[0.6px] bg-white transition-transform hover:scale-105 active:scale-95 outline-none`}
    >
      {/* Outer border container */}
      <div className={`relative rounded-full overflow-hidden ${isDark ? 'bg-black' : 'bg-white'} px-[29px] py-[11px]`}>
        {/* Glow Streak effect at the top */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[2px] bg-gradient-to-r from-transparent via-white/40 to-transparent blur-[1px] -translate-y-[1px]" />
        
        <span className={`text-[14px] font-medium whitespace-nowrap flex items-center gap-2 ${isDark ? 'text-white' : 'text-black'}`}>
          {label}
        </span>
      </div>
    </button>
  );
};

const NavLink = ({ label, href }: { label: string, href: string }) => (
  <Link to={href} className="flex items-center gap-[6px] cursor-pointer group py-2">
    <span className="text-white/80 text-[14px] font-medium group-hover:text-white transition-colors">
      {label}
    </span>
  </Link>
);

const Home = () => {
  const [user, loading] = useAuthState(auth);
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Map icon strings to components
  const IconMap: any = {
    Droplets: <Droplets size={24} />,
    Shield: <Shield size={24} />,
    Wind: <Wind size={24} />,
    Zap: <Zap size={24} />
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Navigate once Firebase confirms auth state
  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading]);

  const handleCTA = async () => {
    if (user) {
      navigate('/dashboard');
      return;
    }
    try {
      const result = await signInWithGoogle();
      // navigation handled by useEffect above once auth state updates
      if (!result) console.log('Login cancelled.');
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  return (
    <div className="relative w-full min-h-screen overflow-x-hidden bg-transparent font-sans scroll-smooth">
      {/* Content Layer */}
      <div className="relative z-20 w-full flex flex-col">
        
        {/* Navbar */}
        <nav className={`fixed top-0 left-0 w-full z-50 flex items-center justify-between px-6 md:px-[120px] py-[20px] transition-all duration-300 ${scrolled ? 'bg-black/60 backdrop-blur-md border-b border-white/10 py-[15px]' : 'bg-transparent'}`}>
          <div className="flex items-center">
            {/* Logo */}
            <Logo onClick={() => window.scrollTo(0, 0)} className="group-hover:scale-105 transition-transform" />

            {/* Nav Links - Desktop only */}
            <div className="hidden md:flex items-center gap-[36px] ml-[60px]">
              <NavLink label="Platform" href="/platform" />
              <NavLink label="Solutions" href="/solutions" />
              <NavLink label="Documentation" href="/documentation" />
            </div>
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-6">
            <a href="https://github.com" target="_blank" rel="noreferrer" className="text-white/60 hover:text-white transition-colors">
              <Github size={20} />
            </a>
            <ActionButton onClick={handleCTA} label={loading ? "..." : (user ? "Go to Dashboard" : "Sign In Connect")} variant="dark" />
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden text-white p-2 outline-none"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </nav>

        {/* Mobile View Menu Overlay */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed inset-0 z-40 bg-black/95 backdrop-blur-xl pt-[80px] px-6 flex flex-col md:hidden"
            >
              <div className="flex flex-col gap-6 text-2xl font-medium mt-10">
                <Link to="/platform" onClick={() => setMobileMenuOpen(false)} className="text-white/80 hover:text-white transition-colors border-b border-white/10 pb-4">Platform</Link>
                <Link to="/solutions" onClick={() => setMobileMenuOpen(false)} className="text-white/80 hover:text-white transition-colors border-b border-white/10 pb-4">Solutions</Link>
                <Link to="/documentation" onClick={() => setMobileMenuOpen(false)} className="text-white/80 hover:text-white transition-colors border-b border-white/10 pb-4">Documentation</Link>
                
                <div className="mt-8">
                  <button 
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleCTA();
                    }}
                    className="w-full bg-white text-black py-4 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-white/90 active:scale-95 transition-all"
                  >
                    {loading ? "..." : (user ? "Open Dashboard" : "Sign In to Buildronix")}
                    <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hero Content */}
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6 min-h-screen relative overflow-hidden">
          {/* Animated Background Orbs */}
          <div className="absolute top-1/4 -left-24 w-96 h-96 bg-brand-primary/10 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute bottom-1/4 -right-24 w-96 h-96 bg-blue-500/10 blur-[120px] rounded-full animate-pulse delay-700" />
          
          <div className="pt-[140px] md:pt-[200px] mb-[102px] flex flex-col items-center gap-[40px] relative z-10">
            
            {/* Badge Pill */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-[20px] cursor-default"
            >
              <div className="w-[4px] h-[4px] rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
              <span className="text-[13px] font-medium">
                <span className="text-white/60">Powered by Gemini 2.0 </span>
                <span className="text-white">Now in Technical Preview</span>
              </span>
            </motion.div>

            {/* Heading with Gradient Text Clip */}
            <motion.h1 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ 
                duration: 0.8,
                ease: [0.16, 1, 0.3, 1]
              }}
              className="max-w-[800px] text-[36px] md:text-[64px] font-medium leading-[1.1] tracking-tight bg-clip-text text-transparent p-2"
              style={{
                backgroundImage: 'linear-gradient(144.5deg, #FFFFFF 28%, rgba(255,255,255,0.1) 115%)',
                WebkitBackgroundClip: 'text',
              }}
            >
              Industrial IoT Engineering at Human Pace
            </motion.h1>

            {/* Subtitle */}
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="max-w-[620px] text-[16px] md:text-[18px] font-normal text-white/70 leading-relaxed -mt-[16px]"
            >
              Buildronix provides production-grade firmware, 3D architectural blueprints, and master build guidance. Conceptualize, design, and document advanced IoT systems in seconds.
            </motion.p>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-8"
            >
              <ActionButton onClick={handleCTA} label={loading ? "Initializing..." : (user ? "Launch Console" : "Start Building Now")} variant="light" />
            </motion.div>
          </div>
        </div>

        {/* Template Showcase Section */}
        <div className="w-full bg-black/40 py-32 border-t border-white/5">
          <div className="max-w-[1200px] mx-auto px-6">
            <div className="flex justify-between items-end mb-16">
              <div>
                <h2 className="text-3xl md:text-5xl font-medium tracking-tight text-white mb-4">Solution Blueprints</h2>
                <p className="text-white/40 text-lg">Explore architectural frameworks for high-impact IoT challenges.</p>
              </div>
              <Link to="/generate" className="hidden md:flex items-center gap-2 text-white/60 hover:text-white transition-all group font-bold uppercase tracking-widest text-xs">
                Browse All <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {PREMADE_PROJECTS.map((project, i) => (
                <motion.div 
                  key={project.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  whileHover={{ 
                    y: -12,
                    scale: 1.02,
                    borderColor: 'rgba(255, 255, 255, 0.4)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
                  }}
                  viewport={{ once: true }}
                  transition={{ 
                    delay: i * 0.1,
                    type: "spring",
                    stiffness: 300,
                    damping: 20
                  }}
                  className="web3-card p-8 flex flex-col group cursor-pointer h-full border-white/5 hover:border-white/20 transition-all"
                  onClick={handleCTA}
                >
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-brand-primary mb-8 group-hover:scale-110 transition-transform">
                    {IconMap[project.icon]}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3 group-hover:web3-gradient-text transition-all">{project.title}</h3>
                  <p className="text-white/40 text-sm leading-relaxed mb-6 flex-1">{project.description}</p>
                  
                  <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest">{project.difficulty}</span>
                    <span className="text-[10px] font-mono text-brand-primary/60 uppercase">{project.time}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="w-full relative bg-black/60 backdrop-blur-2xl border-t border-white/5 py-24 md:py-32">
          {/* Animated Stats Ribbon */}
          <div className="absolute top-0 left-0 w-full overflow-hidden border-b border-white/5 bg-brand-primary/[0.02]">
            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              animate={{ x: [0, -1200] }}
              transition={{ 
                x: { repeat: Infinity, duration: 30, ease: "linear" },
                opacity: { duration: 1 }
              }}
              className="flex whitespace-nowrap py-4"
            >
              {[...Array(3)].map((_, idx) => (
                <div key={idx} className="flex gap-16 px-8 items-center">
                  <div className="flex gap-3 items-center"><span className="text-white font-mono font-bold text-xl uppercase">Gemini 2.0</span><span className="text-white/40 uppercase tracking-widest text-[10px] font-bold">Real-time Inference</span></div>
                  <div className="flex gap-3 items-center"><span className="text-white font-mono font-bold text-xl uppercase">Automated</span><span className="text-white/40 uppercase tracking-widest text-[10px] font-bold">Firmware Schematics</span></div>
                  <div className="flex gap-3 items-center"><span className="text-white font-mono font-bold text-xl uppercase">3D Mapping</span><span className="text-white/40 uppercase tracking-widest text-[10px] font-bold">System Architecture</span></div>
                  <div className="flex gap-3 items-center"><span className="text-white font-mono font-bold text-xl uppercase">Industrial</span><span className="text-white/40 uppercase tracking-widest text-[10px] font-bold">IoT Blueprints</span></div>
                  <div className="flex gap-3 items-center"><span className="text-white font-mono font-bold text-xl uppercase">Neural Trace</span><span className="text-white/40 uppercase tracking-widest text-[10px] font-bold">Hardware Debugging</span></div>
                </div>
              ))}
            </motion.div>
          </div>

          <div className="max-w-[1200px] mx-auto px-6 mt-16">
            <div className="text-center mb-20">
              <h2 className="text-3xl md:text-5xl font-medium tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-white to-white/40 mb-6">
                Automate The Undifferentiated
              </h2>
              <p className="text-lg text-white/50 max-w-[600px] mx-auto">
                Stop wiring breadboards blindly. Buildronix generates the schematic, the firmware, and the BOM automatically.
              </p>
            </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: <Binary size={24} />, title: "Logic Generation", desc: "AI-driven mapping of sensor inputs to actuator outputs with zero boilerplate." },
              { icon: <Blocks size={24} />, title: "3D Virtual Sim", desc: "Interactive WebGL environment to place and test components before ordering parts." },
              { icon: <FileText size={24} />, title: "Instant Docs", desc: "Auto-generated technical write-ups, PDF exports, and Viva Voce preparation guides." },
              { icon: <MonitorPlay size={24} />, title: "Firmware Compiler", desc: "Generates secure C++ and MicroPython code tailored for your exact architecture." },
              { icon: <Zap size={24} />, title: "Real-time Debug", desc: "AI assistant that analyzes stack traces and serial output to isolate hardware faults." },
              { icon: <ShieldCheck size={24} />, title: "Production Ready", desc: "Outputs standard schematic formats ready for PCB routing and mass manufacturing." }
          ].map((feat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ 
                scale: 1.05,
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                borderColor: 'rgba(255, 255, 255, 0.2)'
              }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ 
                delay: i * 0.1,
                type: "spring",
                stiffness: 400,
                damping: 30
              }}
              className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 transition-all group"
            >
                <div className="p-3 bg-white/5 rounded-lg w-fit text-brand-primary mb-6 group-hover:scale-110 transition-transform">
                  {feat.icon}
                </div>
                <h3 className="text-xl font-medium text-white mb-3">{feat.title}</h3>
                <p className="text-white/50 leading-relaxed text-sm">
                  {feat.desc}
                </p>
              </motion.div>
            ))}
          </div>
          </div>
        </div>

        {/* Deep Dive Section */}
        <div className="w-full relative py-32 border-t border-white/5 bg-black/40">
          <div className="max-w-[1200px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-bold uppercase tracking-widest mb-6">
                <Terminal size={14} /> Workflow Console
              </div>
              <h2 className="text-3xl md:text-5xl font-medium tracking-tight text-white mb-6 leading-tight">
                From pure idea to <br/><span className="text-white/40">working hardware.</span>
              </h2>
              <div className="space-y-6 mt-10">
                {[
                  { step: "01", title: "Describe your system.", desc: "Use natural language to outline the sensors, microcontrollers, and logic you need." },
                  { step: "02", title: "Review the architecture.", desc: "Buildronix generates the schematic, pinpointing the right pins and voltages." },
                  { step: "03", title: "Simulate & flash.", desc: "Test the logic virtually, then copy the auto-generated code and flash your physical board." }
                ].map((s, i) => (
                  <div key={i} className="flex gap-6">
                    <div className="text-brand-primary font-mono text-xl font-bold pt-1">{s.step}</div>
                    <div>
                      <h4 className="text-lg font-bold text-white mb-2">{s.title}</h4>
                      <p className="text-white/50">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              animate={{ 
                y: [0, -10, 0],
              }}
              transition={{
                y: { repeat: Infinity, duration: 6, ease: "easeInOut" },
                default: { duration: 0.8 }
              }}
              className="relative aspect-square md:aspect-[4/3] rounded-2xl overflow-hidden border border-white/10 bg-black/50 group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/10 to-transparent group-hover:from-brand-primary/20 transition-all duration-700" />
              <div className="absolute top-4 left-4 right-4 h-8 flex items-center gap-2 border-b border-white/10 pb-4">
                <div className="w-3 h-3 rounded-full bg-white/20" />
                <div className="w-3 h-3 rounded-full bg-white/20" />
                <div className="w-3 h-3 rounded-full bg-white/20" />
              </div>
              <div className="absolute top-16 left-4 right-4 bottom-4 flex gap-4">
                <div className="w-1/3 h-full rounded border border-white/5 bg-white/[0.02]" />
                <div className="w-2/3 flex flex-col gap-4">
                  <div className="w-full h-1/2 rounded border border-white/5 bg-white/[0.02]" />
                  <div className="w-full h-1/2 rounded border border-brand-primary/20 bg-brand-primary/5 flex items-center justify-center">
                      <Cpu size={64} className="text-brand-primary/50" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Bottom CTA & Footer */}
        <div className="w-full border-t border-white/10 pt-32 bg-black">
          <div className="max-w-[800px] mx-auto text-center px-6 mb-32">
            <h2 className="text-4xl md:text-6xl font-medium tracking-tight text-white mb-8">
              Ready to accelerate <br/>your engineering?
            </h2>
            <ActionButton onClick={handleCTA} label={loading ? "..." : (user ? "Go to Dashboard" : "Sign In & Start Building")} variant="light" />
          </div>
          
          <footer className="border-t border-white/5 py-12 px-6 lg:px-24 flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-white/40">
            <div className="flex items-center gap-2">
              <Logo collapsed className="scale-75 origin-left opacity-50 grayscale" />
              <span className="font-medium tracking-widest uppercase ml-4">© 2026 Buildronix</span>
            </div>
            <div className="flex gap-8 font-medium">
              <a href="#" className="hover:text-white transition-colors">Twitter</a>
              <a href="#" className="hover:text-white transition-colors">GitHub</a>
              <a href="#" className="hover:text-white transition-colors">Discord</a>
            </div>
          </footer>
        </div>

      </div>
    </div>
  );
};

export default Home;
