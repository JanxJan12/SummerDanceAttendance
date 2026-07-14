import { Activity, LayoutDashboard, UserPlus, ScanLine } from 'lucide-react';

export type PageId = 'dashboard' | 'monitor' | 'register' | 'scanner';

interface NavigationProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
}

const navigationItems = [
  { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
  { id: 'monitor' as const, label: 'Monitor', icon: Activity },
  { id: 'register' as const, label: 'Register', icon: UserPlus },
  { id: 'scanner' as const, label: 'Scanner', icon: ScanLine },
];

export default function Navigation({ currentPage, onNavigate }: NavigationProps) {
  return (
    <nav
      aria-label="Primary navigation"
      className="surface-card relative z-20 mx-auto w-full max-w-xl rounded-2xl p-1.5 shadow-lg md:w-fit md:max-w-none"
    >
      <div className="flex items-center justify-around gap-1 md:justify-center">
        {navigationItems.map(({ id, label, icon: Icon }) => {
          const active = currentPage === id;

          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={`tap-target group relative flex min-w-0 flex-1 flex-col items-center gap-1 overflow-hidden rounded-xl px-2 py-2 text-xs font-semibold transition-all duration-200 sm:px-4 md:min-w-[126px] md:flex-none md:flex-row md:justify-center md:gap-2 md:py-2.5 ${
                active
                  ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-500/20'
                  : 'text-slate-500 hover:-translate-y-0.5 hover:bg-indigo-50 hover:text-indigo-700'
              }`}
              aria-current={active ? 'page' : undefined}
            >
              <Icon size={18} className="transition-transform duration-200 group-hover:scale-110" />
              <span className="truncate text-[10px] sm:text-xs md:text-sm">{label}</span>
              {active && (
                <span className="absolute inset-x-5 bottom-0 h-0.5 rounded-full bg-white/70 md:hidden" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
