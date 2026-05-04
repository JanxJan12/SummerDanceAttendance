import { UserCheck, UserX, Clock } from "lucide-react";

interface StatsCardsProps {
  presentCount: number;
  lateCount: number;
  absentCount: number;
  statusFilter: "All" | "Present" | "Late" | "Absent";
  onStatusFilter: (status: "All" | "Present" | "Late" | "Absent") => void;
}

export default function StatsCards({
  presentCount,
  lateCount,
  absentCount,
  statusFilter,
  onStatusFilter,
}: StatsCardsProps) {
  const cardClass =
    "bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-left cursor-pointer transition hover:shadow-md";

  return (
    <div className="space-y-3 mb-6">
      

    

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
         onClick={() =>
        onStatusFilter(statusFilter === "Present" ? "All" : "Present")
      }
          className={`${cardClass} ${
            statusFilter === "Present" ? "ring-2 ring-green-500" : ""
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-xl">
              <UserCheck className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Present</p>
              <p className="text-3xl font-bold text-gray-900">{presentCount}</p>
            </div>
          </div>
        </button>

        <button
                onClick={() =>
        onStatusFilter(statusFilter === "Late" ? "All" : "Late")
      }
          className={`${cardClass} ${
            statusFilter === "Late" ? "ring-2 ring-yellow-500" : ""
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-xl">
              <Clock className="text-yellow-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Late</p>
              <p className="text-3xl font-bold text-yellow-600">{lateCount}</p>
            </div>
          </div>
        </button>

        <button
              onClick={() =>
      onStatusFilter(statusFilter === "Absent" ? "All" : "Absent")
    }
          className={`${cardClass} ${
            statusFilter === "Absent" ? "ring-2 ring-red-500" : ""
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-xl">
              <UserX className="text-red-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Absent</p>
              <p className="text-3xl font-bold text-gray-900">{absentCount}</p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}