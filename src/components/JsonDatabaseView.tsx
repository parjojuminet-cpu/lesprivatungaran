import React, { useState } from 'react';
import {
  Student, Tutor, Parent, Subject, WorkingArea, Schedule,
  Attendance, Invoice, Finance, TutorSalary, Module, Approval, AuditLog
} from '../types';
import {
  Database, Search, RefreshCw, Download, FileSpreadsheet,
  Printer, Upload, Code, Table, Eye, CheckCircle2, Copy,
  Check, FileJson, Layers, ShieldCheck, Sparkles, X, Pencil, Trash2, Save, AlertTriangle
} from 'lucide-react';
import {
  exportDatabaseToJson,
  importDatabaseFromJson,
  resetDatabaseToDefaultJson,
  loadErpJsonDatabase,
  saveErpJsonDatabase
} from '../services/jsonStorage';
import { saveToFirestore } from '../services/firestoreService';
import {
  exportDatabaseToExcelXls,
  exportPrintablePDFReport,
  exportTableToCSV
} from '../services/exportUtils';

interface JsonDatabaseViewProps {
  students: Student[];
  tutors: Tutor[];
  parents: Parent[];
  subjects: Subject[];
  workingAreas: WorkingArea[];
  schedules: Schedule[];
  attendances: Attendance[];
  invoices: Invoice[];
  finance: Finance[];
  salaries: TutorSalary[];
  approvals: Approval[];
  modules: Module[];
  auditLogs: AuditLog[];
  onRefresh: () => void;
}

type TableTabKey =
  | 'students'
  | 'tutors'
  | 'parents'
  | 'subjects'
  | 'workingAreas'
  | 'schedules'
  | 'attendances'
  | 'invoices'
  | 'finance'
  | 'salaries'
  | 'approvals'
  | 'modules'
  | 'auditLogs';

