import { QrCode, Edit, Trash2, Download} from 'lucide-react';


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
}

interface ParticipantsTableProps {
  participants: Participant[];
  onEdit: (participant: Participant) => void;
  onDelete: (id: string) => void;
  onShowQR: (participant: Participant) => void;
  onDownloadQR: (participant: Participant) => void;
}
export default function ParticipantsTable({
  participants,
  onEdit,
  onDelete,
  onShowQR,
  onDownloadQR,
}: ParticipantsTableProps) {
  const getAgeBadgeClass = (ageGroup: string) => {
  if (ageGroup === "Kids") return "bg-green-100 text-green-700";
  if (ageGroup === "Teens") return "bg-blue-100 text-blue-700";
  if (ageGroup === "Adult") return "bg-purple-100 text-purple-700";
  return "bg-gray-100 text-gray-700";
};

const getGenderBadgeClass = (gender: string) => {
  if (gender === "Male") return "bg-sky-100 text-sky-700";
  if (gender === "Female") return "bg-pink-100 text-pink-700";
  return "bg-gray-100 text-gray-700";
};
  return (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-700">First Name</th>
              <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-700">Last Name</th>
              <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-700">MI</th>
              <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-700">Age Group</th>
              <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-700">Gender</th>
              <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-700">Contact Number</th>
              <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-700">School</th>
              <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-700">Course/ Strand</th>
              <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-700">Grade/ Year</th>
              <th className="sticky right-0 z-20 bg-gray-50 px-2 py-3 text-center text-xs font-semibold text-gray-700 w-[120px]">Action</th>
            </tr>
          </thead>
          <tbody>
            {participants.map((participant) => (
              <tr key={participant.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors group">
                <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900">{participant.first_name}</td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900">{participant.last_name}</td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700">{participant.middle_initial || '-'}</td>
               <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getAgeBadgeClass(
                    participant.age_group
                  )}`}
                >
                  {participant.age_group}
                </span>
              </td>
                              <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getGenderBadgeClass(
                    participant.gender
                  )}`}
                >
                  {participant.gender}
                </span>
              </td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700">{participant.contact_number || '-'}</td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700 max-w-[150px] truncate" title={participant.school || '-'}>{participant.school || '-'}</td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700 max-w-[120px] truncate" title={participant.course || '-'}>{participant.course || '-'}</td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700">{participant.grade_year || '-'}</td>
                <td className="sticky right-0 z-10 bg-white px-2 py-3 w-[105px]">
                  <div className="flex gap-1">
                    <button
                      onClick={() => onShowQR(participant)}
                      className="p-1.5 sm:p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                      title="Show QR Code"
                    >
                      <QrCode size={14} className="sm:w-4 sm:h-4" />
                    </button>
                    <button
                      onClick={() => onDownloadQR(participant)}
                      className="p-1.5 sm:p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                      title="Download QR Code"
                    >
                      <Download size={14} className="sm:w-4 sm:h-4" />
                    </button>

                    <button
                      onClick={() => onEdit(participant)}
                      className="p-1.5 sm:p-2 bg-yellow-100 text-yellow-600 rounded-lg hover:bg-yellow-200 transition-colors"
                      title="Edit"
                    >
                      <Edit size={14} className="sm:w-4 sm:h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(participant.id)}
                      className="p-1.5 sm:p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={14} className="sm:w-4 sm:h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
