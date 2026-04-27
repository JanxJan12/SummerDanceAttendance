import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { UserPlus, Download, RotateCcw } from 'lucide-react';
import { supabase } from "../../lib/supabase";
import Navigation from "./Navigation";

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



export default function RegistrationPage({ currentPage, setCurrentPage }: any) {
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 sm:p-6">
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-6 sm:p-8 w-full max-w-md text-center">
          <div className="mb-6">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserPlus className="text-green-600" size={24} />
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">Registration Successful!</h2>
            <p className="text-sm sm:text-base text-gray-600">
              {formData.firstName} {formData.lastName}
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 sm:p-6 mb-6">
            <p className="text-xs sm:text-sm text-gray-600 mb-4">Your QR Code</p>
            <div className="flex justify-center">
              <QRCodeSVG id="qrCanvas" value={qrData} size={200} />
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleDownloadQR}
              className="w-full flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium text-sm sm:text-base"
            >
              <Download size={16} className="sm:w-[18px] sm:h-[18px]" />
              Download QR Code
            </button>
            <button
              onClick={handleRegisterAnother}
              className="w-full flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium text-sm sm:text-base"
            >
              <RotateCcw size={16} className="sm:w-[18px] sm:h-[18px]" />
              Register Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50"> 

          <div className="max-w-6xl mx-auto p-4">
            <Navigation
              currentPage={currentPage}
              onNavigate={setCurrentPage}
            />
          </div>
      <div className="flex items-center justify-center p-4 sm:p-6">
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-6 sm:p-8 w-full max-w-lg">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">Participant Registration</h1>
            <p className="text-sm sm:text-base text-gray-600">Fill in your details to receive your QR code</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div>
              <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-3 sm:mb-4 flex items-center gap-2">
                <span className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-[10px] sm:text-xs">
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
                    className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg border ${
                      errors.firstName ? 'border-red-500' : 'border-gray-200'
                    } focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm sm:text-base`}
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
                    className={`w-full px-4 py-2.5 rounded-lg border ${
                      errors.lastName ? 'border-red-500' : 'border-gray-200'
                    } focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all`}
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
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs">
                  2
                </span>
                Demographics
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Age Group <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.ageGroup}
                    onChange={(e) => handleChange('ageGroup', e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-lg border ${
                      errors.ageGroup ? 'border-red-500' : 'border-gray-200'
                    } focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all`}
                  >
                    <option value="">Select</option>
                    <option value="6-7">6–7</option>
                    <option value="13-17">13–17</option>
                    <option value="18+">18+</option>
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
                    className={`w-full px-4 py-2.5 rounded-lg border ${
                      errors.gender ? 'border-red-500' : 'border-gray-200'
                    } focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all`}
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                  {errors.gender && <p className="text-xs text-red-500 mt-1">{errors.gender}</p>}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs">
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
                    className={`w-full px-4 py-2.5 rounded-lg border ${
                      errors.school ? 'border-red-500' : 'border-gray-200'
                    } focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all`}
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
                      className={`w-full px-4 py-2.5 rounded-lg border ${
                        errors.customSchool ? 'border-red-500' : 'border-gray-200'
                      } focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all`}
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
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
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
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs">
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
                  className={`w-full px-4 py-2.5 rounded-lg border ${ 
                    errors.contactNumber ? 'border-red-500' : 'border-gray-200'
                  } focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all`}
                />
                {errors.contactNumber && (
                  <p className="text-xs text-red-500 mt-1">{errors.contactNumber}</p>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 sm:py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-sm text-sm sm:text-base"
            >
              Register & Generate QR
            </button>
          </form>
        </div>
    </div>
  </div>

  );
}
