import React, { useState } from 'react';
import { Schedule, Student, Tutor, ScheduleType, UserRole } from '../types';
import { Calendar, Plus, AlertTriangle, CheckCircle, Sparkles, UserCheck, Clock, ShieldAlert } from 'lucide-react';
import { saveScheduleData } from '../services/dataManager';

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

  // Filter schedules and students based on role
  const displaySchedules = (userRole === 'TENTOR' && currentUserTutorId)
    ? schedules.filter(sch => sch.tutorId === currentUserTutorId)
    : schedules;

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
  const [sessionRate, setSessionRate] = useState<number>(40000);

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
      const tut = tutors.find(t => t.id === selectedTutorId);

      await saveScheduleData({
        studentId: selectedStudentId,
        tutorId: selectedTutorId,
        subject,
        dayOfWeek,
        timeSlot,
        type: type as any,
        sessionRate: Number(sessionRate || 30000),
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            Penjadwalan & Smart Match Tentor
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {isManagement
              ? 'Sistem deteksi bentrok otomatis, pencocokan tentor cerdas, & pengajuan reschedule terintegrasi.'
              : 'Daftar jadwal mengajar & murid yang Anda ampu. Pengisian jadwal dikelola penuh oleh Manajemen.'}
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

      {/* Reschedule Rules Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-3.5 rounded-2xl text-xs text-blue-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <Clock className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <div>
            <span className="font-extrabold text-blue-900">Aturan Reschedule Jadwal Mengajar:</span>
            <span className="ml-1 text-blue-800">
              Tentor / Wali Murid dapat mengajukan reschedule <strong>1 hari (H-1)</strong> atau <strong>2 hari (H-2)</strong> sebelumnya. Batas maksimal pengajuan adalah <strong>1 hari sebelum hari mengajar</strong>.
            </span>
          </div>
        </div>
      </div>

      {/* Grid Schedule Cards */}
      {displaySchedules.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-2">
          <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-700">Belum Ada Jadwal Mengajar</p>
          <p className="text-xs text-slate-500">
            {isManagement
              ? 'Silakan buat jadwal baru dengan mengeklik tombol di atas.'
              : 'Manajemen belum mengalokasikan jadwal mengajar untuk akun Anda.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displaySchedules.map((sch) => {
            const student = displayStudents.find(s => s.id === sch.studentId) || students.find(s => s.id === sch.studentId);
            const tutor = tutors.find(t => t.id === sch.tutorId);

            return (
              <div key={sch.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                  <span className="text-xs font-black text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                    {sch.dayOfWeek} • {sch.timeSlot}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    sch.type === 'Jadwal Tetap' ? 'bg-emerald-100 text-emerald-800' :
                    sch.type === 'Jadwal Reschedule' ? 'bg-amber-100 text-amber-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {sch.type}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Siswa</div>
                    <div className="font-bold text-slate-900 text-sm">{student?.name || 'Siswa N/A'} ({student?.grade})</div>
                    <div className="text-[11px] text-slate-500">Mata Pelajaran: <span className="font-semibold text-slate-800">{sch.subject}</span></div>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Tentor Pengajar</div>
                    <div className="font-bold text-indigo-950 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                        {tutor?.name || 'Tentor N/A'}
                      </span>
                      <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 text-[11px]">
                        {formatRupiah(sch.sessionRate || tutor?.ratePerSession || 40000)}/sesi
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">WA Tentor: {tutor?.wa}</div>
                  </div>

                  {sch.rescheduleCountThisMonth > 0 && (
                    <div className="bg-amber-50 p-2 rounded-xl border border-amber-200 text-[11px] text-amber-900 font-medium flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                      <span>Reschedule bulan ini: {sch.rescheduleCountThisMonth}x</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

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

                {/* Custom Manual Rate per Session Input */}
                <div className="sm:col-span-2 bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1.5">
                  <label className="block text-slate-800 font-bold text-xs flex items-center justify-between">
                    <span>Honor Tentor per Sesi Kesepakatan (Rp)</span>
                    <span className="text-[10px] text-emerald-700 font-extrabold bg-emerald-100 px-2 py-0.5 rounded-md">
                      Isian Manual Pasangan Siswa & Tentor
                    </span>
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-extrabold text-sm pl-1">Rp</span>
                    <input
                      type="number"
                      value={sessionRate}
                      onChange={(e) => setSessionRate(Number(e.target.value))}
                      placeholder="40000"
                      step="1000"
                      className="w-full bg-white border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-black text-slate-900 text-sm"
                      required
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium">
                    💡 <strong>Penyesuaian Manual:</strong> Tarif ini berlaku spesifik untuk pasangan murid dan tentor ini (contoh: Murid A + Tentor A1 = Rp 40.000, Murid C + Tentor A1 = Rp 35.000, Murid C + Tentor A2 = Rp 50.000).
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
    </div>
  );
};
