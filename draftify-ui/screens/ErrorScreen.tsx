import React from 'react';
import { Header } from '../components/Header';
import { Screen } from '../types';

interface Props {
  onNavigate: (screen: Screen) => void;
}

export const ErrorScreen: React.FC<Props> = ({ onNavigate }) => {
  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col bg-background-light dark:bg-background-dark text-slate-900 dark:text-white font-display overflow-x-hidden selection:bg-primary/30">
      <Header onNavigate={onNavigate} activeScreen={Screen.ERROR} />
      
      <main className="layout-container flex h-full grow flex-col">
        <div className="px-4 md:px-10 lg:px-40 flex flex-1 justify-center py-5">
          <div className="layout-content-container flex flex-col max-w-[960px] flex-1 gap-6">
            {/* Breadcrumb / Back Link */}
            <div className="px-4 pt-4">
              <button 
                onClick={() => onNavigate(Screen.INPUT)}
                className="inline-flex items-center gap-2 text-text-muted hover:text-white text-sm font-medium transition-colors"
              >
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                Back to Project Dashboard
              </button>
            </div>

            {/* Page Heading & Status */}
            <div className="flex flex-wrap justify-between gap-6 px-4">
              <div className="flex flex-col gap-3 max-w-2xl">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-red-500 text-4xl">
                    error
                  </span>
                  <h1 className="text-slate-900 dark:text-white text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">
                    Generation Failed
                  </h1>
                </div>
                <p className="text-slate-500 dark:text-text-muted text-base font-normal leading-normal max-w-xl">
                  We encountered a critical issue during the{' '}
                  <span className="text-slate-900 dark:text-white font-medium">HTML Parsing Phase</span>. The
                  process was terminated to prevent data corruption. Please review the details
                  below.
                </p>
              </div>
              {/* Quick Status Card */}
              <div className="flex flex-col justify-center min-w-[200px] gap-2 rounded-lg p-4 bg-slate-200 dark:bg-border-dark/30 border border-slate-300 dark:border-border-dark/50">
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-red-500 animate-pulse"></div>
                  <p className="text-slate-500 dark:text-text-muted text-xs font-bold uppercase tracking-wider">
                    Current Status
                  </p>
                </div>
                <p className="text-slate-900 dark:text-white text-xl font-bold leading-tight">
                  Critical Error
                </p>
                <p className="text-slate-500 dark:text-text-muted text-xs">Phase 3 of 5 Failed</p>
              </div>
            </div>

            {/* Split Layout: Error Details & Guidelines */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-4">
              {/* Left: Technical Details */}
              <div className="lg:col-span-2 flex flex-col gap-4">
                <div className="rounded-xl border border-slate-200 dark:border-border-dark bg-white dark:bg-background-dark overflow-hidden">
                  <div className="bg-slate-100 dark:bg-border-dark/20 px-6 py-4 border-b border-slate-200 dark:border-border-dark flex justify-between items-center">
                    <h3 className="text-slate-900 dark:text-white text-lg font-bold">
                      Technical Diagnostics
                    </h3>
                    <span className="px-2 py-1 rounded bg-slate-200 dark:bg-border-dark text-xs text-slate-700 dark:text-white font-mono">
                      ID: #9283-GEN
                    </span>
                  </div>
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                    <div className="flex flex-col gap-1">
                      <p className="text-slate-500 dark:text-text-muted text-sm">Error Code</p>
                      <p className="text-slate-900 dark:text-white text-base font-mono">ERR-GEN-404</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className="text-slate-500 dark:text-text-muted text-sm">Timestamp</p>
                      <p className="text-slate-900 dark:text-white text-base">
                        Oct 24, 2023 • 14:32:05 UTC
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 md:col-span-2">
                      <p className="text-slate-500 dark:text-text-muted text-sm">Reason</p>
                      <p className="text-slate-900 dark:text-white text-base leading-relaxed">
                        The target URL provided could not be accessed within the 30s timeout
                        limit. This usually indicates the server is unreachable or blocking
                        our scraper requests.
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 md:col-span-2">
                      <p className="text-slate-500 dark:text-text-muted text-sm">Target URL</p>
                      <a
                        className="text-primary hover:underline text-base truncate block"
                        href="#"
                      >
                        https://staging.internal-app.com/dashboard/v2/overview
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Troubleshooting Guidelines */}
              <div className="lg:col-span-1 flex flex-col gap-4">
                <div className="rounded-xl border border-slate-200 dark:border-border-dark bg-white dark:bg-surface-dark/50 h-full">
                  <div className="p-5 border-b border-slate-200 dark:border-border-dark">
                    <h3 className="text-slate-900 dark:text-white text-lg font-bold flex items-center gap-2">
                      <span className="material-symbols-outlined text-yellow-500">
                        lightbulb
                      </span>
                      Suggested Actions
                    </h3>
                  </div>
                  <div className="p-5 flex flex-col gap-4">
                    <div className="flex gap-3 items-start">
                      <div className="size-6 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 text-xs font-bold">
                        1
                      </div>
                      <div className="flex flex-col gap-1">
                        <p className="text-slate-900 dark:text-white text-sm font-medium">
                          Check URL Accessibility
                        </p>
                        <p className="text-slate-500 dark:text-text-muted text-xs leading-normal">
                          Ensure the link is public and not behind a VPN or firewall.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3 items-start">
                      <div className="size-6 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 text-xs font-bold">
                        2
                      </div>
                      <div className="flex flex-col gap-1">
                        <p className="text-slate-900 dark:text-white text-sm font-medium">
                          Verify Robots.txt
                        </p>
                        <p className="text-slate-500 dark:text-text-muted text-xs leading-normal">
                          Make sure your site allows automated agents/crawlers.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3 items-start">
                      <div className="size-6 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 text-xs font-bold">
                        3
                      </div>
                      <div className="flex flex-col gap-1">
                        <p className="text-slate-900 dark:text-white text-sm font-medium">
                          Retry Generation
                        </p>
                        <p className="text-slate-500 dark:text-text-muted text-xs leading-normal">
                          Transient network issues may resolve on a second attempt.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="px-5 pb-5 mt-auto">
                    <a
                      className="text-primary text-xs font-medium hover:underline flex items-center gap-1"
                      href="#"
                    >
                      View full troubleshooting guide
                      <span className="material-symbols-outlined text-[16px]">
                        open_in_new
                      </span>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* System Log Console */}
            <div className="px-4">
              <div className="flex flex-col rounded-xl overflow-hidden border border-slate-200 dark:border-border-dark bg-[#0b1216]">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-border-dark bg-slate-100 dark:bg-border-dark/20">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-slate-500 dark:text-text-muted">
                      terminal
                    </span>
                    <p className="text-slate-900 dark:text-white text-sm font-bold tracking-tight">
                      System Execution Log
                    </p>
                  </div>
                  <button className="group flex items-center gap-2 px-3 py-1.5 rounded hover:bg-white/5 transition-colors text-slate-500 dark:text-text-muted hover:text-white">
                    <span className="material-symbols-outlined text-lg group-hover:text-primary">
                      content_copy
                    </span>
                    <span className="text-xs font-medium">Copy Log</span>
                  </button>
                </div>
                <div className="p-4 md:p-6 overflow-x-auto">
                  <pre className="font-mono text-xs md:text-sm leading-relaxed text-text-muted whitespace-pre-wrap break-all">
                    <span className="text-slate-500">[14:31:55]</span> <span className="text-blue-400">INFO</span> Initializing Draftify Engine v2.4.0...
{'\n'}<span className="text-slate-500">[14:31:56]</span> <span className="text-blue-400">INFO</span> Phase 1: Validating project inputs... <span className="text-green-500">OK</span>
{'\n'}<span className="text-slate-500">[14:31:58]</span> <span className="text-blue-400">INFO</span> Phase 2: Analyzing sitemap structure... <span className="text-green-500">OK</span>
{'\n'}<span className="text-slate-500">[14:32:01]</span> <span className="text-blue-400">INFO</span> Phase 3: Initiating HTML Parse for target...
{'\n'}<span className="text-slate-500">[14:32:01]</span> <span className="text-yellow-500">WARN</span> Response latency &gt; 2000ms detected.
{'\n'}<span className="text-slate-500">[14:32:15]</span> <span className="text-yellow-500">WARN</span> Retrying connection (Attempt 1/3)...
{'\n'}<span className="text-slate-500">[14:32:30]</span> <span className="text-red-500">ERROR</span> TimeoutError: Navigation timeout of 30000ms exceeded.
{'\n'}<span className="text-slate-500">[14:32:30]</span> <span className="text-red-500">FATAL</span> Process terminated with exit code 1.
                  </pre>
                </div>
              </div>
            </div>

            {/* Action Footer */}
            <div className="px-4 pb-12 pt-4">
              <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 py-6 border-t border-slate-200 dark:border-border-dark">
                <button 
                  onClick={() => onNavigate(Screen.INPUT)}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-slate-300 dark:border-border-dark hover:bg-slate-100 dark:hover:bg-border-dark/50 text-slate-700 dark:text-white text-sm font-medium transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">arrow_back</span>
                  Back to Dashboard
                </button>
                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                  <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-slate-200 dark:bg-border-dark/50 hover:bg-slate-300 dark:hover:bg-border-dark text-slate-900 dark:text-white text-sm font-medium transition-colors">
                    <span className="material-symbols-outlined text-lg">edit</span>
                    Edit Project Settings
                  </button>
                  <button 
                    onClick={() => onNavigate(Screen.PROGRESS)}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-bold shadow-lg shadow-primary/20 transition-all"
                  >
                    <span className="material-symbols-outlined text-lg">refresh</span>
                    Retry Phase
                  </button>
                </div>
              </div>
              <div className="flex justify-center">
                <p className="text-slate-500 dark:text-text-muted text-sm">
                  Need help?{' '}
                  <a className="text-primary hover:underline" href="#">
                    Contact Support
                  </a>{' '}
                  and attach the log ID #9283-GEN.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};