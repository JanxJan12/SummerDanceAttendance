import { LayoutDashboard, UserPlus, ScanLine } from 'lucide-react';

interface NavigationProps {
  currentPage: 'dashboard' | 'register' | 'scanner';
  onNavigate: (page: 'dashboard' | 'register' | 'scanner') => void;
}

export default function Navigation({ currentPage, onNavigate }: NavigationProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg md:relative md:shadow-none z-50 safe-area-bottom">
      <div className="flex items-center justify-around md:justify-center md:gap-4 px-2 sm:px-4 py-2 sm:py-3">
        <button
          onClick={() => onNavigate('dashboard')}
          className={`flex flex-col md:flex-row items-center gap-1 md:gap-2 px-3 sm:px-4 py-2 rounded-lg transition-colors font-medium text-xs sm:text-sm md:text-base ${
            currentPage === 'dashboard'
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <LayoutDashboard size={18} className="sm:w-5 sm:h-5" />
          <span className="md:hidden text-[10px] sm:text-xs">Dashboard</span>
          <span className="hidden md:inline">Dashboard</span>
        </button>

        <button
          onClick={() => onNavigate('register')}
          className={`flex flex-col md:flex-row items-center gap-1 md:gap-2 px-3 sm:px-4 py-2 rounded-lg transition-colors font-medium text-xs sm:text-sm md:text-base ${
            currentPage === 'register'
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <UserPlus size={18} className="sm:w-5 sm:h-5" />
          <span className="md:hidden text-[10px] sm:text-xs">Register</span>
          <span className="hidden md:inline">Register</span>
        </button>

        <button
          onClick={() => onNavigate('scanner')}
          className={`flex flex-col md:flex-row items-center gap-1 md:gap-2 px-3 sm:px-4 py-2 rounded-lg transition-colors font-medium text-xs sm:text-sm md:text-base ${
            currentPage === 'scanner'
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <ScanLine size={18} className="sm:w-5 sm:h-5" />
          <span className="md:hidden text-[10px] sm:text-xs">Scanner</span>
          <span className="hidden md:inline">Scanner</span>
        </button>
      </div>
    </nav>
  );
}
