import React, { useState, useEffect } from 'react';
import { Finance, Invoice, TutorSalary, Student, Tutor, Attendance, Schedule, UserRole } from '../types';
import {
  Wallet, DollarSign, FileText, Plus, Search, TrendingUp, TrendingDown,
  ArrowUpRight, ArrowDownRight, MessageSquare, CheckCircle, Clock, Send,
  Download, Printer, Users, CheckCircle2, Pencil, Trash2, AlertCircle
} from 'lucide-react';
import { InvoicePdfModal } from './InvoicePdfModal';
import { saveInvoiceData, payInvoiceData, clearFinanceAndSppData, persistDatabaseUpdate } from '../services/dataManager';
import { getStudentTutorBreakdown } from '../utils/tutorBreakdown';

interface FinanceViewProps {
  finance: Finance[];
  invoices: Invoice[];
  salaries: TutorSalary[];
  students: Student[];
  tutors: Tutor[];
  attendances?: Attendance[];
  schedules?: Schedule[];
  userRole: UserRole;
  onRefresh: () => void;
}

export const FinanceView: React.FC<FinanceViewProps> = ({
  finance,
  invoices,
  salaries,
  students,
  tutors,
  attendances = [],
  schedules = [],
  userRole,
  onRefresh
}) => {
  const [tab, setTab] = useState<'mutasi' | 'invoices' | 'salaries' | 'operational'>('mutasi');
  const [mutasiData, setMutasiData] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  const isAdmin = userRole === 'SUPER_ADMIN' || userRole === 'MANAGEMENT';

  // Modal Invoice Pay
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [payAmount, setPayAmount] = useState(0);

  // Modal PDF Invoice & Rapor
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [selectedPdfInvoice, setSelectedPdfInvoice] = useState<Invoice | null>(null);

  // Modal Add Invoice
  const [showAddInvoiceModal, setShowAddInvoiceModal] = useState(false);
  const [newInvStudentId, setNewInvStudentId] = useState('');
  const [newInvSessionCount, setNewInvSessionCount] = useState<number>(1);
  const [newInvRatePerSession, setNewInvRatePerSession] = useState<number>(25000);
  const [newInvAdditionalAmount, setNewInvAdditionalAmount] = useState<number>(0);
  const [newInvAdditionalNotes, setNewInvAdditionalNotes] = useState<string>('');
  const [newInvAdditionalTutorId, setNewInvAdditionalTutorId] = useState<string>('');
  const [newInvAmount, setNewInvAmount] = useState<number>(25000);
  const [newInvDueDate, setNewInvDueDate] = useState(new Date(Date.now() + 14 * 86400000).toISOString().substring(0, 10));

  // Modal Edit Invoice
  const [showEditInvoiceModal, setShowEditInvoiceModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [editInvSessionCount, setEditInvSessionCount] = useState<number>(1);
  const [editInvRatePerSession, setEditInvRatePerSession] = useState<number>(25000);
  const [editInvAdditionalAmount, setEditInvAdditionalAmount] = useState<number>(0);
  const [editInvAdditionalNotes, setEditInvAdditionalNotes] = useState<string>('');
  const [editInvAdditionalTutorId, setEditInvAdditionalTutorId] = useState<string>('');
  const [editInvAmount, setEditInvAmount] = useState<number>(0);
  const [editInvAmountPaid, setEditInvAmountPaid] = useState<number>(0);
  const [editInvDueDate, setEditInvDueDate] = useState<string>('');
  const [editInvStatus, setEditInvStatus] = useState<'Belum Lunas' | 'Cicilan' | 'Lunas'>('Belum Lunas');
  const [editInvRevisionNote, setEditInvRevisionNote] = useState<string>('');

  // Modal Add Operational Expense
  const [showOpModal, setShowOpModal] = useState(false);
  const [opDescription, setOpDescription] = useState('');
  const [opAmount, setOpAmount] = useState(50000);
  const [opDate, setOpDate] = useState(new Date().toISOString().substring(0, 10));

  // Modal Edit Finance Transaction
  const [showEditFinanceModal, setShowEditFinanceModal] = useState(false);
  const [editingFinance, setEditingFinance] = useState<Finance | null>(null);
  const [editFinDesc, setEditFinDesc] = useState<string>('');
  const [editFinAmount, setEditFinAmount] = useState<number>(0);
  const [editFinType, setEditFinType] = useState<'Pemasukan' | 'Pengeluaran'>('Pemasukan');
  const [editFinCategory, setEditFinCategory] = useState<'SPP Siswa' | 'Gaji Tentor' | 'Fee Manajemen' | 'Operasional'>('SPP Siswa');
  const [editFinDate, setEditFinDate] = useState<string>('');
  const [editFinRevisionNote, setEditFinRevisionNote] = useState<string>('');

  // Modal Edit Payroll Salary
  const [showEditSalaryModal, setShowEditSalaryModal] = useState(false);
  const [editingSalary, setEditingSalary] = useState<any>(null);
  const [editSalTotalRate, setEditSalTotalRate] = useState<number>(0);
  const [editSalBonus, setEditSalBonus] = useState<number>(0);
  const [editSalComp, setEditSalComp] = useState<number>(0);
  const [editSalDeductions, setEditSalDeductions] = useState<number>(0);
  const [editSalStatus, setEditSalStatus] = useState<'Pending' | 'Approved' | 'Paid'>('Pending');
  const [editSalMonthYear, setEditSalMonthYear] = useState<string>('');

  // Dialog & Notification States (IFrame Safe Fallbacks)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const [alertDialog, setAlertDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  const triggerConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      onConfirm
    });
  };

  const triggerAlert = (title: string, message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setAlertDialog({
      isOpen: true,
      title,
      message,
      type
    });
  };

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num || 0);
  };

  // Fetch Mutasi with Cumulative Balance
  const fetchMutasi = async () => {
    try {
      const res = await fetch('/api/finance/mutasi');
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setMutasiData(data);
        return;
      }
    } catch (err) {
      console.error(err);
    }

    // Always merge explicit finance records and synthetic records from attendances to prevent data loss
    const explicitFinance = [...finance];
    const syntheticFin: any[] = [];

    if (attendances && attendances.length > 0) {
      attendances.filter(a => a.status === 'Hadir').forEach(att => {
        const st = students.find(s => s.id === att.studentId);
        const tut = tutors.find(t => t.id === att.tutorId);
        const sch = schedules?.find(s => s.id === att.scheduleId);

        const sppRate = st?.ratePerSession || 25000;
        const adminFee = sch?.adminFee ?? st?.managementMarginNominal ?? 5000;
        const honorRate = sch?.sessionRate ?? Math.max(0, sppRate - adminFee);

        // 1. SPP Masuk dari Murid
        const hasSpp = explicitFinance.some(f => f.attendanceId === att.id && f.category === 'SPP Siswa');
        if (!hasSpp) {
          syntheticFin.push({
            id: `syn-spp-${att.id}`,
            type: 'Pemasukan',
            category: 'SPP Siswa',
            amount: sppRate,
            date: att.date,
            description: `Pemasukan SPP Siswa ${st?.name || 'Siswa'} (1 Sesi)`,
            studentId: att.studentId,
            tutorId: att.tutorId,
            attendanceId: att.id
          });
        }

        // 2. Honor Tentor
        const hasSal = explicitFinance.some(f => f.attendanceId === att.id && f.category === 'Gaji Tentor');
        if (!hasSal) {
          syntheticFin.push({
            id: `syn-sal-${att.id}`,
            type: 'Pengeluaran',
            category: 'Gaji Tentor',
            amount: honorRate,
            date: att.date,
            description: `Pencairan Honor Tentor ${tut?.name || 'Tentor'} (Sesi ${st?.name || 'Siswa'})`,
            studentId: att.studentId,
            tutorId: att.tutorId,
            attendanceId: att.id
          });
        }

        // 3. Fee Admin
        const hasFee = explicitFinance.some(f => f.attendanceId === att.id && f.category === 'Fee Manajemen');
        if (!hasFee) {
          syntheticFin.push({
            id: `syn-fee-${att.id}`,
            type: 'Pemasukan',
            category: 'Fee Manajemen',
            amount: adminFee,
            date: att.date,
            description: `Alokasi Fee Admin Bimbel (Sesi ${st?.name || 'Siswa'} - Tentor ${tut?.name || 'Tentor'})`,
            studentId: att.studentId,
            tutorId: att.tutorId,
            attendanceId: att.id
          });
        }
      });
    }

    const sourceFinance = [...explicitFinance, ...syntheticFin];

    let runningBalance = 0;
    const computed = [...sourceFinance].reverse().map(f => {
      const debit = f.type === 'Pemasukan' ? (Number(f.amount) || 0) : 0;
      const kredit = f.type === 'Pengeluaran' ? (Number(f.amount) || 0) : 0;
      runningBalance += (debit - kredit);
      return {
        ...f,
        debit,
        kredit,
        cumulativeBalance: runningBalance
      };
    }).reverse();
    setMutasiData(computed);
  };

  useEffect(() => {
    fetchMutasi();
  }, [finance, attendances]);

  // Handle Pay Invoice
  const handlePayInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    try {
      await payInvoiceData(selectedInvoice.id, 'Transfer Bank / QRIS');
      triggerAlert('Sukses', 'Pembayaran invoice SPP berhasil dicatat!', 'success');
      setShowPayModal(false);
      onRefresh();
      fetchMutasi();
    } catch (err) {
      triggerAlert('Error', 'Gagal mencatat pembayaran', 'error');
    }
  };

  // Handle student selection in Create Invoice modal (Auto-pull token / attendance count & rates)
  const handleSelectStudentForNewInvoice = (studentId: string) => {
    setNewInvStudentId(studentId);
    const st = students.find(s => s.id === studentId);
    const hadirCount = attendances.filter(a => a.studentId === studentId && a.status === 'Hadir').length;
    const sessCount = hadirCount > 0 ? hadirCount : 1;
    const rate = st?.ratePerSession || 25000;
    setNewInvSessionCount(sessCount);
    setNewInvRatePerSession(rate);
    setNewInvAdditionalAmount(0);
    setNewInvAdditionalNotes('');
    setNewInvAdditionalTutorId('');
    setNewInvAmount(sessCount * rate);
  };

  // Handle Create Invoice
  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const calcAmount = (Number(newInvSessionCount) * Number(newInvRatePerSession)) + Number(newInvAdditionalAmount);
      await saveInvoiceData({
        studentId: newInvStudentId,
        sessionCount: Number(newInvSessionCount),
        ratePerSession: Number(newInvRatePerSession),
        additionalAmount: Number(newInvAdditionalAmount),
        additionalNotes: newInvAdditionalNotes,
        additionalTutorId: newInvAdditionalTutorId || undefined,
        amount: calcAmount,
        dueDate: newInvDueDate,
        status: 'Belum Lunas'
      });
      triggerAlert('Sukses', 'Invoice SPP baru berhasil diterbitkan secara otomatis dari data token/sesi!', 'success');
      setShowAddInvoiceModal(false);
      onRefresh();
    } catch (err) {
      triggerAlert('Error', 'Gagal menerbitkan invoice', 'error');
    }
  };

  // Open Edit Invoice Modal
  const handleOpenEditInvoice = (inv: Invoice) => {
    const st = students.find(s => s.id === inv.studentId);
    const hadirCount = attendances.filter(a => a.studentId === inv.studentId && a.status === 'Hadir').length;
    const sessCount = inv.sessionCount ?? (hadirCount > 0 ? hadirCount : 1);
    const rate = inv.ratePerSession ?? (st?.ratePerSession || 25000);
    const addAmt = inv.additionalAmount || 0;
    const addNotes = inv.additionalNotes || '';
    const addTutorId = inv.additionalTutorId || '';
    const total = inv.amount || (sessCount * rate + addAmt);

    setEditingInvoice(inv);
    setEditInvSessionCount(sessCount);
    setEditInvRatePerSession(rate);
    setEditInvAdditionalAmount(addAmt);
    setEditInvAdditionalNotes(addNotes);
    setEditInvAdditionalTutorId(addTutorId);
    setEditInvAmount(total);
    setEditInvAmountPaid(inv.amountPaid || 0);
    setEditInvDueDate(inv.dueDate || '');
    setEditInvStatus(inv.status);
    setEditInvRevisionNote(inv.revisionNote || '');
    setShowEditInvoiceModal(true);
  };

  // Submit Edit Invoice
  const handleEditInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInvoice) return;

    const note = editInvRevisionNote.trim() || 'Revisi invoice SPP oleh Admin';
    const calcAmount = (Number(editInvSessionCount) * Number(editInvRatePerSession)) + Number(editInvAdditionalAmount);
    const updatedFields = {
      sessionCount: Number(editInvSessionCount),
      ratePerSession: Number(editInvRatePerSession),
      additionalAmount: Number(editInvAdditionalAmount),
      additionalNotes: editInvAdditionalNotes,
      additionalTutorId: editInvAdditionalTutorId || undefined,
      amount: calcAmount,
      amountPaid: Number(editInvAmountPaid),
      dueDate: editInvDueDate,
      status: editInvStatus,
      isRevised: true,
      revisedAt: new Date().toISOString().substring(0, 10),
      revisionNote: note
    };

    try {
      try {
        await fetch(`/api/invoices/${editingInvoice.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedFields)
        });
      } catch (err) {
        console.warn('API backend error');
      }

      await persistDatabaseUpdate(db => {
        const updatedInvoices = (db.invoices || []).map(i =>
          i.id === editingInvoice.id ? { ...i, ...updatedFields } : i
        );
        return { ...db, invoices: updatedInvoices };
      });

      triggerAlert('Sukses', 'Invoice SPP berhasil direvisi!', 'success');
      setShowEditInvoiceModal(false);
      setEditingInvoice(null);
      onRefresh();
    } catch (err) {
      triggerAlert('Error', 'Gagal merevisi invoice SPP.', 'error');
    }
  };

  // Delete Invoice
  const handleDeleteInvoice = (id: string, invoiceNumber: string) => {
    const inv = invoices.find(i => i.id === id);
    triggerConfirm(
      'Hapus Invoice SPP',
      `Apakah Anda yakin ingin menghapus invoice SPP ${invoiceNumber}? Sesuai rincian operasional Anda, seluruh data absensi/presensi murid yang terkait dengan invoice ini pada bulan tersebut akan terhapus secara otomatis dan kuota sesi akan dikembalikan agar pembukuan tetap sinkron.`,
      async () => {
        try {
          try {
            await fetch(`/api/invoices/${id}`, { method: 'DELETE' });
          } catch (err) {
            console.warn('API delete error');
          }

          await persistDatabaseUpdate(db => {
            const nextDb = { ...db };
            nextDb.invoices = (nextDb.invoices || []).filter(i => i.id !== id);

            if (inv) {
              const invoiceDate = inv.dueDate || new Date().toISOString().substring(0, 10);
              const invoiceMonth = invoiceDate.substring(0, 7);

              // Filter out the attendances of this student for that month
              const affectedAttendances = (nextDb.attendances || []).filter(a => a.studentId === inv.studentId && a.date.startsWith(invoiceMonth));

              // Refund the student's remaining session quota
              nextDb.students = (nextDb.students || []).map(st => {
                if (st.id === inv.studentId) {
                  const refundCount = affectedAttendances.filter(a => a.status === 'Hadir').length;
                  const rem = st.remainingSessions + refundCount;
                  return {
                    ...st,
                    remainingSessions: rem,
                    packageStatus: (rem <= 0 ? 'Habis' : rem <= 2 ? 'Hampir Habis' : 'Aktif') as any
                  };
                }
                return st;
              });

              // Remove from attendances
              nextDb.attendances = (nextDb.attendances || []).filter(a => !(a.studentId === inv.studentId && a.date.startsWith(invoiceMonth)));

              // Remove other finance entries generated from the same attendances
              const affectedAttIds = affectedAttendances.map(a => a.id);
              nextDb.finance = (nextDb.finance || []).filter(f => !affectedAttIds.includes(f.attendanceId || ''));
            }

            return nextDb;
          });

          triggerAlert('Sukses', `Invoice ${invoiceNumber} dan data presensi terkait berhasil dihapus.`, 'success');
          onRefresh();
          fetchMutasi();
        } catch (err) {
          triggerAlert('Error', 'Gagal menghapus invoice.', 'error');
        }
      }
    );
  };

  // Handle Add Operational Expense
  const handleAddOperational = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await persistDatabaseUpdate(db => {
        const newFin: Finance = {
          id: `fin_${Date.now()}`,
          type: 'Pengeluaran',
          category: 'Operasional',
          amount: Number(opAmount),
          date: opDate,
          description: opDescription,
          createdBy: userRole === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'MANAGEMENT',
          createdAt: new Date().toISOString()
        };
        return { ...db, finance: [newFin, ...db.finance] };
      });
      triggerAlert('Sukses', 'Biaya operasional berhasil dicatat!', 'success');
      setShowOpModal(false);
      setOpDescription('');
      onRefresh();
      fetchMutasi();
    } catch (err) {
      triggerAlert('Error', 'Gagal mencatat operasional', 'error');
    }
  };

  // Open Edit Finance Modal
  const handleOpenEditFinance = (f: Finance) => {
    setEditingFinance(f);
    setEditFinDesc(f.description);
    setEditFinAmount(f.amount);
    setEditFinType(f.type);
    setEditFinCategory(f.category);
    setEditFinDate(f.date || new Date().toISOString().substring(0, 10));
    setEditFinRevisionNote(f.revisionNote || '');
    setShowEditFinanceModal(true);
  };

  // Submit Edit Finance
  const handleEditFinanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFinance) return;

    const note = editFinRevisionNote.trim() || 'Revisi catatan transaksi oleh Admin';
    const updatedFields = {
      description: editFinDesc.trim(),
      amount: Number(editFinAmount),
      type: editFinType,
      category: editFinCategory,
      date: editFinDate,
      isRevised: true,
      revisedAt: new Date().toISOString().substring(0, 10),
      revisionNote: note
    };

    try {
      try {
        await fetch(`/api/finance/${editingFinance.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedFields)
        });
      } catch (err) {
        console.warn('API backend error');
      }

      await persistDatabaseUpdate(db => {
        const nextDb = { ...db };

        // 1. Convert synthetic ID to real/explicit ID if needed
        const isSynthetic = editingFinance.id.startsWith('syn-');
        const realId = isSynthetic
          ? editingFinance.id.replace('syn-spp-', 'fin_spp_').replace('syn-sal-', 'fin_sal_').replace('syn-fee-', 'fin_fee_')
          : editingFinance.id;

        const newOrUpdatedFin: Finance = {
          ...editingFinance,
          id: realId,
          ...updatedFields,
          createdBy: 'Admin Management',
          createdAt: editingFinance.createdAt || new Date().toISOString()
        };

        const exists = (nextDb.finance || []).some(f => f.id === realId);
        if (exists) {
          nextDb.finance = nextDb.finance.map(f => f.id === realId ? newOrUpdatedFin : f);
        } else {
          nextDb.finance = [newOrUpdatedFin, ...(nextDb.finance || [])];
        }

        // 2. If it is linked to an attendance, update the corresponding attendance record's date
        const attId = editingFinance.attendanceId || (isSynthetic ? editingFinance.id.replace('syn-spp-', '').replace('syn-sal-', '').replace('syn-fee-', '') : null);
        if (attId) {
          nextDb.attendances = (nextDb.attendances || []).map(a => {
            if (a.id === attId) {
              return { ...a, date: editFinDate };
            }
            return a;
          });
        }

        return nextDb;
      });

      triggerAlert('Sukses', 'Data transaksi keuangan berhasil direvisi!', 'success');
      setShowEditFinanceModal(false);
      setEditingFinance(null);
      onRefresh();
      fetchMutasi();
    } catch (err) {
      triggerAlert('Error', 'Gagal merevisi data transaksi.', 'error');
    }
  };

  // Delete Finance Item
  const handleDeleteFinance = (id: string, description: string) => {
    triggerConfirm(
      'Hapus Transaksi Keuangan',
      `Apakah Anda yakin ingin menghapus transaksi "${description}"? Tindakan ini juga akan menghapus data absensi/presensi murid yang berkaitan dengan transaksi ini agar kas keuangan tetap sinkron.`,
      async () => {
        try {
          // Identify if this is a synthetic or explicit item linked to an attendance
          const isSynthetic = id.startsWith('syn-');
          const attId = isSynthetic
            ? id.replace('syn-spp-', '').replace('syn-sal-', '').replace('syn-fee-', '')
            : null;

          try {
            await fetch(`/api/finance/${id}`, { method: 'DELETE' });
            if (attId) {
              await fetch(`/api/attendances/${attId}`, { method: 'DELETE' });
            }
          } catch (err) {
            console.warn('API delete error');
          }

          await persistDatabaseUpdate(db => {
            const nextDb = { ...db };

            // 1. Remove from explicit finance
            nextDb.finance = (nextDb.finance || []).filter(f => f.id !== id);

            // 2. Determine target attendance ID
            let targetAttId = attId;
            if (!targetAttId) {
              const explicitItem = (db.finance || []).find(f => f.id === id);
              if (explicitItem && explicitItem.attendanceId) {
                targetAttId = explicitItem.attendanceId;
              }
            }

            // 3. If there's a target attendance, delete it and refund the student's remaining sessions
            if (targetAttId) {
              const targetAtt = (nextDb.attendances || []).find(a => a.id === targetAttId);
              if (targetAtt) {
                if (targetAtt.status === 'Hadir') {
                  nextDb.students = (nextDb.students || []).map(st => {
                    if (st.id === targetAtt.studentId) {
                      const rem = st.remainingSessions + 1;
                      return {
                        ...st,
                        remainingSessions: rem,
                        packageStatus: (rem <= 0 ? 'Habis' : rem <= 2 ? 'Hampir Habis' : 'Aktif') as any
                      };
                    }
                    return st;
                  });
                }
                // Remove from attendances
                nextDb.attendances = (nextDb.attendances || []).filter(a => a.id !== targetAttId);
                // Remove other finance entries generated from the same attendance
                nextDb.finance = (nextDb.finance || []).filter(f => f.attendanceId !== targetAttId);
              }
            }

            return nextDb;
          });

          triggerAlert('Sukses', 'Transaksi keuangan dan data presensi terkait berhasil dihapus.', 'success');
          onRefresh();
          fetchMutasi();
        } catch (err) {
          triggerAlert('Error', 'Gagal menghapus transaksi.', 'error');
        }
      }
    );
  };

  // Clear All Finance & SPP Data
  const handleClearAllFinance = () => {
    triggerConfirm(
      'Kosongkan Keuangan & SPP',
      'Apakah Anda yakin ingin MENGHAPUS SEMUA data transaksi keuangan, invoice SPP, dan payroll gaji? Tindakan ini tidak dapat dibatalkan.',
      async () => {
        try {
          await clearFinanceAndSppData();
          triggerAlert('Sukses', 'Semua data Keuangan, Invoice SPP, dan Payroll Gaji telah berhasil dikosongkan!', 'success');
          onRefresh();
          fetchMutasi();
        } catch (err) {
          triggerAlert('Error', 'Gagal mengosongkan data keuangan.', 'error');
        }
      }
    );
  };

  // Update Payroll Salary Status
  const handleUpdateSalaryStatus = async (salaryId: string, status: string, tutorId?: string, totalAmount?: number) => {
    try {
      await persistDatabaseUpdate(db => {
        const existingIndex = db.salaries.findIndex(s => s.id === salaryId || (tutorId && s.tutorId === tutorId));
        let updatedSalaries = [...db.salaries];

        if (existingIndex >= 0) {
          updatedSalaries[existingIndex] = {
            ...updatedSalaries[existingIndex],
            paymentStatus: status as any
          };
        } else if (tutorId) {
          const newSalaryRecord: TutorSalary = {
            id: salaryId.startsWith('sal_') ? salaryId : `sal_${Date.now()}`,
            tutorId,
            monthYear: new Date().toISOString().substring(0, 7),
            totalAttendanceRate: totalAmount || 0,
            bonus: 0,
            cancellationCompensation: 0,
            deductions: 0,
            totalSalary: totalAmount || 0,
            paymentStatus: status as any,
            createdAt: new Date().toISOString().substring(0, 10)
          };
          updatedSalaries.push(newSalaryRecord);
        }

        // Also add an expense item to db.finance if paid
        let updatedFinance = [...db.finance];
        if (status === 'Paid') {
          const tut = db.tutors.find(t => t.id === tutorId);
          updatedFinance.push({
            id: `fin_sal_${Date.now()}`,
            date: new Date().toISOString().substring(0, 10),
            type: 'Pengeluaran',
            category: 'Gaji Tentor',
            description: `Pencairan Gaji/Honor Tentor: ${tut?.name || 'Tentor'}`,
            amount: totalAmount || 0,
            createdBy: 'Admin Management',
            createdAt: new Date().toISOString()
          });
        }

        return { ...db, salaries: updatedSalaries, finance: updatedFinance };
      });
      triggerAlert('Sukses', `Status gaji berhasil diperbarui ke: ${status}`, 'success');
      onRefresh();
      fetchMutasi();
    } catch (err) {
      triggerAlert('Error', 'Gagal memperbarui status gaji', 'error');
    }
  };

  // Edit Payroll Salary Handler
  const handleOpenEditSalary = (sal: any) => {
    setEditingSalary(sal);
    setEditSalTotalRate(sal.totalAttendanceRate || 0);
    setEditSalBonus(sal.bonus || 0);
    setEditSalComp(sal.cancellationCompensation || 0);
    setEditSalDeductions(sal.deductions || 0);
    setEditSalStatus(sal.paymentStatus === 'N/A' ? 'Pending' : sal.paymentStatus);
    setEditSalMonthYear(sal.monthYear || new Date().toISOString().substring(0, 7));
    setShowEditSalaryModal(true);
  };

  const handleEditSalarySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSalary) return;

    const totalAttendanceRate = Number(editSalTotalRate);
    const bonus = Number(editSalBonus);
    const cancellationCompensation = Number(editSalComp);
    const deductions = Number(editSalDeductions);
    const totalSalary = totalAttendanceRate + bonus + cancellationCompensation - deductions;

    try {
      await persistDatabaseUpdate(db => {
        let updatedSalaries = [...(db.salaries || [])];
        const existingIdx = updatedSalaries.findIndex(s => s.id === editingSalary.id || (s.tutorId === editingSalary.tutorId && s.monthYear === editSalMonthYear));

        const updatedRecord: TutorSalary = {
          id: existingIdx >= 0 ? updatedSalaries[existingIdx].id : (editingSalary.id.startsWith('sal_') ? editingSalary.id : `sal_${Date.now()}`),
          tutorId: editingSalary.tutorId,
          monthYear: editSalMonthYear,
          totalAttendanceRate,
          bonus,
          cancellationCompensation,
          deductions,
          totalSalary,
          paymentStatus: editSalStatus as any,
          createdAt: existingIdx >= 0 ? updatedSalaries[existingIdx].createdAt : new Date().toISOString().substring(0, 10)
        };

        if (existingIdx >= 0) {
          updatedSalaries[existingIdx] = updatedRecord;
        } else {
          updatedSalaries.push(updatedRecord);
        }

        // Handle db.finance sync if paymentStatus is Paid
        let updatedFinance = [...(db.finance || [])];
        const finId = `fin_${updatedRecord.id}`;
        const existingFinIdx = updatedFinance.findIndex(f => f.id === finId || (f.tutorId === editingSalary.tutorId && f.category === 'Gaji Tentor' && f.date?.startsWith(editSalMonthYear)));

        if (editSalStatus === 'Paid') {
          const finRecord: Finance = {
            id: existingFinIdx >= 0 ? updatedFinance[existingFinIdx].id : finId,
            date: new Date().toISOString().substring(0, 10),
            type: 'Pengeluaran',
            category: 'Gaji Tentor',
            description: `Pencairan Gaji/Honor Tentor: ${editingSalary.tutorName || 'Tentor'} (${editSalMonthYear})`,
            amount: totalSalary,
            tutorId: editingSalary.tutorId,
            createdBy: 'Admin Management',
            createdAt: new Date().toISOString()
          };
          if (existingFinIdx >= 0) {
            updatedFinance[existingFinIdx] = finRecord;
          } else {
            updatedFinance.push(finRecord);
          }
        } else if (existingFinIdx >= 0) {
          updatedFinance.splice(existingFinIdx, 1);
        }

        return { ...db, salaries: updatedSalaries, finance: updatedFinance };
      });

      triggerAlert('Sukses', `Data payroll gaji ${editingSalary.tutorName} berhasil diperbarui!`, 'success');
      setShowEditSalaryModal(false);
      setEditingSalary(null);
      onRefresh();
      fetchMutasi();
    } catch (err) {
      triggerAlert('Error', 'Gagal merevisi data payroll gaji.', 'error');
    }
  };

  const handleDeleteSalary = (salaryId: string, tutorName: string, monthYear: string, tutorId?: string) => {
    triggerConfirm(
      'Hapus Payroll Gaji',
      `Apakah Anda yakin ingin MENGHAPUS data payroll gaji ${tutorName} (${monthYear})? Sesuai permintaan Anda, seluruh data absensi/presensi mengajar tentor pada bulan tersebut akan terhapus secara otomatis dan kuota sesi murid akan dikembalikan agar pembukuan tetap sinkron.`,
      async () => {
        try {
          await persistDatabaseUpdate(db => {
            const nextDb = { ...db };

            // 1. Remove from db.salaries
            nextDb.salaries = (nextDb.salaries || []).filter(s => s.id !== salaryId && !(tutorId && s.tutorId === tutorId && s.monthYear === monthYear));

            // 2. Remove associated Gaji Tentor transactions from db.finance
            nextDb.finance = (nextDb.finance || []).filter(f => {
              if (f.category === 'Gaji Tentor') {
                if (f.id === `fin_${salaryId}` || f.id.includes(salaryId)) return false;
                if (tutorId && f.tutorId === tutorId && (f.date?.startsWith(monthYear) || !monthYear)) return false;
                if (f.description && f.description.includes(tutorName)) return false;
              }
              return true;
            });

            // 3. Remove all attendances for this tutor during that month & refund student package quotas
            if (tutorId && monthYear) {
              const affectedAttendances = (nextDb.attendances || []).filter(a => a.tutorId === tutorId && a.date.startsWith(monthYear));

              // Refund student quotas for each affected attendance marked as Hadir
              const studentRefunds: { [studentId: string]: number } = {};
              affectedAttendances.filter(a => a.status === 'Hadir').forEach(a => {
                studentRefunds[a.studentId] = (studentRefunds[a.studentId] || 0) + 1;
              });

              nextDb.students = (nextDb.students || []).map(st => {
                const refund = studentRefunds[st.id] || 0;
                if (refund > 0) {
                  const rem = st.remainingSessions + refund;
                  return {
                    ...st,
                    remainingSessions: rem,
                    packageStatus: (rem <= 0 ? 'Habis' : rem <= 2 ? 'Hampir Habis' : 'Aktif') as any
                  };
                }
                return st;
              });

              // Remove attendances
              nextDb.attendances = (nextDb.attendances || []).filter(a => !(a.tutorId === tutorId && a.date.startsWith(monthYear)));

              // Remove associated finance entries
              const affectedAttIds = affectedAttendances.map(a => a.id);
              nextDb.finance = (nextDb.finance || []).filter(f => !affectedAttIds.includes(f.attendanceId || ''));
            }

            return nextDb;
          });

          triggerAlert('Sukses', `Data payroll gaji ${tutorName} dan data presensi terkait berhasil dihapus.`, 'success');
          onRefresh();
          fetchMutasi();
        } catch (err) {
          triggerAlert('Error', 'Gagal menghapus data payroll gaji.', 'error');
        }
      }
    );
  };

  // Send WhatsApp Reminder
  const sendWhatsAppReminder = (inv: Invoice) => {
    const student = students.find(s => s.id === inv.studentId);
    if (!student) return;

    const hadirCount = attendances.filter(a => a.studentId === inv.studentId && a.status === 'Hadir').length;
    const sessionCount = inv.sessionCount ?? (hadirCount > 0 ? hadirCount : 1);
    const ratePerSession = inv.ratePerSession ?? (student.ratePerSession || 25000);
    const subtotalSpp = sessionCount * ratePerSession;
    const additionalAmount = inv.additionalAmount || 0;
    const additionalNotes = inv.additionalNotes || '';
    const totalAmount = inv.amount || (subtotalSpp + additionalAmount);
    const remaining = totalAmount - (inv.amountPaid || 0);

    const tutorBreakdown = getStudentTutorBreakdown(inv.studentId, attendances, tutors, ratePerSession);
    const additionalTutor = inv.additionalTutorId ? tutors.find(t => t.id === inv.additionalTutorId) : null;
    const addTutorSuffix = additionalTutor?.name ? ` (oleh Tentor ${additionalTutor.name})` : '';

    const tutorBreakdownText = tutorBreakdown.length > 0
      ? tutorBreakdown.map((tb, idx) =>
          `  ${idx + 1}. Tentor *${tb.tutorName}*: ${tb.sessionCount} Sesi x ${formatRupiah(ratePerSession)} = *${formatRupiah(tb.subtotal)}*`
        ).join('\n')
      : `  • Bimbingan Belajar: ${sessionCount} Sesi x ${formatRupiah(ratePerSession)} = *${formatRupiah(subtotalSpp)}*`;

    const addText = additionalAmount > 0 ? `\n• Cas/Biaya Tambahan (${additionalNotes || 'Denda/Perlengkapan'}${addTutorSuffix}): +${formatRupiah(additionalAmount)}` : '';

    const text = encodeURIComponent(
      `Halo Bapak/Ibu *${student.parentName}*,\n\nSalam hangat dari Management *Bimbel Privat Academia*.\nKami menginformasikan Tagihan SPP Bimbel an. *${student.name}* (${student.grade}):\n\n🧾 *DETAIL NOTA TAGIHAN SPP*\n• No. Invoice: *${inv.invoiceNumber}*\n• Total Sesi Terpakai: *${sessionCount} Sesi*\n\n👥 *RINCIAN SESI PER TENTOR PENGAJAR*:\n${tutorBreakdownText}${addText}\n\n• *Total Tagihan Akhir*: *${formatRupiah(totalAmount)}*\n• Terbayar: *${formatRupiah(inv.amountPaid)}*\n• *Sisa Kekurangan*: *${formatRupiah(remaining)}*\n• Jatuh Tempo: *${inv.dueDate}*\n\nMohon dapat melakukan pembayaran ke Rekening Resmi Bimbel. Terima kasih!`
    );
    window.open(`https://wa.me/${student.parentWA}?text=${text}`, '_blank');
  };

  // Export CSV helper
  const exportCSV = () => {
    const headers = ['ID', 'Tanggal', 'Jenis', 'Kategori', 'Deskripsi', 'Debit', 'Kredit', 'Saldo Kumulatif'];
    const rows = mutasiData.map(m => [
      m.id, m.date, m.type, m.category, `"${m.description}"`, m.debit, m.kredit, m.cumulativeBalance
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Rekening_Koran_Mutasi_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Merge Tutor Salary records with real-time attendances for all tutors
  const currentMonthYear = new Date().toISOString().substring(0, 7);

  // 1. Existing explicit records in db.salaries
  const existingSalariesMapped = (salaries || []).map(sal => {
    const tut = tutors.find(t => t.id === sal.tutorId);
    const tutHadirAttendances = attendances.filter(a => a.tutorId === sal.tutorId && a.status === 'Hadir');
    
    // Recalculate honor per session dynamically based on student schedule rate
    const calculatedHonor = tutHadirAttendances.reduce((acc, att) => {
      const sch = schedules?.find(s => s.id === att.scheduleId);
      const st = students.find(s => s.id === att.studentId);
      const sppRate = st?.ratePerSession || 25000;
      const adminFee = sch?.adminFee ?? st?.managementMarginNominal ?? 5000;
      const honorRate = sch?.sessionRate ?? Math.max(0, sppRate - adminFee);
      return acc + honorRate;
    }, 0);

    const baseHonor = tutHadirAttendances.length > 0 ? calculatedHonor : (sal.totalAttendanceRate || 0);

    return {
      id: sal.id,
      monthYear: sal.monthYear || currentMonthYear,
      tutorId: sal.tutorId,
      tutorName: tut?.name || 'Tentor (Sistem)',
      tutorWa: tut?.wa || '-',
      ratePerSession: tut?.ratePerSession || 40000,
      totalAttendanceRate: baseHonor,
      bonus: sal.bonus || 0,
      cancellationCompensation: sal.cancellationCompensation || 0,
      deductions: sal.deductions || 0,
      totalSalary: baseHonor + (sal.bonus || 0) + (sal.cancellationCompensation || 0) - (sal.deductions || 0),
      paymentStatus: sal.paymentStatus || 'Pending',
      totalSessions: tutHadirAttendances.length,
      isCustomRecord: true
    };
  });

  // 2. Tutors without explicit record in salaries
  const unrepresentedTutorsMapped = tutors
    .filter(tut => !(salaries || []).some(s => s.tutorId === tut.id))
    .map(tut => {
      const tutHadirAttendances = attendances.filter(a => a.tutorId === tut.id && a.status === 'Hadir');
      const totalAttendanceRateCalculated = tutHadirAttendances.reduce((acc, att) => {
        const sch = schedules?.find(s => s.id === att.scheduleId);
        const st = students.find(s => s.id === att.studentId);
        const sppRate = st?.ratePerSession || 25000;
        const adminFee = sch?.adminFee ?? st?.managementMarginNominal ?? 5000;
        const honorRate = sch?.sessionRate ?? Math.max(0, sppRate - adminFee);
        return acc + honorRate;
      }, 0);

      return {
        id: `sal_${tut.id}`,
        monthYear: currentMonthYear,
        tutorId: tut.id,
        tutorName: tut.name,
        tutorWa: tut.wa,
        ratePerSession: tut.ratePerSession || 40000,
        totalAttendanceRate: totalAttendanceRateCalculated,
        bonus: 0,
        cancellationCompensation: 0,
        deductions: 0,
        totalSalary: totalAttendanceRateCalculated,
        paymentStatus: tutHadirAttendances.length > 0 ? 'Pending' : 'N/A',
        totalSessions: tutHadirAttendances.length,
        isCustomRecord: false
      };
    })
    .filter(s => s.totalSessions > 0 || s.totalSalary > 0);

  const displaySalaries = [...existingSalariesMapped, ...unrepresentedTutorsMapped];

  const totalAllHonorCalculated = displaySalaries.reduce((acc, s) => acc + s.totalSalary, 0);
  const totalPaidHonor = displaySalaries.filter(s => s.paymentStatus === 'Paid').reduce((acc, s) => acc + s.totalSalary, 0);
  const totalPendingHonor = displaySalaries.filter(s => s.paymentStatus !== 'Paid').reduce((acc, s) => acc + s.totalSalary, 0);

  // Calculations for Rekening Koran / Mutasi Kas Summary
  const totalTutorHonorReal = mutasiData
    .filter(m => m.category === 'Gaji Tentor' && m.type === 'Pengeluaran')
    .reduce((acc, m) => acc + (Number(m.amount) || 0), 0);

  const totalOperationalExpense = mutasiData
    .filter(m => m.category === 'Operasional' && m.type === 'Pengeluaran')
    .reduce((acc, m) => acc + (Number(m.amount) || 0), 0);

  const omsetKotorDisplay = mutasiData
    .filter(m => m.category === 'SPP Siswa' && m.type === 'Pemasukan')
    .reduce((acc, m) => acc + (Number(m.amount) || 0), 0);

  const feeManagementDisplay = mutasiData
    .filter(m => m.category === 'Fee Manajemen' && m.type === 'Pemasukan')
    .reduce((acc, m) => acc + (Number(m.amount) || 0), 0);

  const pengeluaranTotalDisplay = totalTutorHonorReal + totalOperationalExpense;
  const profitBersihDisplay = feeManagementDisplay - totalOperationalExpense;

  return (
    <div className="space-y-6">
      {/* Top Header & Subtabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-indigo-600" />
            Keuangan, SPP &amp; Rekening Koran Mutasi
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Transparansi pemasukan SPP, potongan fee admin bimbel, penggajian tentor, dan biaya operasional.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={exportCSV}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Download className="w-4 h-4 text-slate-600" /> Export CSV
          </button>
          {/* Mass-clear is now managed centrally in Jantung Sistem */}
        </div>
      </div>

      {/* Skema Penentuan Fee Admin & Honor Tentor */}
      <div className="bg-gradient-to-r from-indigo-500/10 via-emerald-500/10 to-amber-500/10 border border-indigo-200 p-4 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">💡</span>
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
              Skema Keuangan: Potongan Fee Admin &amp; Honor Tentor
            </h3>
            <span className="bg-indigo-100 text-indigo-900 font-bold text-[10px] px-2 py-0.5 rounded-full border border-indigo-200">
              Pengaturan Variabel Saat Penjadwalan
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <div className="text-[11px] font-bold text-slate-500">1. Tarif SPP Siswa (Omset Kotor)</div>
            <div className="text-sm font-black text-emerald-700 mt-0.5">Misal: Rp 25.000 / Rp 30.000</div>
            <p className="text-[10px] text-slate-400 mt-1">Dibayar oleh orang tua murid (Amara: 25rb, Arshaka: 30rb).</p>
          </div>

          <div className="bg-white p-3 rounded-xl border border-indigo-200 bg-indigo-50/40 shadow-2xs">
            <div className="text-[11px] font-bold text-indigo-900">2. Fee Admin Bimbel (Potongan Admin)</div>
            <div className="text-sm font-black text-indigo-700 mt-0.5">Nominal Variabel: Rp 5.000, 7.000, dst.</div>
            <p className="text-[10px] text-indigo-800/80 mt-1">Ditentukan langsung saat membuat jadwal. Tidak menggunakan persen tetap.</p>
          </div>

          <div className="bg-white p-3 rounded-xl border border-emerald-300 bg-emerald-50/50 shadow-2xs">
            <div className="text-[11px] font-bold text-emerald-900">3. Hak Honor Tentor per Sesi</div>
            <div className="text-sm font-black text-emerald-700 mt-0.5">Hak Tentor = SPP - Fee Admin</div>
            <p className="text-[10px] text-emerald-800/80 mt-1">Amara: 25rb - 5rb = 20rb. Arshaka: 30rb - 5rb = 25rb.</p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setTab('mutasi')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            tab === 'mutasi' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          Rekening Koran Mutasi Kas
        </button>
        <button
          onClick={() => setTab('invoices')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            tab === 'invoices' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          Invoice SPP Siswa ({invoices.length})
        </button>
        <button
          onClick={() => setTab('salaries')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            tab === 'salaries' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          Payroll Gaji Tentor ({salaries.length})
        </button>
        <button
          onClick={() => setTab('operational')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            tab === 'operational' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          Biaya Operasional
        </button>
      </div>

      {/* SEARCH BAR */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Cari transaksi / invoice..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        />
      </div>

      {/* VIEW: REKENING KORAN MUTASI KAS */}
      {tab === 'mutasi' && (
        <div className="space-y-4">
          {/* Summary Rekening Koran: Omset Kotor vs Total Pengeluaran vs Fee Manajemen vs Profit Bersih */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-gradient-to-br from-emerald-50 via-white to-emerald-50/30 p-4 rounded-2xl border border-emerald-200 shadow-2xs">
              <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center justify-between">
                <span>Omset Kotor (Pemasukan SPP)</span>
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-xl font-extrabold text-emerald-800 font-mono mt-1">
                {formatRupiah(omsetKotorDisplay)}
              </div>
              <p className="text-[10px] text-slate-500 mt-1 font-medium">
                Penerimaan kotor dari pembayaran SPP siswa
              </p>
            </div>

            <div className="bg-gradient-to-br from-rose-50 via-white to-rose-50/30 p-4 rounded-2xl border border-rose-200 shadow-2xs">
              <div className="text-[11px] font-bold text-rose-800 uppercase tracking-wider flex items-center justify-between">
                <span>Total Pengeluaran (Kredit)</span>
                <TrendingDown className="w-4 h-4 text-rose-600" />
              </div>
              <div className="text-xl font-extrabold text-rose-800 font-mono mt-1">
                {formatRupiah(pengeluaranTotalDisplay)}
              </div>
              <p className="text-[10px] text-slate-500 mt-1 font-medium">
                Honor Tentor ({formatRupiah(totalTutorHonorReal)}) + Operasional ({formatRupiah(totalOperationalExpense)})
              </p>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 via-white to-indigo-50/30 p-4 rounded-2xl border border-indigo-200 shadow-2xs">
              <div className="text-[11px] font-bold text-indigo-800 uppercase tracking-wider flex items-center justify-between">
                <span>Fee Manajemen Bimbel</span>
                <Wallet className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-xl font-extrabold text-indigo-900 font-mono mt-1">
                {formatRupiah(feeManagementDisplay)}
              </div>
              <p className="text-[10px] text-slate-500 mt-1 font-medium">
                Bagian Bimbel = SPP Siswa dikurangi Honor Tentor
              </p>
            </div>

            <div className="bg-gradient-to-br from-amber-50 via-white to-amber-100/40 p-4 rounded-2xl border border-amber-300 shadow-2xs">
              <div className="text-[11px] font-bold text-amber-900 uppercase tracking-wider flex items-center justify-between">
                <span>Pendapatan / Profit Bersih</span>
                <TrendingUp className="w-4 h-4 text-amber-700" />
              </div>
              <div className="text-xl font-extrabold text-amber-900 font-mono mt-1">
                {formatRupiah(profitBersihDisplay)}
              </div>
              <p className="text-[10px] text-amber-800 mt-1 font-semibold">
                Profit Bersih Bimbel (Fee Manajemen - Operasional)
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Tanggal</th>
                  <th className="p-3.5">Kategori</th>
                  <th className="p-3.5">Deskripsi Transaksi</th>
                  <th className="p-3.5 text-right text-emerald-700 font-bold">Masuk Murid (SPP)</th>
                  <th className="p-3.5 text-right text-rose-700 font-bold">Keluar Tentor (Honor)</th>
                  <th className="p-3.5 text-right text-indigo-700 font-bold">Masuk Admin (Fee)</th>
                  <th className="p-3.5 text-right font-black bg-indigo-50/50 text-indigo-900">Saldo Kumulatif Kas</th>
                  {isAdmin && <th className="p-3.5 text-right text-slate-400">Sistem Keamanan</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mutasiData
                  .filter(m => (m.description || '').toLowerCase().includes(search.toLowerCase()))
                  .map((m) => {
                    const isSPP = m.category === 'SPP Siswa';
                    const isSal = m.category === 'Gaji Tentor';
                    const isFee = m.category === 'Fee Manajemen';
                    const isOp = m.category === 'Operasional';

                    return (
                      <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5 text-slate-500 font-medium whitespace-nowrap">{m.date}</td>
                        <td className="p-3.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            isSPP ? 'bg-blue-100 text-blue-800' :
                            isFee ? 'bg-indigo-100 text-indigo-800' :
                            isSal ? 'bg-purple-100 text-purple-800' :
                            'bg-rose-100 text-rose-800'
                          }`}>
                            {m.category}
                          </span>
                        </td>
                        <td className="p-3.5 font-medium text-slate-800">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span>{m.description}</span>
                            {m.isRevised && (
                              <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full inline-flex items-center gap-1 shrink-0" title={`Direvisi pada ${m.revisedAt || ''}: ${m.revisionNote || ''}`}>
                                <Pencil className="w-2.5 h-2.5 text-amber-600" /> Sudah Direvisi
                              </span>
                            )}
                          </div>
                          {m.revisionNote && (
                            <div className="text-[10px] text-amber-700 font-medium italic mt-0.5">
                              Catatan Revisi: {m.revisionNote}
                            </div>
                          )}
                        </td>
                        {/* Masuk SPP Siswa (Debit) */}
                        <td className="p-3.5 text-right font-bold text-emerald-600">
                          {isSPP ? formatRupiah(m.amount || m.debit) : (m.debit > 0 && !isFee ? formatRupiah(m.debit) : '-')}
                        </td>
                        {/* Keluar Tentor / Operasional (Kredit) */}
                        <td className="p-3.5 text-right font-bold text-rose-600">
                          {isSal || isOp ? formatRupiah(m.amount || m.kredit) : (m.kredit > 0 ? formatRupiah(m.kredit) : '-')}
                        </td>
                        {/* Masuk Fee Admin */}
                        <td className="p-3.5 text-right font-bold text-indigo-600">
                          {isFee ? formatRupiah(m.amount) : '-'}
                        </td>
                        {/* Saldo Kumulatif */}
                        <td className="p-3.5 text-right font-extrabold text-indigo-950 bg-indigo-50/20">
                          {formatRupiah(m.cumulativeBalance)}
                        </td>
                        {isAdmin && (
                          <td className="p-3.5 text-right whitespace-nowrap text-[10px] text-slate-400 font-extrabold italic">
                            🔒 Terkunci (Edit di Jantung)
                          </td>
                        )}
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      )}

      {/* VIEW: INVOICES SPP */}
      {tab === 'invoices' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowAddInvoiceModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" /> Terbitkan Invoice SPP Baru
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">No. Invoice</th>
                    <th className="p-3.5">Nama Siswa</th>
                    <th className="p-3.5 text-center">Token / Sesi Terpakai</th>
                    <th className="p-3.5 text-right">Subtotal SPP</th>
                    <th className="p-3.5 text-right">Cas / Tambahan</th>
                    <th className="p-3.5 text-right font-bold text-slate-900">Total Tagihan</th>
                    <th className="p-3.5 text-right text-emerald-700 font-bold">Terbayar</th>
                    <th className="p-3.5">Jatuh Tempo</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices
                    .filter(inv => {
                      const student = students.find(s => s.id === inv.studentId);
                      const searchLower = search.toLowerCase();
                      return (
                        inv.invoiceNumber.toLowerCase().includes(searchLower) ||
                        (student && student.name.toLowerCase().includes(searchLower))
                      );
                    })
                    .map((inv) => {
                      const student = students.find(s => s.id === inv.studentId);
                      const hadirCount = attendances.filter(a => a.studentId === inv.studentId && a.status === 'Hadir').length;
                      const sessionCount = inv.sessionCount ?? (hadirCount > 0 ? hadirCount : 1);
                      const ratePerSession = inv.ratePerSession ?? (student?.ratePerSession || 25000);
                      const subtotalSpp = sessionCount * ratePerSession;
                      const additionalAmount = inv.additionalAmount || 0;
                      const additionalNotes = inv.additionalNotes || '';
                      const totalAmount = inv.amount || (subtotalSpp + additionalAmount);

                      const tutorBreakdown = getStudentTutorBreakdown(inv.studentId, attendances, tutors, ratePerSession);
                      const addTutor = inv.additionalTutorId ? tutors.find(t => t.id === inv.additionalTutorId) : null;

                      return (
                        <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3.5">
                            <div className="font-bold text-slate-900 flex items-center gap-2">
                              <span>{inv.invoiceNumber}</span>
                              {inv.isRevised && (
                                <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full inline-flex items-center gap-1 shrink-0" title={`Direvisi pada ${inv.revisedAt || ''}: ${inv.revisionNote || ''}`}>
                                  <CheckCircle2 className="w-2.5 h-2.5 text-amber-600" /> Sudah Direvisi
                                </span>
                              )}
                            </div>
                            {inv.revisionNote && (
                              <div className="text-[10px] text-amber-700 font-medium italic mt-0.5">
                                Catatan Revisi: {inv.revisionNote}
                              </div>
                            )}
                          </td>
                          <td className="p-3.5">
                            <div className="font-bold text-slate-800">{student?.name || 'Siswa N/A'}</div>
                            <div className="text-[11px] text-slate-400">Wali: {student?.parentName}</div>
                          </td>
                          <td className="p-3.5 text-center font-bold">
                            <span className="inline-block bg-indigo-50 border border-indigo-200 text-indigo-900 px-2 py-0.5 rounded-md font-extrabold text-[11px]" title="Ditarik otomatis dari presensi hadir siswa">
                              {sessionCount} Sesi
                            </span>
                            {tutorBreakdown.length > 0 && (
                              <div className="flex flex-wrap items-center justify-center gap-1 mt-1">
                                {tutorBreakdown.map((tb) => (
                                  <span key={tb.tutorId} className="bg-slate-100 text-slate-700 border border-slate-200 text-[9px] font-bold px-1.5 py-0.2 rounded" title={`${tb.tutorName}: ${tb.sessionCount} Sesi`}>
                                    {tb.tutorName.split(' ')[0]}: {tb.sessionCount}x
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="p-3.5 text-right font-semibold text-slate-700">
                            {formatRupiah(subtotalSpp)}
                            <div className="text-[10px] text-slate-400">@{formatRupiah(ratePerSession)}</div>
                          </td>
                          <td className="p-3.5 text-right">
                            {additionalAmount > 0 ? (
                              <div>
                                <span className="font-bold text-amber-800">+{formatRupiah(additionalAmount)}</span>
                                {additionalNotes && (
                                  <div className="text-[10px] text-amber-700 font-medium italic truncate max-w-[130px]" title={additionalNotes}>
                                    {additionalNotes}
                                  </div>
                                )}
                                {addTutor && (
                                  <div className="text-[9px] font-bold text-amber-900 bg-amber-100/80 px-1 py-0.2 rounded inline-block mt-0.5">
                                    Tentor: {addTutor.name.split(' ')[0]}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="p-3.5 text-right font-black text-slate-900 text-sm">{formatRupiah(totalAmount)}</td>
                          <td className="p-3.5 text-right font-bold text-emerald-600">{formatRupiah(inv.amountPaid)}</td>
                          <td className="p-3.5 text-slate-500">{inv.dueDate}</td>
                          <td className="p-3.5">
                            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                              inv.status === 'Lunas' ? 'bg-emerald-100 text-emerald-800' :
                              inv.status === 'Cicilan' ? 'bg-amber-100 text-amber-800' :
                              'bg-rose-100 text-rose-800'
                            }`}>
                              {inv.status}
                            </span>
                          </td>
                          <td className="p-3.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {inv.status !== 'Lunas' && (
                                <button
                                  onClick={() => {
                                    setSelectedInvoice(inv);
                                    setPayAmount(totalAmount - inv.amountPaid);
                                    setShowPayModal(true);
                                  }}
                                  className="px-2.5 py-1 bg-emerald-600 text-white font-bold rounded-lg text-[11px] hover:bg-emerald-700 cursor-pointer shadow-2xs"
                                >
                                  Bayar SPP
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setSelectedPdfInvoice({ ...inv, amount: totalAmount, sessionCount, ratePerSession, additionalAmount, additionalNotes });
                                  setShowPdfModal(true);
                                }}
                                className="px-2 py-1 bg-slate-900 text-white font-bold rounded-lg text-[11px] hover:bg-slate-800 cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                                title="Cetak PDF Nota & Rapor"
                              >
                                <Printer className="w-3 h-3 text-emerald-400" /> Cetak
                              </button>
                              <button
                                onClick={() => sendWhatsAppReminder(inv)}
                                className="px-2 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-lg text-[11px] hover:bg-emerald-200 cursor-pointer inline-flex items-center gap-1"
                                title="Kirim Pesan WA"
                              >
                                <Send className="w-3 h-3" /> WA
                              </button>

                              {/* Invoice Edit and Delete buttons have been moved to Jantung Sistem */}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: PAYROLL GAJI TENTOR */}
      {tab === 'salaries' && (
        <div className="space-y-4">
          {/* Admin Payroll Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl p-4 border border-indigo-700/60 shadow-xs">
              <div className="text-[11px] text-indigo-300 font-bold uppercase tracking-wider">Total Honor semua tentor</div>
              <div className="text-xl font-extrabold text-indigo-300 font-mono mt-1">{formatRupiah(totalAllHonorCalculated)}</div>
              <p className="text-[11px] text-indigo-200/80 mt-1">Akumulasi {displaySalaries.length} tentor aktif mengajar</p>
            </div>

            <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200 shadow-xs">
              <div className="text-[11px] text-emerald-800 font-bold uppercase tracking-wider">Sudah Dicairkan (Lunas)</div>
              <div className="text-xl font-extrabold text-emerald-700 font-mono mt-1">{formatRupiah(totalPaidHonor)}</div>
              <p className="text-[11px] text-emerald-600 mt-1">Sudah ditransfer ke tentor</p>
            </div>

            <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 shadow-xs">
              <div className="text-[11px] text-amber-800 font-bold uppercase tracking-wider">Pending / Belum Cair</div>
              <div className="text-xl font-extrabold text-amber-700 font-mono mt-1">{formatRupiah(totalPendingHonor)}</div>
              <p className="text-[11px] text-amber-600 mt-1">Siap dicairkan oleh Admin</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-800 flex items-center justify-between">
              <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-indigo-600" /> Rekapan Payroll Gaji Tentor Real-Time</span>
              <span className="text-[11px] text-slate-500 font-normal">Otomatis terekap dari presensi Hadir</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Periode</th>
                    <th className="p-3.5">Nama Tentor</th>
                    <th className="p-3.5 text-center">Sesi Hadir</th>
                    <th className="p-3.5 text-right">Akumulasi Honor</th>
                    <th className="p-3.5 text-right">Bonus & Kompensasi</th>
                    <th className="p-3.5 text-right text-indigo-900 font-bold">Total Gaji Bersih</th>
                    <th className="p-3.5 text-center">Status Pencairan</th>
                    <th className="p-3.5 text-right">Aksi Management</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displaySalaries.map((sal) => (
                    <tr key={sal.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5 font-bold text-slate-800">{sal.monthYear}</td>
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{sal.tutorName}</div>
                        <div className="text-[11px] text-slate-400">{sal.tutorWa}</div>
                      </td>
                      <td className="p-3.5 text-center font-bold text-indigo-600">{sal.totalSessions} Sesi</td>
                      <td className="p-3.5 text-right font-medium text-slate-800">{formatRupiah(sal.totalAttendanceRate)}</td>
                      <td className="p-3.5 text-right text-emerald-600 font-medium">
                        +{formatRupiah((sal.bonus || 0) + (sal.cancellationCompensation || 0))}
                      </td>
                      <td className="p-3.5 text-right font-black text-indigo-950 font-mono">{formatRupiah(sal.totalSalary)}</td>
                      <td className="p-3.5 text-center">
                        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                          sal.paymentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-800' :
                          sal.paymentStatus === 'Approved' ? 'bg-blue-100 text-blue-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {sal.paymentStatus === 'Paid' ? 'Sudah Cair' : sal.paymentStatus}
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-1 flex items-center justify-end gap-1">
                        {sal.paymentStatus !== 'Paid' && (
                          <button
                            onClick={() => handleUpdateSalaryStatus(sal.id, 'Paid', sal.tutorId, sal.totalSalary)}
                            className="px-2.5 py-1 bg-emerald-600 text-white font-bold rounded-lg text-[11px] hover:bg-emerald-700 cursor-pointer shadow-xs active:scale-95 transition-all"
                          >
                            Cairkan
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenEditSalary(sal)}
                          className="px-2 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold rounded-lg text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                          title="Edit Payroll"
                        >
                          <Pencil className="w-3 h-3" /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteSalary(sal.id, sal.tutorName, sal.monthYear, sal.tutorId)}
                          className="px-2 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold rounded-lg text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                          title="Hapus Payroll"
                        >
                          <Trash2 className="w-3 h-3" /> Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: BIAYA OPERASIONAL */}
      {tab === 'operational' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowOpModal(true)}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" /> Catat Pengeluaran Operasional
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4">
            <div className="space-y-3">
              {finance.filter(f => f.category === 'Operasional').map((op) => (
                <div key={op.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 text-xs">{op.description}</span>
                      {op.isRevised && (
                        <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                          <Pencil className="w-2.5 h-2.5 text-amber-600" /> Sudah Direvisi
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Tanggal: {op.date} • Dibuat oleh: {op.createdBy}
                      {op.revisionNote && <span className="text-amber-700 font-medium italic ml-2">• Catatan: {op.revisionNote}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-black text-rose-700">
                      -{formatRupiah(op.amount)}
                    </div>
                    <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
                      <button
                        onClick={() => handleOpenEditFinance(op)}
                        className="px-2.5 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors cursor-pointer flex items-center gap-1 font-bold text-xs"
                        title="Edit Pengeluaran"
                      >
                        <Pencil className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => handleDeleteFinance(op.id, op.description)}
                        className="px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer flex items-center gap-1 font-bold text-xs"
                        title="Hapus Pengeluaran"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Hapus
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PAY INVOICE */}
      {showPayModal && selectedInvoice && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
              Pembayaran SPP: {selectedInvoice.invoiceNumber}
            </h3>
            <form onSubmit={handlePayInvoice} className="space-y-3">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Nominal Pembayaran (Rp)</label>
                <input
                  type="number"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="px-4 py-2 border rounded-xl font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 cursor-pointer shadow-xs"
                >
                  Proses Bayar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT INVOICE (REVISI ADMIN) */}
      {showEditInvoiceModal && editingInvoice && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Pencil className="w-4 h-4 text-indigo-600" /> Revisi Invoice SPP Siswa
              </h3>
              <button
                onClick={() => setShowEditInvoiceModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-800 text-[11px] flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Revisi Admin:</strong> Perubahan jumlah sesi, cas tambahan, atau nominal pembayaran akan ditandai dengan label <strong>"Sudah Direvisi"</strong> pada tabel dan nota SPP.
              </div>
            </div>

            <form onSubmit={handleEditInvoiceSubmit} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">No. Invoice</label>
                <input
                  type="text"
                  disabled
                  value={editingInvoice.invoiceNumber}
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-500 cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Sesi / Token Terpakai</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editInvSessionCount}
                    onChange={(e) => {
                      const sess = Number(e.target.value);
                      setEditInvSessionCount(sess);
                      setEditInvAmount(sess * editInvRatePerSession + editInvAdditionalAmount);
                    }}
                    className="w-full border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Tarif per Sesi (Rp)</label>
                  <input
                    type="number"
                    required
                    value={editInvRatePerSession}
                    onChange={(e) => {
                      const rate = Number(e.target.value);
                      setEditInvRatePerSession(rate);
                      setEditInvAmount(editInvSessionCount * rate + editInvAdditionalAmount);
                    }}
                    className="w-full border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-indigo-600" /> Cas / Nominal Tambahan
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1 text-[11px]">Nominal Cas (Rp)</label>
                    <input
                      type="number"
                      value={editInvAdditionalAmount}
                      onChange={(e) => {
                        const add = Number(e.target.value);
                        setEditInvAdditionalAmount(add);
                        setEditInvAmount(editInvSessionCount * editInvRatePerSession + add);
                      }}
                      className="w-full border border-slate-200 bg-white rounded-xl p-2 font-bold text-amber-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1 text-[11px]">Keterangan Cas</label>
                    <input
                      type="text"
                      value={editInvAdditionalNotes}
                      onChange={(e) => setEditInvAdditionalNotes(e.target.value)}
                      placeholder="Contoh: Cas keterlambatan"
                      className="w-full border border-slate-200 bg-white rounded-xl p-2 font-medium text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1 text-[11px]">Tentor Terkait Cas (Opsional)</label>
                  <select
                    value={editInvAdditionalTutorId}
                    onChange={(e) => setEditInvAdditionalTutorId(e.target.value)}
                    className="w-full border border-slate-200 bg-white rounded-xl p-2 font-medium text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="">-- Bebankan Umum / Semua Tentor --</option>
                    {tutors.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Total Tagihan Akhir (Rp)</label>
                  <input
                    type="number"
                    required
                    value={editInvAmount}
                    onChange={(e) => setEditInvAmount(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-xl p-2.5 font-extrabold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Nominal Terbayar (Rp)</label>
                  <input
                    type="number"
                    required
                    value={editInvAmountPaid}
                    onChange={(e) => setEditInvAmountPaid(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-xl p-2.5 font-extrabold text-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Status Pembayaran</label>
                  <select
                    value={editInvStatus}
                    onChange={(e) => setEditInvStatus(e.target.value as any)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                  >
                    <option value="Belum Lunas">Belum Lunas</option>
                    <option value="Cicilan">Cicilan</option>
                    <option value="Lunas">Lunas</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Tanggal Jatuh Tempo</label>
                  <input
                    type="date"
                    required
                    value={editInvDueDate}
                    onChange={(e) => setEditInvDueDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Alasan / Catatan Revisi</label>
                <input
                  type="text"
                  placeholder="Contoh: Koreksi jumlah sesi les / Tambahan cas modul"
                  value={editInvRevisionNote}
                  onChange={(e) => setEditInvRevisionNote(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditInvoiceModal(false)}
                  className="px-4 py-2 border rounded-xl font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 cursor-pointer shadow-xs active:scale-95 transition-all"
                >
                  Simpan Revisi Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT FINANCE TRANSACTION (REVISI TRANSAKSI) */}
      {showEditFinanceModal && editingFinance && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Pencil className="w-4 h-4 text-indigo-600" /> Revisi Transaksi Keuangan
              </h3>
              <button
                onClick={() => setShowEditFinanceModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-800 text-[11px] flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Revisi Admin:</strong> Hasil perubahan akan memperbarui saldo kumulatif mutasi dan menyematkan penanda "Sudah Direvisi".
              </div>
            </div>

            <form onSubmit={handleEditFinanceSubmit} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Deskripsi Transaksi</label>
                <input
                  type="text"
                  required
                  value={editFinDesc}
                  onChange={(e) => setEditFinDesc(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Nominal (Rp)</label>
                  <input
                    type="number"
                    required
                    value={editFinAmount}
                    onChange={(e) => setEditFinAmount(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-xl p-2.5 font-extrabold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Tanggal</label>
                  <input
                    type="date"
                    required
                    value={editFinDate}
                    onChange={(e) => setEditFinDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Tipe Transaksi</label>
                  <select
                    value={editFinType}
                    onChange={(e) => setEditFinType(e.target.value as any)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                  >
                    <option value="Pemasukan">Pemasukan (Debit)</option>
                    <option value="Pengeluaran">Pengeluaran (Kredit)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Kategori</label>
                  <select
                    value={editFinCategory}
                    onChange={(e) => setEditFinCategory(e.target.value as any)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                  >
                    <option value="SPP Siswa">SPP Siswa</option>
                    <option value="Gaji Tentor">Gaji Tentor</option>
                    <option value="Fee Manajemen">Fee Manajemen</option>
                    <option value="Operasional">Operasional</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Catatan / Alasan Revisi</label>
                <input
                  type="text"
                  placeholder="Contoh: Koreksi kesalahan pencatatan nominal oleh staf"
                  value={editFinRevisionNote}
                  onChange={(e) => setEditFinRevisionNote(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditFinanceModal(false)}
                  className="px-4 py-2 border rounded-xl font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 cursor-pointer shadow-xs active:scale-95 transition-all"
                >
                  Simpan Revisi Transaksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD OPERATIONAL */}
      {showOpModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
              Catat Biaya Operasional Bimbel
            </h3>
            <form onSubmit={handleAddOperational} className="space-y-3">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Deskripsi Pengeluaran</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pembelian Kertas A4 & Listrik"
                  value={opDescription}
                  onChange={(e) => setOpDescription(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Nominal (Rp)</label>
                <input
                  type="number"
                  required
                  value={opAmount}
                  onChange={(e) => setOpAmount(Number(e.target.value))}
                  className="w-full border border-slate-200 rounded-xl p-2.5 font-bold text-rose-700 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowOpModal(false)}
                  className="px-4 py-2 border rounded-xl font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 cursor-pointer shadow-xs"
                >
                  Simpan Pengeluaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD INVOICE */}
      {showAddInvoiceModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" /> Terbitkan Invoice SPP Baru
              </h3>
              <button
                onClick={() => setShowAddInvoiceModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 text-indigo-900 text-[11px] flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <strong>Otomatisasi Token/Presensi:</strong> Jumlah sesi les ditarik secara otomatis dari presensi hadir siswa di menu Penjadwalan & Presensi.
              </div>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Pilih Siswa</label>
                <select
                  value={newInvStudentId}
                  onChange={(e) => handleSelectStudentForNewInvoice(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-semibold text-slate-900"
                  required
                >
                  <option value="">-- Pilih Siswa --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.grade})
                    </option>
                  ))}
                </select>
              </div>

              {newInvStudentId && (() => {
                const breakdown = getStudentTutorBreakdown(newInvStudentId, attendances, tutors, newInvRatePerSession);
                return (
                  <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-3 space-y-1.5 text-[11px]">
                    <div className="font-extrabold text-indigo-950 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-indigo-600" /> Rincian Presensi Tentor Bulan Ini:
                      </span>
                      <span className="text-[10px] bg-indigo-200 text-indigo-900 px-1.5 py-0.5 rounded font-bold">
                        {breakdown.reduce((sum, b) => sum + b.sessionCount, 0)} Sesi Presensi
                      </span>
                    </div>
                    {breakdown.length > 0 ? (
                      <div className="space-y-1 pl-1">
                        {breakdown.map((tb) => (
                          <div key={tb.tutorId} className="flex items-center justify-between font-semibold text-slate-700">
                            <span>• Tentor <strong className="text-slate-900">{tb.tutorName}</strong></span>
                            <span className="bg-white text-indigo-900 border border-indigo-200 px-2 py-0.5 rounded font-extrabold text-[10px]">
                              {tb.sessionCount} Sesi ({tb.dates.join(', ')})
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-500 italic">Belum ada data presensi 'Hadir' bulan ini. Sistem mengasumsikan 1 sesi default.</p>
                    )}
                  </div>
                );
              })()}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Sesi / Token Terpakai
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newInvSessionCount}
                    onChange={(e) => {
                      const sess = Number(e.target.value);
                      setNewInvSessionCount(sess);
                      setNewInvAmount(sess * newInvRatePerSession + newInvAdditionalAmount);
                    }}
                    className="w-full border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Ditarik dari presensi</span>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Tarif per Sesi (Rp)
                  </label>
                  <input
                    type="number"
                    required
                    value={newInvRatePerSession}
                    onChange={(e) => {
                      const rate = Number(e.target.value);
                      setNewInvRatePerSession(rate);
                      setNewInvAmount(newInvSessionCount * rate + newInvAdditionalAmount);
                    }}
                    className="w-full border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Tarif les siswa</span>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-indigo-600" /> Cas / Nominal Tambahan (Opsional)
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1 text-[11px]">Nominal Cas (Rp)</label>
                    <input
                      type="number"
                      value={newInvAdditionalAmount}
                      onChange={(e) => {
                        const add = Number(e.target.value);
                        setNewInvAdditionalAmount(add);
                        setNewInvAmount(newInvSessionCount * newInvRatePerSession + add);
                      }}
                      placeholder="0"
                      className="w-full border border-slate-200 bg-white rounded-xl p-2 font-bold text-amber-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1 text-[11px]">Keterangan Cas</label>
                    <input
                      type="text"
                      value={newInvAdditionalNotes}
                      onChange={(e) => setNewInvAdditionalNotes(e.target.value)}
                      placeholder="Contoh: Denda terlambat / Modul tentor"
                      className="w-full border border-slate-200 bg-white rounded-xl p-2 font-medium text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1 text-[11px]">Tentor Terkait Cas (Opsional)</label>
                  <select
                    value={newInvAdditionalTutorId}
                    onChange={(e) => setNewInvAdditionalTutorId(e.target.value)}
                    className="w-full border border-slate-200 bg-white rounded-xl p-2 font-medium text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="">-- Bebankan Umum / Semua Tentor --</option>
                    {tutors.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Total Tagihan SPP (Rp)</label>
                  <input
                    type="number"
                    required
                    value={newInvAmount}
                    onChange={(e) => setNewInvAmount(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-xl p-2.5 font-black text-indigo-700 bg-indigo-50/50 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Tanggal Jatuh Tempo</label>
                  <input
                    type="date"
                    required
                    value={newInvDueDate}
                    onChange={(e) => setNewInvDueDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddInvoiceModal(false)}
                  className="px-4 py-2 border rounded-xl font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 cursor-pointer shadow-xs"
                >
                  Terbitkan Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT PAYROLL SALARY (REVISI GAJI TENTOR) */}
      {showEditSalaryModal && editingSalary && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Pencil className="w-4 h-4 text-indigo-600" /> Revisi Payroll Gaji Tentor
              </h3>
              <button
                onClick={() => setShowEditSalaryModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 text-indigo-900 text-[11px]">
              <strong>Tentor:</strong> {editingSalary.tutorName} • <strong>Periode:</strong> {editSalMonthYear}
            </div>

            <form onSubmit={handleEditSalarySubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Akumulasi Honor (Rp)</label>
                  <input
                    type="number"
                    required
                    value={editSalTotalRate}
                    onChange={(e) => setEditSalTotalRate(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Bonus Honor (Rp)</label>
                  <input
                    type="number"
                    value={editSalBonus}
                    onChange={(e) => setEditSalBonus(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-xl p-2.5 font-bold text-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Kompensasi (Rp)</label>
                  <input
                    type="number"
                    value={editSalComp}
                    onChange={(e) => setEditSalComp(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-xl p-2.5 font-bold text-sky-700 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Potongan Gaji (Rp)</label>
                  <input
                    type="number"
                    value={editSalDeductions}
                    onChange={(e) => setEditSalDeductions(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-xl p-2.5 font-bold text-rose-700 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Status Pencairan</label>
                  <select
                    value={editSalStatus}
                    onChange={(e) => setEditSalStatus(e.target.value as any)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                  >
                    <option value="Pending">Belum Cair (Pending)</option>
                    <option value="Approved">Disetujui (Approved)</option>
                    <option value="Paid">Sudah Cair (Paid)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Periode (Bulan-Tahun)</label>
                  <input
                    type="month"
                    required
                    value={editSalMonthYear}
                    onChange={(e) => setEditSalMonthYear(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
                <span className="font-bold text-slate-700">Estimasi Total Gaji Bersih:</span>
                <span className="text-sm font-black text-indigo-900 font-mono">
                  {formatRupiah(Number(editSalTotalRate) + Number(editSalBonus) + Number(editSalComp) - Number(editSalDeductions))}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditSalaryModal(false)}
                  className="px-4 py-2 border rounded-xl font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 cursor-pointer shadow-xs active:scale-95 transition-all"
                >
                  Simpan Revisi Gaji
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PDF INVOICE NOTA & RAPOR */}
      {showPdfModal && selectedPdfInvoice && (
        <InvoicePdfModal
          invoice={selectedPdfInvoice}
          student={students.find(s => s.id === selectedPdfInvoice.studentId)}
          attendances={attendances || []}
          tutors={tutors || []}
          onClose={() => {
            setShowPdfModal(false);
            setSelectedPdfInvoice(null);
          }}
        />
      )}

      {/* CUSTOM CONFIRM DIALOG MODAL */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-100 shadow-xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-amber-50 rounded-full text-amber-600 shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">{confirmDialog.title}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {confirmDialog.message}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 text-xs border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                  confirmDialog.onConfirm();
                }}
                className="px-5 py-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all cursor-pointer shadow-xs active:scale-95"
              >
                Ya, Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM ALERT DIALOG MODAL */}
      {alertDialog.isOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-2xs z-[110] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 border border-slate-100 shadow-xl space-y-4 text-center">
            <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center">
              {alertDialog.type === 'success' ? (
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-full">
                  <CheckCircle className="w-6 h-6" />
                </div>
              ) : alertDialog.type === 'error' ? (
                <div className="p-3 bg-rose-50 text-rose-600 rounded-full">
                  <AlertCircle className="w-6 h-6" />
                </div>
              ) : (
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-full">
                  <AlertCircle className="w-6 h-6" />
                </div>
              )}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">{alertDialog.title}</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {alertDialog.message}
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setAlertDialog(prev => ({ ...prev, isOpen: false }))}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
