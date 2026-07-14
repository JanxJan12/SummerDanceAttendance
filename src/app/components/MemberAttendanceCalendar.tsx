import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Save,
  UserRoundCheck,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { supabase } from "../../lib/supabase";
import {
  getAttendanceStatusLabel,
  type AttendanceRecord,
  type AttendanceRecordStatus,
} from "./AttendanceTable";

interface SessionRow {
  id: string | number;
  session_date: string;
  session_period: "Morning" | "Afternoon";
  session_name?: string;
}

interface AttendanceRow {
  id: string | number;
  session_id: string | number;
  status: AttendanceRecordStatus;
  excuse_reason?: string | null;
  status_source?: "QR Scanner" | "Secretary";
  created_at?: string;
  updated_at?: string;
}

interface MemberAttendanceCalendarProps {
  member: AttendanceRecord;
  onClose: () => void;
  onRecordsChanged: () => void | Promise<void>;
}

const statuses: AttendanceRecordStatus[] = [
  "Present",
  "Late",
  "Late - Excused",
  "Absent",
  "Absent - Excused",
];

const statusDot: Record<AttendanceRecordStatus, string> = {
  Present: "bg-emerald-500",
  Late: "bg-amber-500",
  "Late - Excused": "bg-sky-500",
  Absent: "bg-rose-500",
  "Absent - Excused": "bg-violet-500",
};

const statusBadge: Record<AttendanceRecordStatus, string> = {
  Present: "border-emerald-100 bg-emerald-50 text-emerald-700",
  Late: "border-amber-100 bg-amber-50 text-amber-700",
  "Late - Excused": "border-sky-100 bg-sky-50 text-sky-700",
  Absent: "border-rose-100 bg-rose-50 text-rose-700",
  "Absent - Excused": "border-violet-100 bg-violet-50 text-violet-700",
};

const isExcusedStatus = (status: AttendanceRecordStatus) => status.endsWith("Excused");

const monthLabel = (monthValue: string) =>
  new Date(`${monthValue}-01T00:00:00`).toLocaleDateString("en-PH", {
    month: "long",
    year: "numeric",
  });

