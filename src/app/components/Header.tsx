import { Activity, Download } from 'lucide-react';

interface HeaderProps {
  onExportCSV: () => void;
}

export default function Header({ onExportCSV }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/70 bg-white/72 shadow-[0_8px_30px_-24px_rgba(49,46,129,0.5)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <div className="next-moves-seal relative h-10 w-10 shrink-0 rounded-2xl sm:h-11 sm:w-11" role="img" aria-label="Next Moves Company logo">
            <span className="status-live absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-emerald-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-sm font-bold tracking-tight text-slate-900 min-[390px]:text-base sm:text-lg">
                Next Moves Company
              </h1>
              <span className="hidden rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-600 sm:inline">
                QR Attendance
              </span>
            </div>
            <p className="hidden items-center gap-1.5 text-xs text-slate-500 sm:flex">
              <Activity size={12} className="text-emerald-500" />
              Company attendance workspace
            </p>
          </div>
        </div>
        <button
          onClick={onExportCSV}
          className="brand-button tap-target flex shrink-0 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold sm:px-4"
          aria-label="Export the current table as a CSV file"
        >
          <Download size={16} className="sm:w-[18px] sm:h-[18px]" />
          <span className="hidden sm:inline">Export CSV</span>
          <span className="sm:hidden">Export</span>
        </button>
      </div>
    </header>
  );
}
