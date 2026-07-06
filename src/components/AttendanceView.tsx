import React, { useState, useRef, useEffect } from 'react';
import { Attendance, Schedule, Student, Tutor, AttendanceStatus, UserRole, PackageStatus } from '../types';
import { Camera, CheckCircle, Clock, AlertTriangle, UserCheck, RefreshCw, Sparkles, FileText, Loader2, SwitchCamera, Trash2 } from 'lucide-react';
import { saveAttendanceData, deleteAttendanceData } from '../services/dataManager';

interface AttendanceViewProps {
  attendances: Attendance[];
  schedules: Schedule[];
  students: Student[];
  tutors: Tutor[];
  userRole: UserRole;
  currentUserTutorId?: string;
  onRefresh: () => void;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  attendances,
  schedules,
  students,
  tutors,
  userRole,
  currentUserTutorId,
  onRefresh
}) => {
  const [selectedScheduleId, setSelectedScheduleId] = useState('');
  const [status, setStatus] = useState<AttendanceStatus>('Hadir');
  const [materialCovered, setMaterialCovered] = useState('');
  const [progressNotes, setProgressNotes] = useState('');
  const [tutorFeedback, setTutorFeedback] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Selfie camera state
  const [selfieUrl, setSelfieUrl] = useState<string>('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Filter schedules for tentor role if applicable
  const availableSchedules = schedules.filter(s => {
    if (userRole === 'TENTOR' && currentUserTutorId) {
      return s.tutorId === currentUserTutorId && s.status === 'Aktif';
    }
    return s.status === 'Aktif';
  });

  // Auto-select first schedule if available and none selected
  useEffect(() => {
    if (!selectedScheduleId && availableSchedules.length > 0) {
      setSelectedScheduleId(availableSchedules[0].id);
    }
  }, [availableSchedules, selectedScheduleId]);

  // Filter attendance history for tentor role
  const displayAttendances = (userRole === 'TENTOR' && currentUserTutorId)
    ? attendances.filter(a => a.tutorId === currentUserTutorId)
    : attendances;

  const isAdmin = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN' || userRole === 'MANAGEMENT';

  const handleDeleteAttendance = async (attendanceId: string, studentName: string) => {
    if (window.confirm(`Apakah Anda yakin ingin MENGHAPUS data absensi ini untuk siswa "${studentName}"?\n\nTindakan ini akan mengembalikan kuota sesi siswa (+1) dan membatalkan rekap keuangan/gaji terkait.`)) {
      try {
        await deleteAttendanceData(attendanceId);
        alert('Data absensi berhasil dihapus!');
        onRefresh();
      } catch (err) {
        alert('Gagal menghapus data absensi.');
      }
    }
  };

  const todayStr = new Date().toISOString().substring(0, 10);
  const activeScheduleId = selectedScheduleId || (availableSchedules.length > 0 ? availableSchedules[0].id : '');
  const isAlreadyAttendedToday = attendances.some(a => a.scheduleId === activeScheduleId && a.date === todayStr);

  // Auto-attach video stream when camera becomes active
  useEffect(() => {
    if (isCameraActive && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [isCameraActive]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Start real camera with option for front ('user') or back ('environment')
  const startCamera = async (mode: 'user' | 'environment' = facingMode) => {
    stopCamera();
    try {
      setFacingMode(mode);
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: { ideal: mode },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn('Camera access error:', err);
      alert('Gagal mengakses kamera device. Pastikan Anda telah mengizinkan akses kamera di browser.');
      setIsCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && streamRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        if (facingMode === 'user') {
          // Mirror canvas for selfie so result matches live preview
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setSelfieUrl(dataUrl);
        stopCamera();
        return dataUrl;
      }
      stopCamera();
    }
    return selfieUrl;
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const handleSubmitAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitMessage(null);

    const activeScheduleId = selectedScheduleId || (availableSchedules.length > 0 ? availableSchedules[0].id : '');

    if (!activeScheduleId) {
      setSubmitMessage({
        type: 'error',
        text: '⚠️ Pilih jadwal les terlebih dahulu. Jika opsi jadwal kosong, pastikan sudah menambahkan jadwal les aktif.'
      });
      return;
    }

    const sch = schedules.find(s => s.id === activeScheduleId) || availableSchedules.find(s => s.id === activeScheduleId);
    if (!sch) {
      setSubmitMessage({
        type: 'error',
        text: '⚠️ Data sesi jadwal les tidak ditemukan. Silakan pilih ulang sesi jadwal.'
      });
      return;
    }

    // Capture photo from camera if camera active or validate photo presence
    let finalSelfie = selfieUrl;
    if (status === 'Hadir' && !finalSelfie) {
      if (isCameraActive && videoRef.current) {
        finalSelfie = capturePhoto();
      }

      if (!finalSelfie) {
        setSubmitMessage({
          type: 'error',
          text: '⚠️ Silakan jepret foto bukti absensi menggunakan Kamera Depan atau Kamera Belakang terlebih dahulu.'
        });
        return;
      }
    }

    try {
      setIsSubmitting(true);
      await saveAttendanceData({
        scheduleId: sch.id,
        tutorId: sch.tutorId,
        studentId: sch.studentId,
        date: new Date().toISOString().substring(0, 10),
        selfieUrl: finalSelfie || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        status: status as any,
        materialCovered: materialCovered.trim() || 'Pertemuan Les Rutin',
        progressNotes: progressNotes.trim() || 'Pembahasan materi & latihan soal',
        tutorFeedback: tutorFeedback.trim(),
        additionalNotes: additionalNotes.trim()
      });

      setSubmitMessage({
        type: 'success',
        text: '✅ Absensi Berhasil Disimpan! Honor mengajar & Fee Manajemen langsung terekap secara REAL-TIME ke Keuangan, Portal Gaji Tentor, & Cloud Firestore.'
      });

      // Reset form
      setMaterialCovered('');
      setProgressNotes('');
      setTutorFeedback('');
      setAdditionalNotes('');
      setSelfieUrl('');
      
      onRefresh();
    } catch (err: any) {
      console.error('Submit attendance error:', err);
      setSubmitMessage({
        type: 'error',
        text: `❌ Gagal menyimpan absensi: ${err.message || 'Terjadi kesalahan server'}`
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* FORM INPUT ABSENSI (Left / Top Panel) */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Form Absensi & Selfie Tentor</h3>
              <p className="text-[11px] text-slate-500">Verifikasi kehadiran & jurnal mengajar per sesi</p>
            </div>
          </div>

          {submitMessage && (
            <div
              className={`p-3.5 rounded-xl text-xs font-bold mb-4 ${
                submitMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                  : 'bg-rose-50 text-rose-900 border border-rose-200'
              }`}
            >
              {submitMessage.text}
            </div>
          )}

          {availableSchedules.length === 0 ? (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-xs text-amber-900 space-y-2 mb-4">
              <div className="flex items-center gap-2 font-bold text-amber-800">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Belum Ada Sesi Jadwal Les Aktif</span>
              </div>
              <p className="text-[11px] text-amber-700 leading-relaxed">
                {userRole === 'TENTOR'
                  ? 'Akun Anda belum memiliki jadwal les aktif yang ditugaskan. Hubungi Manajemen Bimbel untuk menambahkan jadwal les Anda.'
                  : 'Sistem belum memiliki jadwal les aktif. Silakan tambahkan jadwal les baru pada menu "Jadwal Les" terlebih dahulu.'}
              </p>
            </div>
          ) : null}

          <form onSubmit={handleSubmitAttendance} className="space-y-4 text-xs">
            {/* Schedule Picker */}
            <div>
              <label className="block text-slate-700 font-bold mb-1">Pilih Sesi Jadwal Les</label>
              <select
                value={selectedScheduleId}
                onChange={(e) => setSelectedScheduleId(e.target.value)}
                className="w-full border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                required
              >
                {availableSchedules.length === 0 && <option value="">-- Tidak ada jadwal aktif --</option>}
                {availableSchedules.map((sch) => {
                  const student = students.find(s => s.id === sch.studentId);
                  const tutor = tutors.find(t => t.id === sch.tutorId);
                  return (
                    <option key={sch.id} value={sch.id}>
                      {sch.dayOfWeek} ({sch.timeSlot}) - {student?.name || sch.studentId} ({sch.subject}) by {tutor?.name || sch.tutorId}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Warning Banner if Already Attended Today */}
            {isAlreadyAttendedToday && (
              <div className="bg-amber-50 border border-amber-300 p-3.5 rounded-xl text-xs text-amber-900 space-y-1 my-3 shadow-2xs">
                <div className="flex items-center gap-2 font-extrabold text-amber-800">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>Sesi Ini Sudah Di-absen Hari Ini ({todayStr})</span>
                </div>
                <p className="text-[11px] text-amber-700 leading-relaxed">
                  Absensi untuk jadwal ini sudah pernah diisi hari ini. Sistem otomatis memblokir absen ganda untuk mencegah pemotongan paket siswa 2 kali dan klaim gaji ganda.
                </p>
              </div>
            )}

            {/* Attendance Status */}
            <div>
              <label className="block text-slate-700 font-bold mb-1">Status Kehadiran</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as AttendanceStatus)}
                className="w-full border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold text-slate-800"
              >
                <option value="Hadir">Hadir (Sesi Dipotong & Gaji Diproses)</option>
                <option value="Izin H-1">Izin H-1 (Reschedule / Tanpa Potongan)</option>
                <option value="Izin Mendadak">Izin Mendadak (Ada Kompensasi)</option>
                <option value="Force Majeure">Force Majeure (Butuh Approval Management)</option>
                <option value="Alpha">Alpha (Tanpa Keterangan / Tidak Dibayar)</option>
              </select>
            </div>

            {/* VERIFICATION CAMERA AREA */}
            {status === 'Hadir' && (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <label className="block text-slate-800 font-bold flex items-center justify-between">
                  <span>Foto Bukti Sesi Mengajar</span>
                  <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full font-semibold border border-emerald-200">
                    {facingMode === 'user' ? '📷 Kamera Depan (Selfie)' : '📸 Kamera Belakang'}
                  </span>
                </label>

                {selfieUrl ? (
                  <div className="relative rounded-2xl overflow-hidden border border-emerald-300 bg-slate-900 shadow-sm">
                    <img 
                      src={selfieUrl} 
                      alt="Foto bukti preview" 
                      className="w-full h-72 sm:h-80 md:h-[360px] object-cover" 
                    />
                    <button
                      type="button"
                      onClick={() => setSelfieUrl('')}
                      className="absolute top-3 right-3 bg-slate-900/90 text-white text-xs font-bold px-3.5 py-2 rounded-xl backdrop-blur-md hover:bg-rose-600 cursor-pointer transition-all flex items-center gap-1.5 shadow-md"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Ambil Foto Ulang
                    </button>
                  </div>
                ) : isCameraActive ? (
                  <div className="relative rounded-2xl overflow-hidden bg-black text-center shadow-md border border-slate-800">
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      muted
                      className="w-full h-72 sm:h-80 md:h-[360px] object-cover" 
                      style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
                    />
                    
                    <div className="absolute bottom-3 inset-x-3 flex items-center justify-between gap-2 bg-slate-950/85 p-2.5 rounded-xl backdrop-blur-md border border-slate-800/80">
                      <button
                        type="button"
                        onClick={() => startCamera(facingMode === 'user' ? 'environment' : 'user')}
                        className="bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-white font-bold px-3 py-2 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer transition-all border border-slate-700 shrink-0"
                        title="Tukar Kamera Depan / Belakang"
                      >
                        <SwitchCamera className="w-4 h-4 text-indigo-400 shrink-0" />
                        <span>{facingMode === 'user' ? 'Ke Belakang' : 'Ke Depan'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={capturePhoto}
                        className="bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-extrabold px-4 sm:px-5 py-2 rounded-lg text-xs shadow-md cursor-pointer flex items-center gap-1.5 transition-all active:scale-95 shrink-0"
                      >
                        <Camera className="w-4 h-4 shrink-0" /> Jepret Foto
                      </button>

                      <button
                        type="button"
                        onClick={stopCamera}
                        className="bg-rose-600/90 hover:bg-rose-600 text-white font-bold px-3 py-2 rounded-lg text-xs cursor-pointer transition-all shrink-0"
                      >
                        Tutup
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-[11px] text-slate-500 font-medium">Pilih kamera device yang ingin digunakan:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => startCamera('user')}
                        className="bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-all active:scale-95"
                      >
                        <Camera className="w-4 h-4 text-indigo-200" /> Kamera Depan (Selfie)
                      </button>
                      <button
                        type="button"
                        onClick={() => startCamera('environment')}
                        className="bg-slate-800 hover:bg-slate-900 active:bg-slate-950 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-all active:scale-95"
                      >
                        <SwitchCamera className="w-4 h-4 text-emerald-400" /> Kamera Belakang
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Teaching Reports */}
            <div>
              <label className="block text-slate-700 font-bold mb-1">Materi Yang Diajarkan</label>
              <textarea
                rows={2}
                value={materialCovered}
                onChange={(e) => setMaterialCovered(e.target.value)}
                placeholder="Contoh: Bab 3 Pecahan Senilai & Soal Cerita..."
                className="w-full border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Catatan Kemajuan Siswa</label>
              <textarea
                rows={2}
                value={progressNotes}
                onChange={(e) => setProgressNotes(e.target.value)}
                placeholder="Contoh: Siswa sudah paham rumus dasar, perlu latihan soal tingkat lanjut."
                className="w-full border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Feedback Untuk Orang Tua</label>
              <input
                type="text"
                value={tutorFeedback}
                onChange={(e) => setTutorFeedback(e.target.value)}
                placeholder="Contoh: Dampingi belajar hal. 35-37 di rumah"
                className="w-full border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || availableSchedules.length === 0 || isAlreadyAttendedToday}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-200" />
                  <span>Menyimpan & Memproses Absensi...</span>
                </>
              ) : isAlreadyAttendedToday ? (
                <>
                  <AlertTriangle className="w-4 h-4 text-amber-200" />
                  <span>Sudah Di-absen Hari Ini (Mencegah Duplikasi)</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Kirim Absensi & Laporan</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* ATTENDANCE HISTORY LIST (Right Panel) */}
      <div className="lg:col-span-7 space-y-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              Riwayat Absensi & Foto Selfie Siswa
            </h3>
            <span className="text-xs text-slate-500 font-medium">{displayAttendances.length} Laporan Diterima</span>
          </div>

          <div className="space-y-4 max-h-[700px] overflow-y-auto pr-1">
            {displayAttendances.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400 italic">
                Belum ada riwayat absensi terrekam.
              </div>
            ) : (
              displayAttendances.map((att) => {
                const student = students.find(s => s.id === att.studentId);
                const tutor = tutors.find(t => t.id === att.tutorId);

                return (
                  <div key={att.id} className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 hover:bg-slate-50 transition-all space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        {att.selfieUrl ? (
                          <img src={att.selfieUrl} alt="Selfie" className="w-12 h-12 rounded-xl object-cover border border-slate-300 shadow-xs" />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-slate-200 text-slate-500 font-bold flex items-center justify-center text-xs">
                            NO IMG
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-slate-900 text-sm">{student?.name || 'Siswa'} ({student?.grade || '-'})</div>
                          <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                            <span>Tentor: <strong className="text-slate-800">{tutor?.name || 'Tentor'}</strong></span>
                            <span>•</span>
                            <span>{att.date} ({att.serverTime || 'Baru Saja'})</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                          att.status === 'Hadir' ? 'bg-emerald-100 text-emerald-800' :
                          att.status === 'Force Majeure' ? 'bg-purple-100 text-purple-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {att.status}
                        </span>
                        {isAdmin && (
                          <button
                            onClick={() => handleDeleteAttendance(att.id, student?.name || 'Siswa')}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold px-2 py-1.5 rounded-lg text-xs flex items-center gap-1 cursor-pointer transition-all shrink-0"
                            title="Hapus Data Absensi (Fake/Salah Input)"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            <span className="text-[11px]">Hapus Fake</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-100 text-xs space-y-1.5">
                      <div>
                        <span className="text-slate-400 font-semibold uppercase text-[10px]">Materi: </span>
                        <span className="text-slate-800 font-medium">{att.materialCovered}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold uppercase text-[10px]">Kemajuan: </span>
                        <span className="text-slate-700">{att.progressNotes}</span>
                      </div>
                      {att.tutorFeedback && (
                        <div className="text-emerald-700 text-[11px] font-medium pt-1 border-t border-slate-100">
                          💬 Feedback Orang Tua: "{att.tutorFeedback}"
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

