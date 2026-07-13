import { Check, UserRoundPen, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion } from 'motion/react';

interface EditModalProps {
  participant: any | null;
  onClose: () => void;
  onSave: (participant: any) => void;
}

export default function EditModal({ participant, onClose, onSave }: EditModalProps) {
  const [formData, setFormData] = useState<any | null>(null);

  useEffect(() => {
    if (participant) {
      setFormData(participant);
    }
  }, [participant]);

  if (!participant || !formData) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value || null });
  };

  const fieldClass = "field-control px-4 py-2.5 text-sm";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/55 p-2.5 backdrop-blur-sm sm:p-4" role="dialog" aria-modal="true" aria-labelledby="edit-participant-title">
      <motion.div initial={{ opacity: 0, scale: 0.94, y: 20, rotateX: -4 }} animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }} className="responsive-scroll surface-card max-h-[calc(100dvh-1.25rem)] w-full max-w-2xl overflow-y-auto overscroll-contain rounded-2xl shadow-2xl sm:max-h-[90vh] sm:rounded-3xl">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-2 rounded-t-2xl border-b border-slate-100 bg-white/90 px-3 py-3 backdrop-blur-xl sm:rounded-t-3xl sm:px-6 sm:py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-indigo-50 text-indigo-600"><UserRoundPen size={19} /></div>
            <div className="min-w-0">
              <h2 id="edit-participant-title" className="text-base font-bold leading-tight text-slate-900 sm:text-xl">Edit Next Moves Participant</h2>
              <p className="text-xs text-slate-500">Update this company attendance profile</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close edit participant dialog"
          >
            <X size={18} className="sm:w-5 sm:h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-3 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                className={fieldClass}
                required
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                className={fieldClass}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Middle Initial</label>
              <input
                type="text"
                maxLength={1}
                value={formData.middleInitial || ''}
                onChange={(e) => handleChange('middleInitial', e.target.value)}
                className={fieldClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Age Group</label>
              <select
                value={formData.ageGroup}
                onChange={(e) => handleChange('ageGroup', e.target.value)}
                className={fieldClass}
                required
              >
                <option value="Kids">6-7 | KIDS</option>
                <option value="Teens">13-17 | TEENAGERS</option>
                <option value="Adult">18+ | ADULTS</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => handleChange('gender', e.target.value)}
                className={fieldClass}
                required
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
              <input
                type="tel"
                value={formData.contact}
                onChange={(e) => handleChange('contact', e.target.value)}
                className={fieldClass}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">School</label>
              <input
                type="text"
                value={formData.school || ''}
                onChange={(e) => handleChange('school', e.target.value)}
                className={fieldClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Course / Strand</label>
              <input
                type="text"
                value={formData.course || ''}
                onChange={(e) => handleChange('course', e.target.value)}
                className={fieldClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Grade / Year</label>
              <input
                type="text"
                value={formData.gradeYear || ''}
                onChange={(e) => handleChange('gradeYear', e.target.value)}
                className={fieldClass}
              />
            </div>
          </div>

          <div className="sticky bottom-0 -mx-3 flex gap-2 border-t border-slate-100 bg-white/94 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur sm:static sm:mx-0 sm:gap-3 sm:border-0 sm:bg-transparent sm:px-0 sm:pb-0 sm:pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="brand-button flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold"
            >
              <Check size={16} /> Save changes
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
