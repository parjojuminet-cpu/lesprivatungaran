import React, { useState } from 'react';
import { Student, Attendance, Tutor, Subject, UserRole } from '../types';
import {
  FileSpreadsheet, UserCheck, Calendar, BookOpen, MessageSquare,
  Share2, Printer, Star, Award, Search, Filter, Sparkles, Send, CheckCircle2, AlertCircle
} from 'lucide-react';

interface ReportsViewProps {
  students: Student[];
  attendances: Attendance[];
  tutors: Tutor[];
  subjects: Subject[];
  userRole: UserRole;
  currentUserTutorId?: string;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  students,
  attendances,
  tutors,
  subjects,
  userRole,
  currentUserTutorId
}) => {
  // If user is a Tentor, default or filter students taught by this tutor
  const tutorAttendances = currentUserTutorId && userRole === 'TENTOR'
    ? attendances.filter(a => a.tutorId === currentUserTutorId)
    : attendances;

  const tutorStudentIds = Array.from(new Set(tutorAttendances.map(a => a.studentId)));

  const availableStudents = userRole === 'TENTOR' && currentUserTutorId
    ? students.filter(s => tutorStudentIds.includes(s.id))
    : students.filter(s => s.status === 'Aktif');

  const [selectedStudentId, setSelectedStudentId] = useState<string>(availableStudents[0]?.id || students[0]?.id || '');
  const [selectedMonth, setSelectedMonth] = useState<string>('SEMUA');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const selectedStudent = students.find(s => s.id === selectedStudentId);

  // Student Attendances
  const studentAttendances = attendances.filter(a => a.studentId === selectedStudentId);

  // Filtered by month
  const filteredAttendances = studentAttendances.filter(a => {
    if (selectedMonth === 'SEMUA') return true;
    return a.date.startsWith(selectedMonth);
  });

  // Calculate statistics
  const totalSessionsAttended = filteredAttendances.filter(a => a.status === 'Hadir').length;
  const totalPermissions = filteredAttendances.filter(a => a.status.includes('Izin') || a.status.includes('Force Majeure')).length;
  const totalAlphas = filteredAttendances.filter(a => a.status === 'Alpha').length;

  // Tutors teaching this student
  const studentTutorIds = Array.from(new Set(studentAttendances.map(a => a.tutorId)));
  const studentTutors = tutors.filter(t => studentTutorIds.includes(t.id));

  // Generate WhatsApp Message
  const handleSendReportWA = () => {
    if (!selectedStudent) return;

    const parentWA = selectedStudent.parentWA.replace(/^0/, '62').replace(/[^0-9]/g, '');
    if (!parentWA) {
      alert('Nomor WhatsApp orang tua belum terdaftar!');
      return;
    }

    let msg = `*LAPORAN PERKEMBANGAN BELAJAR SISWA - BIMBEL PRIVAT*\n`;
    msg += `-------------------------------------------\n`;
    msg += `👤 *Nama Siswa*: ${selectedStudent.name}\n`;
    msg += `🏫 *Kelas/Jenjang*: ${selectedStudent.grade} (${selectedStudent.school || '-'})\n`;
    msg += `📚 *Mata Pelajaran*: ${selectedStudent.subjects.join(', ') || '-'}\n`;
    msg += `👨‍🏫 *Tentor Pengajar*: ${studentTutors.map(t => t.name).join(', ') || '-'}\n`;
    msg += `-------------------------------------------\n\n`;

    msg += `📊 *RINGKASAN KEHADIRAN*:\n`;
    msg += `✅ Total Pertemuan Hadir: ${totalSessionsAttended} Pertemuan\n`;
    msg += `📩 Total Izin: ${totalPermissions} Pertemuan\n`;
    msg += `📌 Sisa Kuota Belajar: ${selectedStudent.remainingSessions} Kuota\n\n`;

    msg += `📖 *REKAP MATERI & CATATAN PERKEMBANGAN*:\n`;
    if (filteredAttendances.length === 0) {
      msg += `Belum ada riwayat pertemuan tercatat pada periode ini.\n`;
    } else {
      filteredAttendances.slice(0, 5).forEach((att, idx) => {
        msg += `${idx + 1}. *[${att.date}]* ${att.materialCovered || 'Sesi Pembelajaran'}\n`;
        if (att.progressNotes) msg += `   💡 *Catatan Kemajuan*: ${att.progressNotes}\n`;
        if (att.tutorFeedback) msg += `   📝 *Feedback Tentor*: ${att.tutorFeedback}\n`;
      });
    }

    msg += `\n-------------------------------------------\n`;
    msg += `Terima kasih atas kepercayaan Bapak/Ibu ${selectedStudent.parentName} memilih ERP Bimbel Privat Ungaran. Mari tingkatkan terus semangat belajar ananda! 🚀✨`;

    const encodedMsg = encodeURIComponent(msg);
    window.open(`https://wa.me/${parentWA}?text=${encodedMsg}`, '_blank');
  };

  // Print Digital Report Page
  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-white p-6 rounded-3xl border border-indigo-800/80 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <FileSpreadsheet className="w-3 h-3" /> Raport & Evaluasi Akademik
            </span>
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Digital Report Generator
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Laporan Perkembangan & Raport Siswa
          </h2>
          <p className="text-xs text-indigo-200/90 leading-relaxed max-w-2xl">
            Pantau hasil belajar, materi yang dikuasai, absensi, serta ringkasan evaluasi perkembangan belajar anak secara terstruktur untuk dikirimkan ke Orang Tua.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handlePrintReport}
            className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-4 py-2.5 rounded-2xl border border-slate-700 shadow-sm flex items-center gap-2 cursor-pointer transition-all active:scale-95"
          >
            <Printer className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline">Cetak Raport</span>
          </button>
          <button
            onClick={handleSendReportWA}
            className="bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-2xl shadow-lg shadow-emerald-950/50 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
          >
            <Send className="w-4 h-4" />
            <span>Kirim Raport ke WA Ortu</span>
          </button>
        </div>
      </div>

      {/* Selector & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Student Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Pilih Siswa Bimbel</label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {availableStudents.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} - ({s.grade} - {s.school || 'Privat'})
                </option>
              ))}
            </select>
          </div>

          {/* Month Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Periode Bulan Bimbingan</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="SEMUA">Semua Bulan (Keseluruhan Pertemuan)</option>
              <option value="2026-07">Juli 2026</option>
              <option value="2026-06">Juni 2026</option>
              <option value="2026-05">Mei 2026</option>
            </select>
          </div>

          {/* Search Keywords in Notes */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Cari Kata Kunci Jurnal/Materi</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari bab/topik (contoh: Aljabar)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Printable Report Card Container */}
      {selectedStudent ? (
        <div className="space-y-6 print:p-0">
          {/* Profile Card & Key KPI Metrics */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white font-black text-xl flex items-center justify-center shadow-md shadow-indigo-200 shrink-0">
                  {selectedStudent.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-slate-900">{selectedStudent.name}</h3>
                    <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-indigo-200">
                      {selectedStudent.grade}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Asal Sekolah: <strong className="text-slate-700">{selectedStudent.school || 'Les Privat'}</strong> | Orang Tua: <strong className="text-slate-700">{selectedStudent.parentName} ({selectedStudent.parentWA})</strong>
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Mata Pelajaran Bimbingan: <span className="font-semibold text-slate-600">{selectedStudent.subjects.join(', ') || 'Semua Mata Pelajaran'}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start md:self-center">
                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Status Paket</div>
                  <div className={`text-xs font-black px-3 py-1 rounded-full border mt-0.5 ${
                    selectedStudent.remainingSessions <= 2
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    {selectedStudent.remainingSessions <= 2 ? '⚠️ Paket Hampir Habis' : 'Paket Aktif'}
                  </div>
                </div>
              </div>
            </div>

            {/* Metric KPI Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-indigo-50/70 p-4 rounded-2xl border border-indigo-100/80">
                <div className="flex items-center justify-between text-indigo-700 mb-1">
                  <span className="text-[11px] font-bold">Total Kehadiran</span>
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="text-xl font-black text-indigo-950">{totalSessionsAttended} Pertemuan</div>
                <div className="text-[10px] text-indigo-600 font-medium mt-0.5">Hadir Tepat Waktu</div>
              </div>

              <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-100/80">
                <div className="flex items-center justify-between text-amber-700 mb-1">
                  <span className="text-[11px] font-bold">Izin</span>
                  <Calendar className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-xl font-black text-amber-950">{totalPermissions} Pertemuan</div>
                <div className="text-[10px] text-amber-600 font-medium mt-0.5">Izin Terkonfirmasi</div>
              </div>

              <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-100/80">
                <div className="flex items-center justify-between text-emerald-700 mb-1">
                  <span className="text-[11px] font-bold">Sisa Kuota Paket</span>
                  <Award className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-xl font-black text-emerald-950">{selectedStudent.remainingSessions} Kuota</div>
                <div className="text-[10px] text-emerald-600 font-medium mt-0.5">Dari Total {selectedStudent.totalPackageSessions} Kuota</div>
              </div>

              <div className="bg-purple-50/70 p-4 rounded-2xl border border-purple-100/80">
                <div className="flex items-center justify-between text-purple-700 mb-1">
                  <span className="text-[11px] font-bold">Tentor Bimbingan</span>
                  <UserCheck className="w-4 h-4 text-purple-600" />
                </div>
                <div className="text-sm font-black text-purple-950 truncate">{studentTutors.map(t => t.name).join(', ') || 'Tentor Bimbel'}</div>
                <div className="text-[10px] text-purple-600 font-medium mt-0.5">Pengajar Berpengalaman</div>
              </div>
            </div>
          </div>

          {/* Detailed Learning Log & Notes */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <h4 className="font-extrabold text-slate-900 text-sm">
                  Jurnal Belajar & Catatan Perkembangan Siswa
                </h4>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                {filteredAttendances.length} Pertemuan Tercatat
              </span>
            </div>

            {filteredAttendances.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs text-slate-600 font-bold">Belum ada riwayat bimbingan pada periode ini</p>
                <p className="text-[11px] text-slate-400">Silakan pilih bulan lain atau rekam absensi mengajar terlebih dahulu.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAttendances.map((att, index) => {
                  const tutorObj = tutors.find(t => t.id === att.tutorId);
                  return (
                    <div
                      key={att.id || index}
                      className="bg-slate-50 hover:bg-indigo-50/30 transition-colors p-4 rounded-2xl border border-slate-200 space-y-2"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-bold text-[11px] flex items-center justify-center">
                            #{filteredAttendances.length - index}
                          </span>
                          <span className="text-xs font-extrabold text-slate-900">
                            {new Date(att.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                            att.status === 'Hadir'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              : 'bg-amber-100 text-amber-800 border-amber-200'
                          }`}>
                            {att.status}
                          </span>
                        </div>

                        <span className="text-[11px] font-medium text-slate-500">
                          Tentor: <strong className="text-slate-800">{tutorObj?.name || 'Tentor'}</strong>
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                        <div>
                          <div className="font-bold text-slate-700 flex items-center gap-1.5 mb-1">
                            <BookOpen className="w-3.5 h-3.5 text-indigo-600" /> Pokok Bahasan / Materi Dipelajari:
                          </div>
                          <p className="text-slate-800 bg-white p-2.5 rounded-xl border border-slate-200 leading-relaxed font-medium">
                            {att.materialCovered || 'Sesi diskusi & latihan soal pembelajaran.'}
                          </p>
                        </div>

                        <div>
                          <div className="font-bold text-slate-700 flex items-center gap-1.5 mb-1">
                            <MessageSquare className="w-3.5 h-3.5 text-purple-600" /> Catatan Kemajuan & Feedback Tentor:
                          </div>
                          <p className="text-slate-800 bg-white p-2.5 rounded-xl border border-slate-200 leading-relaxed font-medium">
                            {att.progressNotes || att.tutorFeedback || 'Siswa menunjukkan antusiasme yang baik saat memahami contoh soal.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};
