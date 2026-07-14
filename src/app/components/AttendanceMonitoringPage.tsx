import { useMemo, useState } from "react";
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  Clock3,
  RotateCcw,
  ScanLine,
  Sparkles,
  UserCheck,
  UsersRound,
  UserX,
} from "lucide-react";
import { motion } from "motion/react";
import Header from "./Header";
import Navigation, { type PageId } from "./Navigation";
import SearchBar from "./SearchBar";
import AttendanceTable, { getAttendanceStatusLabel, type AttendanceRecord } from "./AttendanceTable";
import MemberAttendanceCalendar from "./MemberAttendanceCalendar";

type AttendanceStatus = "All" | AttendanceRecord["status"];

interface SessionSummary {
  session_name?: string;
  late_time?: string | null;
  cutoff_time?: string | null;
}

interface AttendanceMonitoringPageProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  records: AttendanceRecord[];
  session: SessionSummary | null;
  selectedDate: string;
  onDateChange: (date: string) => void;
  selectedPeriod: "Morning" | "Afternoon";
  onPeriodChange: (period: "Morning" | "Afternoon") => void;
  todayDate: string;
  onExportCSV: () => void;
  onRecordsChanged: () => void | Promise<void>;
}

const statusOptions: AttendanceStatus[] = ["All", "Present", "Late", "Late - Excused", "Absent", "Absent - Excused"];

const statusTone: Record<AttendanceRecord["status"], string> = {
  Present: "border-emerald-100 bg-emerald-50 text-emerald-700",
  Late: "border-amber-100 bg-amber-50 text-amber-700",
  "Late - Excused": "border-sky-100 bg-sky-50 text-sky-700",
  Absent: "border-rose-100 bg-rose-50 text-rose-700",
  "Absent - Excused": "border-violet-100 bg-violet-50 text-violet-700",
};

