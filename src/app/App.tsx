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


  const [participants, setParticipants] = useState<any[]>([]);  
  const [attendance, setAttendance] = useState<any[]>([]);
  const [session, setSession] = useState<any | null>(null);
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

    const url = await toDataURL(record.id.toString(), {
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
const filteredAttendance = attendanceRecords.filter((r) => {
  const matchesSearch = r.name
    .toLowerCase()
    .includes(searchQuery.toLowerCase());

  const matchesStatus = statusFilter === "All" || r.status === statusFilter;

  return matchesSearch && matchesStatus;
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
    if (!confirm("Delete this participant?")) return;

    await supabase.from("students").delete().eq("id", id);
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

  await supabase
    .from("sessions")
    .update({
      late_time: lateTime,
      cutoff_time: cutoffTime,
    })
    .eq("id", session.id);

  // ✅ EXIT EDIT MODE
  setIsEditingSession(false);

  // ✅ REFRESH DATA
  loadData();
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
    // from AttendanceTable
    if (item.name && item.id) {
      setQrData({
        name: item.name,
        data: item.id.toString(),
      });
    } 
    // from ParticipantsTable
    else {
      setQrData({
        name: `${item.first_name} ${item.last_name}`,
        data: item.id.toString(),
      });
    }
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
    console.log("Export CSV clicked");
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

                  <select
                  value={selectedPeriod}
                  onChange={(e) =>
                    setSelectedPeriod(e.target.value as "Morning" | "Afternoon")
                  }
                  className="bg-white border rounded-lg px-3 py-2 outline-none text-sm"
                >
                  <option value="Morning">Morning</option>
                  <option value="Afternoon">Afternoon</option>
                </select>
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
<div className="bg-white rounded-xl p-4 shadow-sm border space-y-4">

  <h3 className="font-semibold text-gray-700">Session Settings</h3>

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
    <div className="flex flex-wrap items-end gap-3">
      
      <div>
        <label className="text-xs text-gray-500">Late Time</label>
        <input
          type="time"
          value={lateTime}
          onChange={(e) => setLateTime(e.target.value)}
          className="block border rounded-lg px-3 py-2 mt-1"
        />
      </div>

      <div>
        <label className="text-xs text-gray-500">Cutoff Time</label>
        <input
          type="time"
          value={cutoffTime}
          onChange={(e) => setCutoffTime(e.target.value)}
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
        onClick={() => setIsEditingSession(false)}
        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg text-sm"
      >
        Cancel
      </button>
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
              onShowQR={handleShowQR}
              onDownloadQR={handleDownloadQR}
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
            onDelete={(id: string) => handleDeleteParticipant(Number(id))}
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
          onClose={() => setQrData(null)}
        />
      )}
    </div>
  );
  
}