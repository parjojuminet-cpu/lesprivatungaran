import React, { useState, useEffect } from 'react';
import { Finance, Invoice, TutorSalary, Student, Tutor, Attendance, Schedule, UserRole } from '../types';
import {
  Wallet, DollarSign, FileText, Plus, Search, TrendingUp, TrendingDown,
  ArrowUpRight, ArrowDownRight, MessageSquare, CheckCircle, Clock, Send,
  Download, Printer, Users, CheckCircle2, Pencil, Trash2, AlertCircle
} from 'lucide-react';
import { InvoicePdfModal } from './InvoicePdfModal';
import { saveInvoiceData, payInvoiceData, clearFinanceAndSppData, persistDatabaseUpdate } from '../services/dataManager';

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
  const [newInvAmount, setNewInvAmount] = useState(480000);
  const [newInvDueDate, setNewInvDueDate] = useState(new Date(Date.now() + 14 * 86400000).toISOString().substring(0, 10));

  // Modal Edit Invoice
  const [showEditInvoiceModal, setShowEditInvoiceModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
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

    // Fallback: calculate running balance locally
    let runningBalance = 0;
    const computed = [...finance].reverse().map(f => {
      const debit = f.type === 'Pemasukan' ? f.amount : 0;
      const kredit = f.type === 'Pengeluaran' ? f.amount : 0;
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
  }, [finance]);

  // Handle Pay Invoice
  const handlePayInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    try {
      await payInvoiceData(selectedInvoice.id, 'Transfer Bank / QRIS');
      alert('Pembayaran invoice SPP berhasil dicatat!');
      setShowPayModal(false);
      onRefresh();
      fetchMutasi();
    } catch (err) {
      alert('Gagal mencatat pembayaran');
    }
  };

  // Handle Create Invoice
  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saveInvoiceData({
        studentId: newInvStudentId,
        amount: Number(newInvAmount),
        dueDate: newInvDueDate,
        status: 'Belum Lunas'
      });
      alert('Invoice SPP baru berhasil diterbitkan!');
      setShowAddInvoiceModal(false);
      onRefresh();
    } catch (err) {
      alert('Gagal menerbitkan invoice');
    }
  };

  // Open Edit Invoice Modal
  const handleOpenEditInvoice = (inv: Invoice) => {
    setEditingInvoice(inv);
    setEditInvAmount(inv.amount);
    setEditInvAmountPaid(inv.amountPaid || 0);
    setEditInvDueDate(inv.dueDate);
    setEditInvStatus(inv.status);
    setEditInvRevisionNote(inv.revisionNote || '');
    setShowEditInvoiceModal(true);
  };

  // Submit Edit Invoice
  const handleEditInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInvoice) return;

    const note = editInvRevisionNote.trim() || 'Revisi invoice SPP oleh Admin';
    const updatedFields = {
      amount: Number(editInvAmount),
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

      alert('Invoice SPP berhasil direvisi!');
      setShowEditInvoiceModal(false);
      setEditingInvoice(null);
      onRefresh();
    } catch (err) {
      alert('Gagal merevisi invoice SPP.');
    }
  };

  // Delete Invoice
  const handleDeleteInvoice = async (id: string, invoiceNumber: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus invoice SPP ${invoiceNumber}?`)) return;

    try {
      try {
        await fetch(`/api/invoices/${id}`, { method: 'DELETE' });
      } catch (err) {
        console.warn('API delete error');
      }

      await persistDatabaseUpdate(db => {
        const updatedInvoices = (db.invoices || []).filter(i => i.id !== id);
        return { ...db, invoices: updatedInvoices };
      });

      alert(`Invoice ${invoiceNumber} berhasil dihapus.`);
      onRefresh();
    } catch (err) {
      alert('Gagal menghapus invoice.');
    }
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
      alert('Biaya operasional berhasil dicatat!');
      setShowOpModal(false);
      setOpDescription('');
      onRefresh();
      fetchMutasi();
    } catch (err) {
      alert('Gagal mencatat operasional');
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
        const updatedFinance = (db.finance || []).map(f =>
          f.id === editingFinance.id ? { ...f, ...updatedFields } : f
        );
        return { ...db, finance: updatedFinance };
      });

      alert('Data transaksi keuangan berhasil direvisi!');
      setShowEditFinanceModal(false);
      setEditingFinance(null);
      onRefresh();
      fetchMutasi();
    } catch (err) {
      alert('Gagal merevisi data transaksi.');
    }
  };

  // Delete Finance Item
  const handleDeleteFinance = async (id: string, description: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus transaksi "${description}"?`)) return;

    try {
      try {
        await fetch(`/api/finance/${id}`, { method: 'DELETE' });
      } catch (err) {
        console.warn('API delete error');
      }

      await persistDatabaseUpdate(db => {
        const updatedFinance = (db.finance || []).filter(f => f.id !== id);
        return { ...db, finance: updatedFinance };
      });

      alert('Transaksi keuangan berhasil dihapus.');
      onRefresh();
      fetchMutasi();
    } catch (err) {
      alert('Gagal menghapus transaksi.');
    }
  };

  // Clear All Finance & SPP Data
  const handleClearAllFinance = async () => {
    if (window.confirm('Apakah Anda yakin ingin MENGHAPUS SEMUA data transaksi keuangan, invoice SPP, dan payroll gaji? Tindakan ini tidak dapat dibatalkan.')) {
      try {
        await clearFinanceAndSppData();
        alert('Semua data Keuangan, Invoice SPP, dan Payroll Gaji telah berhasil dikosongkan!');
        onRefresh();
        fetchMutasi();
      } catch (err) {
        alert('Gagal mengosongkan data keuangan.');
      }
    }
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
      alert(`Status gaji berhasil diperbarui ke: ${status}`);
      onRefresh();
      fetchMutasi();
    } catch (err) {
      alert('Gagal memperbarui status gaji');
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

      alert(`Data payroll gaji ${editingSalary.tutorName} berhasil diperbarui!`);
      setShowEditSalaryModal(false);
      setEditingSalary(null);
      onRefresh();
      fetchMutasi();
    } catch (err) {
      alert('Gagal merevisi data payroll gaji.');
    }
  };

  const handleDeleteSalary = async (salaryId: string, tutorName: string, monthYear: string, tutorId?: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin MENGHAPUS data payroll gaji ${tutorName} (${monthYear})? Data ini akan dihapus dari rekapan dan mutasi keuangan.`)) return;

    try {
      await persistDatabaseUpdate(db => {
        // Remove from db.salaries
        const updatedSalaries = (db.salaries || []).filter(s => s.id !== salaryId && !(tutorId && s.tutorId === tutorId && s.monthYear === monthYear));

        // Remove associated Gaji Tentor transactions from db.finance
        const updatedFinance = (db.finance || []).filter(f => {
          if (f.category === 'Gaji Tentor') {
            if (f.id === `fin_${salaryId}` || f.id.includes(salaryId)) return false;
            if (tutorId && f.tutorId === tutorId && (f.date?.startsWith(monthYear) || !monthYear)) return false;
            if (f.description && f.description.includes(tutorName)) return false;
          }
          return true;
        });

        return { ...db, salaries: updatedSalaries, finance: updatedFinance };
      });

      alert(`Data payroll gaji ${tutorName} berhasil dihapus.`);
      onRefresh();
      fetchMutasi();
    } catch (err) {
      alert('Gagal menghapus data payroll gaji.');
    }
  };

  // Send WhatsApp Reminder
  const sendWhatsAppReminder = (inv: Invoice) => {
    const student = students.find(s => s.id === inv.studentId);
    if (!student) return;
    const text = encodeURIComponent(
      `Halo Bapak/Ibu ${student.parentName},\n\nSalam hangat dari Management Bimbel Privat.\nKami menginformasikan Tagihan SPP Bimbel untuk an. ${student.name} (${student.grade}):\n\nNo. Invoice: ${inv.invoiceNumber}\nTotal Tagihan: ${formatRupiah(inv.amount)}\nTerbayar: ${formatRupiah(inv.amountPaid)}\nSisa Kekurangan: ${formatRupiah(inv.amount - inv.amountPaid)}\nJatuh Tempo: ${inv.dueDate}\n\nMohon dapat melakukan pembayaran ke Rekening Resmi Bimbel. Terima kasih!`
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
    return {
      id: sal.id,
      monthYear: sal.monthYear || currentMonthYear,
      tutorId: sal.tutorId,
      tutorName: tut?.name || 'Tentor (Sistem)',
      tutorWa: tut?.wa || '-',
      ratePerSession: tut?.ratePerSession || 40000,
      totalAttendanceRate: sal.totalAttendanceRate || 0,
      bonus: sal.bonus || 0,
      cancellationCompensation: sal.cancellationCompensation || 0,
      deductions: sal.deductions || 0,
      totalSalary: sal.totalSalary || 0,
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
        return acc + (sch?.sessionRate || tut.ratePerSession || 40000);
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

  return (
    <div className="space-y-6">
      {/* Top Header & Subtabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-indigo-600" />
            Keuangan, SPP & Rekening Koran Mutasi
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Transparansi pemasukan SPP, potongan fee manajemen, penggajian tentor, dan biaya operasional.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={exportCSV}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Download className="w-4 h-4 text-slate-600" /> Export CSV
          </button>
          {isAdmin && (
            <button
              onClick={handleClearAllFinance}
              className="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer transition-all"
              title="Hapus Semua Data Keuangan, SPP & Payroll Gaji"
            >
              <Trash2 className="w-4 h-4 text-rose-600" /> Kosongkan Keuangan & SPP
            </button>
          )}
        </div>
      </div>

      {/* Skema Potongan Fee & Margin Pemilik Usaha */}
      <div className="bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-indigo-500/10 border border-amber-300/60 p-4 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">💡</span>
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
              Skema Potongan & Margin Fee Pemilik Usaha
            </h3>
            <span className="bg-amber-100 text-amber-900 font-bold text-[10px] px-2 py-0.5 rounded-full border border-amber-300">
              Sistem Otomatis
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <div className="text-[11px] font-bold text-slate-500">1. Tarif SPP Siswa</div>
            <div className="text-sm font-black text-emerald-700 mt-0.5">Rp 40.000 / sesi</div>
            <p className="text-[10px] text-slate-400 mt-1">Dibayar siswa/orang tua via Invoice SPP (diatur di Master Siswa).</p>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <div className="text-[11px] font-bold text-slate-500">2. Honor / Gaji Tentor</div>
            <div className="text-sm font-black text-indigo-700 mt-0.5">Rp 35.000 / sesi</div>
            <p className="text-[10px] text-slate-400 mt-1">Dicairkan ke tentor via Payroll Gaji (diatur di Master/Jadwal).</p>
          </div>

          <div className="bg-white p-3 rounded-xl border border-emerald-300 bg-emerald-50/50 shadow-2xs">
            <div className="text-[11px] font-bold text-emerald-900">3. Potongan Profit Pemilik</div>
            <div className="text-sm font-black text-amber-600 mt-0.5">Rp 5.000 / sesi (12.5%)</div>
            <p className="text-[10px] text-emerald-800/80 mt-1">Dialokasikan untuk Kas Operasional & Profit Bersih Pemilik Usaha.</p>
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
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Tanggal</th>
                  <th className="p-3.5">Kategori</th>
                  <th className="p-3.5">Deskripsi Transaksi</th>
                  <th className="p-3.5 text-right text-emerald-700">Pemasukan (Debit)</th>
                  <th className="p-3.5 text-right text-rose-700">Pengeluaran (Kredit)</th>
                  <th className="p-3.5 text-right font-black bg-indigo-50/50 text-indigo-900">Saldo Kumulatif</th>
                  {isAdmin && <th className="p-3.5 text-right">Aksi Admin</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mutasiData
                  .filter(m => (m.description || '').toLowerCase().includes(search.toLowerCase()))
                  .map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 text-slate-500 font-medium whitespace-nowrap">{m.date}</td>
                      <td className="p-3.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          m.category === 'SPP Siswa' ? 'bg-blue-100 text-blue-800' :
                          m.category === 'Fee Manajemen' ? 'bg-emerald-100 text-emerald-800' :
                          m.category === 'Gaji Tentor' ? 'bg-purple-100 text-purple-800' :
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
                      <td className="p-3.5 text-right font-bold text-emerald-600">
                        {m.debit > 0 ? formatRupiah(m.debit) : '-'}
                      </td>
                      <td className="p-3.5 text-right font-bold text-rose-600">
                        {m.kredit > 0 ? formatRupiah(m.kredit) : '-'}
                      </td>
                      <td className="p-3.5 text-right font-extrabold text-indigo-950 bg-indigo-50/20">
                        {formatRupiah(m.cumulativeBalance)}
                      </td>
                      {isAdmin && (
                        <td className="p-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenEditFinance(m)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                              title="Revisi Transaksi"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteFinance(m.id, m.description)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Hapus Transaksi"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
              </tbody>
            </table>
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
                    <th className="p-3.5 text-right">Total Tagihan</th>
                    <th className="p-3.5 text-right">Terbayar</th>
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
                          <td className="p-3.5 text-right font-bold text-slate-900">{formatRupiah(inv.amount)}</td>
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
                                    setPayAmount(inv.amount - inv.amountPaid);
                                    setShowPayModal(true);
                                  }}
                                  className="px-2.5 py-1 bg-emerald-600 text-white font-bold rounded-lg text-[11px] hover:bg-emerald-700 cursor-pointer shadow-2xs"
                                >
                                  Bayar SPP
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setSelectedPdfInvoice(inv);
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

                              {/* ADMIN REVISION & DELETE BUTTONS */}
                              {isAdmin && (
                                <>
                                  <button
                                    onClick={() => handleOpenEditInvoice(inv)}
                                    className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 transition-colors cursor-pointer"
                                    title="Revisi / Edit Invoice"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteInvoice(inv.id, inv.invoiceNumber)}
                                    className="p-1.5 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors cursor-pointer"
                                    title="Hapus Invoice"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
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
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
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
                <strong>Revisi Admin:</strong> Perubahan nominal atau status pembayaran akan ditandai dengan label <strong>"Sudah Direvisi"</strong> pada tabel dan nota SPP.
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
                  <label className="block text-slate-700 font-bold mb-1">Total Tagihan (Rp)</label>
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
                  placeholder="Contoh: Koreksi diskon SPP siswa / Penyesuaian deposit"
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
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
              Terbitkan Invoice SPP Baru
            </h3>
            <form onSubmit={handleCreateInvoice} className="space-y-3">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Pilih Siswa</label>
                <select
                  value={newInvStudentId}
                  onChange={(e) => setNewInvStudentId(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium"
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
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Total Nominal Tagihan (Rp)</label>
                <input
                  type="number"
                  required
                  value={newInvAmount}
                  onChange={(e) => setNewInvAmount(Number(e.target.value))}
                  className="w-full border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Tanggal Jatuh Tempo</label>
                <input
                  type="date"
                  required
                  value={newInvDueDate}
                  onChange={(e) => setNewInvDueDate(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
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
    </div>
  );
};
