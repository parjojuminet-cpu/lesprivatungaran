import React, { useState } from 'react';
import { DashboardStats, Student, Schedule, Approval, Invoice, UserRole, Attendance, Tutor, TutorSalary, Finance } from '../types';
import {
  Users, GraduationCap, DollarSign, Wallet, TrendingUp, TrendingDown,
  AlertTriangle, Clock, Calendar, CheckCircle2, ArrowRight, Bell, Sparkles,
  FileText, ShieldAlert, UserCheck, PlusCircle, Zap, X
} from 'lucide-react';
import { persistDatabaseUpdate } from '../services/dataManager';

interface DashboardViewProps {
  stats: DashboardStats | null;
  students: Student[];
  schedules: Schedule[];
  approvals: Approval[];
  invoices: Invoice[];
  attendances?: Attendance[];
  tutors?: Tutor[];
  salaries?: TutorSalary[];
  finance?: Finance[];
  userRole: UserRole;
  currentUserTutorId?: string;
  onNavigate: (tab: any) => void;
  onPullSheet?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats: _backendStats,
  students,
  schedules,
  approvals,
  invoices,
  attendances = [],
  tutors = [],
  salaries = [],
  finance = [],
  userRole,
  currentUserTutorId,
  onNavigate,
  onPullSheet
}) => {
  const [showExtraKuotaModal, setShowExtraKuotaModal] = useState(false);
  const [selectedStudentIdForExtra, setSelectedStudentIdForExtra] = useState('');
  const [extraKuotaAmount, setExtraKuotaAmount] = useState<number>(4);
  const [extraKuotaReason, setExtraKuotaReason] = useState('Persiapan Ujian Semester / Pendalaman Materi');

  // Real-time clientside stats computation to bypass backend state resets/restarts
  const stats: DashboardStats = {
    totalActiveStudents: students.filter(s => s.status === 'Aktif').length,
    totalActiveTutors: tutors.filter(t => t.status === 'Aktif').length,
    totalSessionsThisMonth: attendances.length,
    grossIncomeThisMonth: finance
      .filter(f => f.type === 'Pemasukan' && f.category === 'SPP Siswa')
      .reduce((acc, f) => acc + (Number(f.amount) || 0), 0),
    netManagementProfitThisMonth: finance
      .filter(f => f.type === 'Pemasukan' && f.category === 'Fee Manajemen')
      .reduce((acc, f) => acc + (Number(f.amount) || 0), 0) -
      finance
      .filter(f => f.type === 'Pengeluaran' && f.category === 'Operasional')
      .reduce((acc, f) => acc + (Number(f.amount) || 0), 0),
    pendingApprovals: approvals.filter(a => a.status === 'Pending').length,
    unpaidInvoices: invoices.filter(i => i.status !== 'Lunas').length,
    monthlyRevenue: finance
      .filter(f => f.type === 'Pemasukan' && f.category === 'SPP Siswa')
      .reduce((acc, f) => acc + (Number(f.amount) || 0), 0),
    monthlyTutorSalaries: finance
      .filter(f => f.type === 'Pengeluaran' && f.category === 'Gaji Tentor')
      .reduce((acc, f) => acc + (Number(f.amount) || 0), 0),
    monthlyManagementFees: finance
      .filter(f => f.type === 'Pemasukan' && f.category === 'Fee Manajemen')
      .reduce((acc, f) => acc + (Number(f.amount) || 0), 0),
    monthlyOperationalExpenses: finance
      .filter(f => f.type === 'Pengeluaran' && f.category === 'Operasional')
      .reduce((acc, f) => acc + (Number(f.amount) || 0), 0),
    monthlyNetProfit: finance
      .filter(f => f.type === 'Pemasukan' && f.category === 'Fee Manajemen')
      .reduce((acc, f) => acc + (Number(f.amount) || 0), 0) -
      finance
      .filter(f => f.type === 'Pengeluaran' && f.category === 'Operasional')
      .reduce((acc, f) => acc + (Number(f.amount) || 0), 0),
    unpaidInvoicesAmount: invoices
      .filter(i => i.status !== 'Lunas')
      .reduce((acc, i) => acc + (i.amount - (i.amountPaid || 0)), 0),
  };

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num || 0);
  };

  const isTentor = userRole === 'TENTOR';

  // Filter for Tentor role: only show students taught by this tentor
  const mySchedules = (isTentor && currentUserTutorId)
    ? schedules.filter(s => s.tutorId === currentUserTutorId)
    : schedules;

  const myStudentIds = new Set(mySchedules.map(s => s.studentId));

  const myStudents = (isTentor && currentUserTutorId)
    ? students.filter(s => myStudentIds.has(s.id))
    : students;

  const myAttendances = (isTentor && currentUserTutorId)
    ? attendances.filter(a => a.tutorId === currentUserTutorId)
    : attendances;

  const recentAttendances = [...myAttendances]
    .sort((a, b) => {
      // Sort by date descending (newest date first)
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateA !== dateB) {
        return dateB - dateA;
      }
      // If dates are identical, sort by serverTime or id timestamp descending (newest submission first)
      const timeA = a.serverTime ? new Date(a.serverTime).getTime() : 0;
      const timeB = b.serverTime ? new Date(b.serverTime).getTime() : 0;
      if (timeA !== timeB) {
        return timeB - timeA;
      }
      return b.id.localeCompare(a.id);
    })
    .slice(0, 6);

  const expiringStudents = myStudents.filter(s => s.remainingSessions <= 2 && s.status === 'Aktif');
  const pendingApprovalsList = approvals.filter(a => a.status === 'Pending');

  // Compute Tentor real-time total earnings from attendances marked as 'Hadir'
  const myCurrentTutor = tutors.find(t => t.id === currentUserTutorId);
  const myHadirAttendances = myAttendances.filter(a => a.status === 'Hadir');
  const totalTentorEarnings = myHadirAttendances.reduce((acc, att) => {
    const sch = schedules.find(s => s.id === att.scheduleId);
    const st = students.find(s => s.id === att.studentId);
    const sppRate = st?.ratePerSession || 25000;
    const adminFee = sch?.adminFee ?? st?.managementMarginNominal ?? 5000;
    const honorRate = sch?.sessionRate ?? (sppRate - adminFee);
    return acc + honorRate;
  }, 0);

  // Compute ALL Tutors real-time total earnings for Admin Login
  const allHadirAttendances = attendances.filter(a => a.status === 'Hadir');
  const totalAllTutorsHonor = allHadirAttendances.reduce((acc, att) => {
    const sch = schedules.find(s => s.id === att.scheduleId);
    const st = students.find(s => s.id === att.studentId);
    const sppRate = st?.ratePerSession || 25000;
    const adminFee = sch?.adminFee ?? st?.managementMarginNominal ?? 5000;
    const honorRate = sch?.sessionRate ?? (sppRate - adminFee);
    return acc + honorRate;
  }, 0);

  // Per-Tutor Earnings Breakdown for Admin
  const allTutorsEarnings = tutors.map(tut => {
    const tutAttendances = attendances.filter(a => a.tutorId === tut.id && a.status === 'Hadir');
    const totalSessions = tutAttendances.length;
    const totalEarned = tutAttendances.reduce((acc, att) => {
      const sch = schedules.find(s => s.id === att.scheduleId);
      const st = students.find(s => s.id === att.studentId);
      const sppRate = st?.ratePerSession || 25000;
      const adminFee = sch?.adminFee ?? st?.managementMarginNominal ?? 5000;
      const honorRate = sch?.sessionRate ?? (sppRate - adminFee);
      return acc + honorRate;
    }, 0);

    const salaryRecord = salaries.find(s => s.tutorId === tut.id);
    const paymentStatus = salaryRecord ? salaryRecord.paymentStatus : (totalSessions > 0 ? 'Pending' : 'N/A');

    return {
      tutor: tut,
      totalSessions,
      totalEarned,
      paymentStatus
    };
  });

  const handleOpenExtraKuotaModal = (studentId?: string) => {
    if (studentId) {
      setSelectedStudentIdForExtra(studentId);
    } else if (myStudents.length > 0) {
      setSelectedStudentIdForExtra(myStudents[0].id);
    } else if (students.length > 0) {
      setSelectedStudentIdForExtra(students[0].id);
    }
    setShowExtraKuotaModal(true);
  };

  const handleExtraKuotaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentIdForExtra) {
      alert('Silakan pilih siswa terlebih dahulu.');
      return;
    }

    const targetStudent = students.find(s => s.id === selectedStudentIdForExtra);
    if (!targetStudent) return;

    const currentTutor = tutors.find(t => t.id === currentUserTutorId);
    const applicantName = isTentor ? (currentTutor?.name || 'Tentor') : (userRole === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'MANAGEMENT');
    const numAmount = Number(extraKuotaAmount) || 4;

    try {
      await persistDatabaseUpdate(db => {
        if (isTentor) {
          // Tentor submits approval request to Admin
          const newApproval: Approval = {
            id: `app_${Date.now()}`,
            type: 'Pengajuan Kuota Extra',
            requestedBy: applicantName,
            tutorId: currentUserTutorId,
            studentId: selectedStudentIdForExtra,
            reason: `Pengajuan Kuota Extra +${numAmount} Pertemuan untuk ${targetStudent.name}: ${extraKuotaReason}`,
            status: 'Pending',
            createdAt: new Date().toISOString()
          };
          return { ...db, approvals: [newApproval, ...db.approvals] };
        } else {
          // Admin / Management adds extra kuota directly to student
          const updatedStudents = db.students.map(st => {
            if (st.id === selectedStudentIdForExtra) {
              const newRem = st.remainingSessions + numAmount;
              const newTotal = st.totalPackageSessions + numAmount;
              return {
                ...st,
                remainingSessions: newRem,
                totalPackageSessions: newTotal,
                packageStatus: 'Aktif' as const
              };
            }
            return st;
          });

          const newApproval: Approval = {
            id: `app_${Date.now()}`,
            type: 'Pengajuan Kuota Extra',
            requestedBy: applicantName,
            studentId: selectedStudentIdForExtra,
            reason: `Penambahan Kuota Extra +${numAmount} Pertemuan untuk ${targetStudent.name}: ${extraKuotaReason}`,
            status: 'Approved',
            approvedBy: applicantName,
            remarks: 'Disetujui Langsung oleh Manajemen',
            createdAt: new Date().toISOString()
          };

          return { ...db, students: updatedStudents, approvals: [newApproval, ...db.approvals] };
        }
      });

      if (isTentor) {
        alert(`Pengajuan Kuota Extra (+${numAmount} Pertemuan) untuk ${targetStudent.name} berhasil dikirim ke Admin/Manajemen!`);
      } else {
        alert(`Kuota Extra (+${numAmount} Pertemuan) berhasil ditambahkan untuk ${targetStudent.name}! Sisa kuota baru: ${targetStudent.remainingSessions + numAmount}`);
      }

      setShowExtraKuotaModal(false);
      setExtraKuotaReason('Persiapan Ujian Semester / Pendalaman Materi');
    } catch (err) {
      alert('Gagal memproses penambahan kuota extra');
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-850 to-slate-900 rounded-2xl p-6 md:p-7 text-white shadow-md relative overflow-hidden border border-indigo-800/50">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold tracking-wider uppercase">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{isTentor ? 'Portal Mengajar Tentor Bimbel' : 'Overview Dashboard Operasional & Keuangan'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {isTentor ? 'Selamat Datang di Portal Tentor' : 'Selamat Datang di Portal Manajemen Bimbel'}
            </h2>
            <p className="text-indigo-100/90 text-xs sm:text-sm max-w-2xl font-normal leading-relaxed">
              {isTentor
                ? 'Kelola absensi selfie, pantau sisa kuota murid yang Anda ampu, dan ajukan kuota extra saat persiapan ujian.'
                : 'Pantau omzet SPP, verifikasi absensi selfie tentor, dan otomatisasikan pembayaran gaji serta fee manajemen secara real-time.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {isTentor ? (
              <button
                onClick={() => handleOpenExtraKuotaModal()}
                className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold px-4 py-2.5 rounded-xl text-xs sm:text-sm transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Zap className="w-4 h-4 fill-slate-950" />
                <span>Ajukan Kuota Extra Murid</span>
              </button>
            ) : (
              <button
                onClick={() => handleOpenExtraKuotaModal()}
                className="bg-indigo-500 hover:bg-indigo-400 text-white font-extrabold px-4 py-2.5 rounded-xl text-xs sm:text-sm transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-95 border border-indigo-300/30"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Tambah Kuota Extra Murid</span>
              </button>
            )}

            <button
              onClick={() => onNavigate('attendance')}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <span>Isi Absensi Selfie</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      {!isTentor ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Siswa Aktif */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Siswa Aktif</span>
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold border border-blue-100/80">
                  <GraduationCap className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-extrabold text-slate-900 tracking-tight">{stats?.totalActiveStudents || 0} <span className="text-xs font-semibold text-slate-500 font-normal">Murid</span></div>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200/60">{expiringStudents.length} murid</span> sisa kuota ≤ 2
                </p>
              </div>
            </div>

            {/* Tentor Aktif */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tentor Aktif</span>
                <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold border border-purple-100/80">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-extrabold text-slate-900 tracking-tight">{stats?.totalActiveTutors || 0} <span className="text-xs font-semibold text-slate-500 font-normal">Pengajar</span></div>
                <p className="text-xs text-slate-500 mt-1">Mengampu seluruh area Jabodetabek</p>
              </div>
            </div>

            {/* Omzet Kotor SPP Bulan Ini */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Omset Kotor SPP (Pemasukan)</span>
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold border border-emerald-100/80">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-xl sm:text-2xl font-extrabold text-emerald-700 font-mono tracking-tight">{formatRupiah(stats?.monthlyRevenue || 0)}</div>
                <p className="text-xs text-slate-500 mt-1">Total akumulasi penerimaan kotor SPP siswa</p>
              </div>
            </div>

            {/* Profit Bersih Management */}
            <div className="bg-gradient-to-br from-amber-50/50 via-white to-white rounded-2xl p-5 border border-amber-200/80 shadow-2xs hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-amber-900 uppercase tracking-wider">Profit Bersih Bimbel</span>
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold border border-amber-200">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-xl sm:text-2xl font-extrabold text-amber-800 font-mono tracking-tight">{formatRupiah(stats?.monthlyNetProfit || 0)}</div>
                <p className="text-[11px] text-amber-900/80 mt-1 font-semibold">
                  Fee Bimbel ({formatRupiah(stats?.monthlyManagementFees || 0)}) - Operasional ({formatRupiah(stats?.monthlyOperationalExpenses || 0)})
                </p>
              </div>
            </div>
          </div>

          {/* Admin Real-Time All-Tutors Income Recap Banner & Breakdown */}
          <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white rounded-2xl p-5 border border-indigo-700/60 shadow-md space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-indigo-800/60 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider">
                  <Wallet className="w-4 h-4 text-indigo-400" />
                  <span>Rekapan Pendapatan & Honor Semua Tentor (Otomatis Terekap)</span>
                  <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded-full border border-emerald-400/30">
                    Real-time Cloud Sync
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-indigo-300 font-mono tracking-tight">
                  {formatRupiah(totalAllTutorsHonor)}
                </div>
                <p className="text-xs text-indigo-200/90 leading-relaxed">
                  Total akumulasi honor mengajar dari seluruh <strong className="text-white">{tutors.length} tentor</strong> berdasarkan <strong className="text-white">{allHadirAttendances.length} presensi hadir</strong>.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => onNavigate('finance')}
                  className="bg-indigo-500 hover:bg-indigo-400 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <span>Buka Keuangan / Payroll</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Per-Tutor Mini Table */}
            <div className="bg-slate-950/70 rounded-xl p-3 border border-indigo-800/50">
              <div className="text-xs font-bold text-indigo-300 mb-2 flex items-center justify-between">
                <span>Daftar Rincian Pendapatan per Tentor</span>
                <span className="text-[11px] text-indigo-300/80 font-normal">{allTutorsEarnings.length} Pengajar Terdata</span>
              </div>
              <div className="overflow-x-auto max-h-52 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-indigo-900/60 text-indigo-200 font-semibold sticky top-0">
                    <tr>
                      <th className="p-2">Nama Tentor</th>
                      <th className="p-2 text-center">Kehadiran</th>
                      <th className="p-2 text-right">Honor / Pertemuan</th>
                      <th className="p-2 text-right font-bold text-emerald-300">Total Honor Terekap</th>
                      <th className="p-2 text-center">Status Pencairan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-indigo-800/40">
                    {allTutorsEarnings.map((item) => (
                      <tr key={item.tutor.id} className="hover:bg-indigo-900/30">
                        <td className="p-2 font-medium text-white flex items-center gap-2">
                          <Users className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          <div>
                            <div className="font-bold">{item.tutor.name}</div>
                            <div className="text-[10px] text-indigo-300/70">{item.tutor.subjects?.join(', ') || 'Tentor Bimbel'}</div>
                          </div>
                        </td>
                        <td className="p-2 text-center font-bold text-indigo-200">{item.totalSessions} Pertemuan</td>
                        <td className="p-2 text-right text-indigo-300 font-mono">{formatRupiah(item.tutor.ratePerSession || 40000)}</td>
                        <td className="p-2 text-right font-bold text-emerald-400 font-mono">{formatRupiah(item.totalEarned)}</td>
                        <td className="p-2 text-center">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            item.paymentStatus === 'Paid' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                            item.paymentStatus === 'Approved' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                            item.totalSessions > 0 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                            'bg-slate-700/50 text-slate-400'
                          }`}>
                            {item.paymentStatus === 'Paid' ? 'Sudah Cair' : item.totalSessions > 0 ? 'Pending Payroll' : 'Belum Ada Presensi'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Secondary Financial Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="bg-slate-50/80 rounded-2xl p-3.5 border border-slate-200/80 flex items-center justify-between shadow-2xs">
              <div>
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Omset Kotor SPP</div>
                <div className="text-sm font-extrabold text-emerald-700 font-mono mt-0.5">{formatRupiah(stats?.monthlyRevenue || 0)}</div>
                <div className="text-[9px] text-slate-400 font-medium mt-0.5">Penerimaan Kotor SPP</div>
              </div>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-slate-50/80 rounded-2xl p-3.5 border border-slate-200/80 flex items-center justify-between shadow-2xs">
              <div>
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Gaji Tentor</div>
                <div className="text-sm font-extrabold text-indigo-700 font-mono mt-0.5">{formatRupiah(stats?.monthlyTutorSalaries || 0)}</div>
                <div className="text-[9px] text-slate-400 font-medium mt-0.5">Honor Mengajar Tentor</div>
              </div>
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                <Wallet className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-slate-50/80 rounded-2xl p-3.5 border border-slate-200/80 flex items-center justify-between shadow-2xs">
              <div>
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Fee Manajemen</div>
                <div className="text-sm font-extrabold text-slate-800 font-mono mt-0.5">{formatRupiah(stats?.monthlyManagementFees || 0)}</div>
                <div className="text-[9px] text-indigo-700 font-medium mt-0.5">SPP Siswa - Honor Tentor</div>
              </div>
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                <Wallet className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-slate-50/80 rounded-2xl p-3.5 border border-slate-200/80 flex items-center justify-between shadow-2xs">
              <div>
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Biaya Operasional</div>
                <div className="text-sm font-extrabold text-rose-700 font-mono mt-0.5">{formatRupiah(stats?.monthlyOperationalExpenses || 0)}</div>
                <div className="text-[9px] text-slate-400 font-medium mt-0.5">Kas Pengeluaran Umum</div>
              </div>
              <div className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
                <TrendingDown className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-amber-50/80 rounded-2xl p-3.5 border border-amber-200/80 flex items-center justify-between shadow-2xs">
              <div>
                <div className="text-[10px] text-amber-900 font-bold uppercase tracking-wider">Profit Bersih Bimbel</div>
                <div className="text-sm font-extrabold text-amber-900 font-mono mt-0.5">{formatRupiah(stats?.monthlyNetProfit || 0)}</div>
                <div className="text-[9px] text-amber-800 font-medium mt-0.5">Fee - Operasional</div>
              </div>
              <div className="p-2 rounded-xl bg-amber-100 text-amber-800 border border-amber-200">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Tentor-Specific KPI Cards & Income Summary */
        <div className="space-y-4">
          {/* Panduan Alur Kerja & Absen Tentor */}
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-5 border border-indigo-500/30 shadow-md space-y-4">
            <div className="flex items-center gap-2 border-b border-indigo-800/50 pb-3">
              <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-white tracking-tight">💡 Panduan Alur Kerja &amp; Cara Absen Tentor</h3>
                <p className="text-[11px] text-indigo-200">Ikuti 5 langkah mudah berikut ini agar proses mengajar lancar dan honor Anda langsung terekap secara real-time:</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Step 1 */}
              <div className="bg-slate-950/40 p-3.5 rounded-xl border border-indigo-800/40 flex flex-col justify-between">
                <div>
                  <div className="w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-xs border border-indigo-500/30 mb-2 font-mono">1</div>
                  <h4 className="font-bold text-[12px] text-slate-100 flex items-center gap-1">🔑 Login Akun</h4>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">Gunakan username &amp; password resmi yang terdaftar.</p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="bg-slate-950/40 p-3.5 rounded-xl border border-indigo-800/40 flex flex-col justify-between">
                <div>
                  <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-xs border border-amber-500/30 mb-2 font-mono">2</div>
                  <h4 className="font-bold text-[12px] text-slate-100 flex items-center gap-1">📅 Pilih Jadwal</h4>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">Masuk menu absen, lalu pilih nama siswa yang diajar hari ini.</p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-slate-950/40 p-3.5 rounded-xl border border-indigo-800/40 flex flex-col justify-between">
                <div>
                  <div className="w-7 h-7 rounded-full bg-sky-500/20 text-sky-300 flex items-center justify-center font-bold text-xs border border-sky-500/30 mb-2 font-mono">3</div>
                  <h4 className="font-bold text-[12px] text-slate-100 flex items-center gap-1">📸 Foto Selfie</h4>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">Ambil foto selfie bersama murid saat kegiatan les berlangsung.</p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="bg-slate-950/40 p-3.5 rounded-xl border border-indigo-800/40 flex flex-col justify-between">
                <div>
                  <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-xs border border-emerald-500/30 mb-2 font-mono">4</div>
                  <h4 className="font-bold text-[12px] text-slate-100 flex items-center gap-1">✍️ Isi Jurnal</h4>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">Tulis materi &amp; berikan feedback ramah untuk orang tua.</p>
                </div>
              </div>

              {/* Step 5 */}
              <div className="bg-slate-950/40 p-3.5 rounded-xl border border-indigo-800/40 flex flex-col justify-between">
                <div>
                  <div className="w-7 h-7 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold text-xs border border-purple-500/30 mb-2 font-mono">5</div>
                  <h4 className="font-bold text-[12px] text-slate-100 flex items-center gap-1">📤 Kirim Absen</h4>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">Kirim presensi. Kuota terpotong &amp; honor Anda terekap otomatis!</p>
                </div>
              </div>
            </div>
            
            <div className="bg-amber-500/10 border border-amber-500/30 p-3.5 rounded-xl text-xs text-amber-200 leading-relaxed space-y-1">
              <span className="font-bold text-amber-300">⚠️ Peringatan Penting Rekap Gaji &amp; Kehadiran:</span>
              <p className="text-slate-300 text-[11px]">
                Setiap sesi mengajar <strong>wajib diabsensi harian langsung di saat kegiatan pembelajaran (KBM) berlangsung</strong>. 
                Jika Anda lupa atau tidak melakukan absen, sistem tidak dapat mendeteksi sesi mengajar tersebut, sehingga honor harian Anda 
                <strong> tidak akan terkonversi/terekap ke dalam penggajian bulanan</strong>.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-xl border border-indigo-800/30 text-xs text-indigo-200">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                <span>Setiap absensi dilengkapi bukti selfie &amp; watermark keamanan</span>
              </div>
              <button 
                onClick={() => onNavigate('attendance')}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold px-3.5 py-1.5 rounded-lg text-xs transition-all shadow-md active:scale-95 cursor-pointer whitespace-nowrap"
              >
                Mulai Isi Absensi Sekarang &rarr;
              </button>
            </div>
          </div>

          {/* Featured Real-Time Income Banner for Tentor */}
          <div className="bg-gradient-to-br from-emerald-950 via-teal-900 to-slate-900 text-white rounded-2xl p-5 border border-emerald-700/60 shadow-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold uppercase tracking-wider">
                  <Wallet className="w-4 h-4 text-emerald-400" />
                  <span>Pendapatan & Honor Mengajar (Otomatis Terekap)</span>
                  <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded-full border border-emerald-400/30">
                    Real-time Cloud
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono tracking-tight">
                  {formatRupiah(totalTentorEarnings)}
                </div>
                <p className="text-xs text-emerald-100/90 leading-relaxed">
                  Total akumulasi honor mengajar dari <strong className="text-white">{myHadirAttendances.length} pertemuan hadir</strong> yang telah Anda absen.
                </p>
              </div>
              <div className="bg-emerald-950/80 border border-emerald-700/60 p-3.5 rounded-xl text-xs space-y-1 shrink-0">
                <div className="text-emerald-300 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Status Rekap Keuangan:
                </div>
                <div className="text-slate-200">
                  • Tarif Sesuai Penjadwalan: <strong className="text-emerald-300">Variabel Per Sesi</strong>
                </div>
                <div className="text-emerald-200/90 text-[11px] font-medium">
                  • Langsung terekap ke Laporan Admin &amp; Payroll Gaji
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pendapatan Mengajar</span>
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold border border-emerald-100">
                  <Wallet className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-xl sm:text-2xl font-extrabold text-emerald-700 font-mono">{formatRupiah(totalTentorEarnings)}</div>
                <p className="text-xs text-slate-500 mt-1">{myHadirAttendances.length} pertemuan hadir terekap</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Siswa Yang Anda Ajar</span>
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold border border-indigo-100">
                  <GraduationCap className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-extrabold text-slate-900">{myStudents.length} Siswa</div>
                <p className="text-xs text-slate-500 mt-1">Terdaftar di jadwal mengajar Anda</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Jadwal Mengajar Aktif</span>
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold border border-blue-100">
                  <Calendar className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-extrabold text-blue-700">{mySchedules.length} Jadwal</div>
                <p className="text-xs text-slate-500 mt-1">Terjadwal secara mingguan</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kuota Paket Hampir Habis</span>
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold border border-amber-100">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-extrabold text-amber-700">{expiringStudents.length} Siswa</div>
                <p className="text-xs text-slate-500 mt-1">Sisa kuota ≤ 2</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Riwayat Kunjungan & Presensi Terakhir */}
      <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-200/90 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-3.5 border-b border-slate-100">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{isTentor ? 'Riwayat Kunjungan & Presensi Terakhir Anda' : 'Laporan Presensi Kunjungan Tentor Terbaru'}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {isTentor
                ? 'Laporan hasil kunjungan les & foto selfie yang baru saja Anda kirimkan ke sistem'
                : 'Laporan kehadiran tentor, verifikasi foto selfie, dan materi pembelajaran real-time'}
            </p>
          </div>
          <button
            onClick={() => onNavigate('attendance')}
            className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-extrabold px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer border border-emerald-200/80 active:scale-95"
          >
            <span>Lihat Semua Absensi ({myAttendances.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentAttendances.length === 0 ? (
          <div className="py-10 text-center bg-slate-50/70 rounded-2xl border border-dashed border-slate-200/90 space-y-2.5">
            <UserCheck className="w-9 h-9 text-slate-400 mx-auto" />
            <p className="text-xs font-bold text-slate-700">Belum Ada Catatan Kunjungan / Presensi</p>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto leading-relaxed">
              {isTentor
                ? 'Silakan tekan tombol "Isi Absensi Selfie" di atas untuk mengirimkan laporan kunjungan les pertama Anda.'
                : 'Belum ada presensi tentor yang dikirimkan ke dalam sistem.'}
            </p>
            {isTentor && (
              <button
                onClick={() => onNavigate('attendance')}
                className="mt-2 inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs cursor-pointer transition-all active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Isi Absensi Sekarang</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentAttendances.map((att) => {
              const student = students.find(s => s.id === att.studentId);
              const tutor = tutors.find(t => t.id === att.tutorId);

              return (
                <div key={att.id} className="p-4 bg-slate-50/70 hover:bg-white rounded-2xl border border-slate-200/80 transition-all shadow-2xs hover:shadow-xs flex flex-col justify-between space-y-3">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        {att.selfieUrl ? (
                          <img src={att.selfieUrl} alt="Selfie" className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shadow-2xs shrink-0" />
                        ) : (
                          <div className="w-12 h-12 rounded-2xl bg-slate-200/80 text-slate-500 font-extrabold flex items-center justify-center text-[10px] shrink-0 border border-slate-300/60">
                            NO IMG
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-slate-900 text-xs line-clamp-1">{student?.name || (att as any).studentName || 'Siswa'}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {!isTentor && <span className="font-bold text-indigo-700">{tutor?.name || (att as any).tutorName || 'Tentor'} • </span>}
                            <span>{student?.grade || 'Siswa'}</span>
                          </div>
                        </div>
                      </div>

                      <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full shrink-0 border ${
                        att.status === 'Hadir' ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80' :
                        'bg-amber-50 text-amber-800 border-amber-200/80'
                      }`}>
                        {att.status}
                      </span>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-200/80 text-[11px] space-y-1 shadow-2xs">
                      <div>
                        <span className="text-slate-400 font-bold uppercase text-[9px]">Materi: </span>
                        <span className="text-slate-800 font-semibold line-clamp-2">{att.materialCovered || '-'}</span>
                      </div>
                      {att.progressNotes && (
                        <div>
                          <span className="text-slate-400 font-bold uppercase text-[9px]">Catatan: </span>
                          <span className="text-slate-600 line-clamp-2 font-medium">{att.progressNotes}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-200/70 font-medium">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {att.date}
                    </span>
                    <span className="text-slate-600 font-mono font-bold">{att.serverTime ? att.serverTime.split(' ')[1] || att.serverTime : 'Tercatat'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Action Alerts Panel */}
      <div className={`grid grid-cols-1 ${isTentor ? 'lg:grid-cols-2' : 'lg:grid-cols-3'} gap-6`}>
        {/* Kuota Paket Murid Hampir Habis */}
        <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between mb-4 pb-2.5 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Kuota Paket Murid Hampir Habis (≤ 2)</span>
            </h3>
            <button
              onClick={() => handleOpenExtraKuotaModal()}
              className="text-xs text-amber-700 font-bold hover:underline flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-md border border-amber-200"
            >
              <Zap className="w-3 h-3" />
              <span>+ Extra Kuota</span>
            </button>
          </div>
          {expiringStudents.length === 0 ? (
            <div className="text-xs text-slate-400 py-6 text-center italic">Semua murid diampu memiliki sisa kuota berkecukupan</div>
          ) : (
            <div className="space-y-3">
              {expiringStudents.map((s) => (
                <div key={s.id} className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200/70 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-900">{s.name} ({s.grade})</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Wali: {s.parentName} ({s.parentWA})</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-100 text-amber-900 font-extrabold text-xs px-2.5 py-1 rounded-lg border border-amber-200/80">
                      Sisa Kuota {s.remainingSessions}
                    </span>
                    <button
                      onClick={() => handleOpenExtraKuotaModal(s.id)}
                      className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] p-1.5 rounded-lg cursor-pointer transition-all shadow-2xs active:scale-95"
                      title="Tambah / Ajukan Kuota Extra"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Approvals (for Management) */}
        {!isTentor && (
          <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between mb-4 pb-2.5 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-purple-600 shrink-0" />
                <span>Pengajuan Butuh Approval ({pendingApprovalsList.length})</span>
              </h3>
              <button
                onClick={() => onNavigate('approval')}
                className="text-xs text-indigo-600 font-bold hover:underline"
              >
                Kelola
              </button>
            </div>
            {pendingApprovalsList.length === 0 ? (
              <div className="text-xs text-slate-400 py-6 text-center italic">Tidak ada pengajuan pending</div>
            ) : (
              <div className="space-y-3">
                {pendingApprovalsList.map((a) => (
                  <div key={a.id} className="p-3.5 bg-purple-50/60 rounded-xl border border-purple-200/70">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-purple-900 bg-purple-100 px-2 py-0.5 rounded-md border border-purple-200/80">
                        {a.type}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">{new Date(a.createdAt).toLocaleDateString('id-ID')}</span>
                    </div>
                    <p className="text-xs text-slate-800 mt-2 font-semibold">{a.reason}</p>
                    <div className="text-[11px] text-slate-500 mt-1">Pemohon: {a.requestedBy}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Jadwal Hari Ini / Mengajar Anda */}
        <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between mb-4 pb-2.5 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{isTentor ? 'Jadwal Mengajar Anda' : 'Jadwal Bimbel Hari Ini'} ({mySchedules.length})</span>
            </h3>
            <button
              onClick={() => onNavigate('schedule')}
              className="text-xs text-indigo-600 font-bold hover:underline"
            >
              Semua Jadwal
            </button>
          </div>
          {mySchedules.length === 0 ? (
            <div className="text-xs text-slate-400 py-6 text-center italic">Belum ada jadwal mengajar</div>
          ) : (
            <div className="space-y-3">
              {mySchedules.slice(0, 4).map((sch) => {
                const st = students.find(s => s.id === sch.studentId);
                return (
                  <div key={sch.id} className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900">{st?.name || 'Siswa'} - {sch.subject} ({sch.dayOfWeek})</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Jam: {sch.timeSlot}</div>
                    </div>
                    <span className="text-[11px] font-bold bg-emerald-100/90 text-emerald-800 px-2.5 py-1 rounded-lg border border-emerald-200/80">
                      {sch.type}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal Pengajuan / Penambahan Kuota Extra */}
      {showExtraKuotaModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                  <Zap className="w-5 h-5 fill-amber-700" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    {isTentor ? 'Pengajuan Kuota Extra Murid' : 'Tambah Kuota Extra Murid'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isTentor ? 'Kirimkan permohonan kuota ke Manajemen' : 'Penambahan kuota pertemuan langsung oleh Admin'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowExtraKuotaModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExtraKuotaSubmit} className="space-y-4 text-xs mt-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Pilih Murid</label>
                <select
                  value={selectedStudentIdForExtra}
                  onChange={(e) => setSelectedStudentIdForExtra(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none font-semibold text-slate-800 bg-slate-50"
                  required
                >
                  <option value="">-- Pilih Murid --</option>
                  {(isTentor ? myStudents : students).map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.grade}) • Sisa Kuota: {st.remainingSessions} / {st.totalPackageSessions}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Jumlah Pertemuan Extra (Kuota)</label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {[2, 4, 8, 10].map((amt) => (
                    <button
                      type="button"
                      key={amt}
                      onClick={() => setExtraKuotaAmount(amt)}
                      className={`py-2 rounded-xl font-extrabold border transition-all cursor-pointer ${
                        extraKuotaAmount === amt
                          ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      +{amt} Pertemuan
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={extraKuotaAmount}
                  onChange={(e) => setExtraKuotaAmount(Number(e.target.value))}
                  className="w-full border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none font-bold text-slate-800"
                  placeholder="Atau ketik jumlah kuota..."
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Alasan Penambahan Kuota</label>
                <textarea
                  value={extraKuotaReason}
                  onChange={(e) => setExtraKuotaReason(e.target.value)}
                  rows={3}
                  className="w-full border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none font-medium text-slate-800"
                  placeholder="Contoh: Persiapan Ujian Akhir Semester, siswa butuh tambahan les matematika & IPA"
                  required
                />
              </div>

              <div className="bg-amber-50 border border-amber-200/80 p-3 rounded-xl text-[11px] text-amber-900 leading-relaxed">
                <strong>Catatan Kuota Paket:</strong> Setiap murid diberikan kuota 10 kali pertemuan/bulan. Jika murid ingin menambah jam belajar untuk ujian/pendalaman, tentor dapat mengajukan kuota extra di sini.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowExtraKuotaModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl cursor-pointer shadow-md flex items-center gap-1.5 active:scale-95"
                >
                  <Zap className="w-4 h-4 fill-slate-950" />
                  <span>{isTentor ? 'Kirim Pengajuan' : 'Tambah Kuota Sekarang'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
