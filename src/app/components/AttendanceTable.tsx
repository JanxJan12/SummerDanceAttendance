import { Clock3, ListChecks, UsersRound } from "lucide-react";
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

const getStatusStyle = (status: string) => {
  if (status === "Present") {
    return { container: "bg-emerald-50 text-emerald-700 border-emerald-100", dot: "bg-emerald-500" };
  }
  if (status === "Late") {
    return { container: "bg-amber-50 text-amber-700 border-amber-100", dot: "bg-amber-500" };
  }
  return { container: "bg-rose-50 text-rose-700 border-rose-100", dot: "bg-rose-500" };
};

const getAgeBadgeClass = (age: string) => {
  if (age === "Kids") return "bg-teal-50 text-teal-700 border-teal-100";
  if (age === "Teens") return "bg-indigo-50 text-indigo-700 border-indigo-100";
  if (age === "Adult") return "bg-orange-50 text-orange-700 border-orange-100";
  return "bg-slate-50 text-slate-500 border-slate-200";
};

const getGenderStyle = (gender: string) => {
  if (gender === "Male") return "bg-blue-50 text-blue-700 border-blue-100";
  if (gender === "Female") return "bg-pink-50 text-pink-700 border-pink-100";
  return "bg-slate-50 text-slate-500 border-slate-200";
};

const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

export default function AttendanceTable({ records }: AttendanceTableProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="surface-card overflow-hidden rounded-3xl"
    >
      <div className="flex flex-col gap-3 border-b border-slate-100/80 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-indigo-50 text-indigo-600">
            <ListChecks size={21} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">Next Moves Attendance</h3>
            <p className="text-sm text-slate-500">
              {records.length} participant{records.length !== 1 ? "s" : ""} shown
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-500">
          <Clock3 size={13} />
          Latest records first by status
        </div>
      </div>

      {records.length === 0 ? (
        <div className="grid min-h-64 place-items-center px-6 py-12 text-center">
          <div>
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-400">
              <UsersRound size={25} />
            </div>
            <h4 className="font-semibold text-slate-800">No attendance records found</h4>
            <p className="mt-1 text-sm text-slate-500">Try a different name or status filter.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-3 p-3 sm:p-4 md:grid-cols-2 lg:hidden">
            {records.map((record, index) => {
              const statusStyle = getStatusStyle(record.status);
              return (
                <motion.article
                  key={`mobile-${record.id}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.035, 0.3) }}
                  className="rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-indigo-100 to-cyan-100 text-xs font-black text-indigo-700">
                        {initials(record.name)}
                      </span>
                      <div className="min-w-0">
                        <h4 className="break-words text-sm font-bold leading-5 text-slate-900">{record.name}</h4>
                        <p className="mt-0.5 text-xs font-medium text-slate-500">{record.time === '-' ? 'Not checked in' : `Checked in at ${record.time}`}</p>
                      </div>
                    </div>
                    <div className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${statusStyle.container}`}>
                      <span className={`h-2 w-2 rounded-full ${statusStyle.dot}`} />
                      {record.status}
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Age group</p>
                      <span className={`mt-1 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getAgeBadgeClass(record.age)}`}>{record.age}</span>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Gender</p>
                      <span className={`mt-1 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getGenderStyle(record.gender)}`}>{record.gender}</span>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>

          <div className="responsive-scroll hidden overflow-x-auto lg:block">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75">
                {['Full Name', 'Age Group', 'Gender', 'Status', 'Time'].map((heading) => (
                  <th key={heading} className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 first:pl-6">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.map((record, index) => {
                const statusStyle = getStatusStyle(record.status);
                return (
                  <motion.tr
                    key={record.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(index * 0.025, 0.3) }}
                    className="group border-b border-slate-100/80 transition-colors last:border-b-0 hover:bg-indigo-50/35"
                  >
                    <td className="px-5 py-4 pl-6 text-sm font-semibold text-slate-900">
                      <div className="flex items-center gap-3">
                        <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-100 to-cyan-100 text-xs font-black text-indigo-700 transition-transform group-hover:scale-105">
                          {initials(record.name)}
                        </span>
                        {record.name}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm">
                      <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getAgeBadgeClass(record.age)}`}>
                        {record.age}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm">
                      <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getGenderStyle(record.gender)}`}>
                        {record.gender}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${statusStyle.container}`}>
                        <span className={`h-2 w-2 rounded-full ${statusStyle.dot}`} />
                        {record.status}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm font-medium text-slate-600">{record.time}</td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </>
      )}
    </motion.section>
  );
}
