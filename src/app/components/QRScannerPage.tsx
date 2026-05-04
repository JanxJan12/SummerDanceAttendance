import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { CheckCircle, XCircle, Camera, Keyboard } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {supabase } from '../../lib/supabase';
import Navigation from "./Navigation";

interface ScanResult {
  id: string;
  name: string;
  time: string;
  status: "success" | "error";
  attendanceStatus?: "Present" | "Late";
}

export default function QRScannerPage({
  currentPage,
  setCurrentPage,
  selectedPeriod,
}: {
  currentPage: "dashboard" | "register" | "scanner";
  setCurrentPage: (page: "dashboard" | "register" | "scanner") => void;
  selectedPeriod: "Morning" | "Afternoon";
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [recentScans, setRecentScans] = useState<ScanResult[]>([]);
  const [manualId, setManualId] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const [scanLock, setScanLock] = useState(false);

  useEffect(() => {
    startScanning();
    return () => {
      stopScanning();
    };
  }, []);

  const startScanning = async () => {
    try {
      const codeReader = new BrowserMultiFormatReader();
      codeReaderRef.current = codeReader;

const devices = await BrowserMultiFormatReader.listVideoInputDevices();

if (devices.length === 0) {
  console.error("No camera found");
  return;
}

// 🔥 Prefer BACK camera (important for phones)
const backCamera =
  devices.find((d) => d.label.toLowerCase().includes("back")) || devices[0];

// 🔥 Request better quality stream
const stream = await navigator.mediaDevices.getUserMedia({
  video: {
    deviceId: backCamera.deviceId,
    facingMode: "environment",
    width: { ideal: 1280 },
    height: { ideal: 720 },
  },
});

if (videoRef.current) {
  videoRef.current.srcObject = stream;
}

setScanning(true);

// 🔥 Use selected camera
await codeReader.decodeFromVideoDevice(
  backCamera.deviceId,
  videoRef.current!,
  (result, error) => {
    if (result) {
      handleScan(result.getText());
    }
  }
);
    } catch (err:any) {
      console.error('Error starting scanner:', err);
    }
  };

const stopScanning = () => {
  try {
    // stop camera tracks
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }

    // safely stop ZXing if method exists
    const reader: any = codeReaderRef.current;
    if (reader?.reset) {
      reader.reset();
    }

    codeReaderRef.current = null;
    setScanning(false);
  } catch (err) {
    console.error("Stop scanner error:", err);
  }
};




  
const handleScan = async (data: string) => {
  // 🔥 PREVENT MULTIPLE SCANS
  if (scanLock) return;
  setScanLock(true);

  console.log("SCANNED RAW:", data);

  try {
    // ✅ 1. GET TODAY
    const today = new Date().toLocaleDateString("en-CA");

    // ✅ 2. GET SESSION (NO AUTO CREATE)
  let { data: session, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("session_date", today)
    .eq("session_period", selectedPeriod)
    .maybeSingle();

    if (error) {
      console.error("SESSION ERROR:", error);
      throw new Error("Failed to fetch session");
    }

    if (!session) {
      throw new Error("No active session for today");
    }

    // ✅ GET CURRENT TIME (HH:MM format)
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);

    // ✅ SESSION SETTINGS
    const lateTime = session.late_time;
    const cutoffTime = session.cutoff_time;

    // ❌ BLOCK AFTER CUTOFF
    if (cutoffTime && currentTime > cutoffTime) {
      throw new Error("Attendance timeout. Cutoff time has passed.");
    }

    // ⚠️ DETERMINE STATUS
    let attendanceStatus: "Present" | "Late" = "Present";

    if (lateTime && currentTime > lateTime) {
      attendanceStatus = "Late";
    }

    // ✅ 3. PARSE QR
    let studentId;

    try {
      const parsed = JSON.parse(data);
      studentId = typeof parsed === "object" ? parsed.id : parsed;
    } catch {
      studentId = data;
    }

    const scannedCode = String(studentId).trim();

if (!scannedCode) {
  throw new Error("Invalid student code");
}

const { data: student, error: studentError } = await supabase
  .from("students")
  .select("*")
  .eq("student_code", scannedCode)
  .maybeSingle();

if (studentError) {
  console.error("STUDENT ERROR:", studentError);
  throw new Error("Failed to find student");
}

if (!student) {
  throw new Error("Student code not found");
}

studentId = student.id;

console.log("FINAL STUDENT ID:", studentId);

    // ✅ 4. CHECK DUPLICATE
    const { data: existing } = await supabase
      .from("attendance")
      .select("*")
      .eq("student_id", studentId)
      .eq("session_id", session.id)
      .maybeSingle();

    if (existing) {
      throw new Error("Already scanned");
    }

    // ✅ 5. INSERT ATTENDANCE
    const { error: insertError } = await supabase
      .from("attendance")
      .insert([
        {
          student_id: studentId,
          session_id: session.id,
          status: attendanceStatus,
        },
      ]);

    if (insertError) {
      throw insertError;
    }

    // ✅ 6. SUCCESS UI
    const result: ScanResult = {
      id: studentId.toString(),
      name: `Participant ${studentId}`,
      time: new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      status: "success",
      attendanceStatus,
    };

    // 🔥 vibration feedback
if (navigator.vibrate) {
  navigator.vibrate(
    attendanceStatus === "Late" ? [100, 50, 100] : 100
  );
}

    setScanResult(result);
    setRecentScans((prev) => [result, ...prev.slice(0, 9)]);

    // 🔓 UNLOCK AFTER DELAY
    setTimeout(() => {
      setScanResult(null);
      setScanLock(false);
    }, 2000);

  } catch (err: any) {
    console.error("FULL ERROR:", err);

    const errorResult: ScanResult = {
      id: Date.now().toString(),
      name: err.message || "Unknown error",
      time: new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      status: "error",
    };

    setScanResult(errorResult);

    // 🔓 UNLOCK EVEN ON ERROR
    setTimeout(() => {
      setScanResult(null);
      setScanLock(false);
    }, 2000);
  }
};

const handleManualSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!manualId.trim()) return;

  await handleScan(manualId.trim());

  setManualId("");
  setShowManualInput(false);
};

  return (
        <div className="min-h-screen bg-gray-900 flex flex-col">
          <div className="bg-gray-900 border-b border-gray-800 px-4 py-4">
  <div className="max-w-3xl mx-auto flex justify-center gap-3">
    <button
      onClick={() => setCurrentPage("dashboard")}
      className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
        currentPage === "dashboard"
          ? "bg-blue-600 text-white"
          : "text-gray-300 hover:bg-gray-800"
      }`}
    >
      Dashboard
    </button>

    <button
      onClick={() => setCurrentPage("register")}
      className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
        currentPage === "register"
          ? "bg-blue-600 text-white"
          : "text-gray-300 hover:bg-gray-800"
      }`}
    >
      Register
    </button>

    <button
      onClick={() => setCurrentPage("scanner")}
      className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-600 text-white"
    >
      Scanner
    </button>
  </div>