const formatClockValue = (value?: string | null) => {
  if (!value) return "Not set";
  return new Date(`1970-01-01T${value}`).toLocaleTimeString("en-PH", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

export default function AttendanceMonitoringPage({
  currentPage,
  onNavigate,
  records,
  session,
  selectedDate,
  onDateChange,
  selectedPeriod,
  onPeriodChange,
  todayDate,
  onExportCSV,
  onRecordsChanged,
}: AttendanceMonitoringPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<AttendanceStatus>("All");
  const [selectedMember, setSelectedMember] = useState<AttendanceRecord | null>(null);
  const [officialOnly, setOfficialOnly] = useState(true);

  const isToday = selectedDate === todayDate;
  const hasOfficialRoster = records.some((record) => record.isOfficial);
  const monitoredRecords = useMemo(
    () => (officialOnly && hasOfficialRoster ? records.filter((record) => record.isOfficial) : records),
    [records, officialOnly, hasOfficialRoster]
  );
  const presentCount = monitoredRecords.filter((record) => record.status === "Present").length;
  const lateCount = monitoredRecords.filter((record) => record.status === "Late").length;
  const lateExcusedCount = monitoredRecords.filter((record) => record.status === "Late - Excused").length;
  const absentCount = monitoredRecords.filter((record) => record.status === "Absent").length;
  const absentExcusedCount = monitoredRecords.filter((record) => record.status === "Absent - Excused").length;
  const checkedInCount = presentCount + lateCount + lateExcusedCount;
  const attendanceRate = monitoredRecords.length ? Math.round((checkedInCount / monitoredRecords.length) * 100) : 0;
  const onTimeRate = checkedInCount ? Math.round((presentCount / checkedInCount) * 100) : 0;

  const filteredRecords = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return monitoredRecords.filter((record) => {
      const matchesName = !normalizedSearch || record.name.toLowerCase().includes(normalizedSearch);
      const matchesStatus = statusFilter === "All" || record.status === statusFilter;
      return matchesName && matchesStatus;
    });
  }, [monitoredRecords, searchQuery, statusFilter]);

  const recentCheckIns = useMemo(
    () =>
      monitoredRecords
        .filter((record) => !record.status.startsWith("Absent"))
        .sort((a, b) => {
          const first = a.checkedInAt ? new Date(a.checkedInAt).getTime() : 0;
          const second = b.checkedInAt ? new Date(b.checkedInAt).getTime() : 0;
          return second - first;
        })
        .slice(0, 6),
    [monitoredRecords]
  );

  const groupCoverage = useMemo(() => {
    const groups = ["Kids", "Teens", "Adult"];
    const knownGroups = monitoredRecords.filter((record) => groups.includes(record.age));
    const result = groups.map((group) => {
      const groupRecords = monitoredRecords.filter((record) => record.age === group);
      const arrived = groupRecords.filter((record) => !record.status.startsWith("Absent")).length;
      return { group, total: groupRecords.length, arrived };
    });
    const otherRecords = monitoredRecords.filter((record) => !groups.includes(record.age));

    if (otherRecords.length || knownGroups.length === 0) {
      result.push({
        group: "Other",
        total: otherRecords.length,
        arrived: otherRecords.filter((record) => !record.status.startsWith("Absent")).length,
      });
    }

    return result;
  }, [monitoredRecords]);

  const metrics = [
    {
      label: "Present",
      value: presentCount,
      detail: `${onTimeRate}% arrived on time`,
      icon: UserCheck,
      tone: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Late arrivals",
      value: lateCount,
      detail: `${presentCount} on-time check-ins`,
      icon: Clock3,
      tone: "bg-amber-50 text-amber-700",
    },
    {
      label: "Late with Excuse",
      value: lateExcusedCount,
      detail: "Excused late arrivals",
      icon: CheckCircle2,
      tone: "bg-sky-50 text-sky-700",
    },
    {
      label: "Absent",
      value: absentCount,
      detail: session ? "Not yet checked in" : "Session not started",
      icon: UserX,
      tone: "bg-rose-50 text-rose-700",
    },
    {
      label: "Absent with Excuse",
      value: absentExcusedCount,
      detail: "Approved absences",
      icon: CheckCircle2,
      tone: "bg-violet-50 text-violet-700",
    },
  ];

  return (
    <div className="app-shell page-mobile-clearance min-h-screen">
      <span className="ambient-orb left-[-7rem] top-32 h-64 w-64 bg-amber-300/20" />
      <span className="ambient-orb right-[-8rem] top-[34rem] h-72 w-72 bg-rose-300/20 [animation-delay:-3s]" />
      <Header onExportCSV={onExportCSV} />

      <main className="page-enter mx-auto max-w-7xl space-y-5 px-3 py-5 min-[390px]:px-4 sm:space-y-6 sm:px-6 sm:py-7 lg:px-8">
        <Navigation currentPage={currentPage} onNavigate={onNavigate} />

        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl bg-[linear-gradient(135deg,#42090f_0%,#7f1019_48%,#b57919_145%)] p-5 text-white shadow-[0_28px_70px_-36px_rgba(92,12,19,0.85)] sm:p-7"
        >
          <div className="brand-rays pointer-events-none absolute inset-0 opacity-35" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-amber-300">
                <Sparkles size={15} /> Next Moves Operations
              </div>
              <h1 className="text-[clamp(2rem,8vw,3.4rem)] font-black leading-[1.02] tracking-tight">Attendance Monitoring</h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-white/75 sm:text-base">
                Follow live arrivals, attendance coverage, and session status from one responsive command center.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold ${session ? "border-emerald-300/30 bg-emerald-400/15 text-emerald-100" : "border-amber-300/30 bg-amber-300/15 text-amber-100"}`}>
                  <span className={`h-2.5 w-2.5 rounded-full ${session && isToday ? "status-live bg-emerald-400" : "bg-amber-300"}`} />
                  {session ? (isToday ? "Live monitoring" : "Historical report") : "No session selected"}
                </span>
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-bold text-white/85">
                  {selectedPeriod} session
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 self-start rounded-3xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm lg:self-auto">
              <div
                className="grid h-24 w-24 shrink-0 place-items-center rounded-full p-2"
                style={{ background: `conic-gradient(#f5c75f ${attendanceRate * 3.6}deg, rgba(255,255,255,0.14) 0deg)` }}
                role="img"
                aria-label={`${attendanceRate}% attendance rate`}
              >
                <div className="grid h-full w-full place-items-center rounded-full bg-[#5b0d14] text-center">
                  <div><strong className="block text-2xl font-black">{attendanceRate}%</strong><span className="text-[10px] font-bold uppercase tracking-wider text-white/60">covered</span></div>
                </div>
              </div>
              <div className="hidden min-[390px]:block">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-amber-300">Current progress</p>
                <p className="mt-1 text-2xl font-black">{checkedInCount}<span className="text-base text-white/55"> / {monitoredRecords.length}</span></p>
                <p className="mt-1 text-xs text-white/60">participants accounted for</p>
              </div>
            </div>
          </div>
        </motion.section>

        <section className="surface-card rounded-2xl p-3 min-[390px]:p-4 sm:rounded-3xl sm:p-5" aria-label="Monitoring controls">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-amber-50 text-amber-700">
                <CalendarDays size={21} />
              </div>
              <label className="min-w-0">
                <span className="block text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Monitoring date</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(event) => onDateChange(event.target.value)}
                  className="mt-1 min-w-0 max-w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
                />
              </label>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {hasOfficialRoster && (
                <button
                  type="button"
                  onClick={() => setOfficialOnly((current) => !current)}
                  className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition ${officialOnly ? "border-amber-300 bg-amber-50 text-amber-900" : "border-slate-200 bg-white text-slate-600 hover:border-amber-300"}`}
                  aria-pressed={officialOnly}
                >
                  <UserCheck size={16} /> {officialOnly ? "Official roster" : "All members"}
                </button>
              )}
              {!isToday && (
                <button type="button" onClick={() => onDateChange(todayDate)} className="flex items-center justify-center gap-2 rounded-xl bg-amber-50 px-4 py-2.5 text-sm font-bold text-amber-800 transition hover:bg-amber-100">
                  <RotateCcw size={16} /> Back to today
                </button>
              )}
              <div className="flex rounded-2xl border border-slate-200 bg-slate-100/80 p-1">
                {(["Morning", "Afternoon"] as const).map((period) => (
                  <button
                    key={period}
                    type="button"
                    onClick={() => onPeriodChange(period)}
                    className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all sm:flex-none ${selectedPeriod === period ? "bg-white text-[#8d111c] shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                    aria-pressed={selectedPeriod === period}
                  >
                    {period}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => onNavigate("scanner")}
                disabled={!session || !isToday}
                className="brand-button flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-45"
                title={!session ? "Start this session from the dashboard first" : !isToday ? "Scanning is available only for today" : undefined}
              >
                <ScanLine size={17} /> Open scanner
              </button>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5" aria-label="Attendance summary">
          {metrics.map(({ label, value, detail, icon: Icon, tone }, index) => (
            <motion.article
              key={label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              className="surface-card rounded-2xl p-3.5 sm:rounded-3xl sm:p-5"
            >
              <div className={`grid h-10 w-10 place-items-center rounded-2xl sm:h-11 sm:w-11 ${tone}`}><Icon size={20} /></div>
              <p className="mt-4 text-[10px] font-black uppercase tracking-[0.12em] text-slate-400 sm:text-xs">{label}</p>
              <p className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">{value}</p>
              <p className="mt-1 text-[11px] leading-4 text-slate-500 sm:text-xs">{detail}</p>
            </motion.article>
          ))}
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
          <article className="surface-card overflow-hidden rounded-3xl">
            <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><Activity size={21} /></div>
                <div><h2 className="font-bold text-slate-900">Live check-in activity</h2><p className="text-sm text-slate-500">Newest successful scans</p></div>
              </div>
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                <span className="status-live h-2 w-2 rounded-full bg-emerald-500" /> {recentCheckIns.length} recent
              </span>
            </div>
            {recentCheckIns.length ? (
              <div className="divide-y divide-slate-100">
                {recentCheckIns.map((record, index) => (
                  <motion.div key={record.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.04 }} className="flex items-center gap-3 px-5 py-4 sm:px-6">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-amber-100 to-rose-100 text-xs font-black text-[#8d111c]">
                      {record.name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-slate-900">{record.name}</p><p className="mt-0.5 text-xs text-slate-500">Checked in at {record.time}</p></div>
                    <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-bold ${statusTone[record.status]}`}>{getAttendanceStatusLabel(record.status)}</span>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="grid min-h-56 place-items-center px-6 py-10 text-center">
                <div><div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-400"><ScanLine size={22} /></div><h3 className="mt-3 font-bold text-slate-800">Waiting for the first check-in</h3><p className="mt-1 text-sm text-slate-500">Successful QR scans will appear here automatically.</p></div>
              </div>
            )}
          </article>

          <article className="surface-card rounded-3xl p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-indigo-50 text-indigo-700"><UsersRound size={21} /></div>
              <div><h2 className="font-bold text-slate-900">Group coverage</h2><p className="text-sm text-slate-500">Arrivals by age group</p></div>
            </div>
            <div className="mt-6 space-y-5">
              {groupCoverage.map(({ group, total, arrived }) => {
                const rate = total ? Math.round((arrived / total) * 100) : 0;
                return (
                  <div key={group}>
                    <div className="mb-2 flex items-center justify-between gap-3 text-sm"><span className="font-bold text-slate-700">{group}</span><span className="font-semibold text-slate-500">{arrived}/{total} · {rate}%</span></div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label={`${group} attendance`} aria-valuenow={rate} aria-valuemin={0} aria-valuemax={100}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${rate}%` }} transition={{ duration: 0.55 }} className="h-full rounded-full bg-gradient-to-r from-[#9f101c] to-amber-500" />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 border-t border-slate-100 pt-5">
              <div className="rounded-2xl bg-amber-50 p-3"><p className="text-[10px] font-black uppercase tracking-wider text-amber-700">Late after</p><p className="mt-1 text-sm font-bold text-slate-800">{formatClockValue(session?.late_time)}</p></div>
              <div className="rounded-2xl bg-rose-50 p-3"><p className="text-[10px] font-black uppercase tracking-wider text-rose-700">Cutoff</p><p className="mt-1 text-sm font-bold text-slate-800">{formatClockValue(session?.cutoff_time)}</p></div>
            </div>
          </article>
        </section>

        <section className="space-y-4" aria-labelledby="monitoring-roster-heading">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div><div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-[#9f101c]"><CheckCircle2 size={14} /> Secretary's session roster</div><h2 id="monitoring-roster-heading" className="mt-1 text-2xl font-black text-slate-900">Attendance status</h2><p className="mt-1 text-sm text-slate-500">Select a member to open their calendar, review history, and record excuses.</p></div>
            <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search monitored participants..." />
          </div>
          <div className="responsive-scroll flex gap-2 overflow-x-auto pb-1" aria-label="Filter attendance status">
            {statusOptions.map((status) => {
              const count = status === "All" ? monitoredRecords.length : monitoredRecords.filter((record) => record.status === status).length;
              const active = statusFilter === status;
              return (
                <button key={status} type="button" onClick={() => setStatusFilter(status)} className={`tap-target flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition ${active ? "border-[#9f101c] bg-[#9f101c] text-white shadow-lg shadow-rose-900/15" : "border-slate-200 bg-white text-slate-600 hover:border-amber-300 hover:text-[#8d111c]"}`} aria-pressed={active}>
                  {status === "All" ? status : getAttendanceStatusLabel(status)}<span className={`rounded-full px-2 py-0.5 text-[10px] ${active ? "bg-white/18 text-white" : "bg-slate-100 text-slate-500"}`}>{count}</span>
                </button>
              );
            })}
          </div>
          <AttendanceTable records={filteredRecords} onRecordClick={setSelectedMember} />
        </section>
      </main>

      {selectedMember && (
        <MemberAttendanceCalendar
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
          onRecordsChanged={onRecordsChanged}
        />
      )}
    </div>
  );
}
