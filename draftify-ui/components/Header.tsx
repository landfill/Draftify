import React from 'react';
import { Screen } from '../types';

interface HeaderProps {
  onNavigate: (screen: Screen) => void;
  activeScreen?: Screen;
}

export const Header: React.FC<HeaderProps> = ({ onNavigate, activeScreen }) => {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between border-b border-slate-200 dark:border-border-dark bg-white/80 dark:bg-[#111c22]/90 backdrop-blur-md px-6 py-4 lg:px-10">
      <div 
        className="flex items-center gap-3 cursor-pointer group" 
        onClick={() => onNavigate(Screen.INPUT)}
      >
        <div className="flex items-center justify-center size-8 rounded bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
          <span className="material-symbols-outlined text-2xl">description</span>
        </div>
        <h2 className="text-slate-900 dark:text-white text-xl font-bold tracking-tight">Draftify</h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Navigation Links for larger screens */}
        <div className="hidden md:flex items-center gap-6 mr-4">
          <button 
            onClick={() => onNavigate(Screen.RESULT)}
            className={`text-sm font-medium transition-colors ${activeScreen === Screen.RESULT ? 'text-primary' : 'text-slate-500 dark:text-text-muted hover:text-slate-900 dark:hover:text-white'}`}
          >
            Dashboard
          </button>
          <button 
             onClick={() => onNavigate(Screen.RECORD)}
             className={`text-sm font-medium transition-colors ${activeScreen === Screen.RECORD ? 'text-primary' : 'text-slate-500 dark:text-text-muted hover:text-slate-900 dark:hover:text-white'}`}
          >
            Record Mode
          </button>
           <button 
             onClick={() => onNavigate(Screen.ERROR)}
             className={`text-sm font-medium transition-colors ${activeScreen === Screen.ERROR ? 'text-primary' : 'text-slate-500 dark:text-text-muted hover:text-slate-900 dark:hover:text-white'}`}
          >
            Debug Error
          </button>
        </div>

        <button className="flex items-center justify-center rounded-full size-10 bg-slate-100 dark:bg-border-dark text-slate-600 dark:text-white hover:bg-slate-200 dark:hover:bg-[#325567] transition-colors">
          <span className="material-symbols-outlined">account_circle</span>
        </button>
      </div>
    </header>
  );
};