import React, { useState } from 'react';
import { Schedule, Student, Tutor, ScheduleType, UserRole } from '../types';
import { Calendar, Plus, AlertTriangle, CheckCircle, Sparkles, UserCheck, Clock, ShieldAlert, RefreshCw, Pencil, Trash2, Search, Filter } from 'lucide-react';
import { saveScheduleData, deleteScheduleData } from '../services/dataManager';

interface ScheduleViewProps {
  schedules: Schedule[];
  students: Student[];
  tutors: Tutor[];
  userRole: UserRole;
  currentUserTutorId?: string;
  onRefresh: () => void;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  schedules,
  students,
  tutors,
  userRole,
  currentUserTutorId,
  onRefresh
}) => {
  const isManagement = userRole === 'SUPER_ADMIN' || userRole === 'MANAGEMENT';

  // Search & Day Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDay, setFilterDay] = useState('Semua');

  // Filter schedules and students based on role
  const displaySchedules = (userRole === 'TENTOR' && currentUserTutorId)
    ? schedules.filter(sch => sch.tutorId === currentUserTutorId)
    : schedules;

  const filteredSchedules = displaySchedules.filter(sch => {
    const student = students.find(s => s.id === sch.studentId);
    const tutor = tutors.find(t => t.id === sch.tutorId);

    const q = searchQuery.toLowerCase().trim();
    const matchSearch = !q ||
      (student?.name || '').toLowerCase().includes(q) ||
      (tutor?.name || '').toLowerCase().includes(q) ||
      (sch.subject || '').toLowerCase().includes(q) ||
      (sch.dayOfWeek || '').toLowerCase().includes(q);

    const matchDay = filterDay === 'Semua' || sch.dayOfWeek === filterDay;

    return matchSearch && matchDay;
  });

  const taughtStudentIds = new Set(displaySchedules.map(sch => sch.studentId));

  const displayStudents = (userRole === 'TENTOR' && currentUserTutorId)
    ? students.filter(s => taughtStudentIds.has(s.id))
    : students;

  const [showModal, setShowModal] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedTutorId, setSelectedTutorId] = useState('');
  const [subject, setSubject] = useState('Matematika');
  const [dayOfWeek, setDayOfWeek] = useState('Senin');
  const [timeSlot, setTimeSlot] = useState('15:00 - 16:30');
  const [type, setType] = useState<ScheduleType>('Jadwal Tetap');
  const [adminFee, setAdminFee] = useState<number>(5000);
  const [sessionRate, setSessionRate] = useState<number>(20000);

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num || 0);
  };

  // Smart Match recommendations state
  const [recommendedTutors, setRecommendedTutors] = useState<Tutor[]>([]);
  const [isSearchingTutors, setIsSearchingTutors] = useState(false);

  // Clash check error / warning state
  const [clashMessage, setClashMessage] = useState<string | null>(null);
  const [isCheckingClash, setIsCheckingClash] = useState(false);

  // Custom Delete Schedule Modal & Toast State
  const [scheduleToDelete, setScheduleToDelete] = useState<{
    id: string;
    studentName: string;
    day: string;
    time: string;
    subject: string;
    tutorName: string;
  } | null>(null);
  const [isDeletingSchedule, setIsDeletingSchedule] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const confirmDeleteSchedule = async () => {
    if (!scheduleToDelete) return;
    setIsDeletingSchedule(true);
    try {
      await deleteScheduleData(scheduleToDelete.id);
      setToastMessage(`Entri jadwal mengajar untuk ${scheduleToDelete.studentName} (${scheduleToDelete.day}) berhasil dihapus.`);
      setScheduleToDelete(null);
      onRefresh();
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err) {
      alert('Gagal menghapus jadwal. Silakan coba lagi.');
    } finally {
      setIsDeletingSchedule(false);
    }
  };

  // Search smart match
  const handleSmartMatch = async (studId: string, sub: string) => {
    setSelectedStudentId(studId);
    setSubject(sub);
    const stud = displayStudents.find(s => s.id === studId);
    if (!stud) return;

    setIsSearchingTutors(true);
    try {
      const res = await fetch(`/api/tutors/recommend?subject=${encodeURIComponent(sub)}&grade=${encodeURIComponent(stud.grade)}`);
      const data = await res.json();
      setRecommendedTutors(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearchingTutors(false);
    }
  };

  // Check clash live
  const handleCheckClash = async (tutId: string, day: string, time: string) => {
    setIsCheckingClash(true);
    setClashMessage(null);
    try {
      const res = await fetch('/api/schedules/check-clash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tutorId: tutId,
          studentId: selectedStudentId,
          dayOfWeek: day,
          timeSlot: time
        })
      });
      const data = await res.json();
      if (data.hasClash) {
        setClashMessage(data.clashes.join(' | '));
      } else {
        setClashMessage('✅ Jadwal Aman: Tidak ada bentrok jadwal tentor maupun siswa!');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCheckingClash(false);
    }
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isManagement) {
      alert('Akses Terbatas: Hanya Manajemen yang dapat mengisi jadwal.');
      return;
    }
    if (!selectedStudentId || !selectedTutorId) {
      alert('Pilih siswa dan tentor terlebih dahulu');
      return;
    }

    try {
      const stud = displayStudents.find(s => s.id === selectedStudentId);
      const sppRate = stud?.ratePerSession || 25000;
      const finalAdminFee = Number(adminFee) || 5000;
      const finalSessionRate = Number(sessionRate) || Math.max(0, sppRate - finalAdminFee);

      await saveScheduleData({
        studentId: selectedStudentId,
        tutorId: selectedTutorId,
        subject,
        dayOfWeek,
        timeSlot,
        type: type as any,
        sessionRate: finalSessionRate,
        adminFee: finalAdminFee,
        status: 'Aktif'
      });

      alert('Jadwal berhasil disimpan!');
      setShowModal(false);
      onRefresh();
    } catch (err) {
      alert('Gagal membuat jadwal');
    }
  };

  const daysList = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            Penjadwalan &amp; Smart Match Tentor
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {isManagement
              ? 'Tabel alokasi jadwal mengajar tentor &amp; murid. Deteksi bentrok otomatis &amp; pencocokan cerdas.'
              : 'Daftar jadwal mengajar &amp; murid yang Anda ampu. Pengisian jadwal dikelola penuh oleh Manajemen.'}
          </p>
        </div>
        {isManagement ? (
          <button
            onClick={() => setShowModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Jadwal Baru</span>
          </button>
        ) : (
          <div className="bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl text-xs font-semibold text-amber-900 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>Pengisian Jadwal: Khusus Manajemen</span>
          </div>
        )}
      </div>

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-2xl text-xs font-bold shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-emerald-700 hover:text-emerald-950 text-xs font-extrabold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Flexible Scheduling Banner */}
      <div className="bg-gradient-to-r from-emerald-50 via-indigo-50 to-sky-50 border border-emerald-200 p-3.5 rounded-2xl text-xs text-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-start sm:items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5 sm:mt-0" />
          <div className="leading-relaxed">
            <span className="font-extrabold text-emerald-950">Informasi Penjadwalan:</span>
            <span className="ml-1 text-slate-700">
              Tabel ini mengatur pasangan <strong>Siswa &amp; Tentor</strong> serta acuan hari/jam belajar. Untuk merevisi atau menambah Sisa Kuota Paket (10 Sesi) milik Siswa, gunakan menu <strong>Data Master Siswa</strong>.
            </span>
          </div>
        </div>
      </div>

      {/* SEARCH & FILTER CONTROLS */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Cari siswa, tentor, atau mapel..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end text-xs">
          <span className="text-slate-500 font-bold flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" /> Filter Hari:
          </span>
          <select
            value={filterDay}
            onChange={(e) => setFilterDay(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="Semua">Semua Hari</option>
            {daysList.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* TABLE SCHEDULE VIEW */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3.5">Hari &amp; Jam Belajar</th>
                <th className="p-3.5">Siswa &amp; Sisa Kuota</th>
                <th className="p-3.5">Mata Pelajaran</th>
                <th className="p-3.5">Tentor Pengajar</th>
                <th className="p-3.5 text-right">Honor &amp; Fee Bimbel (Rp)</th>
                {isManagement && <th className="p-3.5 text-center">Status</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSchedules.length === 0 ? (
                <tr>
                  <td colSpan={isManagement ? 6 : 5} className="p-8 text-center text-slate-400 italic">
                    {displaySchedules.length === 0
                      ? 'Belum ada jadwal mengajar yang terdaftar.'
                      : 'Tidak ada jadwal yang cocok dengan filter pencarian.'}
                  </td>
                </tr>
              ) : (
                filteredSchedules.map((sch) => {
                  const student = displayStudents.find(s => s.id === sch.studentId) || students.find(s => s.id === sch.studentId);
                  const tutor = tutors.find(t => t.id === sch.tutorId);

                  return (
                    <tr key={sch.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Hari & Jam */}
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="font-extrabold text-indigo-950 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span>{sch.dayOfWeek}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{sch.timeSlot}</span>
                        </div>
                        {sch.type && (
                          <span className="text-[9px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full inline-block mt-1">
                            {sch.type}
                          </span>
                        )}
                      </td>

                      {/* Siswa & Sisa Kuota */}
                      <td className="p-3.5">
                        <div className="font-extrabold text-slate-900 text-xs">{student?.name || 'Siswa N/A'}</div>
                        <div className="text-[11px] text-slate-500">{student?.grade || '-'} • {student?.school || ''}</div>
                        <div className="mt-1">
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${
                            !student || student.remainingSessions <= 0 ? 'bg-rose-50 text-rose-700 border-rose-200' :
                            student.remainingSessions <= 2 ? 'bg-amber-50 text-amber-800 border-amber-200' :
                            'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}>
                            Sisa Kuota: {student ? `${student.remainingSessions} Sesi` : '-'}
                          </span>
                        </div>
                      </td>

                      {/* Mata Pelajaran */}
                      <td className="p-3.5">
                        <div className="font-bold text-slate-800">{sch.subject}</div>
                      </td>

                      {/* Tentor Pengajar */}
                      <td className="p-3.5">
                        <div className="font-extrabold text-slate-900 flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span>{tutor?.name || 'Tentor N/A'}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">WA: {tutor?.wa || '-'}</div>
                      </td>

                      {/* Honor / Sesi & Fee Admin */}
                      <td className="p-3.5 text-right whitespace-nowrap">
                        {(() => {
                          const sppRate = student?.ratePerSession || 25000;
                          const calculatedAdminFee = sch.adminFee ?? student?.managementMarginNominal ?? 5000;
                          const calculatedHonor = sch.sessionRate ?? Math.max(0, sppRate - calculatedAdminFee);
                          return (
                            <>
                              <div className="font-extrabold text-emerald-700">
                                {formatRupiah(calculatedHonor)}
                                <span className="text-[10px] text-slate-400 font-normal block">Honor Tentor / Sesi</span>
                              </div>
                              {isManagement && (
                                <div className="text-[10px] font-bold text-indigo-700 mt-1 bg-indigo-50 px-1.5 py-0.5 rounded-md inline-block border border-indigo-100">
                                  Fee Admin: {formatRupiah(calculatedAdminFee)}
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </td>

                      {/* Aksi Manajemen */}
                      {isManagement && (
                        <td className="p-3.5 text-center whitespace-nowrap">
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold px-2 py-1 rounded-lg">
                            Jadwal Aktif
                          </span>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: BUAT JADWAL & SMART MATCH */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              Buat Jadwal Baru & Smart Match Tentor
            </h3>

            <form onSubmit={handleCreateSchedule} className="space-y-5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Select Student */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Pilih Siswa</label>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setSelectedStudentId(id);
                      const st = students.find(s => s.id === id);
                      if (st && st.subjects.length > 0) {
                        handleSmartMatch(id, st.subjects[0]);
                      }
                    }}
                    className="w-full border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium"
                    required
                  >
                    <option value="">-- Pilih Siswa --</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.grade} - Sisa Sesi: {s.remainingSessions})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Select Subject */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Mata Pelajaran</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => {
                      setSubject(e.target.value);
                      if (selectedStudentId) {
                        handleSmartMatch(selectedStudentId, e.target.value);
                      }
                    }}
                    placeholder="Contoh: Matematika"
                    className="w-full border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium"
                    required
                  />
                </div>

                {/* Select Tutor Direct Dropdown */}
                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-bold mb-1 flex items-center justify-between">
                    <span>Pilih Tentor Pengajar</span>
                    <span className="text-[10px] text-indigo-600 font-normal">
                      Bisa pilih langsung atau via rekomendasi di bawah
                    </span>
                  </label>
                  <select
                    value={selectedTutorId}
                    onChange={(e) => {
                      const tutId = e.target.value;
                      setSelectedTutorId(tutId);
                      const tut = tutors.find(t => t.id === tutId);
                      if (tut && tut.ratePerSession) {
                        setSessionRate(tut.ratePerSession);
                      }
                      if (tutId) {
                        handleCheckClash(tutId, dayOfWeek, timeSlot);
                      }
                    }}
                    className="w-full border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-semibold text-slate-900 bg-white"
                    required
                  >
                    <option value="">-- Pilih Tentor Pengajar --</option>
                    {tutors.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} (★ {t.averageRating || 5.0}) — Matpel: {t.subjects.join(', ')} — Area: {t.workingArea.join(', ')}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Day & Time */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Hari</label>
                  <select
                    value={dayOfWeek}
                    onChange={(e) => {
                      setDayOfWeek(e.target.value);
                      if (selectedTutorId) handleCheckClash(selectedTutorId, e.target.value, timeSlot);
                    }}
                    className="w-full border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium"
                  >
                    {daysList.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Jam Belajar (Slot)</label>
                  <input
                    type="text"
                    value={timeSlot}
                    onChange={(e) => {
                      setTimeSlot(e.target.value);
                      if (selectedTutorId) handleCheckClash(selectedTutorId, dayOfWeek, e.target.value);
                    }}
                    placeholder="15:00 - 16:30"
                    className="w-full border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium"
                    required
                  />
                </div>

                {/* Schedule Type */}
                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-bold mb-1">Jenis Jadwal</label>
                  <div className="flex flex-wrap gap-3">
                    {['Jadwal Tetap', 'Jadwal Reschedule', 'Jadwal Substitusi Tentor'].map((t) => (
                      <label key={t} className="flex items-center gap-2 cursor-pointer bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl hover:bg-slate-100">
                        <input
                          type="radio"
                          name="scheduleType"
                          value={t}
                          checked={type === t}
                          onChange={(e) => setType(e.target.value as any)}
                          className="accent-indigo-600"
                        />
                        <span className="font-semibold text-slate-800">{t}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Custom Fee Admin & Honor Tentor per Sesi Input */}
                <div className="sm:col-span-2 bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 text-xs">Pengaturan Fee Admin Bimbel & Honor Tentor</span>
                    <span className="text-[10px] text-indigo-700 font-extrabold bg-indigo-100 px-2 py-0.5 rounded-md">
                      Variabel per Penjadwalan
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Input Fee Admin */}
                    <div>
                      <label className="block text-slate-700 font-bold mb-1 text-xs">
                        Fee Admin Bimbel (Potongan Admin)
                      </label>
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500 font-bold text-xs">Rp</span>
                        <input
                          type="number"
                          value={adminFee}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 0;
                            setAdminFee(val);
                            const selStudent = displayStudents.find(s => s.id === selectedStudentId);
                            const sppRate = selStudent?.ratePerSession || 25000;
                            setSessionRate(Math.max(0, sppRate - val));
                          }}
                          placeholder="5000"
                          step="500"
                          className="w-full bg-white border border-slate-300 rounded-xl p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold text-indigo-900 text-xs"
                          required
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 block">Contoh: 5000, 7000, dst.</span>
                    </div>

                    {/* Input Honor Tentor */}
                    <div>
                      <label className="block text-slate-700 font-bold mb-1 text-xs">
                        Honor Tentor per Sesi (Dibayarkan ke Tentor)
                      </label>
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500 font-bold text-xs">Rp</span>
                        <input
                          type="number"
                          value={sessionRate}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 0;
                            setSessionRate(val);
                            const selStudent = displayStudents.find(s => s.id === selectedStudentId);
                            const sppRate = selStudent?.ratePerSession || 25000;
                            setAdminFee(Math.max(0, sppRate - val));
                          }}
                          placeholder="20000"
                          step="1000"
                          className="w-full bg-white border border-slate-300 rounded-xl p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-extrabold text-emerald-800 text-xs"
                          required
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 block">SPP Siswa - Fee Admin</span>
                    </div>
                  </div>

                  {/* Live Financial Breakdown Card */}
                  {(() => {
                    const selStudent = displayStudents.find(s => s.id === selectedStudentId);
                    const sppRate = selStudent?.ratePerSession || 25000;
                    const tutRate = Number(sessionRate) || 0;
                    const feeAdminVal = Number(adminFee) || Math.max(0, sppRate - tutRate);
                    return (
                      <div className="bg-gradient-to-r from-indigo-50 via-sky-50 to-emerald-50 p-3 rounded-xl border border-indigo-100/90 space-y-1.5">
                        <div className="text-[11px] font-bold text-indigo-950 flex items-center justify-between">
                          <span>Rincian Pembagian SPP / Sesi:</span>
                          <span className="text-emerald-800 font-extrabold">SPP: {formatRupiah(sppRate)}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-700 text-center font-medium">
                          <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-2xs">
                            <span className="text-slate-500 block font-semibold">1. SPP Murid</span>
                            <strong className="text-slate-900 text-xs">{formatRupiah(sppRate)}</strong>
                          </div>
                          <div className="bg-white p-2 rounded-lg border border-indigo-200 shadow-2xs">
                            <span className="text-indigo-800 block font-bold">2. Fee Admin</span>
                            <strong className="text-indigo-950 text-xs">{formatRupiah(feeAdminVal)}</strong>
                          </div>
                          <div className="bg-emerald-100/80 p-2 rounded-lg border border-emerald-300 shadow-2xs">
                            <span className="text-emerald-900 block font-bold">3. Hak Tentor</span>
                            <strong className="text-emerald-950 text-xs">{formatRupiah(tutRate)}</strong>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  <p className="text-[10px] text-slate-600 font-medium leading-relaxed">
                    💡 <strong>Formula Keuangan:</strong> Honor Tentor ({formatRupiah(Number(sessionRate) || 0)}) = SPP Murid ({formatRupiah(displayStudents.find(s => s.id === selectedStudentId)?.ratePerSession || 25000)}) - Fee Admin ({formatRupiah(Number(adminFee) || 0)}).
                  </p>
                </div>
              </div>

              {/* SMART MATCH RECOMMENDED TUTORS PANEL */}
              <div className="bg-indigo-50/70 p-4 rounded-2xl border border-indigo-100 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-indigo-950 flex items-center gap-1.5 text-xs">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Rekomendasi Tentor Terbaik (Smart Match)
                  </h4>
                  <span className="text-[11px] text-indigo-700 font-medium">
                    Diurutkan berdasarkan rating, mata pelajaran & area
                  </span>
                </div>

                {isSearchingTutors ? (
                  <div className="text-center py-4 text-indigo-600">Mencari tentor terbaik...</div>
                ) : recommendedTutors.length === 0 ? (
                  <div className="text-xs text-slate-500 italic py-2">
                    {selectedStudentId ? 'Tidak ada tentor yang cocok dengan filter spesifik' : 'Pilih siswa untuk melihat rekomendasi tentor'}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {recommendedTutors.map((tut) => {
                      const isSelected = selectedTutorId === tut.id;
                      return (
                        <div
                          key={tut.id}
                          onClick={() => {
                            setSelectedTutorId(tut.id);
                            if (tut.ratePerSession) setSessionRate(tut.ratePerSession);
                            handleCheckClash(tut.id, dayOfWeek, timeSlot);
                          }}
                          className={`p-3 rounded-xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-700 shadow-md'
                              : 'bg-white text-slate-800 border-indigo-100 hover:border-indigo-300'
                          }`}
                        >
                          <div className="font-bold flex items-center justify-between">
                            <span>{tut.name}</span>
                            <span className={isSelected ? 'text-amber-300' : 'text-amber-500'}>★ {tut.averageRating}</span>
                          </div>
                          <div className={`text-[11px] mt-1 ${isSelected ? 'text-indigo-100' : 'text-slate-500'}`}>
                            Area: {tut.workingArea.join(', ')}
                          </div>
                          <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                            Mata Pelajaran: {tut.subjects.join(', ')}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* CLASH CHECK NOTIFICATION BANNER */}
              {clashMessage && (
                <div className={`p-3 rounded-xl border text-xs font-semibold ${
                  clashMessage.includes('Aman')
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}>
                  {clashMessage}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 cursor-pointer shadow-sm"
                >
                  Simpan Jadwal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL CONFIRMATION: HAPUS JADWAL */}
      {scheduleToDelete && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-100">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-100 rounded-2xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Konfirmasi Hapus Jadwal</h3>
                <p className="text-xs text-slate-500">Hapus entri alokasi mengajar</p>
              </div>
            </div>

            <div className="bg-rose-50/70 border border-rose-200/80 p-4 rounded-2xl text-xs space-y-2 text-rose-950">
              <div className="font-bold text-slate-900">
                Siswa: <span className="text-rose-900">{scheduleToDelete.studentName}</span>
              </div>
              <div className="text-slate-700">
                Hari &amp; Jam: <strong>{scheduleToDelete.day} ({scheduleToDelete.time})</strong>
              </div>
              <div className="text-slate-700">
                Mapel / Tentor: <strong>{scheduleToDelete.subject}</strong> • Tentor {scheduleToDelete.tutorName}
              </div>
              <div className="pt-2 border-t border-rose-200/80 text-[11px] text-rose-800 leading-relaxed font-medium">
                💡 <strong>Penting:</strong> Menghapus entri jadwal ini HANYA menghapus alokasi mengajar. Data identitas murid &amp; Sisa Kuota Paket (10 Sesi) milik murid <u>TIDAK akan terhapus</u>.
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setScheduleToDelete(null)}
                disabled={isDeletingSchedule}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer font-bold text-xs"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDeleteSchedule}
                disabled={isDeletingSchedule}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer text-xs shadow-md flex items-center gap-1.5 disabled:opacity-50"
              >
                {isDeletingSchedule ? (
                  <span>Menghapus...</span>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Ya, Hapus Jadwal</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
