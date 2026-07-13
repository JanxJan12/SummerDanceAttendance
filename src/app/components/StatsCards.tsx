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
    <div className="grid grid-cols-3 gap-2 sm:gap-4">
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
            className={`surface-card surface-lift relative min-w-0 overflow-hidden rounded-2xl bg-gradient-to-br ${card.gradient} p-2.5 text-left ring-offset-2 ring-offset-transparent min-[390px]:p-3 sm:p-5 ${
              selected ? `ring-2 ${card.ring}` : ''
            }`}
            aria-pressed={selected}
            aria-label={`${card.status}: ${card.count}. ${selected ? 'Clear' : 'Apply'} filter`}
          >
            <div className="relative z-10 flex items-start justify-between gap-2 sm:gap-3">
              <div className="min-w-0">
                <div className="mb-2 flex items-center gap-1.5 sm:mb-3 sm:gap-2">
                  <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl shadow-lg sm:h-11 sm:w-11 sm:rounded-2xl ${card.iconStyle}`}>
                    <Icon size={18} className="sm:h-[21px] sm:w-[21px]" />
                  </div>
                  {selected && (
                    <span className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-white text-indigo-600 shadow-sm sm:static sm:h-6 sm:w-6">
                      <Check size={12} className="sm:h-3.5 sm:w-3.5" strokeWidth={3} />
                    </span>
                  )}
                </div>
                <p className="truncate text-[9px] font-bold uppercase tracking-[0.08em] text-slate-500 min-[390px]:text-[10px] sm:text-xs sm:tracking-[0.15em]">{card.status}</p>
                <p className="mt-0.5 text-2xl font-black tracking-tight text-slate-900 sm:mt-1 sm:text-3xl">{card.count}</p>
              </div>
              <div className="hidden text-right sm:block">
                <span className={`text-lg font-bold ${card.textStyle}`}>{percentage}%</span>
                <p className="text-[11px] text-slate-400">of {total}</p>
              </div>
            </div>
            <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-white/70 sm:mt-4 sm:h-1.5">
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
