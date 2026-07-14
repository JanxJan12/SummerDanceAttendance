import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { toDataURL } from "qrcode";
import { CheckCircle2, Download, QrCode, RotateCcw, ShieldCheck, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from "../../lib/supabase";
import Navigation, { type PageId } from "./Navigation";

interface FormData {
  firstName: string;
  lastName: string;
  middleInitial: string;
  ageGroup: string;
  gender: string;
  school: string;
  customSchool: string;
  courseStrand: string;
  gradeYear: string;
  contactNumber: string;
}

const initialFormData: FormData = {
  firstName: '',
  lastName: '',
  middleInitial: '',
  ageGroup: '',
  gender: '',
  school: '',
  customSchool: '',
  courseStrand: '',
  gradeYear: '',
  contactNumber: '',
};

const schools = [
  'Liceo De Cagayan University',
  'Cagayan De Oro College',
  'Capitol University',
  'Lourdes College Graduate School',
  'Xavier University - Ateneo De Cagayan',
  'Other',
];



export default function RegistrationPage({
  currentPage,
  setCurrentPage,
}: {
  currentPage: PageId;
  setCurrentPage: (page: PageId) => void;
}) {
const [formData, setFormData] = useState<FormData>(initialFormData);
const [registered, setRegistered] = useState(false);
const [qrData, setQrData] = useState("");
const [errors, setErrors] = useState<any>({});
  

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const validate = () => {
    const newErrors: Partial<FormData> = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.ageGroup) newErrors.ageGroup = 'Age group is required';
    if (!formData.gender) newErrors.gender = 'Gender is required';
    if (!formData.school) newErrors.school = 'School is required';
    if (formData.school === 'Other' && !formData.customSchool.trim()) {
      newErrors.customSchool = 'School name is required';
    }
    if (!formData.contactNumber.trim()) newErrors.contactNumber = 'Contact number is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!validate()) return;

  const finalSchool =
    formData.school === "Other" ? formData.customSchool : formData.school;

  const { data, error } = await supabase
    .from("students")
    .insert([
      {
        first_name: formData.firstName,
        last_name: formData.lastName,
        middle_initial: formData.middleInitial,
        age_group: formData.ageGroup,
        gender: formData.gender,
        school: finalSchool,
        course: formData.courseStrand,
        grade_year: formData.gradeYear,
        contact_number: formData.contactNumber,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error(error);
    alert("Error saving data");
    return;
  }

  // ✅ TRUE UNIQUE QR DATA
  const participantData = {
    id: data.id,
    name: `${formData.firstName} ${formData.lastName}`,
  };

  setQrData(JSON.stringify(participantData));
  setRegistered(true);
};

const handleDownloadQR = () => {
  const svg = document.getElementById("qrCanvas");

  if (!svg) {
    alert("QR not ready");
    return;
  }

  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(svg);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  const img = new Image();

  const svgBlob = new Blob([svgString], {
    type: "image/svg+xml;charset=utf-8",
  });

  const url = URL.createObjectURL(svgBlob);

  img.onload = () => {
    canvas.width = img.width;
    canvas.height = img.height;

    ctx?.drawImage(img, 0, 0);

    const pngUrl = canvas.toDataURL("image/png");

    const link = document.createElement("a");
    link.href = pngUrl;
    link.download = `qr-${formData.firstName}-${formData.lastName}.png`;
    link.click();

    URL.revokeObjectURL(url);
  };

  img.src = url;
};


  const handleRegisterAnother = () => {
    setFormData(initialFormData);
    setRegistered(false);
    setQrData('');
    setErrors({});
  };

  if (registered) {
    return (
      <div className="app-shell page-mobile-clearance min-h-screen">
        <span className="ambient-orb left-[8%] top-[18%] h-52 w-52 bg-emerald-300/20" />
        <span className="ambient-orb right-[7%] top-[45%] h-64 w-64 bg-indigo-300/20 [animation-delay:-2.5s]" />
        <div className="mx-auto max-w-7xl px-3 py-5 min-[390px]:px-4 sm:px-6 lg:px-8">
          <Navigation currentPage={currentPage} onNavigate={setCurrentPage} />
        </div>
        <div className="flex items-center justify-center px-3 py-4 min-[390px]:px-4 sm:px-6 sm:py-8">
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 190, damping: 20 }}
            className="surface-card w-full max-w-lg overflow-hidden rounded-3xl text-center"
          >
            <div className="relative overflow-hidden bg-gradient-to-br from-indigo-700 via-blue-700 to-cyan-600 px-6 pb-16 pt-8 text-white">
              <div className="next-moves-art absolute inset-0 opacity-20 mix-blend-luminosity" />
              <div className="absolute -right-12 -top-10 h-36 w-36 rounded-full border-[24px] border-white/10" />
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.18, type: 'spring' }} className="relative mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-white/18 shadow-xl backdrop-blur">
                <CheckCircle2 size={32} />
              </motion.div>
              <h2 className="relative text-2xl font-black tracking-tight sm:text-3xl">Next Moves pass created</h2>
              <p className="relative mt-2 text-sm text-white/80">The participant is ready for company attendance scanning.</p>
            </div>

            <div className="relative -mt-10 px-6 pb-7 sm:px-8">
              <div className="mx-auto w-fit max-w-full rounded-[1.75rem] bg-white p-3 shadow-[0_22px_55px_-25px_rgba(30,41,59,0.6)] ring-1 ring-slate-100">
                <div className="rounded-2xl border border-indigo-100 p-4">
                  <QRCodeSVG id="qrCanvas" value={qrData} size={200} className="h-auto w-full max-w-[200px]" />
                </div>
              </div>
              <h3 className="mt-5 text-xl font-black text-slate-900">{formData.firstName} {formData.lastName}</h3>
              <p className="mt-1 flex items-center justify-center gap-1.5 text-xs font-medium text-slate-500"><ShieldCheck size={14} className="text-emerald-500" /> Official Next Moves QR identity</p>

              <div className="mt-6 space-y-3">
                <button onClick={handleDownloadQR} className="brand-button flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold">
                  <Download size={17} /> Download QR Code
                </button>
                <button onClick={handleRegisterAnother} className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200">
                  <RotateCcw size={17} /> Register another
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell page-mobile-clearance min-h-screen">
      <span className="ambient-orb left-[-7rem] top-44 h-64 w-64 bg-indigo-300/20" />
      <span className="ambient-orb right-[-8rem] top-[40rem] h-72 w-72 bg-cyan-300/20 [animation-delay:-3s]" />
      <div className="mx-auto max-w-7xl px-3 py-5 min-[390px]:px-4 sm:px-6 lg:px-8">
        <Navigation currentPage={currentPage} onNavigate={setCurrentPage} />
      </div>
      <div className="mx-auto grid max-w-6xl gap-4 px-3 pb-8 min-[390px]:px-4 sm:gap-6 sm:px-6 lg:grid-cols-[0.78fr_1.22fr] lg:items-start lg:px-8">
        <aside className="page-enter lg:sticky lg:top-6">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-blue-700 to-cyan-600 p-7 text-white shadow-[0_30px_70px_-35px_rgba(104,18,25,0.82)] sm:p-9">
            <div className="next-moves-art absolute inset-0 opacity-20 mix-blend-luminosity" />
            <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full border-[32px] border-white/8" />
            <div className="absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-cyan-300/12 blur-2xl" />
            <div className="relative">
              <div className="next-moves-seal mb-6 h-14 w-14 rounded-2xl shadow-xl" role="img" aria-label="Next Moves Company logo" />
              <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-100"><Sparkles size={14} /> Next Moves enrollment</div>
              <h1 className="text-[clamp(1.8rem,9vw,2.25rem)] font-black leading-tight tracking-tight sm:text-4xl">Create a company QR pass.</h1>
              <p className="mt-4 text-sm leading-6 text-indigo-100">Add the participant's details once. Next Moves will create their unique QR identity for every attendance session.</p>
              <div className="mt-8 hidden space-y-3 lg:block">
                {['Member profile and demographics', 'School and contact details', 'Official Next Moves QR pass'].map((item, index) => (
                  <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-sm font-semibold backdrop-blur">
                    <span className="grid h-7 w-7 place-items-center rounded-xl bg-white/15 text-xs">{index + 1}</span>{item}
                  </div>
                ))}
              </div>
              <div className="mt-8 hidden items-center gap-2 border-t border-white/15 pt-5 text-xs text-indigo-100 lg:flex"><ShieldCheck size={15} /> Information is used only for attendance operations.</div>
            </div>
          </div>
        </aside>

        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="surface-card rounded-3xl p-5 sm:p-8">
          <div className="mb-7">
            <div className="mb-3 grid h-11 w-11 place-items-center rounded-2xl bg-indigo-50 text-indigo-600 lg:hidden"><QrCode size={21} /></div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900">Next Moves Members</h2>
            <p className="mt-1 text-sm text-slate-500">Complete the required fields marked with an asterisk.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div className="registration-section">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-800">
                <span className="grid h-7 w-7 place-items-center rounded-xl bg-indigo-100 text-xs text-indigo-700">
                  1
                </span>
                Personal Information
              </h3>
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleChange('firstName', e.target.value)}
                    className={`field-control px-4 py-2.5 text-sm ${errors.firstName ? '!border-rose-400 bg-rose-50/40' : ''}`}
                  />
                  {errors.firstName && (
                    <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleChange('lastName', e.target.value)}
                    className={`field-control px-4 py-2.5 text-sm ${errors.lastName ? '!border-rose-400 bg-rose-50/40' : ''}`}
                  />
                  {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Middle Initial
                  </label>
                  <input
                    type="text"
                    maxLength={1}
                    value={formData.middleInitial}
                    onChange={(e) => handleChange('middleInitial', e.target.value.toUpperCase())}
                    className="field-control px-4 py-2.5 text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="registration-section">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-800">
                <span className="grid h-7 w-7 place-items-center rounded-xl bg-indigo-100 text-xs text-indigo-700">
                  2
                </span>
                Demographics
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Age Group <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.ageGroup}
                    onChange={(e) => handleChange('ageGroup', e.target.value)}
                    className={`field-control px-4 py-2.5 text-sm ${errors.ageGroup ? '!border-rose-400 bg-rose-50/40' : ''}`}
                  >
                    <option value="">Select</option>
                    <option value="Kids">6–7 | KIDS</option>
                    <option value="Teens">13–17 | TEENAGERS</option>
                    <option value="Adult">18+ | ADULTS</option>
                  </select>
                  {errors.ageGroup && <p className="text-xs text-red-500 mt-1">{errors.ageGroup}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => handleChange('gender', e.target.value)}
                    className={`field-control px-4 py-2.5 text-sm ${errors.gender ? '!border-rose-400 bg-rose-50/40' : ''}`}
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                  {errors.gender && <p className="text-xs text-red-500 mt-1">{errors.gender}</p>}
                </div>
              </div>
            </div>

            <div className="registration-section">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-800">
                <span className="grid h-7 w-7 place-items-center rounded-xl bg-indigo-100 text-xs text-indigo-700">
                  3
                </span>
                School Information
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    School <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.school}
                    onChange={(e) => handleChange('school', e.target.value)}
                    className={`field-control px-4 py-2.5 text-sm ${errors.school ? '!border-rose-400 bg-rose-50/40' : ''}`}
                  >
                    <option value="">Select School</option>
                    {schools.map((school) => (
                      <option key={school} value={school}>
                        {school}
                      </option>
                    ))}
                  </select>
                  {errors.school && <p className="text-xs text-red-500 mt-1">{errors.school}</p>}
                </div>

                {formData.school === 'Other' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      School Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.customSchool}
                      onChange={(e) => handleChange('customSchool', e.target.value)}
                      className={`field-control px-4 py-2.5 text-sm ${errors.customSchool ? '!border-rose-400 bg-rose-50/40' : ''}`}
                    />
                    {errors.customSchool && (
                      <p className="text-xs text-red-500 mt-1">{errors.customSchool}</p>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Course / Strand
                  </label>
                  <input
                    type="text"
                    value={formData.courseStrand}
                    onChange={(e) => handleChange('courseStrand', e.target.value)}
                    className="field-control px-4 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Grade / Year
                  </label>
                  <input
                    type="text"
                    value={formData.gradeYear}
                    onChange={(e) => handleChange('gradeYear', e.target.value)}
                    className="field-control px-4 py-2.5 text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="registration-section">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-800">
                <span className="grid h-7 w-7 place-items-center rounded-xl bg-indigo-100 text-xs text-indigo-700">
                  4
                </span>
                Contact
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.contactNumber}
                  onChange={(e) => handleChange('contactNumber', e.target.value)}
                  placeholder="09XX XXX XXXX"
                  className={`field-control px-4 py-2.5 text-sm ${errors.contactNumber ? '!border-rose-400 bg-rose-50/40' : ''}`}
                />
                {errors.contactNumber && (
                  <p className="text-xs text-red-500 mt-1">{errors.contactNumber}</p>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="brand-button flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold"
            >
              <QrCode size={18} /> Register &amp; Generate QR
            </button>
          </form>
        </motion.div>
      </div>
    </div>

  );
}
