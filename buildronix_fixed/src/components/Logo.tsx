import React from 'react';
import { Hexagon, Cpu } from 'lucide-react';

interface LogoProps {
  collapsed?: boolean;
  className?: string;
  onClick?: () => void;
}

export const Logo: React.FC<LogoProps> = ({ collapsed = false, className = '', onClick }) => {
  return (
    <div 
      className={`flex items-center gap-4 group ${onClick ? 'cursor-pointer' : ''} ${className}`} 
      onClick={onClick}
    >
      <div className="relative flex items-center justify-center w-10 h-10 shrink-0">
        <Hexagon className="absolute w-full h-full text-brand-primary/40 group-hover:text-brand-primary group-hover:scale-110 transition-all duration-500" strokeWidth={1} />
        <Cpu size={18} className="text-white group-hover:scale-90 transition-transform duration-500" strokeWidth={1.5} />
        <div className="absolute inset-0 bg-brand-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>
      
      {!collapsed && (
        <div className="flex flex-col justify-center overflow-hidden">
          <span className="text-[22px] font-black tracking-[0.15em] leading-none text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] uppercase">
            Buildronix
          </span>
          <span className="text-[9px] text-brand-primary font-mono tracking-[0.3em] uppercase mt-1.5 opacity-90 drop-shadow-[0_0_4px_rgba(var(--brand-primary),0.5)]">
            Autonomous Systems
          </span>
        </div>
      )}
    </div>
  );
};
