import React, { useEffect, useState, useRef } from 'react';
import { Header } from '../components/Header';
import { Screen } from '../types';

interface Props {
  onNavigate: (screen: Screen) => void;
}

export const ProgressScreen: React.FC<Props> = ({ onNavigate }) => {
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Simulate progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => onNavigate(Screen.RESULT), 1000);
          return 100;
        }
        return prev + 1;
      });
    }, 50); // Completes in approx 5 seconds for demo

    return () => clearInterval(interval);
  }, [onNavigate]);

  useEffect(() => {
    // Simulate logs
    const logMessages = [
      { msg: "Initializing layout engine v2.4.0...", type: "INFO", delay: 100 },
      { msg: "Mockup image parsed. Found 4 sections, 12 components.", type: "SUCCESS", delay: 800 },
      { msg: "Generating color palette from image histogram...", type: "INFO", delay: 1500 },
      { msg: "Contrast ratio low for secondary button style (2.4:1). Auto-adjusting.", type: "WARN", delay: 2400 },
      { msg: "UX Writing module: Generating 3 variants per headline.", type: "INFO", delay: 3200 },
      { msg: "Text generation complete.", type: "SUCCESS", delay: 4000 },
      { msg: "Starting PPT Layout mapping for Slide 1...", type: "INFO", delay: 4500 },
      { msg: "Processing Grid structure...", type: "INFO", delay: 4800 },
    ];

    let timeouts: ReturnType<typeof setTimeout>[] = [];

    logMessages.forEach(({ msg, type, delay }) => {
      const timeout = setTimeout(() => {
        const time = new Date().toLocaleTimeString('en-GB', { hour12: false });
        setLogs(prev => [...prev, `<span class="opacity-50">[${time}]</span> <span class="${
          type === 'INFO' ? 'text-primary' : type === 'SUCCESS' ? 'text-green-500' : 'text-amber-500'
        } font-bold">${type}</span> <span class="${type === 'WARN' ? 'text-amber-200' : 'text-slate-300'}">${msg}</span>`]);
      }, delay);
      timeouts.push(timeout);
    });

    return () => timeouts.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="min-h-screen flex flex-col bg-background-light dark:bg-background-dark text-slate-900 dark:text-white">
      <Header onNavigate={onNavigate} activeScreen={Screen.PROGRESS} />
      
      <main className="flex-1 flex flex-col items-center py-6 px-4 md:px-8 overflow-y-auto">
        <div className="w-full max-w-[1024px] flex flex-col gap-6">
          
          {/* Page Heading */}
          <div className="flex flex-wrap items-end justify-between gap-4 pb-2">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">
                  v1.0
                </span>
                <span className="text-slate-500 dark:text-text-muted text-sm font-medium">
                  Generation ID: #8821XQ
                </span>
              </div>
              <h1 className="text-slate-900 dark:text-white text-2xl md:text-[32px] font-bold leading-tight tracking-tight">
                Project: Landing Page MVP
              </h1>
            </div>
            <div className="flex items-center gap-2 bg-white dark:bg-surface-dark px-4 py-2 rounded-lg border border-slate-200 dark:border-border-dark shadow-sm">
              <span className="material-symbols-outlined text-primary animate-pulse">
                timer
              </span>
              <p className="text-slate-700 dark:text-text-muted text-sm font-semibold">
                Estimated remaining: 2 mins
              </p>
            </div>
          </div>

          {/* Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Progress & Current Status */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              {/* Progress Card */}
              <div className="flex flex-col gap-5 p-6 rounded-xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-slate-900 dark:text-white text-lg font-bold">
                    Overall Progress
                  </h3>
                  <span className="text-primary text-xl font-bold">{progress}%</span>
                </div>
                {/* Progress Bar */}
                <div className="relative h-4 w-full rounded-full bg-slate-100 dark:bg-border-dark overflow-hidden">
                  <div
                    className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  >
                    <div
                      className="absolute inset-0 bg-white/20 animate-shimmer w-full h-full"
                      style={{
                        backgroundImage:
                          "linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)",
                      }}
                    ></div>
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-1">
                  <span className="material-symbols-outlined text-primary animate-spin">
                    sync
                  </span>
                  <p className="text-slate-600 dark:text-text-muted text-sm font-medium">
                    Generating PPT Slide Layouts...
                  </p>
                </div>
              </div>

              {/* Visual Preview Placeholder */}
              <div className="flex-1 min-h-[200px] flex flex-col items-center justify-center p-6 rounded-xl bg-slate-100 dark:bg-surface-dark border border-slate-200 dark:border-border-dark border-dashed">
                <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-border-dark flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-slate-400 dark:text-slate-500 text-3xl">
                    image
                  </span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm text-center">
                  Preview will be available<br />
                  after layout generation
                </p>
              </div>
            </div>

            {/* Right Column: Timeline */}
            <div className="lg:col-span-7 p-6 rounded-xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark shadow-sm">
              <h3 className="text-slate-900 dark:text-white text-lg font-bold mb-6">
                Process Phases
              </h3>
              <div className="grid grid-cols-[40px_1fr] gap-x-2">
                {/* Step 1: Completed */}
                <div className="flex flex-col items-center gap-1 pt-1">
                  <span className="material-symbols-outlined text-green-500 text-[24px]">
                    check_circle
                  </span>
                  <div className="w-[2px] bg-green-500/30 h-full min-h-[2rem]"></div>
                </div>
                <div className="flex flex-1 flex-col pb-6">
                  <div className="flex justify-between items-center">
                    <p className="text-slate-900 dark:text-white text-base font-semibold">
                      Image Analysis
                    </p>
                    <span className="text-xs font-mono text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded">
                      DONE
                    </span>
                  </div>
                  <p className="text-slate-500 dark:text-text-muted text-sm mt-1">
                    Extracted colors, typography, and component hierarchy.
                  </p>
                </div>
                
                {/* Step 2: Completed */}
                <div className="flex flex-col items-center gap-1">
                  <div className="w-[2px] bg-green-500/30 h-2"></div>
                  <span className="material-symbols-outlined text-green-500 text-[24px]">
                    check_circle
                  </span>
                  <div className="w-[2px] bg-green-500/30 h-full min-h-[2rem]"></div>
                </div>
                <div className="flex flex-1 flex-col pb-6">
                  <div className="flex justify-between items-center">
                    <p className="text-slate-900 dark:text-white text-base font-semibold">
                      UX Writing Generation
                    </p>
                    <span className="text-xs font-mono text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded">
                      DONE
                    </span>
                  </div>
                  <p className="text-slate-500 dark:text-text-muted text-sm mt-1">
                    Generated 12 copy variations and headlines.
                  </p>
                </div>

                {/* Step 3: In Progress */}
                <div className="flex flex-col items-center gap-1">
                  <div className="w-[2px] bg-green-500/30 h-2"></div>
                  <div className="relative flex items-center justify-center">
                    <div className="absolute w-full h-full bg-primary/20 rounded-full animate-ping"></div>
                    <span className="material-symbols-outlined text-primary text-[24px] relative z-10">
                      sync
                    </span>
                  </div>
                  <div className="w-[2px] bg-slate-200 dark:bg-border-dark h-full min-h-[2rem]"></div>
                </div>
                <div className="flex flex-1 flex-col pb-6">
                  <div className="flex justify-between items-center">
                    <p className="text-primary text-base font-bold">
                      PPT Slide Layout
                    </p>
                    <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded animate-pulse">
                      RUNNING
                    </span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                    Mapping components to PowerPoint grid system...
                  </p>
                </div>

                {/* Step 4: Pending */}
                <div className="flex flex-col items-center gap-1 pb-1">
                  <div className="w-[2px] bg-slate-200 dark:bg-border-dark h-2"></div>
                  <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-[24px]">
                    radio_button_unchecked
                  </span>
                </div>
                <div className="flex flex-1 flex-col pt-1">
                  <div className="flex justify-between items-center">
                    <p className="text-slate-400 dark:text-slate-500 text-base font-medium">
                      Final Export
                    </p>
                    <span className="text-xs font-mono text-slate-400 dark:text-slate-600 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                      WAITING
                    </span>
                  </div>
                  <p className="text-slate-400 dark:text-slate-600 text-sm mt-1">
                    Merging assets and generating download link.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section: Logs & Actions */}
          <div className="flex flex-col rounded-xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-border-dark bg-slate-50 dark:bg-[#152028]">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-slate-500 dark:text-slate-400">
                  terminal
                </span>
                <h3 className="text-slate-900 dark:text-white text-base font-bold">
                  System Logs
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  Live
                </span>
              </div>
            </div>
            {/* Terminal Window */}
            <div 
                ref={logContainerRef}
                className="bg-[#0f171c] p-4 h-[200px] overflow-y-auto font-mono text-sm leading-relaxed border-b border-slate-200 dark:border-border-dark"
            >
                <div className="flex flex-col gap-1">
                    {logs.map((log, i) => (
                        <div key={i} className="flex gap-3" dangerouslySetInnerHTML={{ __html: log }} />
                    ))}
                </div>
            </div>
            
            {/* Footer Action */}
            <div className="px-6 py-4 flex justify-end bg-slate-50 dark:bg-[#152028]">
              <button 
                onClick={() => onNavigate(Screen.INPUT)}
                className="group flex cursor-pointer items-center justify-center rounded-lg h-10 border border-red-200 dark:border-red-900/50 bg-white dark:bg-red-950/10 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 gap-2 text-sm font-bold leading-normal px-6 transition-all"
              >
                <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">
                  cancel
                </span>
                <span>중단 (Cancel Generation)</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};