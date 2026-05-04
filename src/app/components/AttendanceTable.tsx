import { QrCode, Download } from 'lucide-react';
import { motion } from 'motion/react';

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
  onShowQR: (record: AttendanceRecord) => void;
  onDownloadQR: (record: AttendanceRecord) => void; // ✅ NEW
}

export default function AttendanceTable({
  records,
  onShowQR,
  onDownloadQR,
}: AttendanceTableProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="px-4 py-3 text-left text-sm">Full Name</th>
              <th className="px-4 py-3 text-left text-sm">Age</th>
              <th className="px-4 py-3 text-left text-sm">Gender</th>
              <th className="px-4 py-3 text-left text-sm">Status</th>
              <th className="px-4 py-3 text-left text-sm">Time</th>
              <th className="px-4 py-3 text-left text-sm">Action</th>
            </tr>
          </thead>

          <tbody>
            {records.map((record) => (
              <motion.tr
                key={record.id}
                className="border-b hover:bg-gray-50"
              >
                <td className="px-4 py-3">{record.name}</td>
                <td className="px-4 py-3">{record.age}</td>
                <td className="px-4 py-3">{record.gender}</td>

                <td className="px-4 py-3">
                  <span
                  className={`px-3 py-1 rounded-full text-xs ${
                    record.status === "Present"
                      ? "bg-green-100 text-green-700"
                      : record.status === "Late"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700"
                  }`}
                  >
                    {record.status}
                  </span>
                </td>

                <td className="px-4 py-3">{record.time}</td>

                <td className="px-4 py-3">
                  <div className="flex gap-2">

                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}