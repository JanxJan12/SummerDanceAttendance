import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { Camera, CheckCircle, Clock3, Keyboard, ScanLine, ShieldCheck, XCircle, Zap } from 'lucide-react';
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
  throw new Error("Invalid member code");
}

const { data: student, error: studentError } = await supabase
  .from("students")
  .select("*")
  .or(`student_code.eq.${scannedCode},id.eq.${scannedCode}`)
  .maybeSingle(); 

if (studentError) {
  console.error("STUDENT ERROR:", studentError);
  throw new Error("Failed to find participant");
}

if (!student) {
  throw new Error("Participant not found");
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
      name: `${student.first_name} ${student.last_name}`,
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
    <div className="page-mobile-clearance relative min-h-screen overflow-x-clip bg-[#18070a] text-white">
      <div className="pointer-events-none absolute left-[-12rem] top-20 h-96 w-96 rounded-full bg-indigo-600/24 blur-3xl" />
      <div className="pointer-events-none absolute right-[-10rem] top-[34rem] h-80 w-80 rounded-full bg-cyan-500/18 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-3 py-5 min-[390px]:px-4 sm:px-6 lg:px-8">
        <Navigation currentPage={currentPage} onNavigate={setCurrentPage} />
      </div>

      <header className="relative mx-auto max-w-5xl px-3 pb-5 pt-2 min-[390px]:px-4 sm:px-6 sm:pb-6 sm:pt-3 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="next-moves-seal mt-0.5 h-12 w-12 shrink-0 rounded-2xl sm:h-14 sm:w-14" role="img" aria-label="Next Moves Company logo" />
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-300"><Zap size={14} /> Next Moves live check-in</div>
              <h1 className="text-[clamp(1.65rem,8vw,2.25rem)] font-black leading-tight tracking-tight sm:text-4xl">Scan company QR pass</h1>
              <p className="mt-2 text-sm text-slate-400">Center the Next Moves code inside the illuminated frame for instant attendance.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-200 backdrop-blur sm:self-auto">
            <span className={`h-2.5 w-2.5 rounded-full ${scanning ? 'status-live bg-emerald-400' : 'bg-rose-400'}`} />
            {selectedPeriod} · {scanning ? 'Camera ready' : 'Camera offline'}
          </div>
        </div>
      </header>

      <main className="relative mx-auto grid max-w-5xl gap-4 px-3 min-[390px]:px-4 sm:gap-5 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:px-8">
        <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="rounded-[2rem] border border-white/10 bg-white/5 p-3 shadow-[0_30px_80px_-35px_rgba(214,155,32,0.38)] backdrop-blur-xl sm:p-4">
          <div className="relative overflow-hidden rounded-[1.5rem] bg-black shadow-2xl [transform:perspective(1000px)_rotateX(0.8deg)]">
            <div className="aspect-square">
              <video ref={videoRef} className="h-full w-full object-cover" autoPlay playsInline muted />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_15%,rgba(2,6,23,0.52)_100%)]" />

              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="scanner-frame-glow scanner-target relative aspect-square rounded-[2rem] border border-cyan-300/70 shadow-[0_0_45px_rgba(248,207,82,0.3),inset_0_0_35px_rgba(214,155,32,0.14)]">
                  <span className="absolute left-[-2px] top-[-2px] h-10 w-10 rounded-tl-2xl border-l-4 border-t-4 border-white" />
                  <span className="absolute right-[-2px] top-[-2px] h-10 w-10 rounded-tr-2xl border-r-4 border-t-4 border-white" />
                  <span className="absolute bottom-[-2px] left-[-2px] h-10 w-10 rounded-bl-2xl border-b-4 border-l-4 border-white" />
                  <span className="absolute bottom-[-2px] right-[-2px] h-10 w-10 rounded-br-2xl border-b-4 border-r-4 border-white" />
                  {scanning && <div className="absolute left-3 right-3 top-3 h-0.5 animate-[scan_2s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-cyan-300 to-transparent shadow-[0_0_15px_rgba(248,207,82,0.9)]" />}
                </div>
              </div>

              {!scanning && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm">
                  <div className="text-center">
                    <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-white/8 text-slate-400"><Camera size={27} /></div>
                    <p className="font-semibold text-slate-300">Camera not available</p>
                    <p className="mt-1 text-xs text-slate-500">Check camera permissions and reload.</p>
                  </div>
                </div>
              )}
            </div>

            <AnimatePresence>
              {scanResult && (
                <motion.div initial={{ scale: 0.82, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.86, opacity: 0 }} className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
                  <motion.div
                    initial={{ rotateX: -8 }}
                    animate={{ rotateX: 0 }}
                    className={`w-full max-w-sm overflow-hidden rounded-3xl border p-6 text-center text-white shadow-2xl ${scanResult.status === 'success' ? 'border-emerald-300/30 bg-gradient-to-br from-emerald-500 to-teal-600' : 'border-rose-300/30 bg-gradient-to-br from-rose-500 to-red-700'}`}
                  >
                    <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-white/16">
                      {scanResult.status === 'success' ? <CheckCircle size={30} /> : <XCircle size={30} />}
                    </div>
                    <h3 className="text-xl font-black">{scanResult.name}</h3>
                    <p className="mt-1 text-sm font-semibold text-white/90">{scanResult.status === "success" ? scanResult.attendanceStatus : "Scan error"}</p>
                    <p className="mt-3 text-xs text-white/70">{scanResult.time}</p>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-center gap-2 px-3 pb-1 pt-4 text-xs font-medium text-slate-400">
            <ShieldCheck size={14} className="text-cyan-400" /> Scanner locks briefly after each result to prevent duplicate reads.
          </div>
        </motion.section>

        <motion.aside initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.08 }} className="space-y-5">
          <section className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-indigo-500/15 text-indigo-300"><Keyboard size={19} /></div>
              <div><h2 className="font-bold text-white">Manual check-in</h2><p className="text-xs text-slate-400">Use a Next Moves member code if scanning is unavailable.</p></div>
            </div>
            {!showManualInput ? (
              <button onClick={() => setShowManualInput(true)} className="w-full rounded-xl border border-white/10 bg-white/8 px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:border-indigo-400/50 hover:bg-indigo-500/15">
                Enter member code
              </button>
            ) : (
              <form onSubmit={handleManualSubmit} className="space-y-3">
                <input type="text" value={manualId} onChange={(e) => setManualId(e.target.value)} placeholder="MEMBER CODE" className="w-full rounded-xl border border-white/10 bg-slate-950/55 px-4 py-3 font-mono text-sm tracking-wider text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/10" autoFocus />
                <div className="flex gap-2">
                  <button type="button" onClick={() => { setShowManualInput(false); setManualId(''); }} className="flex-1 rounded-xl bg-white/8 px-3 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/12">Cancel</button>
                  <button type="submit" className="flex-1 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-3 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-950/30 transition hover:-translate-y-0.5">Check in</button>
                </div>
              </form>
            )}
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-cyan-500/15 text-cyan-300"><Clock3 size={19} /></div>
                <div><h2 className="font-bold text-white">Recent scans</h2><p className="text-xs text-slate-400">This device session</p></div>
              </div>
              <span className="rounded-full bg-white/8 px-2.5 py-1 text-xs font-bold text-slate-300">{recentScans.length}</span>
            </div>

            {recentScans.length === 0 ? (
              <div className="grid min-h-40 place-items-center rounded-2xl border border-dashed border-white/10 bg-slate-950/20 px-4 text-center">
                <div><ScanLine className="mx-auto mb-2 text-slate-600" size={26} /><p className="text-sm font-semibold text-slate-400">Waiting for the first scan</p></div>
              </div>
            ) : (
              <div className="max-h-[22rem] space-y-2 overflow-y-auto pr-1">
                {recentScans.map((scan, index) => (
                  <motion.div key={scan.id + scan.time} initial={{ x: -16, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className={`flex items-center justify-between rounded-2xl border p-3 ${scan.status === 'success' ? 'border-emerald-500/15 bg-emerald-500/8' : 'border-rose-500/15 bg-rose-500/8'} ${index === 0 ? 'ring-1 ring-cyan-400/35' : ''}`}>
                    <div className="flex min-w-0 items-center gap-3">
                      {scan.status === 'success' ? <CheckCircle className="shrink-0 text-emerald-400" size={17} /> : <XCircle className="shrink-0 text-rose-400" size={17} />}
                      <div className="min-w-0"><p className="truncate text-sm font-semibold text-white">{scan.name}</p><p className="text-[11px] text-slate-500">{scan.time}</p></div>
                    </div>
                    <span className={`ml-2 shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${scan.status === 'success' ? 'bg-emerald-400/12 text-emerald-300' : 'bg-rose-400/12 text-rose-300'}`}>{scan.status === "success" ? scan.attendanceStatus : "Error"}</span>
                  </motion.div>
                ))}
              </div>
            )}
          </section>
        </motion.aside>
      </main>
    </div>
  );
}
