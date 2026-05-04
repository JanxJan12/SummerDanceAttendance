import { X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";


interface QRModalProps {
  name: string;
  studentCode?: string;
  data: string;
  onClose: () => void;
}

export default function QRModal({
  name,
  studentCode,
  data,
  onClose,
}: QRModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-md">

        {/* HEADER */}
        <div className="border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between rounded-t-xl sm:rounded-t-2xl">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
            QR Code
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={18} className="sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* CONTENT */}
        <div className="p-6 sm:p-8 flex flex-col items-center">

          {/* ✅ NAME ONLY */}
          <p className="text-base sm:text-lg font-semibold text-gray-900 mb-4 text-center">
            {name}
          </p>

          {/* ✅ QR CODE */}
          <div className="p-4 bg-white rounded-xl border-2 border-gray-200 shadow-sm">
            <QRCodeSVG
              value={data}
              size={window.innerWidth < 640 ? 160 : 200}
            />
          </div>

          {/* ✅ STUDENT CODE (BOTTOM) */}
          {studentCode && (
            <div className="mt-5 text-center">
              <p className="text-lg font-bold tracking-widest text-gray-900">
                {studentCode}
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
