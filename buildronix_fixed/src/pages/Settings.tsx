import React from 'react';
import { Settings as SettingsIcon, Shield, User, Bell, Palette, Globe, HardDrive } from 'lucide-react';
import { motion } from 'motion/react';
import { auth } from '../lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';

const Settings = () => {
  const [user] = useAuthState(auth);

  const sections = [
    {
      title: 'Profile Settings',
      icon: <User className="text-white/40" size={20} />,
      description: 'Manage your appearance and identity in the system.',
      fields: [
        { label: 'Display Name', value: user?.displayName || 'Student Alpha' },
        { label: 'Email', value: user?.email || 'alpha@buildronix.edu' },
        { label: 'Institutional ID', value: user?.uid?.substring(0, 8).toUpperCase() || 'BRX-0000' }
      ]
    },
    {
      title: 'System Aesthetic',
      icon: <Palette className="text-white/40" size={20} />,
      description: 'Customize the visual output and interface theme.',
      fields: [
        { label: 'Primary Theme', value: 'Technical / Dark' },
        { label: 'Glassmorphism Intensity', value: 'High' },
        { label: 'Visualization Engine', value: 'WebGL 2.0 / Three.js' }
      ]
    },
    {
      title: 'AI Architect Preferences',
      icon: <Globe className="text-white/40" size={20} />,
      description: 'Configure how the AI generates project payloads.',
      fields: [
        { label: 'Default Skill Tier', value: 'Beginner' },
        { label: 'Documentation Language', value: 'English (US)' },
        { label: 'Hardware Vendor', value: 'Generic IoT Standard' }
      ]
    }
  ];

  return (
    <div className="p-8 md:p-[60px] max-w-5xl">
      <div className="mb-16">
        <div className="web3-badge mb-6 w-fit">
          <SettingsIcon size={14} className="text-white" />
          System Preferences
        </div>
        <h1 className="text-4xl md:text-5xl font-medium tracking-tighter web3-gradient-text mb-4">Settings</h1>
        <p className="text-white/40 text-lg leading-relaxed">
          Configure your Buildronix environment for optimal project generation and documentation exports.
        </p>
      </div>

      <div className="space-y-8">
        {sections.map((section, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="web3-card p-10"
          >
            <div className="flex items-start gap-6 mb-10">
              <div className="p-3 bg-white/5 rounded-2xl">
                {section.icon}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white uppercase tracking-widest mb-2">{section.title}</h2>
                <p className="text-white/40 text-sm">{section.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-white/5">
              {section.fields.map((field, fIdx) => (
                <div key={fIdx} className="space-y-2">
                  <label className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">{field.label}</label>
                  <div className="bg-white/[0.03] border border-white/5 px-6 py-4 rounded-xl text-white font-medium">
                    {field.value}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}

        <div className="web3-card p-10 border-red-500/10 !bg-red-500/[0.02]">
           <div className="flex items-start gap-6">
              <div className="p-3 bg-red-500/10 rounded-2xl">
                <Shield className="text-red-500" size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-red-500 uppercase tracking-widest mb-2">Danger Zone</h2>
                <p className="text-red-500/60 text-sm mb-8">Irreversible actions related to your account and data.</p>
                <button 
                  onClick={() => auth.signOut()}
                  className="px-8 py-3 bg-red-500 text-white rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
                >
                  Logout from System
                </button>
              </div>
            </div>
        </div>
      </div>

      <div className="mt-20 pt-10 border-t border-white/5 flex justify-between items-center text-white/20">
        <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Buildronix OS v2.4.0</span>
        <div className="flex gap-8 text-[10px] font-bold uppercase tracking-[0.3em]">
           <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
           <a href="#" className="hover:text-white transition-colors">Safety Protocol</a>
        </div>
      </div>
    </div>
  );
};

export default Settings;
