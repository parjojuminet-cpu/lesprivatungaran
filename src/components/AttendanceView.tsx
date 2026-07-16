import React, { useState, useRef, useEffect } from 'react';
import { Attendance, Schedule, Student, Tutor, AttendanceStatus, UserRole, PackageStatus } from '../types';
import { Camera, CheckCircle, Clock, AlertTriangle, UserCheck, RefreshCw, Sparkles, FileText, Loader2, SwitchCamera, Trash2, ShieldCheck, Calendar, Lock, ShieldAlert, Search, Filter, Eye, X, ZoomIn, User } from 'lucide-react';
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
  const getLocalDateString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [selectedScheduleId, setSelectedScheduleId] = useState('');
  const [selectedDate, setSelectedDate] = useState(getLocalDateString());
  const [status, setStatus] = useState<AttendanceStatus>('Hadir');
  const [materialCovered, setMaterialCovered] = useState('');
  const [progressNotes, setProgressNotes] = useState('');
  const [tutorFeedback, setTutorFeedback] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Search & filter state for history view
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('Semua');

  // Photo inspection pop-up modal state
  const [inspectPhotoModal, setInspectPhotoModal] = useState<{
    url: string;
    studentName: string;
    tutorName: string;
    date: string;
    time: string;
    materialCovered: string;
    progressNotes: string;
    tutorFeedback?: string;
    status: string;
    attendanceId: string;
  } | null>(null);

  // Selfie camera state
  const [selfieUrl, setSelfieUrl] = useState<string>('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const directNativeCameraInputRef = useRef<HTMLInputElement | null>(null);

  const isAdmin = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN' || userRole === 'MANAGEMENT';

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

  // Filter attendance history
  const rawDisplayAttendances = (userRole === 'TENTOR' && currentUserTutorId)
    ? attendances.filter(a => a.tutorId === currentUserTutorId)
    : attendances;

  const filteredAttendances = rawDisplayAttendances
    .filter((att) => {
      const student = students.find(s => s.id === att.studentId);
      const tutor = tutors.find(t => t.id === att.tutorId);

      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q ||
        (student?.name || '').toLowerCase().includes(q) ||
        (tutor?.name || '').toLowerCase().includes(q) ||
        (att.materialCovered || '').toLowerCase().includes(q) ||
        (att.date || '').toLowerCase().includes(q);

      const matchStatus = filterStatus === 'Semua' || att.status === filterStatus;

      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateA !== dateB) {
        return dateB - dateA;
      }
      const timeA = a.serverTime ? new Date(a.serverTime).getTime() : 0;
      const timeB = b.serverTime ? new Date(b.serverTime).getTime() : 0;
      if (timeA !== timeB) {
        return timeB - timeA;
      }
      return b.id.localeCompare(a.id);
    });

  const handleDeleteAttendance = async (attendanceId: string, studentName: string) => {
    if (window.confirm(`Apakah Anda yakin ingin MENGHAPUS data absensi ini untuk siswa "${studentName}"?\n\nTindakan ini akan mengembalikan kuota paket siswa (+1) dan membatalkan rekap keuangan/gaji terkait.`)) {
      try {
        await deleteAttendanceData(attendanceId);
        alert('Data absensi berhasil dihapus!');
        onRefresh();
      } catch (err) {
        alert('Gagal menghapus data absensi.');
      }
    }
  };

  const todayStr = getLocalDateString();
  const activeScheduleId = selectedScheduleId || (availableSchedules.length > 0 ? availableSchedules[0].id : '');
  const activeSch = schedules.find(s => s.id === activeScheduleId);
  const activeStudentId = activeSch?.studentId;
  const activeDate = selectedDate;

  // Check if student has already been attended on selected date (Anti-Duplicate Check on same calendar day)
  const isAlreadyAttendedOnSelectedDate = false;

  // Apply Security Watermark (Date, Day, Time, Student, Tutor) to Canvas
  const applyWatermarkToCanvas = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    studentName: string,
    tutorName: string,
    subjectName: string
  ) => {
    const now = new Date();
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

    const dayName = days[now.getDay()];
    const dateStr = `${dayName}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')} WIB`;

    // Reset transform before drawing watermark
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Dark Slate Semi-Transparent Bottom Banner
    const bannerHeight = Math.max(80, Math.floor(height * 0.20));
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)'; // Dark slate background
    ctx.fillRect(0, height - bannerHeight, width, bannerHeight);

    // Amber Accent Top Border
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(0, height - bannerHeight, width, Math.max(3, Math.floor(height * 0.01)));

    const paddingX = Math.max(16, Math.floor(width * 0.035));
    const fontSizeHeader = Math.max(12, Math.floor(height * 0.032));
    const fontSizeBody = Math.max(10, Math.floor(height * 0.026));

    // Header Title
    ctx.fillStyle = '#38bdf8'; // Sky blue
    ctx.font = `bold ${fontSizeHeader}px sans-serif`;
    ctx.fillText(`🛡️ VERIFIKASI PRESENSI BIKO LES (WATERMARK KEAMANAN)`, paddingX, height - bannerHeight + fontSizeHeader + 8);

    // Date & Time
    ctx.fillStyle = '#fbbf24'; // Amber
    ctx.font = `bold ${fontSizeBody}px sans-serif`;
    ctx.fillText(`📅 ${dateStr}  ⏰ ${timeStr}`, paddingX, height - bannerHeight + fontSizeHeader + fontSizeBody + 14);

    // Student & Tutor info
    ctx.fillStyle = '#f8fafc'; // White
    ctx.font = `normal ${fontSizeBody}px sans-serif`;
    ctx.fillText(`👤 Siswa: ${studentName} (${subjectName})  |  👨‍🏫 Tentor: ${tutorName}`, paddingX, height - bannerHeight + fontSizeHeader + (fontSizeBody * 2) + 20);
  };

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
      
      let stream: MediaStream;
      try {
        // Try with ideal constraints first
        stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: { ideal: mode },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });
      } catch (firstErr) {
        console.warn('First camera attempt failed, trying fallback constraints:', firstErr);
        try {
          // Fallback to simpler constraints specifying facingMode
          stream = await navigator.mediaDevices.getUserMedia({
            video: { 
              facingMode: { ideal: mode }
            }
          });
        } catch (secErr) {
          console.warn('Second camera attempt failed, trying basic video:', secErr);
          // Ultimate fallback to generic video capture
          stream = await navigator.mediaDevices.getUserMedia({
            video: true
          });
        }
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn('Camera access error:', err);
      setIsCameraActive(false);
      
      // Auto fallback to native device camera
      if (window.confirm('Gagal membuka kamera langsung di browser. Apakah Anda ingin mengambil foto menggunakan Kamera Bawaan HP Anda sebagai gantinya?')) {
        setTimeout(() => {
          directNativeCameraInputRef.current?.click();
        }, 100);
      } else {
        alert('Gagal mengakses kamera device. Silakan izinkan akses kamera di pengaturan browser Anda.');
      }
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && streamRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      
      // Safe fallback for video dimensions
      let width = video.videoWidth;
      let height = video.videoHeight;
      if (!width || width < 100) width = 1280;
      if (!height || height < 100) height = 720;
      
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        if (facingMode === 'user') {
          // Mirror canvas for selfie so result matches live preview
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Stamp Watermark
        const sch = availableSchedules.find(s => s.id === (selectedScheduleId || availableSchedules[0]?.id));
        const student = students.find(s => s.id === sch?.studentId);
        const tutor = tutors.find(t => t.id === sch?.tutorId);

        applyWatermarkToCanvas(
          ctx, 
          canvas.width, 
          canvas.height, 
          student?.name || 'Siswa', 
          tutor?.name || 'Tentor', 
          sch?.subject || 'Les'
        );

        const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
        setSelfieUrl(dataUrl);
        stopCamera();
        return dataUrl;
      }
      stopCamera();
    }
    return selfieUrl;
  };

  // Handle direct camera capture from native device camera input
  const handleNativeCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width || 1280;
        canvas.height = img.height || 720;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          const sch = availableSchedules.find(s => s.id === (selectedScheduleId || availableSchedules[0]?.id));
          const student = students.find(s => s.id === sch?.studentId);
          const tutor = tutors.find(t => t.id === sch?.tutorId);

          applyWatermarkToCanvas(
            ctx,
            canvas.width,
            canvas.height,
            student?.name || 'Siswa',
            tutor?.name || 'Tentor',
            sch?.subject || 'Les'
          );

          const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
          setSelfieUrl(dataUrl);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
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
      const finalDate = selectedDate;

      await saveAttendanceData({
        scheduleId: sch.id,
        tutorId: sch.tutorId,
        studentId: sch.studentId,
        date: finalDate,
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
      setSelectedDate(getLocalDateString());
      
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
    <div className="space-y-6">
      {/* ========================================== */}
      {/* MODE 1: ADMIN / MANAGEMENT VIEW (TABEL)    */}
      {/* ========================================== */}
      {isAdmin ? (
        <div className="space-y-5">
          {/* Top Summary Banner */}
          <div className="bg-slate-900 text-white p-5 rounded-3xl shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-2xl border border-indigo-500/30">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-extrabold text-base sm:text-lg text-white">Database &amp; Riwayat Presensi Seluruh Tentor</h2>
                <p className="text-xs text-slate-400">Pemeriksaan foto bukti mengajar (Watermark Tanggal &amp; Jam Real-Time) &amp; Rekap Jurnal</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <div className="bg-slate-800/90 px-3.5 py-2 rounded-2xl border border-slate-700/80 text-center">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Laporan</div>
                <div className="font-extrabold text-white text-base">{rawDisplayAttendances.length}</div>
              </div>
              <div className="bg-emerald-950/60 border border-emerald-800/60 px-3.5 py-2 rounded-2xl text-center">
                <div className="text-[10px] text-emerald-300 uppercase font-semibold">Hadir (Siswa)</div>
                <div className="font-extrabold text-emerald-400 text-base">
                  {rawDisplayAttendances.filter(a => a.status === 'Hadir').length}
                </div>
              </div>
              <div className="bg-amber-950/60 border border-amber-800/60 px-3.5 py-2 rounded-2xl text-center">
                <div className="text-[10px] text-amber-300 uppercase font-semibold">Izin Mendadak</div>
                <div className="font-extrabold text-amber-400 text-base">
                  {rawDisplayAttendances.filter(a => a.status === 'Izin Mendadak').length}
                </div>
              </div>
            </div>
          </div>

          {/* Controls Bar: Search & Status Filter */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Cari tentor, siswa, mapel, tanggal..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end text-xs">
              <span className="text-slate-500 font-bold flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-slate-400" /> Filter Status:
              </span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Semua">Semua Status Presensi</option>
                <option value="Hadir">Hadir</option>
                <option value="Izin Mendadak">Izin Mendadak</option>
              </select>
            </div>
          </div>

          {/* TABEL RIWAYAT ABSENSI ADMIN */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Tanggal &amp; Waktu</th>
                    <th className="p-3.5">Nama Tentor</th>
                    <th className="p-3.5">Nama Siswa &amp; Mapel</th>
                    <th className="p-3.5">Status Presensi</th>
                    <th className="p-3.5 text-center bg-indigo-50/50 text-indigo-900 font-bold">Foto Bukti Les (Real-Time)</th>
                    <th className="p-3.5">Jurnal &amp; Progress Belajar</th>
                    <th className="p-3.5 text-right">Aksi Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAttendances.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                        Tidak ada riwayat absensi tentor yang cocok dengan pencarian / filter.
                      </td>
                    </tr>
                  ) : (
                    filteredAttendances.map((att) => {
                      const student = students.find(s => s.id === att.studentId);
                      const tutor = tutors.find(t => t.id === att.tutorId);

                      return (
                        <tr key={att.id} className="hover:bg-slate-50/80 transition-colors">
                          {/* Tanggal & Waktu */}
                          <td className="p-3.5 font-bold text-slate-900 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 text-slate-800">
                              <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                              <span>{att.date}</span>
                            </div>
                            <div className="text-[11px] font-normal text-slate-400 mt-0.5 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>{att.serverTime || 'Jam -'}</span>
                            </div>
                          </td>

                          {/* Tentor */}
                          <td className="p-3.5">
                            <div className="font-extrabold text-slate-900">{tutor?.name || 'Tentor'}</div>
                            <div className="text-[10px] text-slate-500">WA: {tutor?.wa || '-'}</div>
                          </td>

                          {/* Siswa & Mapel */}
                          <td className="p-3.5">
                            <div className="font-bold text-indigo-950">{student?.name || 'Siswa'}</div>
                            <div className="text-[11px] text-slate-500">{student?.grade || '-'} • {student?.school || ''}</div>
                          </td>

                          {/* Status */}
                          <td className="p-3.5 whitespace-nowrap">
                            <span className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full ${
                              att.status === 'Hadir' ? 'bg-emerald-100 text-emerald-800' :
                              'bg-amber-100 text-amber-800'
                            }`}>
                              {att.status}
                            </span>
                          </td>

                          {/* Foto Bukti (Inspeksi) */}
                          <td className="p-3.5 text-center bg-indigo-50/20">
                            {att.selfieUrl ? (
                              <div className="flex flex-col items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => setInspectPhotoModal({
                                    url: att.selfieUrl,
                                    studentName: student?.name || 'Siswa',
                                    tutorName: tutor?.name || 'Tentor',
                                    date: att.date,
                                    time: att.serverTime || 'Baru saja',
                                    materialCovered: att.materialCovered || '-',
                                    progressNotes: att.progressNotes || '-',
                                    tutorFeedback: att.tutorFeedback,
                                    status: att.status,
                                    attendanceId: att.id
                                  })}
                                  className="relative group cursor-pointer focus:outline-none"
                                  title="Klik untuk memperbesar & inspeksi foto"
                                >
                                  <img
                                    src={att.selfieUrl}
                                    alt="Selfie Presensi"
                                    className="w-14 h-14 rounded-xl object-cover border-2 border-indigo-200 group-hover:border-indigo-500 transition-all shadow-xs group-hover:scale-105"
                                  />
                                  <div className="absolute inset-0 bg-indigo-950/40 rounded-xl opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-white">
                                    <ZoomIn className="w-5 h-5" />
                                  </div>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setInspectPhotoModal({
                                    url: att.selfieUrl,
                                    studentName: student?.name || 'Siswa',
                                    tutorName: tutor?.name || 'Tentor',
                                    date: att.date,
                                    time: att.serverTime || 'Baru saja',
                                    materialCovered: att.materialCovered || '-',
                                    progressNotes: att.progressNotes || '-',
                                    tutorFeedback: att.tutorFeedback,
                                    status: att.status,
                                    attendanceId: att.id
                                  })}
                                  className="text-[10px] text-indigo-700 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                                >
                                  <Eye className="w-3 h-3 text-indigo-600" /> Cek Foto Asli
                                </button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">Tanpa Foto</span>
                            )}
                          </td>

                          {/* Jurnal & Progress */}
                          <td className="p-3.5 max-w-xs">
                            <div className="font-bold text-slate-800 line-clamp-1">{att.materialCovered}</div>
                            {att.progressNotes && (
                              <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{att.progressNotes}</div>
                            )}
                            {att.tutorFeedback && (
                              <div className="text-[10px] text-emerald-700 font-semibold line-clamp-1 mt-0.5">💬 {att.tutorFeedback}</div>
                            )}
                          </td>

                          {/* Aksi Admin */}
                          <td className="p-3.5 text-right whitespace-nowrap">
                            <button
                              onClick={() => handleDeleteAttendance(att.id, student?.name || 'Siswa')}
                              className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 cursor-pointer transition-all active:scale-95 ml-auto"
                              title="Hapus Data Absensi (Misal Foto Fake / Salah Sesi)"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                              <span>Hapus Fake</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* ========================================== */
        /* MODE 2: TENTOR VIEW (FORM + SELFIE CAMERA) */
        /* ========================================== */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* FORM INPUT ABSENSI (Left / Top Panel) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Form Absensi &amp; Selfie Tentor</h3>
                  <p className="text-[11px] text-slate-500">Verifikasi kehadiran &amp; jurnal mengajar</p>
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
                    <span>Belum Ada Jadwal Les Aktif</span>
                  </div>
                  <p className="text-[11px] text-amber-700 leading-relaxed">
                    Akun Anda belum memiliki jadwal les aktif yang ditugaskan. Hubungi Manajemen Bimbel untuk menambahkan jadwal les Anda.
                  </p>
                </div>
              ) : null}

              <form onSubmit={handleSubmitAttendance} className="space-y-4 text-xs">
                {/* Kuota Paket Info Banner */}
                <div className="bg-indigo-50/80 border border-indigo-200 p-3 rounded-xl text-xs text-indigo-950 flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-extrabold text-indigo-900">Sistem Presensi Fleksibel (Murni Kuota):</span>
                    <p className="text-[11px] text-indigo-800 leading-relaxed">
                      Tentor bebas menentukan hari apa saja untuk melakukan sesi belajar sesuai kesepakatan riil di lapangan. <strong className="text-emerald-950 underline">Sistem presensi murni berbasis kuota (tanpa batasan hari kalender).</strong>
                    </p>
                  </div>
                </div>

                {/* Schedule Picker */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Pilih Siswa &amp; Jadwal Les</label>
                  <select
                    value={selectedScheduleId}
                    onChange={(e) => setSelectedScheduleId(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold text-slate-900 text-xs"
                    required
                  >
                    {availableSchedules.length === 0 && <option value="">-- Tidak ada jadwal aktif --</option>}
                    {availableSchedules.map((sch) => {
                      const student = students.find(s => s.id === sch.studentId);
                      const remaining = student ? student.remainingSessions : 0;
                      return (
                        <option key={sch.id} value={sch.id}>
                          Siswa: {student?.name || sch.studentId} ({sch.subject}) • Sisa Kuota: {remaining} Sesi
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Date Picker */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Tanggal Pertemuan Les</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold text-slate-800 text-xs"
                    required
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Isi dengan tanggal pelaksanaan les yang sebenarnya (bebas memilih tanggal belajar / murni sistem kuota).
                  </p>
                </div>



                {/* Attendance Status */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Status Kehadiran</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as AttendanceStatus)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold text-slate-800"
                  >
                    <option value="Hadir">Hadir (Kuota Paket Dipotong 1 &amp; Gaji Diproses)</option>
                    <option value="Izin Mendadak">Izin Mendadak (Pertemuan Diliburkan / Kuota Utuh)</option>
                  </select>
                </div>

                {/* VERIFICATION CAMERA & WATERMARK AREA */}
                {status === 'Hadir' && (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-slate-800 font-bold">Foto Bukti Mengajar (Kamera Langsung)</label>
                      <span className="text-[10px] text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full font-bold border border-amber-200 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-amber-600" /> Auto Watermark Timestamp
                      </span>
                    </div>

                    {/* Hidden File Input for Native Camera Capture fallback */}
                    <input
                      type="file"
                      ref={directNativeCameraInputRef}
                      accept="image/*"
                      capture={facingMode}
                      onChange={handleNativeCameraCapture}
                      className="hidden"
                    />

                    {selfieUrl ? (
                      <div className="relative rounded-2xl overflow-hidden border border-emerald-300 bg-slate-900 shadow-sm">
                        <img 
                          src={selfieUrl} 
                          alt="Foto bukti preview" 
                          className="w-full h-72 sm:h-80 object-cover" 
                        />
                        <div className="absolute top-3 right-3 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelfieUrl('')}
                            className="bg-slate-900/90 text-white text-xs font-bold px-3.5 py-2 rounded-xl backdrop-blur-md hover:bg-rose-600 cursor-pointer transition-all flex items-center gap-1.5 shadow-md"
                          >
                            <RefreshCw className="w-3.5 h-3.5" /> Ambil Foto Ulang
                          </button>
                        </div>
                      </div>
                    ) : isCameraActive ? (
                      <div className="relative rounded-2xl overflow-hidden bg-black text-center shadow-md border border-slate-800">
                        <video 
                          ref={videoRef} 
                          autoPlay 
                          playsInline 
                          muted
                          className="w-full h-72 sm:h-80 object-cover" 
                          style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
                        />
                        
                        <div className="absolute bottom-3 inset-x-3 flex items-center justify-between gap-2 bg-slate-950/85 p-2.5 rounded-xl backdrop-blur-md border border-slate-800/80">
                          <button
                            type="button"
                            onClick={() => startCamera(facingMode === 'user' ? 'environment' : 'user')}
                            className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-3 py-2 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer border border-slate-700 shrink-0"
                          >
                            <SwitchCamera className="w-4 h-4 text-indigo-400 shrink-0" />
                            <span>{facingMode === 'user' ? 'Ke Belakang' : 'Ke Depan'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={capturePhoto}
                            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold px-4 py-2 rounded-lg text-xs shadow-md cursor-pointer flex items-center gap-1.5 active:scale-95 shrink-0"
                          >
                            <Camera className="w-4 h-4 shrink-0" /> Jepret Foto
                          </button>

                          <button
                            type="button"
                            onClick={stopCamera}
                            className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-3 py-2 rounded-lg text-xs cursor-pointer shrink-0"
                          >
                            Tutup
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        <p className="text-[11px] text-slate-700 font-extrabold flex items-center gap-1">
                          <Camera className="w-3.5 h-3.5 text-indigo-600" />
                          Pilih Kamera Untuk Ambil Foto Langsung Hari Ini:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <button
                            type="button"
                            onClick={() => startCamera('user')}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-3 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs border border-indigo-700"
                          >
                            <Camera className="w-4 h-4 text-indigo-200 shrink-0" />
                            <div className="text-left leading-tight">
                              <div className="font-extrabold">📷 Kamera Depan</div>
                              <div className="text-[10px] text-indigo-200 font-normal">Selfie Tentor &amp; Murid</div>
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={() => startCamera('environment')}
                            className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-3 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs border border-slate-800"
                          >
                            <SwitchCamera className="w-4 h-4 text-emerald-400 shrink-0" />
                            <div className="text-left leading-tight">
                              <div className="font-extrabold">📷 Kamera Belakang</div>
                              <div className="text-[10px] text-slate-300 font-normal">Foto Suasana Les / Buku</div>
                            </div>
                          </button>
                        </div>

                        {/* Native Camera Capture alternative for resilient saves */}
                        <div className="pt-2 border-t border-dashed border-slate-200">
                          <button
                            type="button"
                            onClick={() => {
                              setFacingMode('environment');
                              setTimeout(() => {
                                directNativeCameraInputRef.current?.click();
                              }, 100);
                            }}
                            className="w-full bg-amber-50 hover:bg-amber-100 text-amber-800 font-extrabold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer border border-amber-200 transition-all shadow-3xs"
                          >
                            <Camera className="w-4 h-4 text-amber-600 shrink-0" />
                            <span>Alternatif: Ambil Foto Menggunakan Kamera HP Bawaan</span>
                          </button>
                          <p className="text-[10px] text-center text-slate-500 mt-1 leading-relaxed">
                            Gunakan tombol alternatif di atas jika kamera langsung di web bermasalah / blank hitam.
                          </p>
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
                    placeholder="Contoh: Bab 3 Pecahan Senilai &amp; Soal Cerita..."
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
                  disabled={isSubmitting || availableSchedules.length === 0 || isAlreadyAttendedOnSelectedDate}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-200" />
                      <span>Menyimpan &amp; Memproses Absensi...</span>
                    </>
                  ) : isAlreadyAttendedOnSelectedDate ? (
                    <>
                      <AlertTriangle className="w-4 h-4 text-amber-200" />
                      <span>Sudah Di-absen pada Tanggal Terpilih</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Kirim Absensi &amp; Laporan</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* ATTENDANCE HISTORY LIST (Right Panel for Tentor) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  Riwayat Absensi Saya
                </h3>
                <span className="text-xs text-slate-500 font-medium">{filteredAttendances.length} Laporan Diterima</span>
              </div>

              <div className="space-y-4 max-h-[700px] overflow-y-auto pr-1">
                {filteredAttendances.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400 italic">
                    Belum ada riwayat absensi terrekam.
                  </div>
                ) : (
                  filteredAttendances.map((att) => {
                    const student = students.find(s => s.id === att.studentId);
                    const tutor = tutors.find(t => t.id === att.tutorId);

                    return (
                      <div key={att.id} className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 hover:bg-slate-50 transition-all space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-3">
                            {att.selfieUrl ? (
                              <button
                                type="button"
                                onClick={() => setInspectPhotoModal({
                                  url: att.selfieUrl,
                                  studentName: student?.name || 'Siswa',
                                  tutorName: tutor?.name || 'Tentor',
                                  date: att.date,
                                  time: att.serverTime || 'Baru saja',
                                  materialCovered: att.materialCovered || '-',
                                  progressNotes: att.progressNotes || '-',
                                  tutorFeedback: att.tutorFeedback,
                                  status: att.status,
                                  attendanceId: att.id
                                })}
                                className="relative group cursor-pointer focus:outline-none"
                                title="Klik untuk memperbesar foto presensi"
                              >
                                <img src={att.selfieUrl} alt="Selfie" className="w-12 h-12 rounded-xl object-cover border border-slate-300 shadow-xs group-hover:scale-105 transition-all" />
                              </button>
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-slate-200 text-slate-500 font-bold flex items-center justify-center text-xs">
                                NO IMG
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-slate-900 text-sm">{student?.name || 'Siswa'} ({student?.grade || '-'})</div>
                              <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                                <span>{att.date} ({att.serverTime || 'Baru Saja'})</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-start sm:self-auto">
                            <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                              att.status === 'Hadir' ? 'bg-emerald-100 text-emerald-800' :
                              'bg-amber-100 text-amber-800'
                            }`}>
                              {att.status}
                            </span>
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
      )}

      {/* ======================================================== */}
      {/* POP-UP MODAL INSPEKSI FOTO BUKTI PRESENSI (HIGH-RES)    */}
      {/* ======================================================== */}
      {inspectPhotoModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-indigo-100 text-indigo-800 rounded-2xl border border-indigo-200">
                  <ShieldCheck className="w-5 h-5 text-indigo-700" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Inspeksi Foto Bukti Presensi</h3>
                  <p className="text-xs text-slate-500">Watermark Tanggal, Jam, Siswa &amp; Tentor Ter-Burned In</p>
                </div>
              </div>
              <button
                onClick={() => setInspectPhotoModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl cursor-pointer hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Photo Container */}
            <div className="bg-slate-950 rounded-2xl p-2 flex flex-col items-center justify-center relative overflow-hidden group">
              <img
                src={inspectPhotoModal.url}
                alt="Foto Bukti Presensi"
                className="max-h-[58vh] w-auto object-contain rounded-xl shadow-2xl border border-slate-800"
              />
              <div className="mt-2 text-center text-[11px] text-amber-300 font-bold bg-slate-900/90 px-3.5 py-1 rounded-full border border-amber-500/30 shadow-xs">
                🛡️ Verifikasi Watermark Keamanan Real-Time Bimbel
              </div>
            </div>

            {/* Metadata Information */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 font-semibold block text-[10px]">TENTOR PENGAJAR:</span>
                <span className="font-extrabold text-slate-900">{inspectPhotoModal.tutorName}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block text-[10px]">SISWA LES:</span>
                <span className="font-extrabold text-slate-900">{inspectPhotoModal.studentName}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block text-[10px]">TANGGAL &amp; JAM PRESENSI:</span>
                <span className="font-bold text-slate-800">{inspectPhotoModal.date} ({inspectPhotoModal.time})</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block text-[10px]">STATUS PRESENSI:</span>
                <span className={`inline-block font-extrabold px-2.5 py-0.5 rounded-full text-[11px] ${
                  inspectPhotoModal.status === 'Hadir' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {inspectPhotoModal.status}
                </span>
              </div>
              <div className="col-span-2 pt-2 border-t border-slate-200/80">
                <span className="text-slate-400 font-semibold block text-[10px]">MATERI &amp; PROGRESS:</span>
                <p className="text-slate-800 font-medium text-xs mt-0.5">{inspectPhotoModal.materialCovered}</p>
                {inspectPhotoModal.progressNotes && (
                  <p className="text-slate-500 text-[11px] mt-0.5 italic">"{inspectPhotoModal.progressNotes}"</p>
                )}
                {inspectPhotoModal.tutorFeedback && (
                  <p className="text-emerald-700 text-[11px] mt-0.5 font-semibold">💬 Feedback: "{inspectPhotoModal.tutorFeedback}"</p>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <div className="text-[11px] text-slate-400 italic font-semibold">
                *Edit / Hapus absensi dialihkan ke Jantung Sistem
              </div>

              <button
                type="button"
                onClick={() => setInspectPhotoModal(null)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-xl text-xs cursor-pointer shadow-sm active:scale-95 transition-all"
              >
                Tutup Pratinjau
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

