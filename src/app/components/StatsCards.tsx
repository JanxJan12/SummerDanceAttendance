import { Check, Clock, UserCheck, UserX } from "lucide-react";
import { motion } from "motion/react";

interface StatsCardsProps {
  presentCount: number;
  lateCount: number;
  absentCount: number;
  statusFilter: "All" | "Present" | "Late" | "Absent";
  onStatusFilter: (status: "All" | "Present" | "Late" | "Absent") => void;
}

export default function StatsCards({
  presentCount,
  lateCount,
  absentCount,
  statusFilter,
  onStatusFilter,
}: StatsCardsProps) {
  const total = presentCount + lateCount + absentCount;
  const cards = [
    {
      status: "Present" as const,
      count: presentCount,
      icon: UserCheck,
      gradient: "from-emerald-500/18 via-emerald-50/80 to-white",
      iconStyle: "bg-emerald-500 text-white shadow-emerald-500/25",
      textStyle: "text-emerald-700",
      ring: "ring-emerald-400",
      progress: "bg-emerald-500",
    },
    {
      status: "Late" as const,
      count: lateCount,
      icon: Clock,
      gradient: "from-amber-400/20 via-amber-50/80 to-white",
      iconStyle: "bg-amber-500 text-white shadow-amber-500/25",
      textStyle: "text-amber-700",
      ring: "ring-amber-400",
      progress: "bg-amber-500",
    },
    {
      status: "Absent" as const,
      count: absentCount,
      icon: UserX,
      gradient: "from-rose-500/16 via-rose-50/80 to-white",
      iconStyle: "bg-rose-500 text-white shadow-rose-500/25",
      textStyle: "text-rose-700",
      ring: "ring-rose-400",
      progress: "bg-rose-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {cards.map((card, index) => {
        const Icon = card.icon;
        const selected = statusFilter === card.status;
        const percentage = total ? Math.round((card.count / total) * 100) : 0;

        return (
          <motion.button
            key={card.status}
            type="button"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08, duration: 0.38 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onStatusFilter(selected ? "All" : card.status)}
            className={`surface-card surface-lift relative overflow-hidden rounded-2xl bg-gradient-to-br ${card.gradient} p-5 text-left ring-offset-2 ring-offset-transparent ${
              selected ? `ring-2 ${card.ring}` : ''
            }`}
            aria-pressed={selected}
            aria-label={`${card.status}: ${card.count}. ${selected ? 'Clear' : 'Apply'} filter`}
          >
            <div className="relative z-10 flex items-start justify-between gap-3">
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <div className={`grid h-11 w-11 place-items-center rounded-2xl shadow-lg ${card.iconStyle}`}>
                    <Icon size={21} />
                  </div>
                  {selected && (
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-white text-indigo-600 shadow-sm">
                      <Check size={14} strokeWidth={3} />
                    </span>
                  )}
                </div>
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">{card.status}</p>
                <p className="mt-1 text-3xl font-black tracking-tight text-slate-900">{card.count}</p>
              </div>
              <div className="text-right">
                <span className={`text-lg font-bold ${card.textStyle}`}>{percentage}%</span>
                <p className="text-[11px] text-slate-400">of {total}</p>
              </div>
            </div>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/70">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ delay: 0.2 + index * 0.08, duration: 0.6 }}
                className={`h-full rounded-full ${card.progress}`}
              />
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
