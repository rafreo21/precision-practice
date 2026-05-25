"use client";

interface PracticeHeaderProps {
  onDemoReset?: () => void;
}

export function PracticeHeader({ onDemoReset }: PracticeHeaderProps) {
  return (
    <header className="flex items-center justify-between py-4 px-0">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded bg-indigo-600 flex items-center justify-center flex-shrink-0">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <rect x="1" y="5" width="4" height="6" rx="1" fill="white" />
            <rect x="7" y="2" width="4" height="9" rx="1" fill="white" opacity="0.7" />
          </svg>
        </div>
        <span className="text-[13px] font-semibold text-slate-800 tracking-[-0.01em]">
          Precision Practice
        </span>
      </div>
      {onDemoReset ? (
        <button
          onClick={onDemoReset}
          className="text-[11px] text-slate-300 hover:text-slate-500 transition-colors"
          title="Clear all data (demo reset)"
        >
          reset demo
        </button>
      ) : null}
    </header>
  );
}
