import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

import RegistrationPage from "./components/RegistrationPage";
import QRScannerPage from "./components/QRScannerPage";
import { toDataURL } from "qrcode"; 
import Header from "./components/Header";
import TabNavigation from "./components/TabNavigation";
import SearchBar from "./components/SearchBar";
import StatsCards from "./components/StatsCards";
import Navigation from './components/Navigation';
import AttendanceTable, { AttendanceRecord } from "./components/AttendanceTable";
import ParticipantsTable from "./components/ParticipantsTable";
import EditModal from "./components/EditModal";
import QRModal from "./components/QRModal";
import {
  AlertTriangle,
  CalendarDays,
  Check,
  Clock3,
  History,
  RotateCcw,
  Settings2,
  Sparkles,
  Trash2,
  UsersRound,
} from "lucide-react";
import { motion } from "motion/react";

export default function App()  { 
  
  const [currentPage, setCurrentPage] = useState<
  "dashboard" | "register" | "scanner">("dashboard");
  
  const [activeTab, setActiveTab] = useState<"attendance" | "participants">(
    "attendance");

  const [sessionError, setSessionError] = useState<string | null>(null);
  const [participants, setParticipants] = useState<any[]>([]);  
  const [attendance, setAttendance] = useState<any[]>([]);
  const [session, setSession] = useState<any | null>(null);
  const [participantToDelete, setParticipantToDelete] = useState<any | null>(null);
  const [morningSession, setMorningSession] = useState<any | null>(null);
  const [afternoonSession, setAfternoonSession] = useState<any | null>(null);
  const todayDate: string = new Date().toLocaleDateString("en-CA");

  const [selectedDate, setSelectedDate] = useState(todayDate);
  const [selectedPeriod, setSelectedPeriod] = useState<"Morning" | "Afternoon">("Morning");
  const [searchQuery, setSearchQuery] = useState("");

  const [editingParticipant, setEditingParticipant] = useState<any | null>(null);
  const [qrData, setQrData] = useState<any | null>(null);

  const [isEditingSession, setIsEditingSession] = useState(false); 
  const [lateTime, setLateTime] = useState("");
  const [cutoffTime, setCutoffTime] = useState("");
  const [statusFilter, setStatusFilter] = useState<
  "All" | "Present" | "Late" | "Absent"
>("All");


  // ✅ LOAD DATA
const loadData = async () => {
  // ✅ 1. GET TODAY
  const today = selectedDate;
  // ✅ GET ALL SESSIONS TODAY
const { data: sessionsData } = await supabase
  .from("sessions")
  .select("*")
  .eq("session_date", today);

// ✅ SPLIT INTO MORNING / AFTERNOON
const morning = sessionsData?.find(s => s.session_period === "Morning");
const afternoon = sessionsData?.find(s => s.session_period === "Afternoon");

// ✅ SAVE THEM
setMorningSession(morning || null);
setAfternoonSession(afternoon || null);

// ✅ SET CURRENT SESSION BASED ON SELECTED PERIOD
const current =
  selectedPeriod === "Morning" ? morning : afternoon;

setSession(current || null);

// ✅ LOAD SETTINGS
if (current) {
  setLateTime(current.late_time || "");
  setCutoffTime(current.cutoff_time || "");
} else {
  setLateTime("");
  setCutoffTime("");
}


  // ✅ 3. GET STUDENTS
const { data: studentsData } = await supabase
  .from("students")
  .select("*")
  .order("last_name", { ascending: true })
  .order("first_name", { ascending: true });

  let attendanceData: any[] = [];

  // ✅ 4. GET ATTENDANCE ONLY FOR TODAY
if (current) {
  const { data } = await supabase
    .from("attendance")
    .select("*")
    .eq("session_id", current.id);

  attendanceData = data || [];
}

  // ✅ 5. SET STATE
  setParticipants(studentsData || []);
  setAttendance(attendanceData);
};

useEffect(() => {
  // 🔥 load data ONCE when component mounts
  loadData();

  const channel = supabase
    .channel("realtime-attendance")

    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "attendance" },
      () => {
        loadData(); // refresh on scan
      }
    )

    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "students" },
      () => {
        loadData(); // refresh on edit/delete
      }
    )
          .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sessions" },
        () => {
          loadData(); // 🔥 refresh when session is created/deleted
        }
      )

    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [selectedDate, selectedPeriod]);// 🔥 DEPENDENCY ON selectedDate TO RELOAD WHEN DATE CHANGES

