import React from 'react';
import { Screen } from '../types';

interface Props {
  onNavigate: (screen: Screen) => void;
}

export const RecordScreen: React.FC<Props> = ({ onNavigate }) => {
  return (
    <div className="relative w-full h-screen overflow-hidden bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-display">
      {/* BACKGROUND: MOCK TARGET WEBSITE */}
      <div
        aria-hidden="true"
        className="relative w-full h-full overflow-y-auto bg-white dark:bg-gray-900 select-none pointer-events-none"
      >
        {/* Mock Navbar */}
        <nav className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-8 py-4 flex justify-between items-center sticky top-0 z-10 opacity-60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg"></div>
            <span className="font-bold text-xl tracking-tight text-gray-900 dark:text-white">
              TargetApp
            </span>
          </div>
          <div className="flex gap-6 text-sm font-medium text-gray-500 dark:text-gray-400">
            <span>Features</span>
            <span>Pricing</span>
            <span>Enterprise</span>
            <span>Docs</span>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300">
              Log in
            </button>
            <button className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg">
              Sign up
            </button>
          </div>
        </nav>

        {/* Mock Hero Section */}
        <div className="max-w-7xl mx-auto px-8 py-20 text-center opacity-80">
          <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-6">
            Build software <span className="text-indigo-600">faster</span> than ever.
          </h1>
          <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-10">
            The ultimate platform for developers to deploy, scale, and monitor their
            applications with zero configuration.
          </p>
          
          {/* Highlighted Element Simulating User Interaction */}
          <div className="relative inline-block group pointer-events-auto">
            <div className="absolute -inset-1 rounded-lg border-2 border-primary z-10 pointer-events-none flex items-start justify-start">
              <span className="bg-primary text-white text-[10px] px-1.5 py-0.5 rounded-sm font-mono absolute -top-5 left-0">
                button#get-started
              </span>
            </div>
            <button className="relative px-8 py-4 text-base font-bold text-white bg-indigo-600 rounded-lg shadow-lg">
              Get Started Free
            </button>
          </div>
          <button className="ml-4 px-8 py-4 text-base font-bold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 rounded-lg">
            View Demo
          </button>
        </div>

        {/* Mock Feature Grid */}
        <div className="max-w-7xl mx-auto px-8 py-10 grid grid-cols-3 gap-8 opacity-60">
            {[
                { title: 'Analytics', color: 'blue', desc: 'Real-time data processing.' },
                { title: 'Security', color: 'green', desc: 'Enterprise-grade security.' },
                { title: 'Automation', color: 'purple', desc: 'Automate workflows.' }
            ].map((feature, idx) => (
                <div key={idx} className="p-6 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <div className={`w-12 h-12 bg-${feature.color}-100 dark:bg-${feature.color}-900 rounded-lg mb-4`}></div>
                    <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                    <p className="text-gray-500 text-sm">{feature.desc}</p>
                </div>
            ))}
        </div>
      </div>

      {/* OVERLAY UI: CONTROL BAR */}
      <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 duration-500">
        <div className="flex items-center gap-1 bg-[#111c22]/95 backdrop-blur-md border border-gray-700 rounded-full shadow-2xl p-2 pr-3 pl-6">
          <div className="cursor-grab text-gray-500 hover:text-white mr-2 flex items-center">
            <span className="material-symbols-outlined text-lg">drag_indicator</span>
          </div>
          <div className="flex items-center gap-3 border-r border-gray-700 pr-6 mr-2">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse-red shadow-[0_0_8px_rgba(239,68,68,0.6)]"></div>
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Rec
              </span>
            </div>
            <div className="font-mono text-xl font-medium text-white tabular-nums tracking-tight">
              00:03:12
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="group flex items-center gap-2 h-10 px-4 bg-primary hover:bg-primary/90 text-white text-sm font-bold rounded-full transition-all active:scale-95 shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-[20px]">camera_alt</span>
              <span>캡처</span>
            </button>
            <button 
                onClick={() => onNavigate(Screen.RESULT)}
                className="group flex items-center justify-center w-10 h-10 bg-[#233c48] hover:bg-green-600 text-white rounded-full transition-all active:scale-95 hover:shadow-lg hover:shadow-green-500/20" title="완료"
            >
              <span className="material-symbols-outlined text-[22px] group-hover:scale-110 transition-transform">
                check
              </span>
            </button>
            <button 
                onClick={() => onNavigate(Screen.INPUT)}
                className="group flex items-center justify-center w-10 h-10 bg-transparent hover:bg-red-500/20 text-gray-400 hover:text-red-500 rounded-full transition-all active:scale-95" title="취소"
            >
              <span className="material-symbols-outlined text-[22px]">close</span>
            </button>
          </div>
        </div>
        <div className="absolute top-full mt-3 left-0 w-full text-center">
          <p className="text-[10px] text-gray-400 bg-black/60 px-2 py-1 rounded inline-block backdrop-blur-sm">
            Press <span className="font-mono text-white">Esc</span> to pause
          </p>
        </div>
      </div>

      {/* OVERLAY UI: RIGHT SIDEBAR */}
      <div className="fixed top-4 right-4 bottom-4 w-80 bg-[#111c22]/95 backdrop-blur-xl border border-gray-800 rounded-2xl shadow-2xl flex flex-col z-40 overflow-hidden transform transition-transform translate-x-0">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 bg-[#0f171c]/50">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">video_library</span>
            <h2 className="text-white text-sm font-semibold tracking-wide">
              Session Logs
            </h2>
          </div>
          <button className="text-gray-500 hover:text-white transition-colors">
            <span className="material-symbols-outlined text-lg">dock_to_right</span>
          </button>
        </div>
        <div className="flex p-2 gap-1 border-b border-gray-800 bg-[#0f171c]/30">
          <button className="flex-1 py-1.5 px-3 rounded-lg bg-[#233c48] text-white text-xs font-medium flex items-center justify-center gap-2 transition-all">
            <span className="material-symbols-outlined text-[16px]">image</span>
            Screens (4)
          </button>
          <button className="flex-1 py-1.5 px-3 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white text-xs font-medium flex items-center justify-center gap-2 transition-all">
            <span className="material-symbols-outlined text-[16px]">terminal</span>
            Actions
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Latest Captures
              </h3>
              <span className="text-[10px] text-primary cursor-pointer hover:underline">
                Select all
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {[1, 2, 3].map((item) => (
                 <div key={item} className="group relative rounded-lg border border-gray-700 bg-[#1c2b36] overflow-hidden hover:border-primary/50 transition-colors">
                    <div className="aspect-video w-full bg-cover bg-center" style={{ backgroundImage: `url('https://picsum.photos/400/225?random=${item}')` }}></div>
                    <div className="p-3 flex items-start justify-between">
                        <div>
                        <p className="text-white text-sm font-medium leading-none mb-1">Homepage</p>
                        <p className="text-gray-500 text-[10px] font-mono">1920x1080 • 00:05</p>
                        </div>
                    </div>
                    <div className="absolute top-2 left-2 bg-black/50 backdrop-blur-sm px-1.5 py-0.5 rounded text-[10px] font-mono text-white">#{item}</div>
                 </div>
              ))}
            </div>
          </div>
          <div className="space-y-2 pt-2 border-t border-gray-800">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              Live Activity
            </h3>
            <div className="font-mono text-[10px] space-y-1.5">
              <div className="flex gap-2 text-gray-300">
                <span className="text-gray-500">03:10</span>
                <span className="text-green-400">click</span>
                <span className="truncate text-gray-400">button#get-started</span>
              </div>
              <div className="flex gap-2 text-gray-300">
                <span className="text-gray-500">03:08</span>
                <span className="text-blue-400">scroll</span>
                <span className="truncate text-gray-400">window (y: 1200)</span>
              </div>
            </div>
          </div>
        </div>
        <div className="p-3 bg-[#111c22] border-t border-gray-800 text-center">
          <p className="text-[10px] text-gray-500">Draftify Recorder v1.0.2 • Connected</p>
        </div>
      </div>
    </div>
  );
};