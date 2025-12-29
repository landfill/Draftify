import React from 'react';
import { Header } from '../components/Header';
import { Screen } from '../types';

interface Props {
  onNavigate: (screen: Screen) => void;
}

export const ResultScreen: React.FC<Props> = ({ onNavigate }) => {
  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-white overflow-x-hidden min-h-screen flex flex-col">
      <Header onNavigate={onNavigate} activeScreen={Screen.RESULT} />
      
      <div className="layout-container flex h-full grow flex-col">
        <div className="flex flex-1 justify-center py-8 px-4 md:px-10 lg:px-40">
          <div className="layout-content-container flex flex-col w-full max-w-[960px] flex-1 gap-8">
            {/* Success Header */}
            <div className="flex flex-col items-center gap-4 text-center py-6 animate-fade-in-up">
              <div className="rounded-full bg-green-500/10 p-4 border border-green-500/20">
                <span className="material-symbols-outlined text-green-500 text-5xl">
                  check_circle
                </span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <h1 className="text-slate-900 dark:text-white text-2xl md:text-3xl font-bold leading-tight tracking-[-0.015em]">
                  기획서 생성이 완료되었습니다!
                </h1>
                <p className="text-slate-500 dark:text-text-muted text-base font-normal leading-normal max-w-[480px]">
                  Draftify가 프로젝트 분석 및 기획서 생성을 성공적으로 마쳤습니다.
                  <br />
                  아래에서 결과를 확인하고 다운로드하세요.
                </p>
              </div>
            </div>

            {/* Info Grid: Project Info & Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Col: Project Summary */}
              <div className="lg:col-span-1 flex flex-col gap-4">
                <h3 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">
                  프로젝트 정보
                </h3>
                <div className="rounded-xl border border-slate-200 dark:border-border-dark bg-white dark:bg-surface-dark/50 p-6 flex flex-col gap-6">
                  <div className="flex flex-col gap-1">
                    <span className="text-slate-500 dark:text-text-muted text-xs font-medium uppercase tracking-wider">
                      프로젝트명
                    </span>
                    <span className="text-slate-900 dark:text-white text-base font-medium">
                      E-commerce MVP Renewal
                    </span>
                  </div>
                  <div className="h-px bg-slate-200 dark:bg-border-dark w-full"></div>
                  <div className="flex flex-col gap-1">
                    <span className="text-slate-500 dark:text-text-muted text-xs font-medium uppercase tracking-wider">
                      생성 일시
                    </span>
                    <span className="text-slate-900 dark:text-white text-base font-medium">
                      2023.10.27 14:30
                    </span>
                  </div>
                  <div className="h-px bg-slate-200 dark:bg-border-dark w-full"></div>
                  <div className="flex flex-col gap-1">
                    <span className="text-slate-500 dark:text-text-muted text-xs font-medium uppercase tracking-wider">
                      소요 시간
                    </span>
                    <span className="text-slate-900 dark:text-white text-base font-medium flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">timer</span>
                      2분 15초
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Col: Stats */}
              <div className="lg:col-span-2 flex flex-col gap-4">
                <h3 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">
                  생성 결과 요약
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 h-full">
                  <div className="flex flex-col justify-center gap-2 rounded-xl p-6 border border-slate-200 dark:border-border-dark bg-white dark:bg-surface-dark/50 hover:border-primary/50 transition-colors">
                    <div className="size-10 rounded-lg bg-blue-500/10 flex items-center justify-center mb-2">
                      <span className="material-symbols-outlined text-blue-400">
                        travel_explore
                      </span>
                    </div>
                    <p className="text-slate-500 dark:text-text-muted text-sm font-medium leading-normal">
                      크롤링 페이지
                    </p>
                    <p className="text-slate-900 dark:text-white tracking-tight text-3xl font-bold leading-tight">
                      12
                    </p>
                  </div>
                  <div className="flex flex-col justify-center gap-2 rounded-xl p-6 border border-slate-200 dark:border-border-dark bg-white dark:bg-surface-dark/50 hover:border-primary/50 transition-colors">
                    <div className="size-10 rounded-lg bg-purple-500/10 flex items-center justify-center mb-2">
                      <span className="material-symbols-outlined text-purple-400">
                        splitscreen
                      </span>
                    </div>
                    <p className="text-slate-500 dark:text-text-muted text-sm font-medium leading-normal">
                      화면 정의서
                    </p>
                    <p className="text-slate-900 dark:text-white tracking-tight text-3xl font-bold leading-tight">
                      8
                    </p>
                  </div>
                  <div className="flex flex-col justify-center gap-2 rounded-xl p-6 border border-slate-200 dark:border-border-dark bg-white dark:bg-surface-dark/50 hover:border-primary/50 transition-colors">
                    <div className="size-10 rounded-lg bg-orange-500/10 flex items-center justify-center mb-2">
                      <span className="material-symbols-outlined text-orange-400">
                        gavel
                      </span>
                    </div>
                    <p className="text-slate-500 dark:text-text-muted text-sm font-medium leading-normal">
                      정책 항목
                    </p>
                    <p className="text-slate-900 dark:text-white tracking-tight text-3xl font-bold leading-tight">
                      24
                    </p>
                  </div>
                  <div className="flex flex-col justify-center gap-2 rounded-xl p-6 border border-slate-200 dark:border-border-dark bg-white dark:bg-surface-dark/50 hover:border-primary/50 transition-colors">
                    <div className="size-10 rounded-lg bg-teal-500/10 flex items-center justify-center mb-2">
                      <span className="material-symbols-outlined text-teal-400">
                        menu_book
                      </span>
                    </div>
                    <p className="text-slate-500 dark:text-text-muted text-sm font-medium leading-normal">
                      용어 정의
                    </p>
                    <p className="text-slate-900 dark:text-white tracking-tight text-3xl font-bold leading-tight">
                      15
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Download Actions */}
            <div className="flex flex-col gap-4 mt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">
                  다운로드
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button className="group flex items-center gap-4 rounded-xl border border-slate-200 dark:border-border-dark bg-white dark:bg-[#1a2c36] p-4 text-left hover:bg-slate-50 dark:hover:bg-[#233c48] transition-all hover:border-primary/50 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shimmer"></div>
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-[#FF7043]/10 text-[#FF7043]">
                    <span className="material-symbols-outlined">slideshow</span>
                  </div>
                  <div className="flex flex-col flex-1">
                    <span className="text-slate-900 dark:text-white font-bold text-sm">
                      PPT 기획서
                    </span>
                    <span className="text-slate-500 dark:text-text-muted text-xs">
                      PowerPoint (.pptx)
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-slate-400 dark:text-text-muted group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                    download
                  </span>
                </button>
                <button className="group flex items-center gap-4 rounded-xl border border-slate-200 dark:border-border-dark bg-white dark:bg-[#1a2c36] p-4 text-left hover:bg-slate-50 dark:hover:bg-[#233c48] transition-all hover:border-primary/50 relative overflow-hidden">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-[#42A5F5]/10 text-[#42A5F5]">
                    <span className="material-symbols-outlined">html</span>
                  </div>
                  <div className="flex flex-col flex-1">
                    <span className="text-slate-900 dark:text-white font-bold text-sm">
                      웹 리포트
                    </span>
                    <span className="text-slate-500 dark:text-text-muted text-xs">
                      HTML Document (.html)
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-slate-400 dark:text-text-muted group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                    download
                  </span>
                </button>
                <button className="group flex items-center gap-4 rounded-xl border border-slate-200 dark:border-border-dark bg-white dark:bg-[#1a2c36] p-4 text-left hover:bg-slate-50 dark:hover:bg-[#233c48] transition-all hover:border-primary/50 relative overflow-hidden">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-[#66BB6A]/10 text-[#66BB6A]">
                    <span className="material-symbols-outlined">folder_zip</span>
                  </div>
                  <div className="flex flex-col flex-1">
                    <span className="text-slate-900 dark:text-white font-bold text-sm">
                      전체 패키지
                    </span>
                    <span className="text-slate-500 dark:text-text-muted text-xs">
                      All Files (.zip)
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-slate-400 dark:text-text-muted group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                    download
                  </span>
                </button>
              </div>
            </div>

            {/* Preview Section */}
            <div className="flex flex-col gap-4 mt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">
                  HTML 리포트 미리보기
                </h3>
                <button className="text-primary text-sm font-bold flex items-center gap-1 hover:underline">
                  새 탭에서 열기
                  <span className="material-symbols-outlined text-sm">open_in_new</span>
                </button>
              </div>
              {/* Browser Window Mockup */}
              <div className="w-full rounded-xl border border-slate-200 dark:border-border-dark bg-[#101c22] overflow-hidden flex flex-col shadow-2xl">
                {/* Browser Toolbar */}
                <div className="bg-[#1a2c36] px-4 py-3 flex items-center gap-4 border-b border-border-dark">
                  <div className="flex gap-2">
                    <div className="size-3 rounded-full bg-red-500/80"></div>
                    <div className="size-3 rounded-full bg-yellow-500/80"></div>
                    <div className="size-3 rounded-full bg-green-500/80"></div>
                  </div>
                  <div className="flex-1 bg-[#111c22] rounded px-3 py-1 text-xs text-text-muted font-mono truncate max-w-[400px]">
                    file:///users/draftify/projects/ecommerce-mvp/report.html
                  </div>
                </div>
                {/* Preview Content Area */}
                <div className="relative w-full aspect-video bg-[#111c22] overflow-hidden group">
                  <img 
                    src="https://picsum.photos/1920/1080?random=1" 
                    className="absolute inset-0 w-full h-full object-cover opacity-90 transition-opacity group-hover:opacity-100"
                    alt="Preview"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
                    <button className="rounded-full bg-white text-black px-6 py-3 font-bold text-sm shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform">
                      크게 보기
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex flex-col-reverse sm:flex-row justify-center items-center gap-4 pt-8 pb-12 border-t border-slate-200 dark:border-border-dark mt-4">
              <button 
                onClick={() => onNavigate(Screen.INPUT)}
                className="flex min-w-[140px] cursor-pointer items-center justify-center rounded-lg h-12 px-6 border border-slate-300 dark:border-border-dark text-slate-500 dark:text-text-muted hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-border-dark transition-colors text-sm font-bold"
              >
                <span className="material-symbols-outlined mr-2 text-lg">history</span>
                히스토리
              </button>
              <button 
                onClick={() => onNavigate(Screen.INPUT)}
                className="flex min-w-[160px] cursor-pointer items-center justify-center rounded-lg h-12 px-6 bg-primary hover:bg-sky-400 text-white shadow-[0_0_20px_rgba(19,164,236,0.3)] hover:shadow-[0_0_25px_rgba(19,164,236,0.5)] transition-all text-sm font-bold"
              >
                <span className="material-symbols-outlined mr-2 text-lg">add_circle</span>
                새 기획서 생성
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};