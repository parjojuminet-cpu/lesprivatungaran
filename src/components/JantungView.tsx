import React, { useState, useEffect } from 'react';
import { Finance, Invoice, TutorSalary, Student, Tutor, Attendance, Schedule, UserRole } from '../types';
import {
  Heart, ShieldAlert, ShieldCheck, Trash2, Pencil, Search, Filter,
  AlertTriangle, CheckCircle, RefreshCw, Calendar, Clock, Wallet,
  User, BookOpen, AlertCircle, FileText, ArrowUpRight, ArrowDownRight, Info
} from 'lucide-react';
import { persistDatabaseUpdate, deleteAttendanceData, deleteScheduleData } from '../services/dataManager';

interface JantungViewProps {
  finance: Finance[];
  invoices: Invoice[];
  salaries: TutorSalary[];
  students: Student[];
  tutors: Tutor[];
  attendances: Attendance[];
  schedules: Schedule[];
  onRefresh: () => void;
}

export const JantungView: React.FC<JantungViewProps> = ({
  finance,
  invoices,
  salaries,
  students,
  tutors,
  attendances,
  schedules,
  onRefresh
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'absensi' | 'transaksi' | 'jadwal'>('absensi');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('Semua');

  // Modal edit states
  const [editingAttendance, setEditingAttendance] = useState<Attendance | null>(null);
  const [editingFinance, setEditingFinance] = useState<Finance | null>(null);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);

  // Form states for Editing Attendance
  const [attDate, setAttDate] = useState('');
  const [attStatus, setAttStatus] = useState<'Hadir' | 'Izin' | 'Sakit' | 'Alfa'>('Hadir');
  const [attMaterial, setAttMaterial] = useState('');
  const [attProgress, setAttProgress] = useState('');
  const [attFeedback, setAttFeedback] = useState('');

  // Form states for Editing Finance
  const [finDesc, setFinDesc] = useState('');
  const [finAmount, setFinAmount] = useState<number>(0);
  const [finType, setFinType] = useState<'Pemasukan' | 'Pengeluaran'>('Pemasukan');
  const [finCategory, setFinCategory] = useState<'SPP Siswa' | 'Gaji Tentor' | 'Fee Manajemen' | 'Operasional'>('SPP Siswa');
  const [finDate, setFinDate] = useState('');
  const [finRevisionNote, setFinRevisionNote] = useState('');

  // Form states for Editing Schedule
  const [schDay, setSchDay] = useState('');
  const [schTime, setSchTime] = useState('');
  const [schSubject, setSchSubject] = useState('');
  const [schTutorId, setSchTutorId] = useState('');
  const [schStudentId, setSchStudentId] = useState('');
  const [schRate, setSchRate] = useState<number>(20000);
  const [schAdminFee, setSchAdminFee] = useState<number>(5000);

  // Interactive Alerts & Confirms
  const [alertInfo, setAlertInfo] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    action: () => void;
  } | null>(null);

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num || 0);
  };

  const showAlert = (type: 'success' | 'error', msg: string) => {
    setAlertInfo({ type, message: msg });
    setTimeout(() => setAlertInfo(null), 5000);
  };

  const triggerConfirm = (title: string, message: string, action: () => void) => {
    setConfirmModal({ title, message, action });
  };

  // Reset System Action
  const handleResetSystem = () => {
    triggerConfirm(
      '⚠️ KOSONGKAN SELURUH DATA SISTEM',
      'Apakah Anda benar-benar yakin ingin mengosongkan semua jadwal kegiatan, absensi, dan keuangan? Data Master Siswa, Tentor, Ortu & Akun Pengguna akan TETAP aman. Tindakan ini tidak dapat dibatalkan!',
      async () => {
        try {
          // Clear backend via API if available, then local
          try {
            await fetch('/api/clear-all-activities-absensi-keuangan', { method: 'POST' }).catch(() => {});
          } catch (err) {}

          await persistDatabaseUpdate(db => {
            // Re-sync student remaining session quota to total package session
            const updatedStudents = db.students.map(s => ({
              ...s,
              remainingSessions: s.totalPackageSessions || 10,
              packageStatus: 'Aktif' as any
            }));
            return {
              ...db,
              schedules: [],
              attendances: [],
              finance: [],
              invoices: [],
              salaries: [],
              students: updatedStudents
            };
          });

          showAlert('success', 'Seluruh data kegiatan, absensi, dan semua keuangan berhasil dikosongkan!');
          onRefresh();
        } catch (err) {
          showAlert('error', 'Gagal mengosongkan data sistem.');
        }
      }
    );
  };

  // Wipe All Data Action (Master & Transactions)
  const handleWipeAllData = () => {
    triggerConfirm(
      '🚨 KOSONGKAN TOTAL SELURUH DATA MASTER & SISTEM',
      'Apakah Anda benar-benar yakin ingin menghapus seluruh data di sistem, TERMASUK Data Master (Siswa, Tentor, Ortu, Mapel, Wilayah, Jadwal, Absensi, Keuangan)? Sistem akan sepenuhnya bersih untuk input data baru. Tindakan ini tidak dapat dibatalkan!',
      async () => {
        try {
          try {
            await fetch('/api/clear-all-data', { method: 'POST' }).catch(() => {});
          } catch (err) {}

          await persistDatabaseUpdate(db => {
            return {
              users: [],
              students: [],
              tutors: [],
              parents: [],
              subjects: [],
              workingAreas: [],
              schedules: [],
              attendances: [],
              invoices: [],
              finance: [],
              salaries: [],
              approvals: [],
              modules: [],
              settings: [],
              auditLogs: []
            };
          });

          showAlert('success', 'Seluruh data master, penyiapan, dan sistem berhasil dikosongkan!');
          onRefresh();
        } catch (err) {
          showAlert('error', 'Gagal mengosongkan seluruh data master.');
        }
      }
    );
  };

  // Delete Attendance Action (Standard business rules apply)
  const handleDeleteAttendance = (att: Attendance) => {
    const student = students.find(s => s.id === att.studentId);
    triggerConfirm(
      'Hapus Data Absensi/Presensi',
      `Apakah Anda yakin ingin menghapus absensi siswa "${student?.name || 'Siswa'}" pada tanggal ${att.date}? Tindakan ini otomatis mengembalikan sisa kuota sesi siswa (+1) dan membatalkan rekap pencatatan gaji tentor terkait.`,
      async () => {
        try {
          await deleteAttendanceData(att.id);
          showAlert('success', 'Absensi berhasil dihapus, kuota murid telah dikembalikan!');
          onRefresh();
        } catch (err) {
          showAlert('error', 'Gagal menghapus absensi.');
        }
      }
    );
  };

  // Open Edit Attendance Modal
  const handleOpenEditAttendance = (att: Attendance) => {
    setEditingAttendance(att);
    setAttDate(att.date);
    setAttStatus(att.status);
    setAttMaterial(att.materialCovered || '');
    setAttProgress(att.progressNotes || '');
    setAttFeedback(att.tutorFeedback || '');
  };

  // Save Edit Attendance
  const handleSaveAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAttendance) return;

    try {
      await persistDatabaseUpdate(db => {
        // Find associated records
        const targetStudent = db.students.find(s => s.id === editingAttendance.studentId);
        const targetTutor = db.tutors.find(t => t.id === editingAttendance.tutorId);
        const targetSchedule = db.schedules.find(s => s.id === editingAttendance.scheduleId);

        const honorRate = targetSchedule?.sessionRate || targetTutor?.ratePerSession || 40000;
        const marginRate = targetStudent?.managementMarginNominal || 10000;

        let updatedFinance = db.finance || [];
        let updatedSalaries = db.salaries || [];
        let updatedStudents = db.students;

        // 1. REVERSE OLD EFFECT IF IT WAS HADIR
        if (editingAttendance.status === 'Hadir') {
          // Remove old finance records for this attendanceId
          updatedFinance = updatedFinance.filter(f => f.attendanceId !== editingAttendance.id);

          // Deduct old salary
          const oldMonthYear = editingAttendance.date.substring(0, 7);
          const salIdx = updatedSalaries.findIndex(s => s.tutorId === editingAttendance.tutorId && s.monthYear === oldMonthYear);
          if (salIdx !== -1) {
            const existing = updatedSalaries[salIdx];
            const newRate = Math.max(0, (existing.totalAttendanceRate || 0) - honorRate);
            updatedSalaries = [...updatedSalaries];
            updatedSalaries[salIdx] = {
              ...existing,
              totalAttendanceRate: newRate,
              totalSalary: newRate + (existing.cancellationCompensation || 0) + (existing.bonus || 0) - (existing.deductions || 0)
            };
          }

          // Refund student quota (+1)
          updatedStudents = updatedStudents.map(s => {
            if (s.id === editingAttendance.studentId) {
              const rem = s.remainingSessions + 1;
              return {
                ...s,
                remainingSessions: rem,
                packageStatus: (rem <= 0 ? 'Habis' : rem <= 2 ? 'Hampir Habis' : 'Aktif') as any
              };
            }
            return s;
          });
        }

        // 2. APPLY NEW EFFECT IF IT IS HADIR
        if (attStatus === 'Hadir') {
          // Add new finance records
          const currentDateStr = attDate;
          const newMonthYear = attDate.substring(0, 7);

          const salaryExpenseFin: Finance = {
            id: `fin_sal_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            type: 'Pengeluaran',
            category: 'Gaji Tentor',
            amount: honorRate,
            date: currentDateStr,
            description: `Honor Mengajar Tentor (${targetTutor?.name || 'Tentor'}) - Siswa ${targetStudent?.name || 'Siswa'} (${currentDateStr}) [REVISI]`,
            tutorId: editingAttendance.tutorId,
            studentId: editingAttendance.studentId,
            attendanceId: editingAttendance.id,
            createdBy: 'SYSTEM_AUTO_RECAP',
            createdAt: new Date().toISOString()
          };

          const marginIncomeFin: Finance = {
            id: `fin_fee_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            type: 'Pemasukan',
            category: 'Fee Manajemen',
            amount: marginRate,
            date: currentDateStr,
            description: `Fee Margin Manajemen Sesi - ${targetStudent?.name || 'Siswa'} (${currentDateStr}) [REVISI]`,
            studentId: editingAttendance.studentId,
            attendanceId: editingAttendance.id,
            createdBy: 'SYSTEM_AUTO_RECAP',
            createdAt: new Date().toISOString()
          };

          updatedFinance = [salaryExpenseFin, marginIncomeFin, ...updatedFinance];

          // Add to salary
          const salIdx = updatedSalaries.findIndex(s => s.tutorId === editingAttendance.tutorId && s.monthYear === newMonthYear);
          if (salIdx !== -1) {
            const existing = updatedSalaries[salIdx];
            const newRate = (existing.totalAttendanceRate || 0) + honorRate;
            updatedSalaries = [...updatedSalaries];
            updatedSalaries[salIdx] = {
              ...existing,
              totalAttendanceRate: newRate,
              totalSalary: newRate + (existing.cancellationCompensation || 0) + (existing.bonus || 0) - (existing.deductions || 0)
            };
          } else {
            const newTutorSalary: TutorSalary = {
              id: `sal_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              tutorId: editingAttendance.tutorId,
              monthYear: newMonthYear,
              totalAttendanceRate: honorRate,
              cancellationCompensation: 0,
              bonus: 0,
              deductions: 0,
              totalSalary: honorRate,
              paymentStatus: 'Pending',
              createdAt: new Date().toISOString().substring(0, 10)
            };
            updatedSalaries = [newTutorSalary, ...updatedSalaries];
          }

          // Deduct student quota (-1)
          updatedStudents = updatedStudents.map(s => {
            if (s.id === editingAttendance.studentId) {
              const rem = Math.max(0, s.remainingSessions - 1);
              return {
                ...s,
                remainingSessions: rem,
                packageStatus: (rem <= 0 ? 'Habis' : rem <= 2 ? 'Hampir Habis' : 'Aktif') as any
              };
            }
            return s;
          });
        }

        // 3. UPDATE ATTENDANCE STATE
        const nextAttendances = db.attendances.map(a => {
          if (a.id === editingAttendance.id) {
            return {
              ...a,
              date: attDate,
              status: attStatus,
              materialCovered: attMaterial,
              progressNotes: attProgress,
              tutorFeedback: attFeedback
            };
          }
          return a;
        });

        return {
          ...db,
          attendances: nextAttendances,
          students: updatedStudents,
          finance: updatedFinance,
          salaries: updatedSalaries
        };
      });

      showAlert('success', 'Perubahan absensi dan penyesuaian keuangan berhasil disimpan!');
      setEditingAttendance(null);
      onRefresh();
    } catch (err) {
      showAlert('error', 'Gagal memperbarui absensi.');
    }
  };

  // Delete Finance Action
  const handleDeleteFinance = (fin: Finance) => {
    triggerConfirm(
      'Hapus Catatan Transaksi Keuangan',
      `Apakah Anda yakin ingin menghapus transaksi "${fin.description}"? Jika transaksi ini berasal dari absensi mengajar, tindakan ini tidak direkomendasikan karena akan membuat mutasi manual menyimpang dari absensi otomatis.`,
      async () => {
        try {
          await persistDatabaseUpdate(db => {
            let updatedSalaries = db.salaries || [];
            if (fin.category === 'Gaji Tentor' && fin.tutorId) {
              const monthYearStr = fin.date.substring(0, 7);
              const salIdx = updatedSalaries.findIndex(s => s.tutorId === fin.tutorId && s.monthYear === monthYearStr);
              if (salIdx !== -1) {
                const existing = updatedSalaries[salIdx];
                const newRate = Math.max(0, (existing.totalAttendanceRate || 0) - fin.amount);
                updatedSalaries = [...updatedSalaries];
                updatedSalaries[salIdx] = {
                  ...existing,
                  totalAttendanceRate: newRate,
                  totalSalary: newRate + (existing.cancellationCompensation || 0) + (existing.bonus || 0) - (existing.deductions || 0)
                };
              }
            }

            return {
              ...db,
              finance: db.finance.filter(f => f.id !== fin.id),
              salaries: updatedSalaries
            };
          });
          showAlert('success', 'Transaksi keuangan berhasil dihapus!');
          onRefresh();
        } catch (err) {
          showAlert('error', 'Gagal menghapus transaksi.');
        }
      }
    );
  };

  // Open Edit Finance Modal
  const handleOpenEditFinance = (fin: Finance) => {
    setEditingFinance(fin);
    setFinDesc(fin.description);
    setFinAmount(fin.amount);
    setFinType(fin.type);
    setFinCategory(fin.category);
    setFinDate(fin.date);
    setFinRevisionNote(fin.revisionNote || '');
  };

  // Save Edit Finance
  const handleSaveFinance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFinance) return;

    try {
      await persistDatabaseUpdate(db => {
        let updatedSalaries = db.salaries || [];

        // 1. REVERSE OLD SALARY EFFECT
        if (editingFinance.category === 'Gaji Tentor' && editingFinance.tutorId) {
          const oldMonthYear = editingFinance.date.substring(0, 7);
          const salIdx = updatedSalaries.findIndex(s => s.tutorId === editingFinance.tutorId && s.monthYear === oldMonthYear);
          if (salIdx !== -1) {
            const existing = updatedSalaries[salIdx];
            const newRate = Math.max(0, (existing.totalAttendanceRate || 0) - editingFinance.amount);
            updatedSalaries = [...updatedSalaries];
            updatedSalaries[salIdx] = {
              ...existing,
              totalAttendanceRate: newRate,
              totalSalary: newRate + (existing.cancellationCompensation || 0) + (existing.bonus || 0) - (existing.deductions || 0)
            };
          }
        }

        // 2. APPLY NEW SALARY EFFECT
        if (finCategory === 'Gaji Tentor' && editingFinance.tutorId) {
          const newMonthYear = finDate.substring(0, 7);
          const salIdx = updatedSalaries.findIndex(s => s.tutorId === editingFinance.tutorId && s.monthYear === newMonthYear);
          if (salIdx !== -1) {
            const existing = updatedSalaries[salIdx];
            const newRate = (existing.totalAttendanceRate || 0) + Number(finAmount);
            updatedSalaries = [...updatedSalaries];
            updatedSalaries[salIdx] = {
              ...existing,
              totalAttendanceRate: newRate,
              totalSalary: newRate + (existing.cancellationCompensation || 0) + (existing.bonus || 0) - (existing.deductions || 0)
            };
          } else {
            const newTutorSalary: TutorSalary = {
              id: `sal_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              tutorId: editingFinance.tutorId,
              monthYear: newMonthYear,
              totalAttendanceRate: Number(finAmount),
              cancellationCompensation: 0,
              bonus: 0,
              deductions: 0,
              totalSalary: Number(finAmount),
              paymentStatus: 'Pending',
              createdAt: new Date().toISOString().substring(0, 10)
            };
            updatedSalaries = [newTutorSalary, ...updatedSalaries];
          }
        }

        const updatedFinance = db.finance.map(f => {
          if (f.id === editingFinance.id) {
            return {
              ...f,
              description: finDesc,
              amount: Number(finAmount),
              type: finType,
              category: finCategory,
              date: finDate,
              isRevised: true,
              revisedAt: new Date().toISOString().substring(0, 10),
              revisionNote: finRevisionNote || 'Direvisi di Jantung Sistem'
            };
          }
          return f;
        });

        return { ...db, finance: updatedFinance, salaries: updatedSalaries };
      });

      showAlert('success', 'Transaksi keuangan berhasil direvisi!');
      setEditingFinance(null);
      onRefresh();
    } catch (err) {
      showAlert('error', 'Gagal merevisi transaksi keuangan.');
    }
  };

  // Delete Schedule Action
  const handleDeleteSchedule = (sch: Schedule) => {
    const student = students.find(s => s.id === sch.studentId);
    triggerConfirm(
      'Hapus Alokasi Jadwal',
      `Apakah Anda yakin ingin menghapus alokasi jadwal mengajar hari ${sch.dayOfWeek} (${sch.timeSlot}) untuk siswa "${student?.name || 'Siswa'}"? Tindakan ini hanya menghapus penugasan jadwal dan tidak akan menghapus data siswa itu sendiri.`,
      async () => {
        try {
          await deleteScheduleData(sch.id);
          showAlert('success', 'Jadwal mengajar berhasil dihapus!');
          onRefresh();
        } catch (err) {
          showAlert('error', 'Gagal menghapus jadwal mengajar.');
        }
      }
    );
  };

  // Open Edit Schedule Modal
  const handleOpenEditSchedule = (sch: Schedule) => {
    setEditingSchedule(sch);
    setSchDay(sch.dayOfWeek);
    setSchTime(sch.timeSlot);
    setSchSubject(sch.subject);
    setSchTutorId(sch.tutorId);
    setSchStudentId(sch.studentId);
    setSchRate(sch.sessionRate || 20000);
    setSchAdminFee(sch.adminFee || 5000);
  };

  // Save Edit Schedule
  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSchedule) return;

    try {
      await persistDatabaseUpdate(db => {
        const updatedSchedules = db.schedules.map(s => {
          if (s.id === editingSchedule.id) {
            return {
              ...s,
              dayOfWeek: schDay,
              timeSlot: schTime,
              subject: schSubject,
              tutorId: schTutorId,
              studentId: schStudentId,
              sessionRate: Number(schRate),
              adminFee: Number(schAdminFee)
            };
          }
          return s;
        });

        return { ...db, schedules: updatedSchedules };
      });

      showAlert('success', 'Alokasi jadwal berhasil diperbarui!');
      setEditingSchedule(null);
      onRefresh();
    } catch (err) {
      showAlert('error', 'Gagal memperbarui alokasi jadwal.');
    }
  };

  // Filter lists based on tab & search
  const q = searchQuery.toLowerCase().trim();

  const filteredAttendances = attendances
    .filter(att => {
      const student = students.find(s => s.id === att.studentId);
      const tutor = tutors.find(t => t.id === att.tutorId);
      const textMatch = !q ||
        (student?.name || '').toLowerCase().includes(q) ||
        (tutor?.name || '').toLowerCase().includes(q) ||
        (att.materialCovered || '').toLowerCase().includes(q) ||
        att.date.includes(q);
      const typeMatch = filterType === 'Semua' || att.status === filterType;
      return textMatch && typeMatch;
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

  const filteredFinance = finance.filter(fin => {
    const textMatch = !q ||
      fin.description.toLowerCase().includes(q) ||
      (fin.category || '').toLowerCase().includes(q) ||
      fin.date.includes(q);
    const typeMatch = filterType === 'Semua' || fin.type === filterType;
    return textMatch && typeMatch;
  });

  const filteredSchedules = schedules.filter(sch => {
    const student = students.find(s => s.id === sch.studentId);
    const tutor = tutors.find(t => t.id === sch.tutorId);
    const textMatch = !q ||
      (student?.name || '').toLowerCase().includes(q) ||
      (tutor?.name || '').toLowerCase().includes(q) ||
      sch.subject.toLowerCase().includes(q) ||
      sch.dayOfWeek.toLowerCase().includes(q);
    const typeMatch = filterType === 'Semua' || sch.dayOfWeek === filterType;
    return textMatch && typeMatch;
  });

  return (
    <div className="space-y-6">
      {/* Upper Status Cards */}
      <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-indigo-950 text-white p-6 sm:p-8 rounded-3xl border border-rose-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 translate-y-12 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-rose-500/20 text-rose-300 border border-rose-500/30 px-3.5 py-1 rounded-full text-xs font-extrabold tracking-wide uppercase">
              <Heart className="w-3.5 h-3.5 animate-pulse text-rose-400" />
              <span>Jantung Sistem Bimbel ERP</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Pusat Pengawasan, Edit, Hapus &amp; Pembersihan
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
              Satu-satunya jantung sistem untuk melakukan tindakan korektif (Edit &amp; Hapus) pada seluruh data transaksi keuangan dan presensi. Seluruh menu operasional luar dikunci menjadi aman dari tindakan hapus/edit yang membingungkan.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 md:items-center self-start md:self-auto shrink-0">
            <button
              onClick={handleResetSystem}
              className="bg-amber-600 hover:bg-amber-500 text-white font-extrabold px-5 py-3.5 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-950/50 cursor-pointer active:scale-95 transition-all border border-amber-400/30"
            >
              <Trash2 className="w-4 h-4" />
              <span>Bersihkan Aktivitas &amp; Keuangan</span>
            </button>
            <button
              onClick={handleWipeAllData}
              className="bg-rose-600 hover:bg-rose-500 text-white font-extrabold px-5 py-3.5 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-950/50 cursor-pointer active:scale-95 transition-all border border-rose-400/30"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>KOSONGKAN TOTAL SELURUH DATA MASTER</span>
            </button>
          </div>
        </div>
      </div>

      {/* Alert Notifications */}
      {alertInfo && (
        <div className={`p-4 rounded-2xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${
          alertInfo.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
        }`}>
          <CheckCircle className={`w-5 h-5 ${alertInfo.type === 'success' ? 'text-emerald-600' : 'text-rose-600'}`} />
          <p className="text-xs sm:text-sm font-bold">{alertInfo.message}</p>
        </div>
      )}

      {/* Workflow Explainer Panel */}
      <div className="bg-amber-50/60 border border-amber-200/60 p-5 rounded-2xl space-y-3 shadow-xs">
        <h3 className="text-sm font-black text-amber-950 flex items-center gap-2">
          <Info className="w-4 h-4 text-amber-600 shrink-0" />
          💡 Alur Data Sistem Bimbel ERP
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-700 font-medium">
          <div className="bg-white/80 p-3.5 rounded-xl border border-amber-200/40 shadow-2xs">
            <div className="text-amber-800 font-extrabold text-xs mb-1">1. Alokasi Jadwal</div>
            Membuat penugasan tentor mengajar siswa pada hari &amp; jam tertentu. Tarif honor sesi &amp; fee admin ditentukan secara individual di sini.
          </div>
          <div className="bg-white/80 p-3.5 rounded-xl border border-amber-200/40 shadow-2xs">
            <div className="text-emerald-800 font-extrabold text-xs mb-1">2. Presensi (Jantung Otomatis)</div>
            Begitu tentor mengirim absensi <strong>Hadir</strong>, sistem otomatis mengurangi kuota sisa paket siswa (-1) dan langsung menghasilkan rekap honor &amp; fee admin.
          </div>
          <div className="bg-white/80 p-3.5 rounded-xl border border-amber-200/40 shadow-2xs">
            <div className="text-indigo-800 font-extrabold text-xs mb-1">3. Jantung Sistem Korektif</div>
            Semua tindakan edit/revisi serta penghapusan absensi atau transaksi mutasi kas dipusatkan di sini demi menjaga konsistensi keuangan &amp; sisa paket.
          </div>
        </div>
      </div>

      {/* Database manager tabs & query filters */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => { setActiveSubTab('absensi'); setSearchQuery(''); setFilterType('Semua'); }}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'absensi' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              <span>Manajemen Absensi ({attendances.length})</span>
            </button>
            <button
              onClick={() => { setActiveSubTab('transaksi'); setSearchQuery(''); setFilterType('Semua'); }}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'transaksi' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Wallet className="w-4 h-4" />
              <span>Manajemen Keuangan ({finance.length})</span>
            </button>
            <button
              onClick={() => { setActiveSubTab('jadwal'); setSearchQuery(''); setFilterType('Semua'); }}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'jadwal' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Manajemen Jadwal ({schedules.length})</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 max-w-md w-full">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari kata kunci..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none focus:bg-white font-medium text-slate-800"
              />
            </div>

            {/* Quick Status Filters */}
            {activeSubTab === 'absensi' && (
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Semua">Semua Status</option>
                <option value="Hadir">Hadir</option>
                <option value="Izin">Izin</option>
                <option value="Sakit">Sakit</option>
                <option value="Alfa">Alfa</option>
              </select>
            )}

            {activeSubTab === 'transaksi' && (
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Semua">Semua Tipe</option>
                <option value="Pemasukan">Pemasukan</option>
                <option value="Pengeluaran">Pengeluaran</option>
              </select>
            )}

            {activeSubTab === 'jadwal' && (
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Semua">Semua Hari</option>
                <option value="Senin">Senin</option>
                <option value="Selasa">Selasa</option>
                <option value="Rabu">Rabu</option>
                <option value="Kamis">Kamis</option>
                <option value="Jumat">Jumat</option>
                <option value="Sabtu">Sabtu</option>
                <option value="Minggu">Minggu</option>
              </select>
            )}
          </div>
        </div>

        {/* ======================= TAB: ABSENSI ======================= */}
        {activeSubTab === 'absensi' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Tanggal</th>
                  <th className="p-3.5">Siswa</th>
                  <th className="p-3.5">Tentor Pengajar</th>
                  <th className="p-3.5">Materi Yang Diajarkan</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Aksi Jantung</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAttendances.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 italic">
                      Tidak ada data absensi ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredAttendances.map(att => {
                    const student = students.find(s => s.id === att.studentId);
                    const tutor = tutors.find(t => t.id === att.tutorId);
                    return (
                      <tr key={att.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5 whitespace-nowrap font-extrabold text-slate-900">
                          {att.date}
                        </td>
                        <td className="p-3.5">
                          <div className="font-extrabold text-slate-800">{student?.name || 'Siswa N/A'}</div>
                          <div className="text-[10px] text-slate-400">{student?.grade || '-'}</div>
                        </td>
                        <td className="p-3.5 font-bold text-slate-700">
                          {tutor?.name || 'Tentor N/A'}
                        </td>
                        <td className="p-3.5 max-w-xs truncate font-medium text-slate-600" title={att.materialCovered}>
                          {att.materialCovered || '-'}
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                            att.status === 'Hadir' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {att.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditAttendance(att)}
                              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 p-2 rounded-xl border border-indigo-200 cursor-pointer active:scale-95 transition-all"
                              title="Edit Detail Absensi"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteAttendance(att)}
                              className="bg-rose-50 hover:bg-rose-100 text-rose-700 p-2 rounded-xl border border-rose-200 cursor-pointer active:scale-95 transition-all"
                              title="Hapus Absensi & Balikkan Quota"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ======================= TAB: TRANSAKSI ======================= */}
        {activeSubTab === 'transaksi' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Tanggal</th>
                  <th className="p-3.5">Kategori</th>
                  <th className="p-3.5">Deskripsi</th>
                  <th className="p-3.5 text-right">Debit (Masuk)</th>
                  <th className="p-3.5 text-right">Kredit (Keluar)</th>
                  <th className="p-3.5 text-right">Aksi Jantung</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredFinance.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 italic">
                      Tidak ada data transaksi keuangan manual ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredFinance.map(fin => {
                    const isDebit = fin.type === 'Pemasukan';
                    return (
                      <tr key={fin.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5 whitespace-nowrap font-extrabold text-slate-900">
                          {fin.date}
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                            fin.category === 'SPP Siswa' ? 'bg-sky-100 text-sky-800' :
                            fin.category === 'Gaji Tentor' ? 'bg-purple-100 text-purple-800' :
                            fin.category === 'Fee Manajemen' ? 'bg-indigo-100 text-indigo-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {fin.category}
                          </span>
                        </td>
                        <td className="p-3.5 font-medium text-slate-700 max-w-sm truncate" title={fin.description}>
                          {fin.description}
                        </td>
                        <td className="p-3.5 text-right font-extrabold text-emerald-600">
                          {isDebit ? formatRupiah(fin.amount) : '-'}
                        </td>
                        <td className="p-3.5 text-right font-extrabold text-rose-600">
                          {!isDebit ? formatRupiah(fin.amount) : '-'}
                        </td>
                        <td className="p-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditFinance(fin)}
                              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 p-2 rounded-xl border border-indigo-200 cursor-pointer active:scale-95 transition-all"
                              title="Revisi Detail Transaksi"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteFinance(fin)}
                              className="bg-rose-50 hover:bg-rose-100 text-rose-700 p-2 rounded-xl border border-rose-200 cursor-pointer active:scale-95 transition-all"
                              title="Hapus Transaksi Kas"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ======================= TAB: JADWAL ======================= */}
        {activeSubTab === 'jadwal' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Hari / Jam</th>
                  <th className="p-3.5">Siswa</th>
                  <th className="p-3.5">Mata Pelajaran</th>
                  <th className="p-3.5">Tentor Pengajar</th>
                  <th className="p-3.5 text-right">Honor / Sesi</th>
                  <th className="p-3.5 text-right">Aksi Jantung</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSchedules.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 italic">
                      Tidak ada alokasi jadwal mengajar ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredSchedules.map(sch => {
                    const student = students.find(s => s.id === sch.studentId);
                    const tutor = tutors.find(t => t.id === sch.tutorId);
                    return (
                      <tr key={sch.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5 whitespace-nowrap">
                          <div className="font-extrabold text-slate-900">{sch.dayOfWeek}</div>
                          <div className="text-[10px] text-slate-400">{sch.timeSlot}</div>
                        </td>
                        <td className="p-3.5">
                          <div className="font-extrabold text-slate-800">{student?.name || 'Siswa N/A'}</div>
                          <div className="text-[10px] text-slate-400">{student?.grade || '-'}</div>
                        </td>
                        <td className="p-3.5 font-bold text-slate-700">
                          {sch.subject}
                        </td>
                        <td className="p-3.5 font-bold text-slate-700">
                          {tutor?.name || 'Tentor N/A'}
                        </td>
                        <td className="p-3.5 text-right font-extrabold text-emerald-700">
                          {formatRupiah(sch.sessionRate || 20000)}
                        </td>
                        <td className="p-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditSchedule(sch)}
                              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 p-2 rounded-xl border border-indigo-200 cursor-pointer active:scale-95 transition-all"
                              title="Ubah Jadwal"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteSchedule(sch)}
                              className="bg-rose-50 hover:bg-rose-100 text-rose-700 p-2 rounded-xl border border-rose-200 cursor-pointer active:scale-95 transition-all"
                              title="Hapus Jadwal"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* MODAL EDIT: ABSENSI                                      */}
      {/* ======================================================== */}
      {editingAttendance && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <h3 className="text-sm font-black text-indigo-950 flex items-center gap-2 pb-2 border-b border-slate-100">
              <Pencil className="w-4 h-4 text-indigo-600" />
              Revisi Data Absensi Sesi
            </h3>
            <form onSubmit={handleSaveAttendance} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Tanggal Pertemuan</label>
                  <input
                    type="date"
                    value={attDate}
                    onChange={(e) => setAttDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Status Kehadiran</label>
                  <select
                    value={attStatus}
                    onChange={(e: any) => setAttStatus(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                  >
                    <option value="Hadir">Hadir</option>
                    <option value="Izin">Izin</option>
                    <option value="Sakit">Sakit</option>
                    <option value="Alfa">Alfa</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Materi Diajarkan</label>
                <textarea
                  rows={2}
                  value={attMaterial}
                  onChange={(e) => setAttMaterial(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  placeholder="Isi materi pengajaran..."
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Catatan Kemajuan</label>
                <textarea
                  rows={2}
                  value={attProgress}
                  onChange={(e) => setAttProgress(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  placeholder="Tulis kemajuan siswa di kelas..."
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Feedback Wali Murid</label>
                <input
                  type="text"
                  value={attFeedback}
                  onChange={(e) => setAttFeedback(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  placeholder="Pesan singkat untuk orang tua..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingAttendance(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL EDIT: TRANSAKSI KEUANGAN                           */}
      {/* ======================================================== */}
      {editingFinance && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <h3 className="text-sm font-black text-indigo-950 flex items-center gap-2 pb-2 border-b border-slate-100">
              <Pencil className="w-4 h-4 text-indigo-600" />
              Revisi Catatan Keuangan Manual
            </h3>
            <form onSubmit={handleSaveFinance} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Tanggal</label>
                  <input
                    type="date"
                    value={finDate}
                    onChange={(e) => setFinDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Tipe Mutasi</label>
                  <select
                    value={finType}
                    onChange={(e: any) => setFinType(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                  >
                    <option value="Pemasukan">Pemasukan (Debit)</option>
                    <option value="Pengeluaran">Pengeluaran (Kredit)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Kategori</label>
                  <select
                    value={finCategory}
                    onChange={(e: any) => setFinCategory(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                  >
                    <option value="SPP Siswa">SPP Siswa</option>
                    <option value="Gaji Tentor">Gaji Tentor</option>
                    <option value="Fee Manajemen">Fee Manajemen</option>
                    <option value="Operasional">Operasional</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Jumlah (IDR)</label>
                  <input
                    type="number"
                    value={finAmount}
                    onChange={(e) => setFinAmount(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Deskripsi Transaksi</label>
                <input
                  type="text"
                  value={finDesc}
                  onChange={(e) => setFinDesc(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Catatan Alasan Revisi</label>
                <input
                  type="text"
                  value={finRevisionNote}
                  onChange={(e) => setFinRevisionNote(e.target.value)}
                  placeholder="Contoh: Kesalahan input nominal gaji oleh admin"
                  className="w-full border border-amber-300 bg-amber-50/50 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingFinance(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl cursor-pointer"
                >
                  Simpan Revisi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL EDIT: JADWAL MENGAJAR                              */}
      {/* ======================================================== */}
      {editingSchedule && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <h3 className="text-sm font-black text-indigo-950 flex items-center gap-2 pb-2 border-b border-slate-100">
              <Pencil className="w-4 h-4 text-indigo-600" />
              Revisi Alokasi Jadwal
            </h3>
            <form onSubmit={handleSaveSchedule} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Hari Les</label>
                  <select
                    value={schDay}
                    onChange={(e) => setSchDay(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                  >
                    <option value="Senin">Senin</option>
                    <option value="Selasa">Selasa</option>
                    <option value="Rabu">Rabu</option>
                    <option value="Kamis">Kamis</option>
                    <option value="Jumat">Jumat</option>
                    <option value="Sabtu">Sabtu</option>
                    <option value="Minggu">Minggu</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Jam Belajar</label>
                  <input
                    type="text"
                    value={schTime}
                    onChange={(e) => setSchTime(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Siswa</label>
                  <select
                    value={schStudentId}
                    onChange={(e) => setSchStudentId(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                    required
                  >
                    {students.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Tentor Pengajar</label>
                  <select
                    value={schTutorId}
                    onChange={(e) => setSchTutorId(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                    required
                  >
                    {tutors.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Mata Pelajaran</label>
                <input
                  type="text"
                  value={schSubject}
                  onChange={(e) => setSchSubject(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Honor / Sesi (IDR)</label>
                  <input
                    type="number"
                    value={schRate}
                    onChange={(e) => setSchRate(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Fee Manajemen / Sesi (IDR)</label>
                  <input
                    type="number"
                    value={schAdminFee}
                    onChange={(e) => setSchAdminFee(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingSchedule(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl cursor-pointer"
                >
                  Simpan Jadwal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM ACTION MODAL (Iframe Safe & Polish) */}
      {confirmModal && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-rose-500/20 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-rose-50 rounded-2xl border border-rose-100 text-rose-600 shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-slate-900 text-sm sm:text-base leading-snug">{confirmModal.title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">{confirmModal.message}</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 text-xs">
              <button
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2.5 bg-slate-150 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
              >
                Kembali / Batal
              </button>
              <button
                onClick={() => {
                  confirmModal.action();
                  setConfirmModal(null);
                }}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-extrabold rounded-xl cursor-pointer transition-all active:scale-95"
              >
                Ya, Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
