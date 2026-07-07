import React, { useState } from 'react';
import { Student, Tutor, Parent, Subject, WorkingArea, GradeLevel, PackageStatus, UserRole } from '../types';
import { Plus, Search, Edit2, Trash2, CheckCircle, XCircle, GraduationCap, Users, UserCheck, BookOpen, MapPin, AlertCircle, Phone, Home, Zap, RefreshCw, X } from 'lucide-react';
import { saveStudentData, deleteStudentData, saveTutorData, deleteTutorData, resetAllStudentsQuotaTo10 } from '../services/dataManager';

interface MasterDataViewProps {
  students: Student[];
  tutors: Tutor[];
  parents: Parent[];
  subjects: Subject[];
  workingAreas: WorkingArea[];
  userRole: UserRole;
  onRefresh: () => void;
}

export const MasterDataView: React.FC<MasterDataViewProps> = ({
  students,
  tutors,
  parents,
  subjects,
  workingAreas,
  userRole,
  onRefresh
}) => {
  if (userRole === 'TENTOR') {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-3">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
        <h3 className="text-base font-bold text-slate-900">Akses Terbatas: Data Master Khusus Manajemen</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Sebagai Tentor, Anda hanya dapat melihat data siswa yang Anda ajar secara langsung melalui menu <strong>Penjadwalan</strong> atau <strong>Absensi & Selfie</strong>.
        </p>
      </div>
    );
  }

  const [subTab, setSubTab] = useState<'students' | 'tutors' | 'parents' | 'subjects' | 'areas'>('students');
  const [search, setSearch] = useState('');

  // Modal states
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [showTutorModal, setShowTutorModal] = useState(false);
  const [editingTutor, setEditingTutor] = useState<Tutor | null>(null);

  // Quick Quota Revision Modal state
  const [quickQuotaStudent, setQuickQuotaStudent] = useState<Student | null>(null);
  const [quickTotalSessions, setQuickTotalSessions] = useState<number>(10);
  const [quickRemainingSessions, setQuickRemainingSessions] = useState<number>(10);
  const [isResettingAllQuotas, setIsResettingAllQuotas] = useState(false);

  const handleResetAllQuotasTo10 = async () => {
    if (window.confirm('Apakah Anda yakin ingin mengatur ulang kuota paket SELURUH siswa menjadi 10 Pertemuan?')) {
      setIsResettingAllQuotas(true);
      try {
        await resetAllStudentsQuotaTo10();
        alert('Berhasil! Seluruh siswa telah disetting kuota paketnya menjadi 10 Pertemuan.');
        onRefresh();
      } catch (err) {
        alert('Gagal memperbarui kuota siswa.');
      } finally {
        setIsResettingAllQuotas(false);
      }
    }
  };

  // Student form state
  const [studentForm, setStudentForm] = useState({
    name: '',
    gender: 'Laki-laki' as 'Laki-laki' | 'Perempuan',
    grade: 'SD' as GradeLevel,
    className: 'Kelas 5',
    school: 'SDN 01',
    address: 'Jl. Utama',
    parentName: 'Orang Tua',
    parentWA: '081234567890',
    subjects: 'Matematika, IPA',
    totalPackageSessions: 10,
    remainingSessions: 10,
    packageStartDate: new Date().toISOString().substring(0, 10),
    packageEndDate: new Date(Date.now() + 90 * 86400000).toISOString().substring(0, 10),
    ratePerSession: 40000,
    managementMarginNominal: 10000,
    status: 'Aktif' as 'Aktif' | 'Nonaktif' | 'Arsip'
  });

  // Tutor form state
  const [tutorForm, setTutorForm] = useState({
    name: '',
    gender: 'Laki-laki' as 'Laki-laki' | 'Perempuan',
    address: '',
    wa: '',
    subjects: 'Matematika, Fisika',
    gradesMastered: ['SD', 'SMP', 'SMA'] as GradeLevel[],
    ratePerSession: 75000,
    workingArea: 'Jakarta Selatan, Depok',
    workingHours: 'Senin 14:00-18:00, Rabu 14:00-18:00',
    salarySystem: 'Per Pertemuan' as any,
    status: 'Aktif' as any,
    maxHoursPerDay: 4,
    maxHoursPerWeek: 20,
    maxStudents: 6,
    evaluationNotes: '',
    username: '',
    password: 'tentor123',
    createAccount: true
  });

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num || 0);
  };

  const handleCreateNewStudentClick = () => {
    setEditingStudent(null);
    setStudentForm({
      name: '',
      gender: 'Laki-laki',
      grade: 'SD',
      className: 'Kelas 5',
      school: '',
      address: '',
      parentName: '',
      parentWA: '',
      subjects: 'Matematika, IPA',
      totalPackageSessions: 10,
      remainingSessions: 10,
      packageStartDate: new Date().toISOString().substring(0, 10),
      packageEndDate: new Date(Date.now() + 30 * 86400000).toISOString().substring(0, 10),
      ratePerSession: 40000,
      managementMarginNominal: 10000,
      status: 'Aktif'
    });
    setShowStudentModal(true);
  };

  const handleOpenQuickQuotaModal = (s: Student) => {
    setQuickQuotaStudent(s);
    setQuickTotalSessions(s.totalPackageSessions || 10);
    setQuickRemainingSessions(s.remainingSessions !== undefined ? s.remainingSessions : 10);
  };

  const handleSaveQuickQuota = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickQuotaStudent) return;

    const newTotal = Number(quickTotalSessions);
    const newRem = Number(quickRemainingSessions);

    const payload = {
      ...quickQuotaStudent,
      totalPackageSessions: newTotal,
      remainingSessions: newRem,
      packageStatus: (newRem <= 0 ? 'Habis' : newRem <= 2 ? 'Hampir Habis' : 'Aktif') as PackageStatus
    };

    try {
      await saveStudentData(payload);
      setQuickQuotaStudent(null);
      alert(`Berhasil merevisi kuota untuk ${quickQuotaStudent.name}! (Sisa Kuota: ${newRem} / ${newTotal})`);
      onRefresh();
    } catch (err) {
      alert('Gagal memperbarui kuota siswa');
    }
  };

  // Save Student
  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      id: editingStudent ? editingStudent.id : undefined,
      ...studentForm,
      subjects: studentForm.subjects.split(',').map(s => s.trim()).filter(Boolean),
      ratePerSession: Number(studentForm.ratePerSession),
      managementMarginNominal: Number(studentForm.managementMarginNominal || 10000),
      totalPackageSessions: Number(studentForm.totalPackageSessions),
      remainingSessions: Number(studentForm.remainingSessions),
      packageStatus: (studentForm.remainingSessions <= 0 ? 'Habis' : studentForm.remainingSessions <= 2 ? 'Hampir Habis' : 'Aktif') as PackageStatus
    };

    try {
      await saveStudentData(payload);
      setShowStudentModal(false);
      setEditingStudent(null);
      onRefresh();
    } catch (err) {
      alert('Gagal menyimpan data siswa');
    }
  };

  const handleEditStudentClick = (s: Student) => {
    setEditingStudent(s);
    setStudentForm({
      name: s.name,
      gender: s.gender,
      grade: s.grade,
      className: s.className,
      school: s.school,
      address: s.address,
      parentName: s.parentName,
      parentWA: s.parentWA,
      subjects: s.subjects.join(', '),
      totalPackageSessions: s.totalPackageSessions !== undefined ? s.totalPackageSessions : 10,
      remainingSessions: s.remainingSessions !== undefined ? s.remainingSessions : 10,
      packageStartDate: s.packageStartDate,
      packageEndDate: s.packageEndDate,
      ratePerSession: s.ratePerSession,
      managementMarginNominal: s.managementMarginNominal !== undefined ? s.managementMarginNominal : 10000,
      status: s.status
    });
    setShowStudentModal(true);
  };

  // Deleting item states
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);
  const [deletingTutor, setDeletingTutor] = useState<Tutor | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDeleteStudent = async () => {
    if (!deletingStudent) return;
    setIsDeleting(true);
    try {
      await deleteStudentData(deletingStudent.id);
      setDeletingStudent(null);
      onRefresh();
    } catch (err) {
      alert('Gagal menghapus siswa');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConfirmDeleteTutor = async () => {
    if (!deletingTutor) return;
    setIsDeleting(true);
    try {
      await deleteTutorData(deletingTutor.id);
      setDeletingTutor(null);
      onRefresh();
    } catch (err) {
      alert('Gagal menghapus tentor');
    } finally {
      setIsDeleting(false);
    }
  };

  // Save Tutor
  const handleSaveTutor = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = tutorForm.username.trim() || ('tentor_' + tutorForm.name.toLowerCase().split(' ')[0].replace(/[^a-z0-9]/g, ''));
    
    const payload = {
      id: editingTutor ? editingTutor.id : undefined,
      ...tutorForm,
      username: cleanUsername,
      password: tutorForm.password.trim() || 'tentor123',
      subjects: tutorForm.subjects.split(',').map(s => s.trim()).filter(Boolean),
      workingArea: tutorForm.workingArea.split(',').map(s => s.trim()).filter(Boolean),
      workingHours: tutorForm.workingHours.split(',').map(s => s.trim()).filter(Boolean),
      ratePerSession: Number(tutorForm.ratePerSession),
      maxHoursPerDay: Number(tutorForm.maxHoursPerDay),
      maxHoursPerWeek: Number(tutorForm.maxHoursPerWeek),
      maxStudents: Number(tutorForm.maxStudents),
      averageRating: editingTutor ? editingTutor.averageRating : 4.9,
      totalRatings: editingTutor ? editingTutor.totalRatings : 10
    };

    try {
      await saveTutorData(payload);

      if (!editingTutor && tutorForm.createAccount) {
        alert(`Data Tentor & Akun Hak Akses berhasil disimpan!\n\nCredential Login Tentor:\n• Username: ${cleanUsername}\n• Password: ${payload.password}`);
      }

      setShowTutorModal(false);
      setEditingTutor(null);
      onRefresh();
    } catch (err) {
      alert('Gagal menyimpan data tentor');
    }
  };

  const handleEditTutorClick = (t: Tutor) => {
    setEditingTutor(t);
    setTutorForm({
      name: t.name,
      gender: t.gender,
      address: t.address,
      wa: t.wa,
      subjects: t.subjects.join(', '),
      gradesMastered: t.gradesMastered,
      ratePerSession: t.ratePerSession,
      workingArea: t.workingArea.join(', '),
      workingHours: t.workingHours.join(', '),
      salarySystem: t.salarySystem,
      status: t.status,
      maxHoursPerDay: t.maxHoursPerDay,
      maxHoursPerWeek: t.maxHoursPerWeek,
      maxStudents: t.maxStudents,
      evaluationNotes: t.evaluationNotes || ''
    });
    setShowTutorModal(true);
  };

  const handleDeleteTutor = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data tentor ini?')) return;
    try {
      await deleteTutorData(id);
      onRefresh();
    } catch (err) {
      alert('Gagal menghapus tentor');
    }
  };

  return (
    <div className="space-y-6">
      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-2 rounded-2xl border border-slate-200">
        <div className="flex flex-wrap items-center gap-1">
          <button
            onClick={() => setSubTab('students')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              subTab === 'students' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Siswa ({students.length})</span>
          </button>
          <button
            onClick={() => setSubTab('tutors')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              subTab === 'tutors' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Tentor ({tutors.length})</span>
          </button>
          <button
            onClick={() => setSubTab('parents')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              subTab === 'parents' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Orang Tua ({parents.length})</span>
          </button>
          <button
            onClick={() => setSubTab('subjects')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              subTab === 'subjects' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Mata Pelajaran ({subjects.length})</span>
          </button>
          <button
            onClick={() => setSubTab('areas')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              subTab === 'areas' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Wilayah Kerja ({workingAreas.length})</span>
          </button>
        </div>

        {/* Action Button for adding */}
        {subTab === 'students' && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleResetAllQuotasTo10}
              disabled={isResettingAllQuotas}
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
              title="Setel ulang seluruh kuota murid menjadi 10 pertemuan"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isResettingAllQuotas ? 'animate-spin' : ''}`} />
              <span>Standarkan Kuota Semua Murid (10 Pertemuan)</span>
            </button>
            <button
              onClick={handleCreateNewStudentClick}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Tambah Siswa Baru
            </button>
          </div>
        )}

        {subTab === 'tutors' && (
          <button
            onClick={() => {
              setEditingTutor(null);
              setShowTutorModal(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Tambah Tentor Baru
          </button>
        )}
      </div>

      {/* SEARCH BAR */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder={`Cari ${subTab}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        />
      </div>

      {/* VIEW: STUDENTS TABLE */}
      {subTab === 'students' && (
        <div className="space-y-4">
          {/* BANNER PENJELASAN ATURAN KUOTA FLEKSIBEL */}
          <div className="bg-amber-50/90 border border-amber-200/90 p-3.5 rounded-2xl text-xs text-amber-950 flex items-start gap-3 shadow-2xs">
            <Zap className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 fill-amber-500" />
            <div className="space-y-1">
              <div className="font-extrabold text-amber-950 text-xs">Penetapan &amp; Revisi Kuota Pertemuan Murid (Aturan Bebas Admin):</div>
              <p className="text-[11px] text-amber-900/90 leading-relaxed">
                Secara standar bawaan sistem, setiap murid memiliki <strong>10 Pertemuan/Bulan</strong>. Namun Admin bebas menentukan kuota khusus sejak pendaftaran (misal 8, 12, atau 16 pertemuan) atau merevisi kuota kapan saja saat proses belajar berjalan jika murid meminta jam les tambahan rutin. Gunakan tombol <strong className="bg-amber-100 text-amber-950 px-1.5 py-0.5 rounded border border-amber-300">Revisi Kuota</strong> pada baris siswa untuk mereset atau menambah kuota secara instan.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Nama Siswa</th>
                    <th className="p-3.5">Jenjang / Kelas</th>
                    <th className="p-3.5">Wali & Kontak</th>
                    <th className="p-3.5">Mata Pelajaran</th>
                    <th className="p-3.5 bg-indigo-50/50 text-indigo-900 font-bold">Tarif SPP (Per Pertemuan)</th>
                    <th className="p-3.5 bg-emerald-50/50 text-emerald-900 font-bold">Fee Admin (Nominal)</th>
                    <th className="p-3.5 bg-amber-50/50 text-amber-900 font-bold">Sisa Kuota Belajar</th>
                    <th className="p-3.5">Status Paket</th>
                    <th className="p-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students
                    .filter(s => s.name.toLowerCase().includes(search.toLowerCase()))
                    .map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5 font-bold text-slate-900">
                          {s.name}
                          <div className="text-[11px] font-normal text-slate-400">{s.school}</div>
                        </td>
                        <td className="p-3.5">
                          <span className="bg-slate-100 text-slate-800 font-semibold px-2 py-0.5 rounded-md">
                            {s.grade}
                          </span>
                          <div className="text-[11px] text-slate-500 mt-0.5">{s.className}</div>
                        </td>
                        <td className="p-3.5">
                          <div className="font-medium text-slate-800">{s.parentName}</div>
                          <div className="text-[11px] text-emerald-600 flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {s.parentWA}
                          </div>
                        </td>
                        <td className="p-3.5">
                          <div className="flex flex-wrap gap-1">
                            {s.subjects.map((subj, i) => (
                              <span key={i} className="bg-indigo-50 text-indigo-700 text-[10px] font-medium px-2 py-0.5 rounded-full border border-indigo-100">
                                {subj}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-3.5 bg-indigo-50/30 font-extrabold text-indigo-900">
                          {formatRupiah(s.ratePerSession)}
                        </td>
                        <td className="p-3.5 bg-emerald-50/30 font-extrabold text-emerald-900">
                          {formatRupiah(s.managementMarginNominal || 10000)}
                        </td>
                        <td className="p-3.5 bg-amber-50/20 font-extrabold text-amber-950">
                          {s.remainingSessions} / {s.totalPackageSessions} Kuota
                        </td>
                        <td className="p-3.5">
                          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                            s.packageStatus === 'Aktif' ? 'bg-emerald-100 text-emerald-800' :
                            s.packageStatus === 'Hampir Habis' ? 'bg-amber-100 text-amber-800 animate-pulse' :
                            'bg-rose-100 text-rose-800'
                          }`}>
                            {s.packageStatus}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenQuickQuotaModal(s)}
                              className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-[11px] font-bold px-2.5 py-1.5 rounded-xl flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-2xs"
                              title="Revisi & Atur Kuota Pertemuan Siswa"
                            >
                              <Zap className="w-3.5 h-3.5 fill-amber-600 text-amber-700 shrink-0" />
                              <span>Revisi Kuota</span>
                            </button>
                            <button
                              onClick={() => handleEditStudentClick(s)}
                              className="p-1.5 text-slate-600 hover:text-indigo-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                              title="Edit Lengkap Siswa"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletingStudent(s)}
                              className="p-1.5 text-slate-600 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                              title="Hapus Data Siswa"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: TUTORS TABLE */}
      {subTab === 'tutors' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Nama Tentor</th>
                  <th className="p-3.5">Mata Pelajaran</th>
                  <th className="p-3.5">Jenjang Kuasai</th>
                  <th className="p-3.5">Wilayah Kerja</th>
                  <th className="p-3.5">Rating</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tutors
                  .filter(t => t.name.toLowerCase().includes(search.toLowerCase()))
                  .map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 font-bold text-slate-900">
                        {t.name}
                        <div className="text-[11px] text-emerald-600">{t.wa}</div>
                      </td>
                      <td className="p-3.5">
                        <div className="flex flex-wrap gap-1">
                          {t.subjects.map((sb, i) => (
                            <span key={i} className="bg-purple-50 text-purple-700 text-[10px] font-medium px-2 py-0.5 rounded-full border border-purple-100">
                              {sb}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="flex flex-wrap gap-1">
                          {t.gradesMastered.map((g, i) => (
                            <span key={i} className="bg-slate-100 text-slate-800 text-[10px] font-semibold px-2 py-0.5 rounded-md">
                              {g}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-700">{t.workingArea.join(', ')}</td>
                      <td className="p-3.5 font-bold text-amber-600">
                        ★ {t.averageRating} ({t.totalRatings})
                      </td>
                      <td className="p-3.5">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          t.status === 'Aktif' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-2">
                        <button
                          onClick={() => handleEditTutorClick(t)}
                          className="p-1.5 text-slate-600 hover:text-indigo-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingTutor(t)}
                          className="p-1.5 text-slate-600 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                          title="Hapus Data Tentor"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: PARENTS TABLE */}
      {subTab === 'parents' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {parents.map((p) => (
              <div key={p.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-900">{p.name}</div>
                <div className="text-xs text-emerald-600 font-medium mt-1">WA: {p.wa}</div>
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <Home className="w-3.5 h-3.5" /> {p.address}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW: SUBJECTS & WORKING AREAS */}
      {subTab === 'subjects' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {subjects.map((sb) => (
              <div key={sb.id} className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 flex items-center justify-between">
                <div>
                  <div className="font-bold text-indigo-950 text-xs">{sb.name}</div>
                  <div className="text-[10px] text-indigo-600">Jenjang {sb.grade}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {subTab === 'areas' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {workingAreas.map((wa) => (
              <div key={wa.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 text-xs">{wa.name}</div>
                  <div className="text-[10px] text-slate-500">Kode Pos: {wa.postcode}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT STUDENT */}
      {showStudentModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
              {editingStudent ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}
            </h3>
            <form onSubmit={handleSaveStudent} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Nama Lengkap Siswa</label>
                  <input
                    type="text"
                    required
                    value={studentForm.name}
                    onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Jenis Kelamin</label>
                  <select
                    value={studentForm.gender}
                    onChange={(e) => setStudentForm({ ...studentForm, gender: e.target.value as any })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Jenjang Pendidikan</label>
                  <select
                    value={studentForm.grade}
                    onChange={(e) => setStudentForm({ ...studentForm, grade: e.target.value as any })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="PAUD">PAUD</option>
                    <option value="TK Kecil">TK Kecil</option>
                    <option value="TK Besar">TK Besar</option>
                    <option value="SD">SD</option>
                    <option value="SMP">SMP</option>
                    <option value="SMA">SMA</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Kelas & Sekolah</label>
                  <input
                    type="text"
                    placeholder="Contoh: Kelas 5, SDN Menteng 01"
                    value={studentForm.className}
                    onChange={(e) => setStudentForm({ ...studentForm, className: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-600 font-semibold mb-1">Alamat Rumah Lengkap</label>
                  <input
                    type="text"
                    value={studentForm.address}
                    onChange={(e) => setStudentForm({ ...studentForm, address: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Nama Wali / Orang Tua</label>
                  <input
                    type="text"
                    required
                    value={studentForm.parentName}
                    onChange={(e) => setStudentForm({ ...studentForm, parentName: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Nomor WhatsApp Orang Tua</label>
                  <input
                    type="text"
                    required
                    value={studentForm.parentWA}
                    onChange={(e) => setStudentForm({ ...studentForm, parentWA: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                {/* TARIF PER PERTEMUAN (NOMOR PENTING) */}
                <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-200">
                  <label className="block text-indigo-950 font-bold mb-1">
                    Tarif SPP Per Pertemuan (Wali Murid)
                  </label>
                  <p className="text-[11px] text-indigo-700 mb-2">
                    SPP per pertemuan (SD: 40rb, SMP: 50rb, SMA: 60rb).
                  </p>
                  <input
                    type="number"
                    required
                    value={studentForm.ratePerSession}
                    onChange={(e) => setStudentForm({ ...studentForm, ratePerSession: Number(e.target.value) })}
                    className="w-full bg-white border border-indigo-300 rounded-xl p-2.5 font-bold text-indigo-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                {/* DEFAULT FEE ADMIN NOMINAL (KHUSUS SISWA INI) */}
                <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                  <label className="block text-emerald-950 font-bold mb-1">
                    Default Fee Admin Bimbel (Potongan Admin)
                  </label>
                  <p className="text-[11px] text-emerald-800 mb-2">
                    Fee admin default per sesi (misal: 5.000, 7.000, dst). Honor Tentor = SPP - Fee Admin.
                  </p>
                  <input
                    type="number"
                    required
                    value={studentForm.managementMarginNominal}
                    onChange={(e) => setStudentForm({ ...studentForm, managementMarginNominal: Number(e.target.value) })}
                    className="w-full bg-white border border-emerald-300 rounded-xl p-2.5 font-bold text-emerald-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-extrabold"
                  />
                </div>

                {/* PENGATURAN KUOTA PERTEMUAN (ATURAN BEBAS ADMIN) */}
                <div className="sm:col-span-2 bg-amber-50/70 p-4 rounded-2xl border border-amber-200/90 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-700 fill-amber-700" />
                      <span className="font-extrabold text-amber-950 text-xs">Pengaturan Kuota Pertemuan (Aturan Bebas Admin)</span>
                    </div>
                    <span className="text-[10px] bg-amber-200/80 text-amber-900 font-bold px-2 py-0.5 rounded-full border border-amber-300">
                      Fleksibel Bebas Ditentukan
                    </span>
                  </div>

                  <p className="text-[11px] text-amber-900/90 leading-relaxed">
                    <strong>Ketentuan Kuota:</strong> Standar sistem adalah <strong>10 Pertemuan/Bulan</strong>. Namun jika murid dari awal pendaftaran minta kuota lebih/kurang (misal 8, 12, 14, 16) atau saat pembelajaran berjalan minta tambahan kuota rutin tiap bulan, Admin bebas merevisi dan menentukan nilainya di sini.
                  </p>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1 text-[11px]">Pilih Preset Kuota Bulanan Murid:</label>
                    <div className="flex flex-wrap gap-1.5">
                      {[8, 10, 12, 14, 16, 20].map((amt) => (
                        <button
                          type="button"
                          key={amt}
                          onClick={() => setStudentForm({
                            ...studentForm,
                            totalPackageSessions: amt,
                            remainingSessions: amt
                          })}
                          className={`px-3 py-1.5 rounded-xl font-bold text-[11px] border transition-all cursor-pointer ${
                            studentForm.totalPackageSessions === amt
                              ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {amt === 10 ? '10 Kuota (Standar)' : `${amt} Kuota`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-slate-800 font-bold mb-1">Total Kuota Paket (Per Bulan / Periode)</label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={studentForm.totalPackageSessions}
                        onChange={(e) => setStudentForm({ ...studentForm, totalPackageSessions: Number(e.target.value) })}
                        className="w-full bg-white border border-amber-300 rounded-xl p-2.5 font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-slate-800 font-bold">Sisa Kuota Belajar Saat Ini</label>
                        <button
                          type="button"
                          onClick={() => setStudentForm({ ...studentForm, remainingSessions: studentForm.totalPackageSessions })}
                          className="text-[10px] text-amber-800 font-extrabold hover:underline cursor-pointer"
                        >
                          Reset = Total ({studentForm.totalPackageSessions})
                        </button>
                      </div>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={studentForm.remainingSessions}
                        onChange={(e) => setStudentForm({ ...studentForm, remainingSessions: Number(e.target.value) })}
                        className="w-full bg-white border border-amber-300 rounded-xl p-2.5 font-bold text-amber-950 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-600 font-semibold mb-1">Mata Pelajaran (pisahkan dengan koma)</label>
                  <input
                    type="text"
                    placeholder="Contoh: Matematika, Bahasa Inggris"
                    value={studentForm.subjects}
                    onChange={(e) => setStudentForm({ ...studentForm, subjects: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowStudentModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 cursor-pointer shadow-sm"
                >
                  Simpan Data Siswa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT TUTOR */}
      {showTutorModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
              {editingTutor ? 'Edit Data Tentor' : 'Tambah Tentor Baru'}
            </h3>
            <form onSubmit={handleSaveTutor} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Nama Lengkap & Gelar</label>
                  <input
                    type="text"
                    required
                    value={tutorForm.name}
                    onChange={(e) => setTutorForm({ ...tutorForm, name: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Nomor WhatsApp</label>
                  <input
                    type="text"
                    required
                    value={tutorForm.wa}
                    onChange={(e) => setTutorForm({ ...tutorForm, wa: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-600 font-semibold mb-1">Alamat Lengkap</label>
                  <input
                    type="text"
                    value={tutorForm.address}
                    onChange={(e) => setTutorForm({ ...tutorForm, address: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Mata Pelajaran (koma)</label>
                  <input
                    type="text"
                    value={tutorForm.subjects}
                    onChange={(e) => setTutorForm({ ...tutorForm, subjects: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Wilayah Kerja (koma)</label>
                  <input
                    type="text"
                    value={tutorForm.workingArea}
                    onChange={(e) => setTutorForm({ ...tutorForm, workingArea: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-600 font-semibold mb-1">Jam Kerja Ketersediaan (koma)</label>
                  <input
                    type="text"
                    placeholder="Contoh: Senin 13:00-18:00, Rabu 13:00-18:00"
                    value={tutorForm.workingHours}
                    onChange={(e) => setTutorForm({ ...tutorForm, workingHours: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                {/* LOGIN CREDENTIAL SECTION FOR NEW TUTORS */}
                {!editingTutor && (
                  <div className="sm:col-span-2 bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-900 text-xs flex items-center gap-1.5">
                        <UserCheck className="w-4 h-4 text-emerald-600" /> Akun Login Hak Akses Tentor Baru
                      </span>
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs text-emerald-800 font-medium">
                        <input
                          type="checkbox"
                          checked={tutorForm.createAccount}
                          onChange={(e) => setTutorForm({ ...tutorForm, createAccount: e.target.checked })}
                          className="rounded text-emerald-600"
                        />
                        Terbitkan Akun Login
                      </label>
                    </div>

                    {tutorForm.createAccount && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Username Login Tentor</label>
                          <input
                            type="text"
                            placeholder="e.g. tentor_fauzi"
                            value={tutorForm.username}
                            onChange={(e) => setTutorForm({ ...tutorForm, username: e.target.value })}
                            className="w-full bg-white border border-emerald-300 rounded-lg p-2 font-mono font-bold text-slate-800"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Password Default</label>
                          <input
                            type="text"
                            placeholder="e.g. tentor123"
                            value={tutorForm.password}
                            onChange={(e) => setTutorForm({ ...tutorForm, password: e.target.value })}
                            className="w-full bg-white border border-emerald-300 rounded-lg p-2 font-mono font-bold text-emerald-700"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTutorModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 cursor-pointer shadow-sm"
                >
                  Simpan Data Tentor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL CONFIRM DELETE STUDENT */}
      {deletingStudent && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-rose-100 rounded-xl text-rose-600">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">Konfirmasi Hapus Data Siswa</h3>
                  <p className="text-[11px] text-slate-500">Hapus permanen dari Master Data Siswa</p>
                </div>
              </div>
              <button
                onClick={() => setDeletingStudent(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="text-slate-500">Siswa yang akan dihapus:</div>
              <div className="font-bold text-slate-900 text-sm">{deletingStudent.name}</div>
              <div className="text-slate-600">Jenjang: {deletingStudent.grade} | Wali: {deletingStudent.parentName} ({deletingStudent.parentWA})</div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setDeletingStudent(null)}
                disabled={isDeleting}
                className="px-4 py-2 border border-slate-300 text-slate-600 rounded-xl font-bold cursor-pointer hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteStudent}
                disabled={isDeleting}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeleting ? 'Menghapus...' : 'Ya, Hapus Data Siswa'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIRM DELETE TUTOR */}
      {deletingTutor && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-rose-100 rounded-xl text-rose-600">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">Konfirmasi Hapus Data Tentor</h3>
                  <p className="text-[11px] text-slate-500">Hapus permanen dari Master Data Tentor</p>
                </div>
              </div>
              <button
                onClick={() => setDeletingTutor(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="text-slate-500">Tentor yang akan dihapus:</div>
              <div className="font-bold text-slate-900 text-sm">{deletingTutor.name}</div>
              <div className="text-emerald-700 font-semibold">WA: {deletingTutor.wa}</div>
              <div className="text-slate-600">Mata Pelajaran: {deletingTutor.subjects?.join(', ')}</div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setDeletingTutor(null)}
                disabled={isDeleting}
                className="px-4 py-2 border border-slate-300 text-slate-600 rounded-xl font-bold cursor-pointer hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteTutor}
                disabled={isDeleting}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeleting ? 'Menghapus...' : 'Ya, Hapus Data Tentor'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REVISI & ATUR KUOTA PERTEMUAN SISWA */}
      {quickQuotaStudent && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-amber-100 text-amber-800 rounded-2xl border border-amber-200">
                  <Zap className="w-5 h-5 fill-amber-700" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Revisi &amp; Atur Kuota Murid</h3>
                  <p className="text-xs text-slate-500">{quickQuotaStudent.name} ({quickQuotaStudent.grade})</p>
                </div>
              </div>
              <button
                onClick={() => setQuickQuotaStudent(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl cursor-pointer hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuickQuota} className="space-y-4 text-xs mt-4">
              <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200 text-amber-950 text-[11px] leading-relaxed space-y-1">
                <div className="font-extrabold flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 fill-amber-600 text-amber-700" /> Aturan Kuota Fleksibel Admin:
                </div>
                <p>
                  Secara standar, kuota murid adalah <strong>10 Pertemuan/Bulan</strong>. Namun jika murid meminta kuota khusus (seperti 8, 12, 14, 16) atau meminta tambahan jam les pertengahan bulan, Admin dapat merevisi langsung di sini.
                </p>
              </div>

              {/* Quick Actions / Presets */}
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Preset Kuota Bulanan Siswa:</label>
                <div className="grid grid-cols-3 gap-2">
                  {[8, 10, 12, 14, 16, 20].map((amt) => (
                    <button
                      type="button"
                      key={amt}
                      onClick={() => {
                        setQuickTotalSessions(amt);
                        setQuickRemainingSessions(amt);
                      }}
                      className={`py-2 rounded-xl font-extrabold text-[11px] border transition-all cursor-pointer ${
                        quickTotalSessions === amt
                          ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {amt === 10 ? '10 Kuota (Standar)' : `${amt} Pertemuan`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tambah Kuota Cepat */}
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Tambah Sisa Kuota Cepat:</label>
                <div className="flex flex-wrap gap-1.5">
                  {[+2, +4, +8, +10].map((addAmt) => (
                    <button
                      type="button"
                      key={addAmt}
                      onClick={() => setQuickRemainingSessions(prev => prev + addAmt)}
                      className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold px-3 py-1.5 rounded-xl border border-emerald-200 cursor-pointer active:scale-95 transition-all text-[11px]"
                    >
                      +{addAmt} Sisa Pertemuan
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setQuickRemainingSessions(quickTotalSessions)}
                    className="bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-bold px-3 py-1.5 rounded-xl border border-indigo-200 cursor-pointer active:scale-95 transition-all text-[11px]"
                  >
                    Reset Sisa = Total ({quickTotalSessions})
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Total Kuota Paket</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={quickTotalSessions}
                    onChange={(e) => setQuickTotalSessions(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Sisa Kuota Belajar</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={quickRemainingSessions}
                    onChange={(e) => setQuickRemainingSessions(Number(e.target.value))}
                    className="w-full border border-amber-300 rounded-xl p-2.5 font-extrabold text-amber-950 focus:ring-2 focus:ring-amber-500 focus:outline-none bg-amber-50/50"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setQuickQuotaStudent(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl cursor-pointer shadow-md flex items-center gap-1.5 active:scale-95"
                >
                  <Zap className="w-4 h-4 fill-slate-950" />
                  <span>Simpan Revisi Kuota</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
