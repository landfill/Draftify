import React, { useState } from 'react';
import { Header } from '../components/Header';
import { Screen } from '../types';

interface Props {
  onNavigate: (screen: Screen) => void;
}

export const InputScreen: React.FC<Props> = ({ onNavigate }) => {
  const [url, setUrl] = useState('');
  const [isUrlValid, setIsUrlValid] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.includes('http')) {
      setIsUrlValid(false);
      return;
    }
    onNavigate(Screen.PROGRESS);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background-light dark:bg-background-dark">
      <Header onNavigate={onNavigate} activeScreen={Screen.INPUT} />
      <main className="flex-1 flex justify-center py-8 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-[800px] flex flex-col gap-8">
          {/* Page Heading */}
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
              기획서 생성하기
            </h1>
            <p className="text-slate-500 dark:text-text-muted text-base font-normal leading-relaxed">
              MVP URL을 입력하거나 기존 문서를 업로드하여 프로젝트 초안을 자동으로 생성하세요.
            </p>
          </div>

          {/* Main Form Card */}
          <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-border-dark p-6 sm:p-8 shadow-sm">
            <form className="flex flex-col gap-8" onSubmit={handleSubmit}>
              {/* Section 1: Core Info */}
              <div className="flex flex-col gap-6">
                {/* Project Name */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    프로젝트명
                  </label>
                  <input
                    className="w-full rounded-lg border border-slate-300 dark:border-border-dark bg-white dark:bg-[#192b33] px-4 py-3 text-base text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    placeholder="예: 쇼핑몰 리뉴얼 프로젝트 v1.0"
                    type="text"
                  />
                </div>

                {/* Target URL (Required) */}
                <div className="flex flex-col gap-2">
                  <label className="flex justify-between text-sm font-semibold text-slate-700 dark:text-slate-200">
                    <span>Target URL (MVP)</span>
                    <span className="text-xs font-normal text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      필수
                    </span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <span className="material-symbols-outlined text-[20px]">link</span>
                    </div>
                    <input
                      className={`w-full rounded-lg border ${
                        isUrlValid
                          ? 'border-slate-300 dark:border-border-dark focus:border-primary focus:ring-primary'
                          : 'border-red-400 text-red-500 focus:border-red-500 focus:ring-red-500'
                      } bg-white dark:bg-[#192b33] pl-10 pr-4 py-3 text-base text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-1 outline-none transition-all`}
                      placeholder="https://example.com"
                      type="url"
                      value={url}
                      onChange={(e) => {
                        setUrl(e.target.value);
                        setIsUrlValid(true);
                      }}
                    />
                    {!isUrlValid && (
                      <p className="mt-1 text-xs text-red-500">
                        올바른 URL 형식을 입력해주세요 (http:// 또는 https:// 포함)
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 2: Upload */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  참조 문서 (선택사항)
                </label>
                <div className="group relative flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-border-dark hover:border-primary dark:hover:border-primary bg-slate-50 dark:bg-[#192b33]/50 hover:bg-slate-100 dark:hover:bg-[#192b33] transition-all py-10 px-6 cursor-pointer text-center">
                  <div className="size-12 rounded-full bg-slate-200 dark:bg-border-dark flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                    <span className="material-symbols-outlined text-slate-500 dark:text-slate-300">
                      cloud_upload
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      파일을 여기로 드래그하거나 클릭하여 업로드
                    </p>
                    <p className="text-xs text-slate-500 dark:text-text-muted">
                      지원 형식: PDF, DOCX (최대 10MB)
                    </p>
                  </div>
                  <input
                    accept=".pdf,.docx"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    type="file"
                  />
                </div>
              </div>

              <hr className="border-slate-200 dark:border-border-dark" />

              {/* Section 3: Settings */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white">
                  <span className="material-symbols-outlined text-primary">tune</span>
                  <h3 className="text-base font-bold">크롤링 상세 설정</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Record Mode */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-medium text-slate-500 dark:text-text-muted">
                      Record 모드
                    </label>
                    <div className="relative">
                      <select className="w-full appearance-none rounded-lg border border-slate-300 dark:border-border-dark bg-white dark:bg-[#192b33] px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none cursor-pointer">
                        <option value="static">정적 (Static)</option>
                        <option value="interactive">동적 (Interactive)</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-sm">
                        expand_more
                      </span>
                    </div>
                  </div>
                  {/* Max Pages */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-medium text-slate-500 dark:text-text-muted">
                      최대 페이지 수
                    </label>
                    <input
                      className="w-full rounded-lg border border-slate-300 dark:border-border-dark bg-white dark:bg-[#192b33] px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                      max="100"
                      min="1"
                      type="number"
                      defaultValue="10"
                    />
                  </div>
                  {/* Max Depth */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-medium text-slate-500 dark:text-text-muted">
                      탐색 깊이 (Depth)
                    </label>
                    <input
                      className="w-full rounded-lg border border-slate-300 dark:border-border-dark bg-white dark:bg-[#192b33] px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                      max="5"
                      min="1"
                      type="number"
                      defaultValue="2"
                    />
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-4">
                <button
                  className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-base font-bold rounded-xl text-white bg-primary hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary shadow-lg shadow-primary/25 transition-all active:scale-[0.99]"
                  type="submit"
                >
                  <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                    <span className="material-symbols-outlined group-hover:animate-pulse">
                      auto_awesome
                    </span>
                  </span>
                  생성 시작
                </button>
                <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-3">
                  버튼을 누르면 AI가 사이트 구조 분석을 시작합니다. 약 1-2분이 소요될 수
                  있습니다.
                </p>
              </div>
            </form>
          </div>

          {/* Footer / Help Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-10">
            <div className="p-4 rounded-lg bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark flex gap-3 items-start">
              <span className="material-symbols-outlined text-primary mt-0.5">help</span>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Record 모드란?
                </h4>
                <p className="text-xs text-slate-500 dark:text-text-muted mt-1 leading-relaxed">
                  '정적'은 HTML 구조만 분석하며, '동적'은 사용자 클릭과 스크롤 이벤트를
                  시뮬레이션하여 숨겨진 요소를 찾습니다.
                </p>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark flex gap-3 items-start">
              <span className="material-symbols-outlined text-primary mt-0.5">
                security
              </span>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  데이터 보안
                </h4>
                <p className="text-xs text-slate-500 dark:text-text-muted mt-1 leading-relaxed">
                  업로드된 문서는 분석 후 즉시 암호화되어 저장되며, 프로젝트 완료 후 자동
                  파기됩니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};