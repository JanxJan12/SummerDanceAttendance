import { Download } from 'lucide-react';

interface HeaderProps {
  onExportCSV: () => void;
}

export default function Header({ onExportCSV }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
        <h1 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900">
          <span className="hidden sm:inline">Attendance Dashboard</span>
          <span className="sm:hidden">Attendance</span>
        </h1>
        <button
          onClick={onExportCSV}
          className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-sm sm:text-base"
        >
          <Download size={16} className="sm:w-[18px] sm:h-[18px]" />
          <span className="hidden sm:inline">Export CSV</span>
          <span className="sm:hidden">Export</span>
        </button>
      </div>
    </header>
  );
}
