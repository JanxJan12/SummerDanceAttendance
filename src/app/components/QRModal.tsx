import { ShieldCheck, X } from "lucide-react";
import { motion } from "motion/react";
import { QRCodeSVG } from "qrcode.react";

interface QRModalProps {
  name: string;
  studentCode?: string;
  data: string;
  onClose: () => void;
}

export default function QRModal({ name, studentCode, data, onClose }: QRModalProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-2.5 backdrop-blur-sm sm:p-4" role="dialog" aria-modal="true" aria-labelledby="qr-dialog-title">
      <motion.div
        initial={{ opacity: 0, scale: 0.88, y: 24, rotateY: -5 }}
        animate={{ opacity: 1, scale: 1, y: 0, rotateY: 0 }}
        transition={{ type: "spring", stiffness: 230, damping: 22 }}
        className="responsive-scroll surface-card relative max-h-[calc(100dvh-1.25rem)] w-full max-w-md overflow-y-auto overscroll-contain rounded-2xl shadow-2xl sm:rounded-3xl"
      >
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500" />
        <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full border-[22px] border-white/10" />

        <div className="relative flex items-center justify-between px-5 py-4 text-white sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="next-moves-seal h-9 w-9 rounded-xl" role="img" aria-label="Next Moves Company logo" />
            <h2 id="qr-dialog-title" className="text-lg font-bold">Next Moves QR Pass</h2>
          </div>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 transition hover:bg-white/20" aria-label="Close QR code dialog">
            <X size={18} />
          </button>
        </div>

        <div className="relative px-4 pb-5 pt-6 text-center min-[390px]:px-6 sm:px-8 sm:pb-7 sm:pt-7">
          <div className="mx-auto w-fit max-w-full rounded-[1.75rem] bg-white p-3 shadow-[0_22px_55px_-25px_rgba(30,41,59,0.65)] ring-1 ring-slate-100 [transform:perspective(700px)_rotateX(1.5deg)]">
            <div className="rounded-2xl border border-indigo-100 bg-white p-4">
              <QRCodeSVG value={data} size={200} level="M" className="h-auto w-full max-w-[200px]" />
            </div>
          </div>

          <h3 className="mt-6 text-xl font-black tracking-tight text-slate-900">{name}</h3>
          {studentCode && (
            <div className="mt-2 inline-flex rounded-full border border-indigo-100 bg-indigo-50 px-4 py-1.5 font-mono text-sm font-bold tracking-[0.18em] text-indigo-700">
              {studentCode}
            </div>
          )}
          <p className="mt-4 flex items-center justify-center gap-1.5 text-xs font-medium text-slate-500">
            <ShieldCheck size={14} className="text-emerald-500" />
            Verified Next Moves attendance identity
          </p>
        </div>
      </motion.div>
    </div>
  );
}
