import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, ArrowLeft, Cpu, Box, GraduationCap, Code2, Globe, Shield, Terminal } from 'lucide-react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Logo } from '../components/Logo';

const contentMap: Record<string, any> = {
  '/platform': {
    title: 'The Buildronix Platform',
    subtitle: 'Automated IoT Engineering',
    description: "Buildronix is the world's first fully autonomous hardware architect. We provide an integrated suite of tools designed to take your ideas from raw concept to production-ready circuit blueprints in seconds.",
    features: [
      { icon: <Cpu size={32} />, title: 'AI Hardware Architect', desc: 'Auto-generate circuit logic and full schematic blueprints using our advanced Gemini 2.0 integration, specifically engineered for B.Tech level complexity.' },
      { icon: <Box size={32} />, title: 'Interactive 3D Simulation', desc: 'Visualize your hardware and wiring interactively in an auto-managed WebGL environment. No more guessing if a component will fit.' },
      { icon: <Terminal size={32} />, title: 'Firmware Autopilot', desc: 'Direct compilation of C++ and Python logic explicitly targeted to your microcontroller architecture with automated dependency checking.' }
    ]
  },
  '/solutions': {
    title: 'Solutions & Scaling',
    subtitle: 'Built for Education & Enterprise',
    description: 'Whether you are a university teaching technical engineering or an R&D team rapidly prototyping sensor suites, Buildronix scales securely with your operations.',
    features: [
      { icon: <GraduationCap size={32} />, title: 'University Ready', desc: 'Pre-configured curriculum support with deep-dive technical explanations, method reasoning, and safe "breadboard-first" designs.' },
      { icon: <Globe size={32} />, title: 'Global Cloud Sync', desc: 'All projects are securely serialized and saved on our globally distributed Firebase backend, accessible dynamically from any machine.' },
      { icon: <Shield size={32} />, title: 'Enterprise Grade', desc: 'Strict data partitioning and stateless AI processing ensures your proprietary architectures and IoT models remain entirely private.' }
    ]
  },
  '/documentation': {
    title: 'Developer Documentation',
    subtitle: 'Integrate, Expand, Deploy',
    description: 'Explore our hardware compatibility matrices, simulated environments, and detailed operational guidelines to get the most out of your embedded development.',
    features: [
      { icon: <Code2 size={32} />, title: 'Generation Protocol', desc: 'Learn how to perfectly prompt the AI Architect to generate complex sensor fusion arrays and algorithmic routing.' },
      { icon: <Cpu size={32} />, title: 'Hardware Support Matrix', desc: 'Browse our list of natively supported microcontrollers including ESP32, Arduino Uno/Mega, Raspberry Pi Pico, and STM32 arrays.' },
      { icon: <Box size={32} />, title: 'Simulation Integrations', desc: 'Detailed guides on exporting Buildronix schemas directly into Wokwi or Tinkercad for pre-physical validation.' }
    ]
  }
};

const InfoPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const content = contentMap[location.pathname] || contentMap['/platform'];

  return (
    <div className="relative w-full min-h-screen overflow-hidden font-sans">
      <div className="relative z-20 w-full h-full flex flex-col px-6 md:px-[120px]">
        
        {/* Simple Header */}
        <div className="py-[40px] flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 cursor-pointer group">
            <Logo className="group-hover:scale-105 transition-transform" />
          </Link>
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-white/50 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
            <span className="uppercase tracking-widest text-xs font-bold">Return Home</span>
          </button>
        </div>

        {/* Hero Section */}
        <div className="mt-20 md:mt-32 max-w-[800px]">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block px-4 py-2 bg-white/5 border border-white/10 rounded-full mb-8"
          >
            <span className="text-brand-primary text-xs font-bold tracking-[0.2em] uppercase">{content.subtitle}</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold text-white tracking-tight mb-8"
          >
            {content.title}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-white/60 leading-relaxed font-medium"
          >
            {content.description}
          </motion.p>
        </div>

        {/* Feature Grid */}
        <div className="mt-24 pb-32 grid grid-cols-1 md:grid-cols-3 gap-8">
          {content.features.map((feature: any, idx: number) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + (idx * 0.1) }}
              className="web3-card p-10 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
            >
              <div className="w-16 h-16 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center mb-8 border border-brand-primary/20">
                {feature.icon}
              </div>
              <h3 className="text-2xl font-bold text-white mb-4 tracking-tight">{feature.title}</h3>
              <p className="text-white/50 leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InfoPage;
