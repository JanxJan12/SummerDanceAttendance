interface TabNavigationProps {
  activeTab: 'attendance' | 'participants';
  onTabChange: (tab: 'attendance' | 'participants') => void;
}

export default function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  return (
    <div className="flex gap-2 mb-4 sm:mb-6">
      <button
        onClick={() => onTabChange('attendance')}
        className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-2.5 rounded-full font-medium transition-all text-sm sm:text-base ${
          activeTab === 'attendance'
            ? 'bg-blue-600 text-white shadow-md'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        Attendance
      </button>
      <button
        onClick={() => onTabChange('participants')}
        className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-2.5 rounded-full font-medium transition-all text-sm sm:text-base ${
          activeTab === 'participants'
            ? 'bg-blue-600 text-white shadow-md'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        <span className="hidden sm:inline">All Participants</span>
        <span className="sm:hidden">Participants</span>
      </button>
    </div>
  );
}
