import { Download, Edit, QrCode, Trash2, UsersRound } from 'lucide-react';
import { motion } from 'motion/react';

interface Participant {
  id: string;
  student_code?: string;
  first_name: string;
  last_name: string;
  middle_initial: string | null;
  age_group: string;
  gender: string;
  contact_number: string | null;
  school: string | null;
  grade_year: string | null;
  course: string | null;
  is_official?: boolean;
  membership_year?: string | null;
}

interface ParticipantsTableProps {
  participants: Participant[];
  onEdit: (participant: Participant) => void;
  onDelete: (id: string) => void;
  onShowQR: (participant: Participant) => void;
  onDownloadQR: (participant: Participant) => void;
}

const getAgeBadgeClass = (ageGroup: string) => {
  if (ageGroup === "Kids") return "border-amber-200 bg-amber-50 text-amber-800";
  if (ageGroup === "Teens") return "border-rose-200 bg-rose-50 text-rose-700";
  if (ageGroup === "Adult") return "border-indigo-200 bg-indigo-50 text-indigo-800";
  return "bg-slate-50 text-slate-600 border-slate-200";
};

const getGenderBadgeClass = (gender: string) => {
  if (gender === "Male") return "border-cyan-200 bg-cyan-50 text-cyan-800";
  if (gender === "Female") return "border-rose-200 bg-rose-50 text-rose-700";
  return "bg-slate-50 text-slate-600 border-slate-200";
};

