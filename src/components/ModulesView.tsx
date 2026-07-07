import React, { useState } from 'react';
import { Module, GradeLevel, UserRole } from '../types';
import {
  BookOpen, ExternalLink, Plus, Search, FileText, Download,
  Trash2, Copy, Check, Filter, Shield, UploadCloud, FileCheck, Info
} from 'lucide-react';
import { persistDatabaseUpdate } from '../services/dataManager';

interface ModulesViewProps {
  modules: Module[];
  userRole: UserRole;
  onRefresh: () => void;
}

export const ModulesView: React.FC<ModulesViewProps> = ({ modules, userRole, onRefresh }) => {
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('SEMUA');
  const [selectedSubject, setSelectedSubject] = useState<string>('SEMUA');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Upload Form State
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Matematika');
  const [grade, setGrade] = useState<GradeLevel>('SD');
  const [description, setDescription] = useState('');
  const [uploadType, setUploadType] = useState<'url' | 'file'>('url');
  const [driveFileUrl, setDriveFileUrl] = useState('');
  const [attachedFileName, setAttachedFileName] = useState('');

  const isAdmin = userRole === 'SUPER_ADMIN' || userRole === 'MANAGEMENT';

  // Handle File Selection (convert local file to Data URL for instant download)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedFileName(file.name);
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const result = uploadEvent.target?.result as string;
        if (result) {
          setDriveFileUrl(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Save New Module
  const handleUploadModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driveFileUrl.trim()) {
      alert('Silakan isi URL Google Drive atau pilih file lokal!');
      return;
    }

    const newModule: Module = {
      id: `mod_${Date.now()}`,
      title: title.trim(),
      subject: subject.trim(),
      grade,
      description: description.trim() || 'Modul & materi latihan pembelajaran bimbel.',
      driveFileUrl: driveFileUrl.trim(),
      uploadedBy: userRole === 'SUPER_ADMIN' ? 'Super Admin' : userRole === 'MANAGEMENT' ? 'Manajemen Bimbel' : 'Tentor',
      uploadedAt: new Date().toISOString().substring(0, 10),
      fileType: uploadType === 'file' ? attachedFileName.split('.').pop()?.toUpperCase() || 'DOCUMENT' : 'PDF / DRIVE'
    };

    try {
      // Send to API if available
      try {
        await fetch('/api/modules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newModule)
        });
      } catch (err) {
        console.warn('API backend error, saving directly via persistDatabaseUpdate');
      }

      // Persist to local & Firestore cloud database
      await persistDatabaseUpdate(db => {
        const updatedModules = [newModule, ...(db.modules || [])];
        return { ...db, modules: updatedModules };
      });

      alert('Modul / materi belajar berhasil diunggah!');
      setShowModal(false);
      setTitle('');
      setDriveFileUrl('');
      setDescription('');
      setAttachedFileName('');
      onRefresh();
    } catch (err) {
      alert('Gagal menambah modul. Silakan coba kembali.');
    }
  };

  // Delete Module (Admin only)
  const handleDeleteModule = async (id: string, title: string) => {
    if (!window.confirm(`Hapus modul "${title}" dari bank materi?`)) return;

    try {
      try {
        await fetch(`/api/modules/${id}`, { method: 'DELETE' });
      } catch (e) {
        // Fallback
      }

      await persistDatabaseUpdate(db => {
        const updatedModules = (db.modules || []).filter(m => m.id !== id);
        return { ...db, modules: updatedModules };
      });

      alert('Modul berhasil dihapus.');
      onRefresh();
    } catch (err) {
      alert('Gagal menghapus modul.');
    }
  };

  // Copy URL Link
  const handleCopyLink = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Unique Subjects for Filter
  const availableSubjects = Array.from(new Set(modules.map(m => m.subject))).filter(Boolean);

  // Filtered Modules
  const filteredModules = modules.filter(m => {
    const matchesSearch =
      m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.description && m.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesGrade = selectedGrade === 'SEMUA' || m.grade === selectedGrade;
    const matchesSubject = selectedSubject === 'SEMUA' || m.subject === selectedSubject;

    return matchesSearch && matchesGrade && matchesSubject;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white p-6 rounded-3xl border border-indigo-700/60 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <BookOpen className="w-3 h-3" /> Bank Materi & Modul Belajar Digital
            </span>
            {isAdmin ? (
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Shield className="w-3 h-3" /> Akses Admin (Upload & Kelola)
              </span>
            ) : (
              <span className="bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Download className="w-3 h-3" /> Akses Tentor (Unduh Modul)
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Pusat Modul & Materi Pembelajaran Privat
          </h2>
          <p className="text-xs text-indigo-200/90 leading-relaxed max-w-2xl">
            {isAdmin
              ? 'Kelola dan unggah materi belajar, bank soal, serta silabus untuk dapat diakses dan diunduh oleh para Tentor secara realtime.'
              : 'Pilih dan unduh modul latihan, bank soal, serta panduan mengajar untuk mempermudah sesi les bersama siswa Anda.'}
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowModal(true)}
            className="bg-indigo-500 hover:bg-indigo-400 active:bg-indigo-600 text-white font-extrabold text-xs px-5 py-3 rounded-2xl shadow-lg flex items-center gap-2 cursor-pointer transition-all active:scale-95 shrink-0 self-start md:self-center"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Modul Baru</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari modul (contoh: Matematika, Soal SD, Fisika...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          {/* Grade Selector */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400 shrink-0 hidden sm:block" />
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer w-full sm:w-auto"
            >
              <option value="SEMUA">Semua Jenjang</option>
              <option value="PAUD">PAUD</option>
              <option value="TK Kecil">TK Kecil</option>
              <option value="TK Besar">TK Besar</option>
              <option value="SD">SD</option>
              <option value="SMP">SMP</option>
              <option value="SMA">SMA</option>
            </select>

            {/* Subject Selector */}
            {availableSubjects.length > 0 && (
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer w-full sm:w-auto"
              >
                <option value="SEMUA">Semua Mapel</option>
                {availableSubjects.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Counter Info */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
          <span>Menampilkan <strong>{filteredModules.length}</strong> dari {modules.length} modul</span>
          {(searchTerm || selectedGrade !== 'SEMUA' || selectedSubject !== 'SEMUA') && (
            <button
              onClick={() => { setSearchTerm(''); setSelectedGrade('SEMUA'); setSelectedSubject('SEMUA'); }}
              className="text-indigo-600 font-bold hover:underline cursor-pointer"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Modules Grid */}
      {filteredModules.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800 text-sm">Belum Ada Modul Ditemukan</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {isAdmin
              ? 'Belum ada modul belajar yang ditambahkan. Klik "+ Upload Modul Baru" untuk mengunggah materi pertama.'
              : 'Tidak ada modul yang sesuai dengan kriteria pencarian Anda. Silakan coba kata kunci lain atau hubungi Admin.'}
          </p>
          {isAdmin && (
            <button
              onClick={() => setShowModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl inline-flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" /> Tambah Modul Baru
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredModules.map((mod) => (
            <div
              key={mod.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="bg-indigo-100 text-indigo-800 font-bold text-[10px] px-2.5 py-0.5 rounded-full border border-indigo-200">
                      {mod.grade}
                    </span>
                    <span className="bg-slate-100 text-slate-700 font-semibold text-[10px] px-2.5 py-0.5 rounded-full border border-slate-200">
                      {mod.subject}
                    </span>
                  </div>

                  {isAdmin && (
                    <button
                      onClick={() => handleDeleteModule(mod.id, mod.title)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Hapus Modul"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm leading-snug group-hover:text-indigo-600 transition-colors">
                      {mod.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {mod.description || 'Modul materi pembelajaran bimbel privat.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Diupload oleh: <strong className="text-slate-600">{mod.uploadedBy}</strong></span>
                  <span>{new Date(mod.uploadedAt).toLocaleDateString('id-ID')}</span>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={mod.driveFileUrl}
                    target="_blank"
                    rel="noreferrer"
                    download={mod.driveFileUrl.startsWith('data:') ? `${mod.title}.pdf` : undefined}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-95"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download / Buka Materi</span>
                  </a>

                  <button
                    onClick={() => handleCopyLink(mod.id, mod.driveFileUrl)}
                    className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs flex items-center justify-center transition-all cursor-pointer"
                    title="Salin Link Modul"
                  >
                    {copiedId === mod.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL UPLOAD MODUL BARU */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <UploadCloud className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Upload Modul / Materi Baru</h3>
                  <p className="text-[11px] text-slate-500">Materi akan otomatis muncul di menu Tentor</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadModule} className="space-y-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Judul Modul / Materi</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Modul Latihan Matematika SD Bab 1-4"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Mata Pelajaran</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Matematika"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Jenjang Tingkat</label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none cursor-pointer"
                  >
                    <option value="PAUD">PAUD</option>
                    <option value="TK Kecil">TK Kecil</option>
                    <option value="TK Besar">TK Besar</option>
                    <option value="SD">SD</option>
                    <option value="SMP">SMP</option>
                    <option value="SMA">SMA</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Deskripsi Singkat / Ringkasan</label>
                <textarea
                  rows={2}
                  placeholder="Penjelasan ringkas mengenai isi modul ini..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                />
              </div>

              {/* Upload Type Switcher */}
              <div className="space-y-2">
                <label className="block text-slate-700 font-bold">Metode Upload Files</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setUploadType('url')}
                    className={`py-2 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                      uploadType === 'url' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Link Google Drive / Cloud
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadType('file')}
                    className={`py-2 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                      uploadType === 'file' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Upload File Komputer (PDF/Doc)
                  </button>
                </div>
              </div>

              {uploadType === 'url' ? (
                <div>
                  <label className="block text-slate-700 font-bold mb-1">URL Link Google Drive / Cloud</label>
                  <input
                    type="url"
                    required
                    placeholder="https://drive.google.com/file/d/..."
                    value={driveFileUrl}
                    onChange={(e) => setDriveFileUrl(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Pastikan hak akses file di Google Drive diset "Siapa saja yang memiliki link".</p>
                </div>
              ) : (
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Pilih File dari Komputer (PDF / Word / Gambar)</label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.png"
                    onChange={handleFileChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium text-slate-800 focus:outline-none cursor-pointer text-xs"
                  />
                  {attachedFileName && (
                    <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl font-medium flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="truncate">{attachedFileName} (Siap Diunggah)</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold rounded-xl shadow-md shadow-indigo-200 cursor-pointer active:scale-95 transition-all"
                >
                  Simpan & Publis Modul
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