const handleDownloadQR = async (record: any) => {
  try {
    const fullName =
      record.name ||
      `${record.first_name || ""} ${record.last_name || ""}`.trim();

const qrValue = record.student_code || record.id.toString();

const url = await toDataURL(qrValue, {
  width: 300,
});

    const link = document.createElement("a");
    link.href = url;
    link.download = `${fullName || "participant"}-qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error("QR download error:", err);
  }
};

const handleCreateSession = async () => {
  try {
    const { error } = await supabase.from("sessions").insert([
      {
        session_name: `${selectedPeriod} Session ${selectedDate}`,
        session_date: selectedDate,
        session_period: selectedPeriod,
        late_time: null,
        cutoff_time: null,
      },
    ]);

    if (error) {
      console.error("Create session error:", error);
      alert(error.message);
      return;
    }

    await loadData();
  } catch (err) {
    console.error("Create session error:", err);
  }
};


  // ✅ MATCH AttendanceTable TYPE EXACTLY
  const attendanceRecords: AttendanceRecord[] = participants.map((student) => {
    const record = attendance.find(
      (a) => a.student_id == student.id
    );

    return {
      id: student.id.toString(), // string REQUIRED

      name: `${student.first_name} ${student.last_name}`,

      age: student.age_group || "-",

      gender: student.gender || "-",

      status: record?.status || "Absent",

      time: record
        ? new Date(record.created_at).toLocaleTimeString("en-PH", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })
        : "-",

      isNew: false,
    };
  });

  // ✅ FILTER ATTENDANCE
  const statusOrder = {
    Present: 1,
    Late: 2,
    Absent: 3,
  };

  const filteredAttendance = attendanceRecords
    .filter((r) => {
      const matchesSearch = r.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "All" || r.status === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const statusDiff = statusOrder[a.status] - statusOrder[b.status];

      if (statusDiff !== 0) return statusDiff;

      return a.name.localeCompare(b.name);
    });

  // ✅ FILTER PARTICIPANTS
  const filteredParticipants = participants.filter(
    (p) =>
      p.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.last_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ✅ COUNTERS
  const presentCount = attendanceRecords.filter(
    (r) => r.status === "Present"
  ).length;

  const lateCount = attendanceRecords.filter(
    (r) => r.status === "Late"
  ).length;

  const absentCount = attendanceRecords.filter(
    (r) => r.status === "Absent"
  ).length;
  // ✅ DELETE
      const handleDeleteParticipant = async (id: number) => {
        await supabase.from("students").delete().eq("id", id);

        setParticipantToDelete(null);
        loadData();
      };

  // ✅ EDIT SAVE
const handleSaveParticipant = async (updated: any) => {
  await supabase
    .from("students")
    .update({
      first_name: updated.firstName,
      last_name: updated.lastName,
      middle_initial: updated.middleInitial,
      age_group: updated.ageGroup,
      gender: updated.gender,
      contact_number: updated.contact,
      school: updated.school,
      course: updated.course,        // ✅ THIS IS THE FIX
      grade_year: updated.gradeYear,
    })
    .eq("id", updated.id);

  setEditingParticipant(null);
  loadData();
};

const handleSaveSessionSettings = async () => {
  if (!session) return;

 setSessionError(null);

if (!lateTime || !cutoffTime) {
  setSessionError("Please set both late time and cutoff time.");
  return;
}

if (selectedPeriod === "Morning") {
  if (lateTime >= "12:00" || cutoffTime >= "12:00") {
    setSessionError("Morning session must be before 12:00 PM.");
    return;
  }
}

if (selectedPeriod === "Afternoon") {
  if (lateTime < "12:00" || cutoffTime < "12:00") {
    setSessionError("Afternoon session must be 12:00 PM or later.");
    return;
  }
}

if (lateTime >= cutoffTime) {
  setSessionError("Late time must be earlier than cutoff time.");
  return;
}

const { error } = await supabase
  .from("sessions")
  .update({
    late_time: lateTime,
    cutoff_time: cutoffTime,
  })
  .eq("id", session.id);

if (error) {
  setSessionError("Failed to save settings.");
  return;
}

// ✅ update local session immediately
setSession({
  ...session,
  late_time: lateTime,
  cutoff_time: cutoffTime,
});

setIsEditingSession(false);

// 🔥 OPTIONAL: delay loadData to sync
setTimeout(() => {
  loadData();
}, 300);
};

const formatTime = (time: string) => {
  if (!time) return "-";

  return new Date(`1970-01-01T${time}`).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

  // ✅ QR (NOW MATCHES AttendanceRecord)
const handleShowQR = (item: any) => {
  const name = item.first_name
    ? `${item.first_name} ${item.last_name}`
    : item.name;

  const studentCode = item.student_code || item.id;

  setQrData({
    name,
    studentCode,
    data: studentCode,
  });
};

if (currentPage === "register") {
  return (
    <RegistrationPage
      currentPage={currentPage}
      setCurrentPage={setCurrentPage}
    />
  );
}

const isToday = selectedDate === todayDate;

if (currentPage === "scanner" && !isToday) {
  return (
    <div className="app-shell flex min-h-screen items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.94, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="surface-card w-full max-w-md rounded-3xl p-7 text-center">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-amber-50 text-amber-600">
          <History size={25} />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Historical date selected</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">Scanning is available only for today. Return to the dashboard and switch back to today before opening the scanner.</p>
        <button
          onClick={() => setCurrentPage("dashboard")}
          className="brand-button mt-6 w-full rounded-xl px-4 py-3 text-sm font-semibold"
        >
          Back to Dashboard
        </button>
      </motion.div>
    </div>
  );
}

if (currentPage === "scanner") {
  return (
    <QRScannerPage
      currentPage={currentPage}
      setCurrentPage={setCurrentPage}
      selectedPeriod={selectedPeriod}
    />
  );
}


  // ✅ EXPORT (for Header)
const handleExportCSV = () => {
  const rows =
    activeTab === "attendance"
      ? filteredAttendance.map((r) => ({
          Name: r.name,
          Age: r.age,
          Gender: r.gender,
          Status: r.status,
          Time: r.time,
          Date: selectedDate,
          Session: selectedPeriod,
        }))
      : filteredParticipants.map((p) => ({
          "First Name": p.first_name,
          "Last Name": p.last_name,
          "Middle Initial": p.middle_initial || "",
          "Age Group": p.age_group || "",
          Gender: p.gender || "",
          School: p.school || "",
          Course: p.course || "",
          "Grade/Year": p.grade_year || "",
          "Contact Number": p.contact_number || "",
        }));

  if (rows.length === 0) {
    alert("No data to export.");
    return;
  }

  const headers = Object.keys(rows[0]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((header) => {
          const value = String(row[header as keyof typeof row] ?? "");
          return `"${value.replace(/"/g, '""')}"`;
        })
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download =
    activeTab === "attendance"
      ? `attendance-${selectedDate}-${selectedPeriod}.csv`
      : `participants.csv`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};

  return (
    <div className="app-shell page-mobile-clearance">
      <span className="ambient-orb left-[-7rem] top-28 h-60 w-60 bg-indigo-300/20" />
      <span className="ambient-orb right-[-8rem] top-[28rem] h-72 w-72 bg-cyan-300/20 [animation-delay:-3s]" />
      <Header onExportCSV={handleExportCSV} />

      <main className="page-enter mx-auto max-w-7xl space-y-5 px-3 py-5 min-[390px]:px-4 sm:space-y-6 sm:px-6 sm:py-7 lg:px-8">
        <Navigation currentPage={currentPage} onNavigate={setCurrentPage} />

        <section className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
              {activeTab === "attendance" ? <Sparkles size={14} /> : <UsersRound size={14} />}
              Next Moves Company
            </div>
            <h2 className="gradient-text text-[clamp(1.75rem,8vw,2.25rem)] font-black leading-[1.08] tracking-tight sm:text-4xl">
              {activeTab === "attendance" ? "Next Moves attendance center" : "Next Moves member directory"}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
              {activeTab === "attendance"
                ? "Monitor company check-ins, manage session rules, and keep every Next Moves group running smoothly."
                : "View, update, and manage every registered Next Moves participant and their QR access."}
            </p>
          </div>
          <div className="flex items-center gap-3 self-start sm:self-auto">
            <div className="next-moves-art hidden h-16 w-24 rounded-2xl border border-amber-200 shadow-lg sm:block" role="img" aria-label="Next Moves Company brand artwork" />
            <div className="flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50/80 px-3 py-2 text-xs font-bold text-emerald-700 shadow-sm">
              <span className="status-live h-2.5 w-2.5 rounded-full bg-emerald-500" />
              System live
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
        </section>

        {activeTab === "attendance" && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="surface-card rounded-2xl p-3 min-[390px]:p-4 sm:rounded-3xl sm:p-5"
          >
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-indigo-50 text-indigo-600">
                  <CalendarDays size={21} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Session date</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="min-w-0 max-w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                    />
                    {isToday && (
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">Today</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex rounded-2xl border border-slate-200 bg-slate-100/80 p-1">
                  {(["Morning", "Afternoon"] as const).map((period) => (
                    <button
                      key={period}
                      type="button"
                      onClick={() => setSelectedPeriod(period)}
                      className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all sm:flex-none ${
                        selectedPeriod === period
                          ? "bg-white text-indigo-700 shadow-sm"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                      aria-pressed={selectedPeriod === period}
                    >
                      {period}
                    </button>
                  ))}
                </div>

                {!isToday && (
                  <button onClick={() => setSelectedDate(todayDate)} className="flex items-center justify-center gap-2 rounded-xl bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100">
                    <RotateCcw size={16} />
                    Back to today
                  </button>
                )}

                {isToday && ((selectedPeriod === "Morning" && !morningSession) || (selectedPeriod === "Afternoon" && !afternoonSession)) && (
                  <button onClick={handleCreateSession} className="brand-button rounded-xl px-4 py-2.5 text-sm font-semibold">
                    Start {selectedPeriod} session
                  </button>
                )}
              </div>
            </div>
          </motion.section>
        )}

        {activeTab === "attendance" ? (
          <div className="space-y-5">
            <StatsCards
              presentCount={presentCount}
              lateCount={lateCount}
              absentCount={absentCount}
              statusFilter={statusFilter}
              onStatusFilter={setStatusFilter}
            />

            {session && isToday && (
              <motion.section layout className="surface-card overflow-hidden rounded-3xl p-5 sm:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-violet-50 text-violet-600">
                      <Settings2 size={21} />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-slate-900">Session timing</h3>
                        <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-700">{selectedPeriod}</span>
                        {isEditingSession && <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700">Editing</span>}
                      </div>
                      <p className="mt-1 text-sm text-slate-500">Set the thresholds used to mark late arrivals and close check-in.</p>
                    </div>
                  </div>

                  {!isEditingSession ? (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-2xl border border-amber-100 bg-amber-50/80 px-4 py-2.5">
                          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-amber-600">Late after</p>
                          <p className="mt-0.5 font-bold text-slate-800">{formatTime(lateTime)}</p>
                        </div>
                        <div className="rounded-2xl border border-rose-100 bg-rose-50/80 px-4 py-2.5">
                          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-rose-600">Cutoff</p>
                          <p className="mt-0.5 font-bold text-slate-800">{formatTime(cutoffTime)}</p>
                        </div>
                      </div>
                      <button onClick={() => setIsEditingSession(true)} className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-indigo-700">
                        Edit timing
                      </button>
                    </div>
                  ) : (
                    <div className="w-full space-y-3 lg:max-w-2xl">
                      <div className="flex flex-wrap items-end gap-3">
                        <label className="min-w-[150px] flex-1 text-xs font-bold uppercase tracking-[0.1em] text-slate-500">
                          Late time
                          <input
                            type="time"
                            value={lateTime}
                            min={selectedPeriod === "Morning" ? "00:00" : "12:00"}
                            max={selectedPeriod === "Morning" ? "11:59" : "23:59"}
                            onChange={(e) => { setLateTime(e.target.value); setSessionError(null); }}
                            className="field-control mt-1 block px-3 py-2 text-sm normal-case tracking-normal"
                          />
                        </label>
                        <label className="min-w-[150px] flex-1 text-xs font-bold uppercase tracking-[0.1em] text-slate-500">
                          Cutoff time
                          <input
                            type="time"
                            value={cutoffTime}
                            min={selectedPeriod === "Morning" ? "00:00" : "12:00"}
                            max={selectedPeriod === "Morning" ? "11:59" : "23:59"}
                            onChange={(e) => { setCutoffTime(e.target.value); setSessionError(null); }}
                            className="field-control mt-1 block px-3 py-2 text-sm normal-case tracking-normal"
                          />
                        </label>
                        <button onClick={handleSaveSessionSettings} className="flex h-11 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-emerald-700">
                          <Check size={16} /> Save
                        </button>
                        <button
                          onClick={() => {
                            setLateTime(session?.late_time || "");
                            setCutoffTime(session?.cutoff_time || "");
                            setSessionError(null);
                            setIsEditingSession(false);
                          }}
                          className="h-11 rounded-xl bg-slate-100 px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-200"
                        >
                          Cancel
                        </button>
                      </div>
                      {sessionError && (
                        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
                          <AlertTriangle size={16} /> {sessionError}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.section>
            )}

            {!session && (
              <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="surface-card rounded-3xl border-amber-200/70 p-6 text-center">
                <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-amber-50 text-amber-600">
                  <Clock3 size={22} />
                </div>
                <h3 className="font-bold text-slate-900">{isToday ? `No ${selectedPeriod.toLowerCase()} session yet` : "No session on this date"}</h3>
                <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
                  {isToday ? "Start the session when you are ready to begin accepting attendance scans." : "Choose another date to review its attendance records."}
                </p>
              </motion.section>
            )}

            {session && <AttendanceTable records={filteredAttendance} />}
          </div>
        ) : (
          <ParticipantsTable
            participants={filteredParticipants}
            onEdit={(p:any) => setEditingParticipant({
              id: p.id,
              firstName: p.first_name,
              lastName: p.last_name,
              middleInitial: p.middle_initial,
              ageGroup: p.age_group,
              gender: p.gender,
              contact: p.contact_number,
              school: p.school,
              course: p.course,
              gradeYear: p.grade_year,
            })}
            onDelete={(id: string) => {
              const participant = participants.find((p) => p.id === Number(id));
              setParticipantToDelete(participant);
            }}
            onShowQR={handleShowQR}
            onDownloadQR={handleDownloadQR}
          />
        )}
      </main>

      {editingParticipant && <EditModal participant={editingParticipant} onClose={() => setEditingParticipant(null)} onSave={handleSaveParticipant} />}
      {qrData && <QRModal name={qrData.name} data={qrData.data} studentCode={qrData.studentCode} onClose={() => setQrData(null)} />}

      {participantToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.92, y: 18 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="surface-card max-h-[calc(100dvh-1.5rem)] w-full max-w-sm overflow-y-auto rounded-3xl p-5 shadow-2xl sm:p-6">
            <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-rose-50 text-rose-600">
              <Trash2 size={22} />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Delete participant?</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Are you sure you want to delete <span className="font-bold text-slate-900">{participantToDelete.first_name} {participantToDelete.last_name}</span>? This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setParticipantToDelete(null)} className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200">Cancel</button>
              <button onClick={() => handleDeleteParticipant(participantToDelete.id)} className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-500/20 transition hover:-translate-y-0.5 hover:bg-rose-700">Delete</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
  
}