export default function ParticipantsTable({
  participants,
  onEdit,
  onDelete,
  onShowQR,
  onDownloadQR,
}: ParticipantsTableProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="surface-card overflow-hidden rounded-3xl"
    >
      <div className="relative overflow-hidden border-b border-amber-200/60 bg-gradient-to-r from-indigo-900 via-indigo-700 to-indigo-900 px-5 py-5 sm:px-6">
        <div className="brand-rays pointer-events-none absolute inset-0 opacity-50" />
        <div className="relative flex items-center gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-amber-300/50 bg-amber-300/15 text-amber-200 shadow-inner">
            <UsersRound size={21} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-300">Member registry</p>
            <h3 className="mt-0.5 font-bold text-white">Next Moves Directory</h3>
            <p className="text-sm text-amber-100/80">
              {participants.length} Registered Member{participants.length !== 1 ? 's' : ''}
            </p>
          </div>
          <img
            src="/next-moves-brand.jpg"
            alt=""
            className="hidden h-14 w-14 shrink-0 rounded-2xl border border-amber-300/50 object-cover shadow-lg sm:block"
          />
        </div>
      </div>

      {participants.length === 0 ? (
        <div className="grid min-h-64 place-items-center px-6 py-12 text-center">
          <div>
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-400">
              <UsersRound size={25} />
            </div>
            <h4 className="font-semibold text-slate-800">No Members found</h4>
            <p className="mt-1 text-sm text-slate-500">Try another search or register a new member.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-3 p-3 sm:p-4 md:grid-cols-2 xl:hidden">
            {participants.map((participant, index) => {
              const fullName = `${participant.first_name} ${participant.last_name}`;
              const memberInitials = `${participant.first_name?.[0] || ''}${participant.last_name?.[0] || ''}`.toUpperCase();
              return (
                <motion.article
                  key={`mobile-${participant.id}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.035, 0.3) }}
                  className="rounded-2xl border border-amber-100 bg-white/90 p-4 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-indigo-100 to-cyan-100 text-sm font-black text-indigo-800 shadow-inner">{memberInitials}</span>
                    <div className="min-w-0 flex-1">
                      <h4 className="break-words text-base font-bold leading-5 text-slate-900">{fullName}</h4>
                      {participant.student_code && <p className="mt-1 break-all font-mono text-[11px] font-semibold tracking-wider text-slate-400">{participant.student_code}</p>}
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {participant.is_official && <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-800">Official {participant.membership_year || ''}</span>}
                        <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getAgeBadgeClass(participant.age_group)}`}>{participant.age_group}</span>
                        <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getGenderBadgeClass(participant.gender)}`}>{participant.gender}</span>
                      </div>
                    </div>
                  </div>

                  <dl className="mt-4 grid grid-cols-1 gap-3 border-t border-amber-100 pt-4 min-[420px]:grid-cols-2">
                    <div className="min-w-0"><dt className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Contact</dt><dd className="mt-1 break-words text-xs font-medium text-slate-700">{participant.contact_number || '-'}</dd></div>
                    <div className="min-w-0"><dt className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">School</dt><dd className="mt-1 break-words text-xs font-medium text-slate-700">{participant.school || '-'}</dd></div>
                    <div className="min-w-0"><dt className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Course / Strand</dt><dd className="mt-1 break-words text-xs font-medium text-slate-700">{participant.course || '-'}</dd></div>
                    <div className="min-w-0"><dt className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Grade / Year</dt><dd className="mt-1 break-words text-xs font-medium text-slate-700">{participant.grade_year || '-'}</dd></div>
                  </dl>

                  <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <button onClick={() => onShowQR(participant)} className="tap-target flex items-center justify-center gap-2 rounded-xl bg-indigo-50 px-2 text-xs font-bold text-indigo-700 transition active:scale-[0.98]" aria-label={`Show QR code for ${fullName}`}><QrCode size={16} /> QR</button>
                    <button onClick={() => onDownloadQR(participant)} className="tap-target flex items-center justify-center gap-2 rounded-xl bg-emerald-50 px-2 text-xs font-bold text-emerald-700 transition active:scale-[0.98]" aria-label={`Download QR code for ${fullName}`}><Download size={16} /> Save</button>
                    <button onClick={() => onEdit(participant)} className="tap-target flex items-center justify-center gap-2 rounded-xl bg-amber-50 px-2 text-xs font-bold text-amber-700 transition active:scale-[0.98]" aria-label={`Edit ${fullName}`}><Edit size={16} /> Edit</button>
                    <button onClick={() => onDelete(participant.id)} className="tap-target flex items-center justify-center gap-2 rounded-xl bg-rose-50 px-2 text-xs font-bold text-rose-700 transition active:scale-[0.98]" aria-label={`Delete ${fullName}`}><Trash2 size={16} /> Delete</button>
                  </div>
                </motion.article>
              );
            })}
          </div>

          <div className="responsive-scroll hidden overflow-x-auto xl:block">
          <table className="w-full min-w-[1050px]">
            <thead>
              <tr className="border-b border-amber-300/40 bg-indigo-900">
                {['First Name', 'Last Name', 'MI', 'Age Group', 'Gender', 'Contact Number', 'School', 'Course / Strand', 'Grade / Year'].map((heading) => (
                  <th key={heading} className="px-4 py-4 text-left text-[11px] font-bold uppercase tracking-[0.1em] text-amber-100 first:pl-6">
                    {heading}
                  </th>
                ))}
                <th className="sticky right-0 z-20 w-[170px] border-l border-amber-300/25 bg-indigo-900 px-3 py-4 text-center text-[11px] font-bold uppercase tracking-[0.1em] text-amber-100">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {participants.map((participant, index) => {
                const fullName = `${participant.first_name} ${participant.last_name}`;
                return (
                  <motion.tr
                    key={participant.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(index * 0.02, 0.28) }}
                    className="group border-b border-amber-100/80 transition-colors last:border-b-0 hover:bg-amber-50/60"
                  >
                    <td className="px-4 py-4 pl-6 text-sm font-semibold text-slate-900">
                      <div>{participant.first_name}</div>
                      {participant.is_official && <span className="mt-1 inline-flex rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-amber-800">Official {participant.membership_year || ''}</span>}
                    </td>
                    <td className="px-4 py-4 text-sm font-semibold text-slate-900">{participant.last_name}</td>
                    <td className="px-4 py-4 text-sm text-slate-600">{participant.middle_initial || '-'}</td>
                    <td className="px-4 py-4 text-sm">
                      <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getAgeBadgeClass(participant.age_group)}`}>
                        {participant.age_group}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getGenderBadgeClass(participant.gender)}`}>
                        {participant.gender}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">{participant.contact_number || '-'}</td>
                    <td className="max-w-[170px] truncate px-4 py-4 text-sm text-slate-600" title={participant.school || '-'}>{participant.school || '-'}</td>
                    <td className="max-w-[150px] truncate px-4 py-4 text-sm text-slate-600" title={participant.course || '-'}>{participant.course || '-'}</td>
                    <td className="px-4 py-4 text-sm text-slate-600">{participant.grade_year || '-'}</td>
                    <td className="sticky right-0 z-10 w-[170px] border-l border-amber-100 bg-white/95 px-3 py-3 backdrop-blur transition-colors group-hover:bg-amber-50/95">
                      <div className="flex justify-center gap-1.5">
                        <button onClick={() => onShowQR(participant)} className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-50 text-indigo-600 transition hover:-translate-y-0.5 hover:bg-indigo-600 hover:text-white" title="Show QR Code" aria-label={`Show QR code for ${fullName}`}>
                          <QrCode size={15} />
                        </button>
                        <button onClick={() => onDownloadQR(participant)} className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-50 text-emerald-600 transition hover:-translate-y-0.5 hover:bg-emerald-600 hover:text-white" title="Download QR Code" aria-label={`Download QR code for ${fullName}`}>
                          <Download size={15} />
                        </button>
                        <button onClick={() => onEdit(participant)} className="grid h-8 w-8 place-items-center rounded-lg bg-amber-50 text-amber-600 transition hover:-translate-y-0.5 hover:bg-amber-500 hover:text-white" title="Edit" aria-label={`Edit ${fullName}`}>
                          <Edit size={15} />
                        </button>
                        <button onClick={() => onDelete(participant.id)} className="grid h-8 w-8 place-items-center rounded-lg bg-rose-50 text-rose-600 transition hover:-translate-y-0.5 hover:bg-rose-600 hover:text-white" title="Delete" aria-label={`Delete ${fullName}`}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </>
      )}
    </motion.section>
  );
}
