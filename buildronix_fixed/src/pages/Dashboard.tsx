import React from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollection } from 'react-firebase-hooks/firestore';
import { auth, db } from '../lib/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { Plus, Clock, Cpu, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

const Dashboard = () => {
  const [user] = useAuthState(auth);
  const projectsRef = collection(db, 'projects');
  const q = user ? query(projectsRef, where('userId', '==', user.uid), orderBy('createdAt', 'desc')) : null;
  const [value, loading] = useCollection(q);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  const projects = value?.docs.map(doc => ({ id: doc.id, ...doc.data() })) || [];

  return (
    <div className="p-8 md:p-[60px] max-w-7xl">
      <div className="flex justify-between items-end mb-16">
        <div>
          <div className="web3-badge mb-4 w-fit">
            <div className="web3-dot" />
            Project Archive
          </div>
          <h1 className="text-4xl md:text-5xl font-medium tracking-tighter web3-gradient-text">My Built Projects</h1>
        </div>
        <Link to="/generate" className="btn-web3-outer">
          <div className="btn-web3-inner-light group px-8 py-3">
            <div className="btn-glow" />
            <Plus size={18} className="text-black mr-2" />
            <span className="text-sm font-semibold text-black">New System</span>
          </div>
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="web3-card p-[100px] flex flex-col items-center text-center">
          <div className="bg-white/5 p-8 rounded-full mb-8">
            <Cpu size={48} className="text-white/20" />
          </div>
          <h2 className="text-2xl font-medium mb-4">No systems detected</h2>
          <p className="text-white/40 max-w-sm mb-12 leading-relaxed text-sm">
            Ready to build something amazing? Start your first IoT project with our AI architect.
          </p>
          <Link to="/generate" className="btn-web3-outer">
            <div className="btn-web3-inner-dark group px-8 py-3 ring-1 ring-white/10">
              <span className="text-sm font-medium text-white">Initialize Project</span>
            </div>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project: any, i) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link to={`/project/${project.id}`}>
                <div className="web3-card group p-8 min-h-[260px] flex flex-col">
                  <div className="flex justify-between items-start mb-10">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
                      {project.skillLevel}
                    </span>
                    <div className="flex gap-2">
                        {project.circuit?.layout3D && (
                           <div className="px-2 py-1 rounded bg-brand-primary/10 text-brand-primary text-[9px] font-bold uppercase tracking-widest border border-brand-primary/20">
                              3D Ready
                           </div>
                        )}
                        <div className="p-2 rounded-full bg-white/5 text-white/20 group-hover:text-white transition-colors">
                           <ChevronRight size={18} />
                        </div>
                    </div>
                  </div>
                  
                  <h3 className="text-2xl font-medium mb-4 tracking-tight group-hover:web3-gradient-text transition-all line-clamp-1">{project.title}</h3>
                  <p className="text-sm text-white/40 mb-auto line-clamp-2 leading-relaxed">
                    {project.description}
                  </p>
                  
                  <div className="flex items-center gap-6 pt-10 mt-6 border-t border-white/5 text-[11px] text-white/40 font-bold uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="opacity-50" />
                      {new Date(project.createdAt?.seconds * 1000).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2">
                      <Cpu size={14} className="opacity-50" />
                      {project.components?.length || 0} Components
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
