import { motion } from "motion/react";

export interface AttendanceRecord {
  id: string;
  name: string;
  age: string;
  gender: string;
  status: "Present" | "Late" | "Absent";
  time: string;
  isNew?: boolean;
}

interface AttendanceTableProps {
  records: AttendanceRecord[];
}

export default function AttendanceTable({ records }: AttendanceTableProps) {
const getStatusStyle = (status: string) => {
  if (status === "Present") {
    return {
      container: "bg-green-50 text-green-700",
      dot: "bg-green-500",
    };
  }

  if (status === "Late") {
    return {
      container: "bg-amber-50 text-amber-700",
      dot: "bg-amber-500",
    };
  }

  return {
    container: "bg-red-50 text-red-700",
    dot: "bg-red-500",
  };
};

const getAgeBadgeClass = (age: string) => {
  if (age === "Kids") {
    return "bg-teal-50 text-green-700 border border-green-100";
  }

  if (age === "Teens") {
    return "bg-indigo-50 text-indigo-700 border border-indigo-100";
  }

  if (age === "Adult") {
    return "bg-orange-50 text-orange-700 border border-orange-100";
  }

  return "bg-slate-50 text-slate-500 border border-slate-200";
};
const getGenderStyle = (gender: string) => {
  if (gender === "Male") {
    return {
      container: "bg-blue-50 text-blue-700 border border-blue-100",
      dot: "bg-blue-500",
    };
  }

  if (gender === "Female") {
    return {
      container: "bg-pink-50 text-pink-700 border border-pink-100",
      dot: "bg-pink-500",
    };
  }

  return {
    container: "bg-slate-50 text-slate-500 border border-slate-200",
    dot: "bg-slate-400",
  };
};

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">Attendance List</h3>
          <p className="text-sm text-gray-500">
            {records.length} participant{records.length !== 1 ? "s" : ""} shown
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-5 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Full Name
              </th>
              <th className="px-5 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Age Group
              </th>
              <th className="px-5 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Gender
              </th>
              <th className="px-5 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Status
              </th>
              <th className="px-5 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Time
              </th>
            </tr>
          </thead>

          <tbody>
            {records.map((record) => (
              <motion.tr
                key={record.id}
                className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <td className="px-5 py-4 text-sm font-medium text-gray-900">
                  {record.name}
                </td>

                <td className="px-5 py-4 text-sm">
                  <span
                    className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getAgeBadgeClass(
                      record.age
                    )}`}
                  >
                    {record.age}
                  </span>
                </td>

                <td className="px-5 py-4 text-sm">
              <span
                className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getGenderStyle(
                  record.gender
                ).container}`}
              >
                {record.gender}
              </span>
                </td>

                <td className="px-5 py-4">
                  <div
                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(
                      record.status
                    ).container}`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${getStatusStyle(record.status).dot}`}
                    ></span>
                    {record.status}
                  </div>
                </td>

                <td className="px-5 py-4 text-sm text-gray-700">
                  {record.time}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}