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
  "dashboard" | "register" | "scanner"
>("dashboard");
  
  const [activeTab, setActiveTab] = useState<"attendance" | "participants">(
    "attendance"
    
  );


  const [participants, setParticipants] = useState<any[]>([]);  
  const [attendance, setAttendance] = useState<any[]>([]);
  const [session, setSession] = useState<any | null>(null);
  const todayDate: string = new Date().toLocaleDateString("en-CA");

  const [selectedDate, setSelectedDate] = useState(todayDate);
  const [searchQuery, setSearchQuery] = useState("");

  const [editingParticipant, setEditingParticipant] = useState<any | null>(null);
  const [qrData, setQrData] = useState<any | null>(null);

  // ✅ LOAD DATA
const loadData = async () => {
  // ✅ 1. GET TODAY
  const today = selectedDate;

  // ✅ 2. GET TODAY'S SESSION
const { data: sessionData } = await supabase
  .from("sessions")
  .select("*")
  .eq("session_date", today)
  .maybeSingle();

setSession(sessionData);

  // ✅ 3. GET STUDENTS
  const { data: studentsData } = await supabase
    .from("students")
    .select("*");

  let attendanceData: any[] = [];

  // ✅ 4. GET ATTENDANCE ONLY FOR TODAY
  if (sessionData) {
    const { data } = await supabase
      .from("attendance")
      .select("*")
      .eq("session_id", sessionData.id); // 🔥 THIS IS THE FIX

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

    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [selectedDate]); // 🔥 DEPENDENCY ON selectedDate TO RELOAD WHEN DATE CHANGES

const handleDownloadQR = async (record: any) => {
  try {
    const url = await toDataURL(record.id, {
      width: 200,
    });

    const link = document.createElement("a");
    link.href = url;
    link.download = `${record.name}-qr.png`;
    link.click();
  } catch (err) {
    console.error(err);
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

      status: record ? "Present" : "Absent",

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
  const filteredAttendance = attendanceRecords.filter((r) =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  const absentCount = attendanceRecords.length - presentCount;

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

if (currentPage === "scanner") {
  if (!isToday) {
    alert("Scanning is only allowed for today's session");
    setCurrentPage("dashboard");
    return null;
  }

  return <QRScannerPage />;
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
            absentCount={absentCount}
          />

          {/* ❌ NO SESSION */}
          {!session && (
            <div className="bg-yellow-100 text-yellow-800 p-4 rounded-lg text-center">
              There is no attendance record on this day
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
            onDelete={(participant: any) => handleDeleteParticipant(participant.id)}
            onShowQR={handleShowQR}
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