export const JsonDatabaseView: React.FC<JsonDatabaseViewProps> = ({
  students,
  tutors,
  parents,
  subjects,
  workingAreas,
  schedules,
  attendances,
  invoices,
  finance,
  salaries,
  approvals,
  modules,
  auditLogs,
  onRefresh
}) => {
  const [activeViewMode, setActiveViewMode] = useState<'tables' | 'json_inspector'>('tables');
  const [activeTable, setActiveTable] = useState<TableTabKey>('students');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSelfieUrl, setSelectedSelfieUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [jsonScope, setJsonScope] = useState<'ALL' | TableTabKey>('ALL');

  // Edit item state
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [editingTableKey, setEditingTableKey] = useState<TableTabKey | null>(null);
  const [editingJsonText, setEditingJsonText] = useState<string>('');

  // Editable Raw JSON state
  const [rawJsonEditing, setRawJsonEditing] = useState<string>('');
  const [isRawJsonModified, setIsRawJsonModified] = useState<boolean>(false);

  const formatRupiah = (num?: number) => {
    if (num === undefined || num === null) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num);
  };

  const handleDeleteItem = async (tableKey: TableTabKey, itemId: string, itemTitle?: string) => {
    const title = itemTitle || itemId;
    if (!window.confirm(`Apakah Anda yakin ingin menghapus data "${title}" dari tabel ${tableKey}?`)) {
      return;
    }

    try {
      const fullDb = loadErpJsonDatabase();
      const currentList = (fullDb as any)[tableKey] || [];
      const updatedList = currentList.filter((item: any) => item.id !== itemId);

      const updatedDb = {
        ...fullDb,
        [tableKey]: updatedList
      };

      saveErpJsonDatabase(updatedDb);
      await saveToFirestore(updatedDb);

      try {
        let endpoint = '';
        if (tableKey === 'students') endpoint = `/api/students/${itemId}`;
        else if (tableKey === 'tutors') endpoint = `/api/tutors/${itemId}`;
        else if ((tableKey as string) === 'users') endpoint = `/api/users/${itemId}`;

        if (endpoint) {
          await fetch(endpoint, { method: 'DELETE' });
        }
      } catch (e) {
        console.warn('API delete call notice:', e);
      }

      onRefresh();
    } catch (err: any) {
      alert('Gagal menghapus data: ' + err.message);
    }
  };

  const handleOpenEditModal = (tableKey: TableTabKey, item: any) => {
    setEditingTableKey(tableKey);
    setEditingItem(item);
    setEditingJsonText(JSON.stringify(item, null, 2));
  };

  const handleSaveEditedItem = async () => {
    if (!editingTableKey || !editingItem) return;
    try {
      const parsedItem = JSON.parse(editingJsonText);
      if (!parsedItem.id) {
        alert('Objek harus memiliki properti "id".');
        return;
      }

      const fullDb = loadErpJsonDatabase();
      const currentList = (fullDb as any)[editingTableKey] || [];
      const itemIndex = currentList.findIndex((it: any) => it.id === parsedItem.id);

      let updatedList = [...currentList];
      if (itemIndex !== -1) {
        updatedList[itemIndex] = parsedItem;
      } else {
        updatedList.unshift(parsedItem);
      }

      const updatedDb = {
        ...fullDb,
        [editingTableKey]: updatedList
      };

      saveErpJsonDatabase(updatedDb);
      await saveToFirestore(updatedDb);
      setEditingItem(null);
      setEditingTableKey(null);
      onRefresh();
      alert('Perubahan data berhasil disimpan!');
    } catch (err: any) {
      alert('Format JSON item tidak valid: ' + err.message);
    }
  };

  const tableTabs: { key: TableTabKey; label: string; count: number; icon: string }[] = [
    { key: 'students', label: '1. Siswa', count: students.length, icon: '👨‍🎓' },
    { key: 'tutors', label: '2. Tentor', count: tutors.length, icon: '👨‍🏫' },
    { key: 'parents', label: '3. Orang Tua', count: parents.length, icon: '👪' },
    { key: 'subjects', label: '4. Mapel', count: subjects.length, icon: '📚' },
    { key: 'workingAreas', label: '5. Wilayah', count: workingAreas.length, icon: '📍' },
    { key: 'schedules', label: '6. Jadwal', count: schedules.length, icon: '📅' },
    { key: 'attendances', label: '7. Absensi & Selfie', count: attendances.length, icon: '📸' },
    { key: 'invoices', label: '8. Tagihan SPP', count: invoices.length, icon: '🧾' },
    { key: 'finance', label: '9. Keuangan', count: finance.length, icon: '💵' },
    { key: 'salaries', label: '10. Gaji Tentor', count: salaries.length, icon: '💸' },
    { key: 'approvals', label: '11. Persetujuan', count: approvals.length, icon: '✅' },
    { key: 'modules', label: '12. Modul Belajar', count: modules.length, icon: '📖' },
    { key: 'auditLogs', label: '13. Audit Log', count: auditLogs.length, icon: '🛡️' }
  ];

  const currentTabInfo = tableTabs.find(t => t.key === activeTable);

  // Helper map for Student/Tutor names
  const studentMap = new Map(students.map(s => [s.id, s.name]));
  const tutorMap = new Map(tutors.map(t => [t.id, t.name]));

  // Get current active table data array
  const getCurrentTableData = () => {
    switch (activeTable) {
      case 'students': return students;
      case 'tutors': return tutors;
      case 'parents': return parents;
      case 'subjects': return subjects;
      case 'workingAreas': return workingAreas;
      case 'schedules': return schedules;
      case 'attendances': return attendances;
      case 'invoices': return invoices;
      case 'finance': return finance;
      case 'salaries': return salaries;
      case 'approvals': return approvals;
      case 'modules': return modules;
      case 'auditLogs': return auditLogs;
      default: return [];
    }
  };

  // Get raw JSON string for Inspector
  const getRawJsonString = () => {
    const fullDb = loadErpJsonDatabase();
    if (jsonScope === 'ALL') {
      return JSON.stringify(fullDb, null, 2);
    }
    return JSON.stringify(fullDb[jsonScope] || [], null, 2);
  };

  const handleCopyJson = () => {
    const text = getRawJsonString();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Title & Header Card */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 shadow-xl border border-indigo-900/60 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-300">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-black text-white tracking-tight">Database ERP Berbasis JSON</h1>
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    Format File JSON Aktif
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Seluruh data tersimpan langsung dalam format JSON tanpa ketergantungan Google Sheets. Dapat diinspeksi, diekspor ke Excel (.xls), atau dicetak ke PDF secara instan.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                exportDatabaseToJson();
                alert('File backup JSON database ERP berhasil diunduh!');
              }}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
            >
              <FileJson className="w-4 h-4" />
              <span>Unduh Backup JSON</span>
            </button>

            <button
              onClick={() => exportDatabaseToExcelXls()}
              className="bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Unduh Excel (.xls)</span>
            </button>

            <button
              onClick={() => exportPrintablePDFReport()}
              className="bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / PDF</span>
            </button>

            <label className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md transition-all cursor-pointer">
              <Upload className="w-4 h-4" />
              <span>Impor JSON</span>
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    try {
                      await importDatabaseFromJson(file);
                      alert('Database berhasil diimpor & dipulihkan dari file JSON!');
                      onRefresh();
                    } catch (err: any) {
                      alert('Gagal mengimpor file JSON: ' + err);
                    }
                  }
                }}
              />
            </label>

            <button
              onClick={onRefresh}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold p-2.5 rounded-xl border border-slate-700 transition-all cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* View Mode Switcher Header */}
        <div className="flex items-center gap-2 border-t border-indigo-900/80 pt-4">
          <button
            onClick={() => setActiveViewMode('tables')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeViewMode === 'tables'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/60'
                : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Table className="w-4 h-4" />
            <span>Tabel Data Interaktif</span>
          </button>

          <button
            onClick={() => setActiveViewMode('json_inspector')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeViewMode === 'json_inspector'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/60'
                : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Code className="w-4 h-4 text-amber-400" />
            <span>Inspektur Raw JSON File</span>
          </button>
        </div>
      </div>

      {/* MODE 1: INTERACTIVE TABLES */}
      {activeViewMode === 'tables' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-6">
          {/* Table Selector Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200">
            {tableTabs.map(tab => {
              const isActive = activeTable === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => {
                    setActiveTable(tab.key);
                    setSearchTerm('');
                  }}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                    isActive
                      ? 'bg-slate-900 text-white font-bold shadow-sm ring-2 ring-indigo-500/20'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Table Action Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder={`Cari data di tabel ${currentTabInfo?.label}...`}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-4 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => exportTableToCSV(activeTable, getCurrentTableData())}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-indigo-400" />
                <span>Unduh CSV Tabel Ini</span>
              </button>
            </div>
          </div>

          {/* TABLE RENDERING BY ACTIVE TAB */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            {/* 1. SISWA */}
            {activeTable === 'students' && (
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-900 text-slate-200 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3">ID Siswa</th>
                    <th className="p-3">Nama Siswa</th>
                    <th className="p-3">Jenjang / Kelas</th>
                    <th className="p-3">Wali & No WA</th>
                    <th className="p-3">Mata Pelajaran</th>
                    <th className="p-3">Sisa / Total Sesi</th>
                    <th className="p-3">Tarif / Sesi</th>
                    <th className="p-3">Status Paket</th>
                    <th className="p-3 text-center">Aksi (Edit/Hapus)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {students
                    .filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.id.includes(searchTerm))
                    .map(s => (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="p-3 font-mono font-bold text-indigo-600">{s.id}</td>
                        <td className="p-3 font-bold text-slate-900">{s.name}</td>
                        <td className="p-3">{s.grade} - {s.className || 'Reguler'}</td>
                        <td className="p-3">{s.parentName} ({s.parentWA})</td>
                        <td className="p-3">{Array.isArray(s.subjects) ? s.subjects.join(', ') : '-'}</td>
                        <td className="p-3 font-bold text-amber-600">{s.remainingSessions} / {s.totalPackageSessions} Sesi</td>
                        <td className="p-3 font-bold">{formatRupiah(s.ratePerSession)}</td>
                        <td className="p-3">
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {s.packageStatus || 'Aktif'}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenEditModal('students', s)}
                              className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer"
                              title="Edit Data Siswa"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem('students', s.id, s.name)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
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
            )}

            {/* 2. TENTOR */}
            {activeTable === 'tutors' && (
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-900 text-slate-200 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3">ID Tentor</th>
                    <th className="p-3">Nama Lengkap</th>
                    <th className="p-3">No WhatsApp</th>
                    <th className="p-3">Mapel Master</th>
                    <th className="p-3">Sistem Gaji</th>
                    <th className="p-3">Honor Per Sesi</th>
                    <th className="p-3">Wilayah Kerja</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-center">Aksi (Edit/Hapus)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {tutors
                    .filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()) || t.id.includes(searchTerm))
                    .map(t => (
                      <tr key={t.id} className="hover:bg-slate-50">
                        <td className="p-3 font-mono font-bold text-indigo-600">{t.id}</td>
                        <td className="p-3 font-bold text-slate-900">{t.name}</td>
                        <td className="p-3">{t.wa || '-'}</td>
                        <td className="p-3">{Array.isArray(t.subjects) ? t.subjects.join(', ') : '-'}</td>
                        <td className="p-3">{t.salarySystem || 'Per Pertemuan'}</td>
                        <td className="p-3 font-bold text-emerald-600">{formatRupiah(t.ratePerSession)}</td>
                        <td className="p-3">{Array.isArray(t.workingArea) ? t.workingArea.join(', ') : '-'}</td>
                        <td className="p-3">
                          <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {t.status}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenEditModal('tutors', t)}
                              className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer"
                              title="Edit Data Tentor"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem('tutors', t.id, t.name)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                              title="Hapus Data Tentor"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}

            {/* 3. ORANG TUA */}
            {activeTable === 'parents' && (
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-900 text-slate-200 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3">ID Orang Tua</th>
                    <th className="p-3">Nama Lengkap</th>
                    <th className="p-3">No WhatsApp</th>
                    <th className="p-3">Alamat</th>
                    <th className="p-3">Anak (ID Siswa)</th>
                    <th className="p-3 text-center">Aksi (Edit/Hapus)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {parents
                    .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map(p => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="p-3 font-mono font-bold text-indigo-600">{p.id}</td>
                        <td className="p-3 font-bold text-slate-900">{p.name}</td>
                        <td className="p-3">{p.wa}</td>
                        <td className="p-3">{p.address}</td>
                        <td className="p-3">{Array.isArray(p.studentIds) ? p.studentIds.join(', ') : '-'}</td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenEditModal('parents', p)}
                              className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer"
                              title="Edit Data Orang Tua"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem('parents', p.id, p.name)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                              title="Hapus Data Orang Tua"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}

            {/* 4. MAPEL */}
            {activeTable === 'subjects' && (
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-900 text-slate-200 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3">ID Mapel</th>
                    <th className="p-3">Nama Mata Pelajaran</th>
                    <th className="p-3">Jenjang Sekolah</th>
                    <th className="p-3 text-center">Aksi (Edit/Hapus)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {subjects.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-indigo-600">{s.id}</td>
                      <td className="p-3 font-bold text-slate-900">{s.name}</td>
                      <td className="p-3"><span className="bg-slate-100 text-slate-800 font-bold px-2 py-0.5 rounded">{s.grade}</span></td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal('subjects', s)}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer"
                            title="Edit Mapel"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem('subjects', s.id, s.name)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                            title="Hapus Mapel"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 5. WILAYAH KERJA */}
            {activeTable === 'workingAreas' && (
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-900 text-slate-200 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3">ID Wilayah</th>
                    <th className="p-3">Nama Wilayah / Kecamatan</th>
                    <th className="p-3">Kode Pos</th>
                    <th className="p-3 text-center">Aksi (Edit/Hapus)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {workingAreas.map(w => (
                    <tr key={w.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-indigo-600">{w.id}</td>
                      <td className="p-3 font-bold text-slate-900">{w.name}</td>
                      <td className="p-3">{w.postcode || '-'}</td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal('workingAreas', w)}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer"
                            title="Edit Wilayah"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem('workingAreas', w.id, w.name)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                            title="Hapus Wilayah"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 6. JADWAL */}
            {activeTable === 'schedules' && (
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-900 text-slate-200 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3">ID Jadwal</th>
                    <th className="p-3">Siswa</th>
                    <th className="p-3">Tentor</th>
                    <th className="p-3">Mata Pelajaran</th>
                    <th className="p-3">Hari & Jam</th>
                    <th className="p-3">Tipe Jadwal</th>
                    <th className="p-3">Tarif / Pertemuan</th>
                    <th className="p-3 text-center">Aksi (Edit/Hapus)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {schedules.map(sch => (
                    <tr key={sch.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-indigo-600">{sch.id}</td>
                      <td className="p-3 font-bold text-slate-900">{studentMap.get(sch.studentId) || sch.studentId}</td>
                      <td className="p-3">{tutorMap.get(sch.tutorId) || sch.tutorId}</td>
                      <td className="p-3">{sch.subject}</td>
                      <td className="p-3 font-bold">{sch.dayOfWeek}, {sch.timeSlot}</td>
                      <td className="p-3"><span className="bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-full">{sch.type}</span></td>
                      <td className="p-3 font-bold">{formatRupiah(sch.sessionRate)}</td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal('schedules', sch)}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer"
                            title="Edit Jadwal"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem('schedules', sch.id, `Jadwal ${sch.subject}`)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                            title="Hapus Jadwal"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 7. ABSENSI */}
            {activeTable === 'attendances' && (
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-900 text-slate-200 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3">Tanggal</th>
                    <th className="p-3">Tentor</th>
                    <th className="p-3">Siswa</th>
                    <th className="p-3">Selfie Absen</th>
                    <th className="p-3">Materi Diberikan</th>
                    <th className="p-3">Catatan Perkembangan</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-center">Aksi (Edit/Hapus)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {attendances.map(att => (
                    <tr key={att.id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold">{att.date}</td>
                      <td className="p-3">{tutorMap.get(att.tutorId) || att.tutorId}</td>
                      <td className="p-3 font-bold">{studentMap.get(att.studentId) || att.studentId}</td>
                      <td className="p-3">
                        {att.selfieUrl ? (
                          <button
                            onClick={() => setSelectedSelfieUrl(att.selfieUrl)}
                            className="flex items-center gap-1 text-[11px] text-indigo-600 hover:underline font-bold cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Lihat Foto</span>
                          </button>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="p-3 max-w-xs truncate">{att.materialCovered || '-'}</td>
                      <td className="p-3 max-w-xs truncate">{att.progressNotes || '-'}</td>
                      <td className="p-3 font-bold text-emerald-600">{att.status}</td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal('attendances', att)}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer"
                            title="Edit Presensi"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem('attendances', att.id, `Presensi ${att.date}`)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                            title="Hapus Presensi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 8. TAGIHAN SPP */}
            {activeTable === 'invoices' && (
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-900 text-slate-200 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3">No. Invoice</th>
                    <th className="p-3">Siswa</th>
                    <th className="p-3">Total Tagihan</th>
                    <th className="p-3">Sudah Dibayar</th>
                    <th className="p-3">Jatuh Tempo</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-center">Aksi (Edit/Hapus)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {invoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-indigo-600">{inv.invoiceNumber}</td>
                      <td className="p-3 font-bold text-slate-900">{studentMap.get(inv.studentId) || inv.studentId}</td>
                      <td className="p-3 font-bold">{formatRupiah(inv.amount)}</td>
                      <td className="p-3 text-emerald-600 font-bold">{formatRupiah(inv.amountPaid)}</td>
                      <td className="p-3">{inv.dueDate}</td>
                      <td className="p-3 font-bold">{inv.status}</td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal('invoices', inv)}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer"
                            title="Edit Invoice"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem('invoices', inv.id, inv.invoiceNumber)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                            title="Hapus Invoice"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 9. KEUANGAN */}
            {activeTable === 'finance' && (
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-900 text-slate-200 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3">ID Transaksi</th>
                    <th className="p-3">Tanggal</th>
                    <th className="p-3">Tipe</th>
                    <th className="p-3">Kategori</th>
                    <th className="p-3">Keterangan</th>
                    <th className="p-3">Nominal</th>
                    <th className="p-3">Pembuat</th>
                    <th className="p-3 text-center">Aksi (Edit/Hapus)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {finance.map(f => (
                    <tr key={f.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-indigo-600">{f.id}</td>
                      <td className="p-3">{f.date}</td>
                      <td className="p-3">
                        <span className={`font-bold px-2 py-0.5 rounded ${
                          f.type === 'Pemasukan' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {f.type}
                        </span>
                      </td>
                      <td className="p-3 font-bold">{f.category}</td>
                      <td className="p-3">{f.description}</td>
                      <td className="p-3 font-bold">{formatRupiah(f.amount)}</td>
                      <td className="p-3">{f.createdBy}</td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal('finance', f)}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer"
                            title="Edit Transaksi"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem('finance', f.id, f.description || f.id)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                            title="Hapus Transaksi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 10. GAJI */}
            {activeTable === 'salaries' && (
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-900 text-slate-200 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3">ID Slip</th>
                    <th className="p-3">Tentor</th>
                    <th className="p-3">Bulan/Tahun</th>
                    <th className="p-3">Honor Mengajar</th>
                    <th className="p-3">Bonus</th>
                    <th className="p-3">Total Diterima</th>
                    <th className="p-3">Status Gaji</th>
                    <th className="p-3 text-center">Aksi (Edit/Hapus)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {salaries.map(sal => (
                    <tr key={sal.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-indigo-600">{sal.id}</td>
                      <td className="p-3 font-bold">{tutorMap.get(sal.tutorId) || sal.tutorId}</td>
                      <td className="p-3">{sal.monthYear}</td>
                      <td className="p-3">{formatRupiah(sal.totalAttendanceRate)}</td>
                      <td className="p-3 text-emerald-600">{formatRupiah(sal.bonus)}</td>
                      <td className="p-3 font-bold text-slate-900">{formatRupiah(sal.totalSalary)}</td>
                      <td className="p-3 font-bold">{sal.paymentStatus}</td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal('salaries', sal)}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer"
                            title="Edit Slip Gaji"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem('salaries', sal.id, `Slip ${sal.monthYear}`)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                            title="Hapus Slip Gaji"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 11. APPROVALS */}
            {activeTable === 'approvals' && (
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-900 text-slate-200 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3">ID Request</th>
                    <th className="p-3">Pengaju</th>
                    <th className="p-3">Tipe Persetujuan</th>
                    <th className="p-3">Alasan</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-center">Aksi (Edit/Hapus)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {approvals.map(app => (
                    <tr key={app.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-indigo-600">{app.id}</td>
                      <td className="p-3 font-bold">{app.requestedBy}</td>
                      <td className="p-3">{app.type}</td>
                      <td className="p-3 max-w-md">{app.reason}</td>
                      <td className="p-3 font-bold">{app.status}</td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal('approvals', app)}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer"
                            title="Edit Request"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem('approvals', app.id, app.type)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                            title="Hapus Request"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 12. MODULES */}
            {activeTable === 'modules' && (
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-900 text-slate-200 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3">ID Modul</th>
                    <th className="p-3">Judul Modul</th>
                    <th className="p-3">Mapel & Jenjang</th>
                    <th className="p-3">Tanggal Unggah</th>
                    <th className="p-3 text-center">Aksi (Edit/Hapus)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {modules.map(mod => (
                    <tr key={mod.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-indigo-600">{mod.id}</td>
                      <td className="p-3 font-bold text-slate-900">{mod.title}</td>
                      <td className="p-3">{mod.subject} ({mod.grade})</td>
                      <td className="p-3">{mod.uploadedAt}</td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal('modules', mod)}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer"
                            title="Edit Modul"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem('modules', mod.id, mod.title)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                            title="Hapus Modul"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 13. AUDIT LOGS */}
            {activeTable === 'auditLogs' && (
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-900 text-slate-200 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3">Waktu</th>
                    <th className="p-3">Pengguna</th>
                    <th className="p-3">Aktivitas Sistem</th>
                    <th className="p-3 text-center">Aksi (Edit/Hapus)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {auditLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono text-slate-500">{log.time}</td>
                      <td className="p-3 font-bold text-indigo-600">{log.user}</td>
                      <td className="p-3 text-slate-800">{log.activity}</td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal('auditLogs', log)}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer"
                            title="Edit Log"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem('auditLogs', log.id, `Log ${log.time}`)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                            title="Hapus Log"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* MODE 2: RAW JSON FILE INSPECTOR */}
      {activeViewMode === 'json_inspector' && (
        <div className="bg-slate-900 text-slate-100 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-extrabold text-white">Inspektur & Editor Struktur Berkas JSON Database</h3>
              </div>
              <p className="text-xs text-slate-400">
                Pilih cakupan objek JSON di bawah untuk melihat dan mengedit struktur data mentah yang tersimpan.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={jsonScope}
                onChange={e => {
                  setJsonScope(e.target.value as any);
                  setRawJsonEditing('');
                }}
                className="bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none"
              >
                <option value="ALL">📦 Seluruh Objek Database (Full JSON)</option>
                <option value="students">👨‍🎓 Table `students` (Siswa)</option>
                <option value="tutors">👨‍🏫 Table `tutors` (Tentor)</option>
                <option value="schedules">📅 Table `schedules` (Jadwal)</option>
                <option value="attendances">📸 Table `attendances` (Presensi)</option>
                <option value="finance">💵 Table `finance` (Keuangan)</option>
                <option value="invoices">🧾 Table `invoices` (Tagihan)</option>
                <option value="salaries">💸 Table `salaries` (Gaji Tentor)</option>
                <option value="approvals">✅ Table `approvals` (Persetujuan)</option>
                <option value="users">👤 Table `users` (Pengguna)</option>
                <option value="settings">⚙️ Table `settings` (Pengaturan)</option>
              </select>

              <button
                onClick={handleCopyJson}
                className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Tersalin!' : 'Salin JSON'}</span>
              </button>

              <button
                onClick={async () => {
                  try {
                    const textToSave = rawJsonEditing || getRawJsonString();
                    const parsed = JSON.parse(textToSave);
                    if (jsonScope === 'ALL') {
                      saveErpJsonDatabase(parsed);
                      await saveToFirestore(parsed);
                    } else {
                      const fullDb = loadErpJsonDatabase();
                      const updatedDb = { ...fullDb, [jsonScope]: parsed };
                      saveErpJsonDatabase(updatedDb);
                      await saveToFirestore(updatedDb);
                    }
                    onRefresh();
                    alert('Database JSON berhasil diperbarui!');
                  } catch (err: any) {
                    alert('Gagal menyimpan JSON: ' + err.message);
                  }
                }}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Raw JSON</span>
              </button>
            </div>
          </div>

          <div className="relative">
            <textarea
              value={rawJsonEditing || getRawJsonString()}
              onChange={e => setRawJsonEditing(e.target.value)}
              className="w-full h-[520px] bg-slate-950 text-indigo-300 font-mono text-xs p-4 rounded-2xl border border-slate-800 focus:outline-none resize-none leading-relaxed overflow-y-auto"
            />
          </div>
        </div>
      )}

      {/* Edit Single Item Modal */}
      {editingItem && editingTableKey && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Pencil className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-extrabold text-slate-900">
                  Edit Data Baris ({editingTableKey} - ID: {editingItem.id})
                </h3>
              </div>
              <button
                onClick={() => { setEditingItem(null); setEditingTableKey(null); }}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Ubah nilai properti data di bawah ini, kemudian tekan <strong>Simpan Perubahan</strong> untuk memperbarui data secara permanen.
            </p>

            <div className="flex-1 overflow-hidden">
              <textarea
                value={editingJsonText}
                onChange={e => setEditingJsonText(e.target.value)}
                className="w-full h-80 bg-slate-950 text-indigo-300 font-mono text-xs p-4 rounded-2xl border border-slate-800 focus:outline-none resize-none leading-relaxed overflow-y-auto"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => { setEditingItem(null); setEditingTableKey(null); }}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleSaveEditedItem}
                className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Perubahan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Selfie Photo Preview Modal */}
      {selectedSelfieUrl && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-5 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Bukti Foto Selfie Presensi</h3>
              <button
                onClick={() => setSelectedSelfieUrl(null)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
              <img
                src={selectedSelfieUrl}
                alt="Selfie Presensi"
                className="w-full h-80 object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
