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
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-6 rounded-xl shadow text-center space-y-4">
        <p className="text-red-600 font-semibold">
          Scanning is only allowed for today's session.
        </p>

        <button
          onClick={() => setCurrentPage("dashboard")}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          Back to Dashboard
        </button>
      </div>
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
    <div className="min-h-screen bg-gray-100">
      <Header onExportCSV={handleExportCSV} />
      

      <main className="max-w-6xl mx-auto p-4 space-y-4">
    
        <Navigation currentPage={currentPage} onNavigate={setCurrentPage} />

        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

        

        <SearchBar value={searchQuery} onChange={setSearchQuery} />
          <div className="flex justify-between items-center mb-4">
            
            {/* ✅ Dynamic Title */}
            <h2 className="text-lg font-semibold">
              {activeTab === "attendance" ? "Attendance" : "Participants"}
            </h2>

            {/* ✅ ONLY SHOW DATE PICKER IN ATTENDANCE TAB */}
            {activeTab === "attendance" && (
              <div className="flex items-center gap-2">
                
                {/* 📅 Date Picker */}
                <div className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2">
                  <span>📅</span>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="outline-none"
                  />

                  {/* ● Today Indicator */}
                  {selectedDate === todayDate && (
                    <span className="text-green-600 text-sm font-medium">
                      ● Today
                    </span>
                  )}
                  {/* 🟢 Start Session Button (ONLY TODAY + NO SESSION) */}
                  {selectedDate === todayDate &&
                  ((selectedPeriod === "Morning" && !morningSession) ||
                  (selectedPeriod === "Afternoon" && !afternoonSession)) && (
                    <button
                      onClick={handleCreateSession}
                      className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                    >
                      Start {selectedPeriod} Session
                    </button>
                  )}

                <div className="flex bg-gray-100 rounded-xl p-1 border">
                  <button
                    type="button"
                    onClick={() => setSelectedPeriod("Morning")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      selectedPeriod === "Morning"
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Morning
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedPeriod("Afternoon")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      selectedPeriod === "Afternoon"
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Afternoon
                  </button>
                </div>
                </div>

                {/* 🔥 Back to Today */}
                {selectedDate !== todayDate && (
                  <button
                    onClick={() => setSelectedDate(todayDate)}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    Back to Today
                  </button>
                )}

              </div>
            )}
          </div>
          
      {activeTab === "attendance" ? (
        <>
      <StatsCards
        presentCount={presentCount}
        lateCount={lateCount}
        absentCount={absentCount}
        statusFilter={statusFilter}
        onStatusFilter={setStatusFilter}
      />
          {/* ✅ SESSION SETTINGS (ONLY TODAY + HAS SESSION) */}
{session && isToday && (
<div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">

  <div>
  <h3 className="font-semibold text-gray-800">Session Settings</h3> 
  <p className="text-sm text-gray-500">
    Manage late and cutoff times for Morning and Afternoon sessions.
  </p>
</div>
  {isEditingSession && (
    <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
      Editing: {selectedPeriod}
    </div>
  )}

  {!isEditingSession ? (
    // ✅ VIEW MODE
    <div className="flex items-center justify-between">

        <div className="space-y-2">

          <p className="text-sm text-gray-500">
            Late Time:
            <span className="ml-2 font-semibold text-yellow-600">
              {formatTime(lateTime)}
            </span>
          </p>

          <p className="text-sm text-gray-500">
            Cutoff Time:
            <span className="ml-2 font-semibold text-red-600">
              {formatTime(cutoffTime)}
            </span>
          </p>

        </div>

        <button
          onClick={() => setIsEditingSession(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
        >
          Edit Session
        </button>

      </div>

  ) : (
    // ✏️ EDIT MODE
<div className="space-y-3">
  
  {/* ROW: inputs + buttons */}
  <div className="flex flex-wrap items-end gap-3">
    
    <div>
      <label className="text-xs text-gray-500">Late Time</label>
      <input
        type="time"
        value={lateTime}
        min={selectedPeriod === "Morning" ? "00:00" : "12:00"}
        max={selectedPeriod === "Morning" ? "11:59" : "23:59"}
        onChange={(e) => {
          setLateTime(e.target.value);
          setSessionError(null);
        }}
        className="block border rounded-lg px-3 py-2 mt-1"
      />
    </div>

    <div>
      <label className="text-xs text-gray-500">Cutoff Time</label>
      <input
        type="time"
        value={cutoffTime}
        min={selectedPeriod === "Morning" ? "00:00" : "12:00"}
        max={selectedPeriod === "Morning" ? "11:59" : "23:59"}
        onChange={(e) => {
          setCutoffTime(e.target.value);
          setSessionError(null);
        }}
        className="block border rounded-lg px-3 py-2 mt-1"
      />
    </div>

    <button
      onClick={handleSaveSessionSettings}
      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
    >
      Save
    </button>

    <button
      onClick={() => {
        setLateTime(session?.late_time || "");
        setCutoffTime(session?.cutoff_time || "");
        setSessionError(null);
        setIsEditingSession(false);
      }}
      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg text-sm"
    >
      Cancel
    </button>

  </div>

  {/* ERROR BELOW */}
  {sessionError && (
    <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
      {sessionError}
    </div>
  )}

</div>
    
  )}
</div>
)}

          {/* ❌ NO SESSION */}
          {!session && (
            <div className="bg-yellow-100 text-yellow-800 p-4 rounded-lg text-center">
              {selectedDate === todayDate
                ? "No session yet. Start today's session to begin attendance."
                : "There is no attendance record on this day"}
            </div>
          )}

          {/* ✅ SHOW TABLE */}
          {session && (
            <AttendanceTable
              records={filteredAttendance}
            />
          )}
        </>
      ) : (
          <ParticipantsTable
            participants={filteredParticipants}
            onEdit={(p:any) => 
              setEditingParticipant({
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

      {/* EDIT MODAL */}
      {editingParticipant && (
        <EditModal
          participant={editingParticipant}
          onClose={() => setEditingParticipant(null)}
          onSave={handleSaveParticipant}
        />
      )}

      {/* QR MODAL */}
      {qrData && (
        <QRModal
          name={qrData.name}
          data={qrData.data}
          studentCode={qrData.studentCode} // ✅ ADD THIS
          onClose={() => setQrData(null)}
        />
      )}

      {participantToDelete && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-2">
        Delete participant?
      </h2>

      <p className="text-sm text-gray-600 mb-6">
        Are you sure you want to delete{" "}
        <span className="font-semibold text-gray-900">
          {participantToDelete.first_name} {participantToDelete.last_name}
        </span>
        ? This action cannot be undone.
      </p>

      <div className="flex gap-3 justify-end">
        <button
          onClick={() => setParticipantToDelete(null)}
          className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
        >
          Cancel
        </button>

        <button
          onClick={() => handleDeleteParticipant(participantToDelete.id)}
          className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
        >
          Delete
        </button>
      </div>
    </div>
  </div>
)}
    </div>

    
  );
  
}