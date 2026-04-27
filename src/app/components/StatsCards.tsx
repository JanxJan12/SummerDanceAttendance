import { UserCheck, UserX } from 'lucide-react';

interface StatsCardsProps {
  presentCount: number;
  absentCount: number;
}

export default function StatsCards({ presentCount, absentCount }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6">
      <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="p-2 sm:p-3 bg-green-100 rounded-lg sm:rounded-xl">
            <UserCheck className="text-green-600" size={20} />
          </div>
          <div>
            <p className="text-xs sm:text-sm text-gray-500">Present</p>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">{presentCount}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="p-2 sm:p-3 bg-red-100 rounded-lg sm:rounded-xl">
            <UserX className="text-red-600" size={20} />
          </div>
          <div>
            <p className="text-xs sm:text-sm text-gray-500">Absent</p>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">{absentCount}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