</div>


      
        <header className="bg-gray-900 px-4 py-6 text-center">
          <h1 className="text-2xl font-semibold text-white">
            Scan QR Code
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Align the code inside the frame
          </p>
        </header>

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-lg"> 
          <div className="relative">
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-black/70 px-3 py-1 rounded-full text-xs text-white z-10">
          {scanning ? "Scanning..." : "Camera Off"}
        </div>
            <div className="aspect-square bg-black rounded-2xl overflow-hidden relative shadow-xl">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                muted
              />
              <div className="absolute inset-0 bg-black/20"></div>

              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                
                {/* Scan Box */}
              <div className="w-64 sm:w-72 h-64 sm:h-72 border-2 border-blue-400 rounded-3xl relative shadow-[0_0_20px_rgba(59,130,246,0.4)]">

                {/* Corner accents */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-xl"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-xl"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-xl"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-xl"></div>

                {/* Smooth scanning line */}
                <div className="absolute left-0 w-full h-1 bg-blue-400 animate-[scan_2s_linear_infinite]"></div>

              </div>

              </div>
              {!scanning && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                  <div className="text-center">
                    <Camera className="text-gray-400 mx-auto mb-2" size={48} />
                    <p className="text-gray-400">Camera not available</p>
                  </div>
                </div>
              )}
            </div>

            <AnimatePresence>
              {scanResult && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <div
                    className={`rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-2xl max-w-sm w-full mx-4 ${
                      scanResult.status === 'success' ? 'bg-green-600' : 'bg-red-600'
                    }`}
                  >
                    <div className="text-center text-white">
                      {scanResult.status === 'success' ? (
                        <CheckCircle className="mx-auto mb-2 sm:mb-3" size={36} />
                      ) : (
                        <XCircle className="mx-auto mb-2 sm:mb-3" size={36} />
                      )}
                      <h3 className="text-lg sm:text-xl font-semibold mb-1">{scanResult.name}</h3>
                      <p className="text-xs sm:text-sm opacity-90">
                        {scanResult.status === "success"
                          ? scanResult.attendanceStatus
                          : "Error"}
                      </p>
                      <p className="text-xs sm:text-sm opacity-75 mt-2">{scanResult.time}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-4 sm:mt-6">
            {!showManualInput ? (
              <button
                onClick={() => setShowManualInput(true)}
                className="w-full flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-800 text-white rounded-xl hover:bg-gray-700 transition-colors border border-gray-700 text-sm sm:text-base"
              >
                <Keyboard size={16} className="sm:w-[18px] sm:h-[18px]" />
                Manual Input
              </button>
            ) : (
              <form onSubmit={handleManualSubmit} className="space-y-3">
                <input
                  type="text"
                  value={manualId}
                  onChange={(e) => setManualId(e.target.value)}
                  placeholder="ENTER STUDENT CODE"
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-gray-800 border border-gray-700 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm sm:text-base"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowManualInput(false);
                      setManualId('');
                    }}
                    className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-800 text-gray-300 rounded-xl hover:bg-gray-700 transition-colors border border-gray-700 text-sm sm:text-base"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm sm:text-base"
                  >
                    Mark Present
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {recentScans.length > 0 && (
        <div className="bg-gray-800 border-t border-gray-700 px-4 sm:px-6 py-3 sm:py-4">
          <h3 className="text-xs sm:text-sm font-semibold text-gray-300 mb-2 sm:mb-3">Recent Scans</h3>
          <div className="space-y-2 max-h-40 sm:max-h-48 overflow-y-auto">
            {recentScans.map((scan, index) => (
              <motion.div
                key={scan.id + scan.time}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-center justify-between p-2 sm:p-3 rounded-lg ${
                  scan.status === 'success' ? 'bg-green-900/30' : 'bg-red-900/30'
                } ${index === 0 ? 'ring-1 sm:ring-2 ring-blue-500' : ''}`}
              >
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  {scan.status === 'success' ? (
                    <CheckCircle className="text-green-400 flex-shrink-0" size={16} />
                  ) : (
                    <XCircle className="text-red-400 flex-shrink-0" size={16} />
                  )}
                  <div className="min-w-0">
                    <p className="text-white text-xs sm:text-sm font-medium truncate">{scan.name}</p>
                    <p className="text-gray-400 text-[10px] sm:text-xs">{scan.time}</p>
                  </div>
                </div>
                <span
                  className={`text-[10px] sm:text-xs font-medium px-1.5 sm:px-2 py-0.5 sm:py-1 rounded flex-shrink-0 ${
                    scan.status === 'success'
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {scan.status === "success" ? scan.attendanceStatus : "Error"}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
