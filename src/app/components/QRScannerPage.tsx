import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { CheckCircle, XCircle, Camera, Keyboard } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {supabase } from '../../lib/supabase';

interface ScanResult {
  id: string;
  name: string;
  time: string;
  status: 'success' | 'error';
}

export default function QRScannerPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [recentScans, setRecentScans] = useState<ScanResult[]>([]);
  const [manualId, setManualId] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);

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

    const videoInputDevices = await BrowserMultiFormatReader.listVideoInputDevices();
      if (videoInputDevices.length === 0) {
        console.error('No camera found');
        return;
      }

      setScanning(true);

      await codeReader.decodeFromVideoDevice(
        undefined,
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
    if (codeReaderRef.current) {
      (codeReaderRef.current as any).reset();
    }
    setScanning(false);
  };

const handleScan = async (data: string) => {
  console.log("SCANNED RAW:", data);

  try {
    // ✅ 1. GET TODAY (FIX TIMEZONE)
    const today = new Date().toLocaleDateString("en-CA");

    // ✅ 2. GET OR CREATE SESSION
    let { data: session, error } = await supabase
      .from("sessions")
      .select("*")
      .eq("session_date", today)
      .maybeSingle(); // 🔥 IMPORTANT

    if (error) {
      console.error("SESSION ERROR:", error);
    }

    if (!session) {
      const { data: newSession, error: insertError } = await supabase
        .from("sessions")
        .insert([
          {
            session_name: `Session ${today}`,
            session_date: today,
          },
        ])
        .select()
        .single();

      if (insertError) {
        console.error("CREATE SESSION ERROR:", insertError);
        throw insertError;
      }

      session = newSession;
    }

// ✅ 3. HANDLE QR FORMAT (FINAL FIX)
    let studentId;

    try {
      const parsed = JSON.parse(data);

      if (typeof parsed === "object") {
        studentId = parsed.id;
      } else {
        studentId = parsed;
      }
    } catch {
      studentId = data;
    }

    // 🔥 IMPORTANT: force number
    studentId = Number(studentId);

    // 🔥 validate
    if (!studentId) {
      throw new Error("Invalid QR");
    }

console.log("FINAL STUDENT ID:", studentId);

    console.log("STUDENT ID:", studentId);

    // ✅ 4. CHECK DUPLICATE
    const { data: existing } = await supabase
      .from("attendance")
      .select("*")
      .eq("student_id", studentId)
      .eq("session_id", session.id)
      .maybeSingle(); // 🔥 IMPORTANT

    if (existing) {
      throw new Error("Already scanned");
    }

    // ✅ 5. INSERT ATTENDANCE
    const { error: insertAttendanceError } = await supabase
      .from("attendance")
      .insert([
        {
          student_id: studentId,
          session_id: session.id,
        },
      ]);

    if (insertAttendanceError) {
      throw insertAttendanceError;
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
    };

    setScanResult(result);
    setRecentScans((prev) => [result, ...prev.slice(0, 9)]);
    setTimeout(() => setScanResult(null), 3000);

  } catch (err: any) {
  console.error("FULL ERROR:", err);

  const errorResult = {
    id: Date.now().toString(),
    name: err.message || "Unknown error",
    time: new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    status: "error",
  } as ScanResult;

  setScanResult(errorResult);
  setTimeout(() => setScanResult(null), 3000);
}
};
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualId.trim()) return;

    const result: ScanResult = {
      id: manualId,
      name: `Participant ${manualId}`,
      time: new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      status: 'success',
    };

    setScanResult(result);
    setRecentScans((prev) => [result, ...prev.slice(0, 9)]);
    setManualId('');
    setShowManualInput(false);

    setTimeout(() => setScanResult(null), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <header className="bg-gray-800 border-b border-gray-700 px-4 sm:px-6 py-3 sm:py-4">
        <h1 className="text-xl sm:text-2xl font-semibold text-white text-center">Attendance Scanner</h1>
        <p className="text-gray-400 text-center text-xs sm:text-sm mt-1">Scan participant QR code</p>
      </header>

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md">
          <div className="relative">
            <div className="aspect-square bg-black rounded-xl sm:rounded-2xl overflow-hidden relative">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                muted
              />

              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 border-2 sm:border-4 border-blue-500 rounded-xl sm:rounded-2xl m-4 sm:m-8 shadow-lg shadow-blue-500/50"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/80"></div>
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
                        {scanResult.status === 'success' ? 'Present' : 'Error'}
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
                  placeholder="Enter participant ID"
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
                  {scan.status === 'success' ? 'Present' : 'Error'}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
