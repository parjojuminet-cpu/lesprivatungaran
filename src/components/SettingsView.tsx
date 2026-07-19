import React, { useState, useEffect } from 'react';
import { Setting, UserRole, User, Tutor } from '../types';
import {
  Settings as SettingsIcon, Save, Plus, Trash2, Key,
  UserCheck, Shield, CheckCircle, X, UserPlus, Sparkles,
  Database, Download, Upload, RefreshCw, FileText, FileSpreadsheet, Printer
} from 'lucide-react';
import {
  exportDatabaseToJson,
  importDatabaseFromJson,
  resetDatabaseToDefaultJson
} from '../services/jsonStorage';
import {
  exportDatabaseToExcelXls,
  exportPrintablePDFReport
} from '../services/exportUtils';
import { persistDatabaseUpdate } from '../services/dataManager';

interface SettingsViewProps {
  settings: Setting[];
  users?: User[];
  tutors?: Tutor[];
  userRole: UserRole;
  currentUser?: User;
  onRefresh: () => void;
}

const DEFAULT_SETTINGS: Setting[] = [
  { key: 'MARGIN_MANAGEMENT_NOMINAL', value: 10000, description: 'Nominal Standar Fee/Potongan Manajemen (Rp per Sesi Pertemuan)', category: 'Keuangan' },
  { key: 'MAX_RESCHEDULE_PER_MONTH', value: 2, description: 'Batas Maksimal Reschedule Gratis Per Bulan', category: 'Operasional' },
  { key: 'MIN_NOTICE_RESCHEDULE_DAYS', value: 1, description: 'Minimal Pemberitahuan Reschedule Sebelum Hari Mengajar (Hari, misal 1 atau 2 hari)', category: 'Operasional' },
  { key: 'MAX_DEADLINE_RESCHEDULE_BEFORE_TEACHING_DAYS', value: 1, description: 'Batas Maksimal Pengajuan Reschedule Sebelum Hari Mengajar (Hari, Standar: H-1)', category: 'Operasional' }
];

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings = [],
  users = [],
  tutors = [],
  userRole,
  currentUser,
  onRefresh
}) => {
  const [settingsList, setSettingsList] = useState<Setting[]>(() => {
    let list = DEFAULT_SETTINGS;
    if (settings && settings.length > 0) list = settings;
    return list.filter(s => s.key !== 'AUTO_SYNC_GOOGLE_SHEETS');
  });

  useEffect(() => {
    let list = DEFAULT_SETTINGS;
    if (settings && settings.length > 0) {
      list = settings;
    }
    setSettingsList(list.filter(s => s.key !== 'AUTO_SYNC_GOOGLE_SHEETS'));
  }, [settings]);

  const [isSaving, setIsSaving] = useState(false);

  // Modal Add User State
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    username: '',
    password: '',
    name: '',
    role: 'TENTOR' as UserRole,
    tutorId: '',
    status: 'Aktif' as 'Aktif' | 'Nonaktif',
    desc: ''
  });

  const handleChangeValue = (key: string, newValue: any) => {
    setSettingsList(prev => prev.map(s => s.key === key ? { ...s, value: newValue } : s));
  };

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await persistDatabaseUpdate(db => ({
        ...db,
        settings: settingsList
      }));
      alert('Pengaturan sistem ERP Bimbel berhasil disimpan!');
    } catch (err) {
      console.error('Failed saving settings:', err);
      alert('Gagal menyimpan pengaturan.');
    } finally {
      setIsSaving(false);
      onRefresh();
    }
  };

  // Select Tutor automatically fills Name and Username recommendation
  const handleSelectTutorForAccount = (tutorId: string) => {
    const selectedTutor = tutors.find(t => t.id === tutorId);
    if (selectedTutor) {
      const cleanUsername = selectedTutor.name.toLowerCase().split(' ')[0].replace(/[^a-z0-9]/g, '');
      setNewUserForm(prev => ({
        ...prev,
        tutorId: selectedTutor.id,
        name: selectedTutor.name,
        username: cleanUsername,
        password: `${cleanUsername}111`,
        role: 'TENTOR',
        desc: `Akses khusus tentor ${selectedTutor.name}: presensi mengajar, modul & rincian honor.`
      }));
    } else {
      setNewUserForm(prev => ({ ...prev, tutorId: '' }));
    }
  };

  // Submit Create New User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserForm.username || !newUserForm.password || !newUserForm.name) {
      alert('Harap lengkapi Username, Password, dan Nama Pengguna.');
      return;
    }

    const newAcc: User = {
      id: `usr-${Date.now()}`,
      username: newUserForm.username.trim(),
      passwordHash: newUserForm.password.trim(),
      name: newUserForm.name.trim(),
      role: newUserForm.role,
      tutorId: newUserForm.tutorId || undefined,
      status: newUserForm.status,
      desc: newUserForm.desc || `Akses ${newUserForm.role} ERP Bimbel`,
      createdAt: new Date().toISOString().substring(0, 10)
    };

    try {
      await persistDatabaseUpdate(db => ({
        ...db,
        users: [newAcc, ...db.users.filter(u => u.username !== newAcc.username)]
      }));
    } catch (err) {
      console.warn('Persistence error:', err);
    }

    alert(`Berhasil membuat akun user baru!\n\nUsername: ${newAcc.username}\nPassword: ${newUserForm.password}`);
    setShowAddUserModal(false);
    setNewUserForm({
      username: '',
      password: '',
      name: '',
      role: 'TENTOR',
      tutorId: '',
      status: 'Aktif',
      desc: ''
    });
    onRefresh();
  };

  // Modal Delete User State
  const [deletingAccount, setDeletingAccount] = useState<{ id: string; username: string; name: string; tutorId?: string } | null>(null);
  const [deleteTutorDataAlso, setDeleteTutorDataAlso] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  // Delete User Account
  const handleConfirmDeleteUser = async () => {
    if (!deletingAccount) return;
    setIsDeleting(true);
    try {
      await persistDatabaseUpdate(db => {
        const updatedUsers = db.users.filter(u => u.id !== deletingAccount.id && u.username !== deletingAccount.username);
        const updatedTutors = (deleteTutorDataAlso && deletingAccount.tutorId)
          ? db.tutors.filter(t => t.id !== deletingAccount.tutorId)
          : db.tutors;
        return {
          ...db,
          users: updatedUsers,
          tutors: updatedTutors
        };
      });

      setDeletingAccount(null);
      onRefresh();
    } catch (err) {
      alert('Gagal menghapus akun / data tentor');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-indigo-600" />
            Pengaturan Sistem & Manajemen User / Hak Akses
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Atur parameter operasional, tarif margin, serta terbitkan akun login & hak akses untuk Tentor Baru.
          </p>
        </div>

        <button
          onClick={handleSaveAll}
          disabled={isSaving}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Menyimpan...' : 'Simpan Perubahan Settings'}</span>
        </button>
      </div>

      {/* JSON File Database Storage & Backup Management Card */}
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-md border border-indigo-900 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-indigo-800/60 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-bold text-white">Penyimpanan Data ERP Berbasis JSON</h3>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                Format JSON (Aktif)
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Seluruh data operasional ERP Bimbel (Siswa, Tentor, Jadwal, Presensi, Keuangan, SPP, Modul, User & Settings) kini tersimpan dalam format <strong>JSON Storage</strong> yang aman, cepat, dan mandiri.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                exportDatabaseToJson();
                alert('File backup JSON database ERP berhasil diunduh!');
              }}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Unduh Backup JSON</span>
            </button>

            <button
              onClick={() => {
                exportDatabaseToExcelXls();
              }}
              title="Unduh seluruh tabel database sebagai file spreadsheet Excel (.xls)"
              className="bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Unduh Tabel Excel (.xls)</span>
            </button>

            <button
              onClick={() => {
                exportPrintablePDFReport();
              }}
              title="Mencetak atau menyimpan ringkasan tabel database sebagai file PDF"
              className="bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Simpan PDF</span>
            </button>

            <label className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer transition-all">
              <Upload className="w-4 h-4" />
              <span>Impor File JSON</span>
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
              onClick={() => {
                if (confirm('Apakah Anda yakin ingin mereset seluruh database ERP ke data default JSON awal? Data lokal saat ini akan digantikan dengan dataset default.')) {
                  resetDatabaseToDefaultJson();
                  alert('Database telah di-reset ke dataset default JSON!');
                  onRefresh();
                }
              }}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 border border-slate-700 cursor-pointer transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Default</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
            <div className="text-slate-400 text-[10px] uppercase tracking-wider font-semibold">Tipe Storage</div>
            <div className="text-slate-100 font-bold mt-0.5">JSON Local & File Storage</div>
          </div>
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
            <div className="text-slate-400 text-[10px] uppercase tracking-wider font-semibold">Fitur Utama</div>
            <div className="text-emerald-400 font-bold mt-0.5">100% Offline & Ekspor/Impor Instan</div>
          </div>
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
            <div className="text-slate-400 text-[10px] uppercase tracking-wider font-semibold">Keamanan Data</div>
            <div className="text-indigo-300 font-bold mt-0.5">Dapat Dibackup Bebas (.json)</div>
          </div>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          {settingsList.map((st) => {
            const isNominalMargin = st.key.includes('MARGIN');
            const isRescheduleDays = st.key.includes('RESCHEDULE');

            return (
              <div key={st.key} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 text-sm">
                      {st.key === 'MARGIN_MANAGEMENT_NOMINAL' ? 'Margin Manajemen Standar (Nominal)' :
                       st.key === 'MIN_NOTICE_RESCHEDULE_DAYS' ? 'Minimal Pemberitahuan Reschedule (Hari)' :
                       st.key === 'MAX_DEADLINE_RESCHEDULE_BEFORE_TEACHING_DAYS' ? 'Batas Maksimal Reschedule Sebelum Mengajar' :
                       st.key === 'MAX_RESCHEDULE_PER_MONTH' ? 'Batas Maksimal Reschedule Gratis / Bulan' : st.key}
                    </span>
                    <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-md">
                      {st.category}
                    </span>
                  </div>
                  <p className="text-slate-600 text-xs leading-relaxed">{st.description}</p>

                  {/* Contextual Info Banner */}
                  {isNominalMargin && (
                    <div className="bg-emerald-50 text-emerald-900 p-2.5 rounded-lg border border-emerald-200 text-[11px] mt-2">
                      💡 <strong>Dapat disesuaikan per murid:</strong> Tiap murid dapat diatur nominal potongannya secara spesifik di menu <strong>Master Data Siswa</strong> (contoh: Rp 5.000, Rp 7.000, Rp 10.000 per sesi).
                    </div>
                  )}

                  {isRescheduleDays && st.key.includes('MIN') && (
                    <div className="bg-blue-50 text-blue-900 p-2.5 rounded-lg border border-blue-200 text-[11px] mt-2">
                      📅 Tentor atau Wali Murid dapat mengatur reschedule <strong>1 hari (H-1)</strong> atau <strong>2 hari (H-2)</strong> sebelumnya.
                    </div>
                  )}

                  {isRescheduleDays && st.key.includes('MAX_DEADLINE') && (
                    <div className="bg-amber-50 text-amber-900 p-2.5 rounded-lg border border-amber-200 text-[11px] mt-2">
                      ⏰ Batas maksimal paling lambat pengajuan reschedule adalah <strong>1 hari sebelum hari mengajar (H-1)</strong>.
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-200">
                  {typeof st.value === 'boolean' ? (
                    <select
                      value={st.value ? 'true' : 'false'}
                      onChange={(e) => handleChangeValue(st.key, e.target.value === 'true')}
                      className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="true">AKTIF (True - Otomatis Sync Realtime)</option>
                      <option value="false">NONAKTIF (False - Manual Sync Saja)</option>
                    </select>
                  ) : (
                    <div className="relative">
                      <input
                        type="number"
                        value={st.value}
                        onChange={(e) => handleChangeValue(st.key, Number(e.target.value))}
                        className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                      <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">
                        {isNominalMargin ? 'Rp / Sesi' : isRescheduleDays ? 'Hari' : 'x / Bulan'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* User Accounts Credential Directory & Addition */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-indigo-600" />
              Daftar Akun Login & Kredensial Akses Pengguna
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Kelola dan terbitkan akun login untuk Tentor Baru, Manajemen, dan Super Admin.
            </p>
          </div>

          <button
            onClick={() => setShowAddUserModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Buat Akun Tentor Baru</span>
          </button>
        </div>

        {/* User Account List Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {users.map((acc) => (
            <div key={acc.id || acc.username} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 relative group">
              <div className="flex items-center justify-between">
                <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Key className="w-3.5 h-3.5 text-indigo-600" />
                  {acc.name}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    acc.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                    acc.role === 'MANAGEMENT' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                    'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}>
                    {acc.role}
                  </span>
                  {(!currentUser || (acc.id !== currentUser.id && acc.username !== currentUser.username)) && (
                    <button
                      onClick={() => setDeletingAccount({ id: acc.id, username: acc.username, name: acc.name, tutorId: acc.tutorId })}
                      title="Hapus Akun Pengguna"
                      className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer transition-colors hover:bg-rose-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-slate-500 text-xs">{acc.desc || `Akses role ${acc.role}`}</p>
              <div className="flex items-center gap-4 pt-1 font-mono text-slate-800 bg-white p-2.5 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-400 font-sans text-[11px] block">Username:</span>
                  <span className="font-bold text-slate-900">{acc.username}</span>
                </div>
                <div className="pl-4 border-l border-slate-200">
                  <span className="text-slate-400 font-sans text-[11px] block">Password:</span>
                  <span className="font-bold text-indigo-600">{acc.passwordHash || `${acc.username}111`}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL ADD USER ACCOUNT */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-sm text-slate-900">Buat Akun Hak Akses Tentor Baru</h3>
              </div>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              {/* Optional Select from Existing Tutors */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Pilih dari Master Tentor (Opsional):
                </label>
                <select
                  value={newUserForm.tutorId}
                  onChange={(e) => handleSelectTutorForAccount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium text-slate-900"
                >
                  <option value="">-- Pilih Tentor atau Buat Manual --</option>
                  {tutors.map((t) => (
                    <option key={t.id} value={t.id}>{t.name} ({t.subjects?.join(', ') || 'Tentor'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Lengkap Tentor / User *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ahmad Fauzi, S.Pd"
                  value={newUserForm.name}
                  onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Role / Hak Akses</label>
                  <select
                    value={newUserForm.role}
                    onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value as UserRole })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900"
                  >
                    <option value="TENTOR">TENTOR</option>
                    <option value="MANAGEMENT">MANAGEMENT</option>
                    <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Status Akun</label>
                  <select
                    value={newUserForm.status}
                    onChange={(e) => setNewUserForm({ ...newUserForm, status: e.target.value as 'Aktif' | 'Nonaktif' })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Nonaktif">Nonaktif</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Username Login *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. tentor_fauzi"
                  value={newUserForm.username}
                  onChange={(e) => setNewUserForm({ ...newUserForm, username: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono font-bold text-indigo-700"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Password Login *</label>
                <input
                  type="text"
                  required
                  placeholder="Default: username + 111"
                  value={newUserForm.password}
                  onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono font-bold text-emerald-700"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Keterangan / Catatan Akses</label>
                <input
                  type="text"
                  placeholder="e.g. Tentor khusus Mapel Fisika UTBK SMA"
                  value={newUserForm.desc}
                  onChange={(e) => setNewUserForm({ ...newUserForm, desc: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-700"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-600 rounded-xl font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Terbitkan Akun Tentor</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL CONFIRM DELETE USER ACCOUNT */}
      {deletingAccount && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-rose-100 rounded-xl text-rose-600">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">Konfirmasi Hapus Akun</h3>
                  <p className="text-[11px] text-slate-500">Cabut hak akses login tentor/pengguna</p>
                </div>
              </div>
              <button
                onClick={() => setDeletingAccount(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5 text-xs">
              <div className="text-slate-500">Akun yang akan dihapus:</div>
              <div className="font-bold text-slate-900 text-sm">{deletingAccount.name}</div>
              <div className="font-mono text-indigo-600">Username: {deletingAccount.username}</div>
            </div>

            {deletingAccount.tutorId && (
              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-amber-200 bg-amber-50/70 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={deleteTutorDataAlso}
                  onChange={(e) => setDeleteTutorDataAlso(e.target.checked)}
                  className="w-4 h-4 text-rose-600 rounded focus:ring-rose-500 cursor-pointer"
                />
                <div>
                  <span className="font-bold text-amber-900 block">Hapus Data Master Tentor Juga</span>
                  <span className="text-[11px] text-amber-800">Sekaligus hapus profil tentor dari Master Data Tentor</span>
                </div>
              </label>
            )}

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setDeletingAccount(null)}
                disabled={isDeleting}
                className="px-4 py-2 border border-slate-300 text-slate-600 rounded-xl font-bold text-xs cursor-pointer hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteUser}
                disabled={isDeleting}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeleting ? 'Menghapus...' : 'Ya, Hapus Akun Ini'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