export default function MemberAttendanceCalendar({
  member,
  onClose,
  onRecordsChanged,
}: MemberAttendanceCalendarProps) {
  const today = new Date().toLocaleDateString("en-CA");
  const [selectedMonth, setSelectedMonth] = useState(today.slice(0, 7));
  const [selectedDate, setSelectedDate] = useState(today);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [attendanceRows, setAttendanceRows] = useState<AttendanceRow[]>([]);
  const [drafts, setDrafts] = useState<Record<string, { status: AttendanceRecordStatus; reason: string }>>({});
  const [loading, setLoading] = useState(true);
  const [savingSessionId, setSavingSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadHistory = async (preserveSelectedDate = false) => {
    setLoading(true);
    setError(null);

    const [year, month] = selectedMonth.split("-").map(Number);
    const lastDay = new Date(year, month, 0).getDate();
    const rangeStart = `${selectedMonth}-01`;
    const rangeEnd = `${selectedMonth}-${String(lastDay).padStart(2, "0")}`;

    const { data: sessionData, error: sessionError } = await supabase
      .from("sessions")
      .select("id, session_date, session_period, session_name")
      .gte("session_date", rangeStart)
      .lte("session_date", rangeEnd)
      .order("session_date", { ascending: true });

    if (sessionError) {
      setError("Unable to load this month's sessions.");
      setLoading(false);
      return;
    }

    const monthSessions = (sessionData || []) as SessionRow[];
    let memberRows: AttendanceRow[] = [];

    if (monthSessions.length) {
      const { data: attendanceData, error: attendanceError } = await supabase
        .from("attendance")
        .select("id, session_id, status, excuse_reason, status_source, created_at, updated_at")
        .eq("student_id", member.id)
        .in("session_id", monthSessions.map((session) => session.id));

      if (attendanceError) {
        setError(
          attendanceError.message.includes("excuse_reason")
            ? "The secretary attendance database update has not been applied yet."
            : "Unable to load this member's attendance history."
        );
        setLoading(false);
        return;
      }

      memberRows = (attendanceData || []) as AttendanceRow[];
    }

    setSessions(monthSessions);
    setAttendanceRows(memberRows);
    setDrafts({});

    if (!preserveSelectedDate) {
      const monthContainsToday = today.startsWith(selectedMonth);
      const firstSessionDate = monthSessions[0]?.session_date;
      setSelectedDate(monthContainsToday ? today : firstSessionDate || rangeStart);
    }
    setLoading(false);
  };

  useEffect(() => {
    void loadHistory();
  }, [member.id, selectedMonth]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const recordForSession = (sessionId: string | number) =>
    attendanceRows.find((row) => String(row.session_id) === String(sessionId));

  const statusForSession = (sessionId: string | number): AttendanceRecordStatus =>
    recordForSession(sessionId)?.status || "Absent";

  const sessionLedger = useMemo(
    () => sessions.map((session) => ({ session, status: statusForSession(session.id) })),
    [sessions, attendanceRows]
  );

  const totals = statuses.reduce<Record<AttendanceRecordStatus, number>>(
    (summary, status) => {
      summary[status] = sessionLedger.filter((entry) => entry.status === status).length;
      return summary;
    },
    { Present: 0, Late: 0, "Late - Excused": 0, Absent: 0, "Absent - Excused": 0 }
  );

  const [year, month] = selectedMonth.split("-").map(Number);
  const numberOfDays = new Date(year, month, 0).getDate();
  const leadingBlankCount = new Date(year, month - 1, 1).getDay();
  const calendarCells: Array<number | null> = [
    ...Array.from({ length: leadingBlankCount }, () => null),
    ...Array.from({ length: numberOfDays }, (_, index) => index + 1),
  ];
  while (calendarCells.length % 7 !== 0) calendarCells.push(null);

  const selectedDaySessions = sessions.filter((session) => session.session_date === selectedDate);

  const moveMonth = (amount: number) => {
    const next = new Date(year, month - 1 + amount, 1);
    const nextValue = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`;
    setSelectedMonth(nextValue);
    setSuccessMessage(null);
  };

  const getDraft = (session: SessionRow) => {
    const key = String(session.id);
    const existing = recordForSession(session.id);
    return drafts[key] || {
      status: existing?.status || "Absent",
      reason: existing?.excuse_reason || "",
    };
  };

  const updateDraft = (session: SessionRow, changes: Partial<{ status: AttendanceRecordStatus; reason: string }>) => {
    const key = String(session.id);
    setDrafts((current) => ({ ...current, [key]: { ...getDraft(session), ...changes } }));
    setError(null);
    setSuccessMessage(null);
  };

  const saveAttendance = async (session: SessionRow) => {
    const draft = getDraft(session);
    const reason = draft.reason.trim();

    if (isExcusedStatus(draft.status) && !reason) {
      setError("Add an excuse reason before saving an excused status.");
      return;
    }

    const existing = recordForSession(session.id);
    const payload = {
      status: draft.status,
      excuse_reason: isExcusedStatus(draft.status) ? reason : null,
      status_source: "Secretary",
    };

    setSavingSessionId(String(session.id));
    setError(null);
    setSuccessMessage(null);

    const response = existing
      ? await supabase.from("attendance").update(payload).eq("id", existing.id)
      : await supabase.from("attendance").insert([{ ...payload, student_id: member.id, session_id: session.id }]);

    if (response.error) {
      setError(
        response.error.message.includes("status") || response.error.message.includes("excuse_reason")
          ? "Apply the secretary attendance database update, then try again."
          : response.error.message
      );
      setSavingSessionId(null);
      return;
    }

    await loadHistory(true);
    await onRecordsChanged();
    setSuccessMessage(`${session.session_period} attendance saved.`);
    setSavingSessionId(null);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/65 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
        <motion.section
          initial={{ opacity: 0, y: 35, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 25, scale: 0.98 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="member-calendar-title"
          className="surface-card max-h-[calc(100dvh-0.5rem)] w-full max-w-6xl overflow-y-auto rounded-t-3xl shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:rounded-3xl"
        >
          <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-slate-100 bg-white/95 px-4 py-4 backdrop-blur-xl sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#9f101c] to-amber-500 text-sm font-black text-white">
                {member.name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}
              </div>
              <div className="min-w-0"><p className="text-[10px] font-black uppercase tracking-[0.15em] text-[#9f101c]">Member attendance calendar</p><h2 id="member-calendar-title" className="truncate text-lg font-black text-slate-900 sm:text-xl">{member.name}</h2></div>
            </div>
            <button type="button" onClick={onClose} className="tap-target grid shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-rose-50 hover:text-rose-700" aria-label="Close attendance calendar"><X size={20} /></button>
          </header>

          <div className="space-y-5 p-4 sm:p-6">
            <section className="grid grid-cols-2 gap-2 sm:grid-cols-5" aria-label="Monthly attendance totals">
              {statuses.map((status) => (
                <div key={status} className={`rounded-2xl border p-3 ${statusBadge[status]}`}>
                  <div className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${statusDot[status]}`} /><p className="text-[10px] font-black uppercase tracking-wide">{getAttendanceStatusLabel(status)}</p></div>
                  <p className="mt-2 text-2xl font-black">{totals[status]}</p>
                </div>
              ))}
            </section>

            {error && <div className="flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700"><AlertCircle className="mt-0.5 shrink-0" size={17} /> {error}</div>}
            {successMessage && <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700"><UserRoundCheck size={17} /> {successMessage}</div>}

            <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
              <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
                <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-5">
                  <button type="button" onClick={() => moveMonth(-1)} className="tap-target grid place-items-center rounded-xl bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-800" aria-label="Previous month"><ChevronLeft size={19} /></button>
                  <div className="text-center"><p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Monthly ledger</p><h3 className="font-black text-slate-900">{monthLabel(selectedMonth)}</h3></div>
                  <button type="button" onClick={() => moveMonth(1)} className="tap-target grid place-items-center rounded-xl bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-800" aria-label="Next month"><ChevronRight size={19} /></button>
                </div>

                {loading ? (
                  <div className="grid min-h-80 place-items-center"><div className="text-center"><span className="mx-auto block h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[#9f101c]" /><p className="mt-3 text-sm font-semibold text-slate-500">Loading attendance history…</p></div></div>
                ) : (
                  <div className="p-3 sm:p-5">
                    <div className="grid grid-cols-7 text-center text-[10px] font-black uppercase tracking-wider text-slate-400">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <span key={day} className="py-2">{day}</span>)}</div>
                    <div className="grid grid-cols-7 gap-1">
                      {calendarCells.map((day, index) => {
                        if (!day) return <span key={`blank-${index}`} className="aspect-square" />;
                        const date = `${selectedMonth}-${String(day).padStart(2, "0")}`;
                        const daySessions = sessions.filter((session) => session.session_date === date);
                        const active = selectedDate === date;
                        const isToday = date === today;
                        return (
                          <button key={date} type="button" onClick={() => setSelectedDate(date)} className={`relative aspect-square min-w-0 rounded-xl border p-1 text-xs font-bold transition sm:rounded-2xl ${active ? "border-[#9f101c] bg-[#9f101c] text-white shadow-lg" : isToday ? "border-amber-300 bg-amber-50 text-amber-900" : "border-transparent bg-slate-50 text-slate-700 hover:border-amber-200 hover:bg-amber-50"}`} aria-label={`${date}, ${daySessions.length} session${daySessions.length === 1 ? "" : "s"}`}>
                            <span>{day}</span>
                            <span className="absolute inset-x-1 bottom-1 flex justify-center gap-0.5">
                              {daySessions.slice(0, 2).map((daySession) => <span key={daySession.id} className={`h-1.5 w-1.5 rounded-full ring-1 ring-white ${statusDot[statusForSession(daySession.id)]}`} />)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-x-3 gap-y-2 border-t border-slate-100 pt-4">{statuses.map((status) => <span key={status} className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500"><span className={`h-2 w-2 rounded-full ${statusDot[status]}`} />{getAttendanceStatusLabel(status)}</span>)}</div>
                  </div>
                )}
              </section>

              <section className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
                <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-2xl bg-amber-50 text-amber-700"><CalendarDays size={19} /></div><div><p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Selected date</p><h3 className="font-black text-slate-900">{new Date(`${selectedDate}T00:00:00`).toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" })}</h3></div></div>

                <div className="mt-5 space-y-4">
                  {selectedDaySessions.length ? selectedDaySessions.map((daySession) => {
                    const draft = getDraft(daySession);
                    const existing = recordForSession(daySession.id);
                    return (
                      <div key={daySession.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center justify-between gap-3"><div><p className="font-black text-slate-900">{daySession.session_period}</p><p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500"><Clock3 size={13} /> {existing?.created_at ? `Recorded ${new Date(existing.created_at).toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" })}` : "No saved record"}</p></div>{existing?.status_source && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500">{existing.status_source}</span>}</div>
                        <label className="mt-4 block text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">Attendance status
                          <select value={draft.status} onChange={(event) => updateDraft(daySession, { status: event.target.value as AttendanceRecordStatus })} className="field-control mt-1.5 px-3 py-2.5 text-sm font-semibold normal-case tracking-normal">
                            {statuses.map((status) => <option key={status} value={status}>{getAttendanceStatusLabel(status)}</option>)}
                          </select>
                        </label>
                        {isExcusedStatus(draft.status) && <label className="mt-3 block text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">Excuse reason
                          <textarea value={draft.reason} onChange={(event) => updateDraft(daySession, { reason: event.target.value })} rows={2} placeholder="Enter the reason or supporting note…" className="field-control mt-1.5 resize-none px-3 py-2.5 text-sm font-medium normal-case tracking-normal" />
                        </label>}
                        <button type="button" onClick={() => saveAttendance(daySession)} disabled={savingSessionId === String(daySession.id)} className="brand-button mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold disabled:cursor-wait disabled:opacity-60"><Save size={16} /> {savingSessionId === String(daySession.id) ? "Saving…" : "Save attendance"}</button>
                      </div>
                    );
                  }) : <div className="grid min-h-64 place-items-center text-center"><div><div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-400"><CalendarDays size={21} /></div><h4 className="mt-3 font-bold text-slate-800">No session on this date</h4><p className="mt-1 text-sm text-slate-500">Select a highlighted day with a session record.</p></div></div>}
                </div>
              </section>
            </div>
          </div>
        </motion.section>
      </div>
    </AnimatePresence>
  );
}
