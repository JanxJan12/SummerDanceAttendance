interface TabNavigationProps {
  activeTab: 'attendance' | 'participants';
  onTabChange: (tab: 'attendance' | 'participants') => void;
}

export default function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  return (
    <div className="surface-card flex w-full gap-1 rounded-2xl p-1.5 sm:w-fit">
      <button
        onClick={() => onTabChange('attendance')}
        className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all sm:flex-none sm:px-6 ${
          activeTab === 'attendance'
            ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-500/20'
            : 'text-slate-500 hover:bg-indigo-50 hover:text-indigo-700'
        }`}
        aria-pressed={activeTab === 'attendance'}
      >
        Attendance
      </button>
      <button
        onClick={() => onTabChange('participants')}
        className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all sm:flex-none sm:px-6 ${
          activeTab === 'participants'
            ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-500/20'
            : 'text-slate-500 hover:bg-indigo-50 hover:text-indigo-700'
        }`}
        aria-pressed={activeTab === 'participants'}
      >
        <span className="hidden sm:inline">All Participants</span>
        <span className="sm:hidden">Participants</span>
      </button>
    </div>
  );
}
