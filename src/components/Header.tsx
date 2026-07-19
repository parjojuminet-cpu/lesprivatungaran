import React from 'react';
import { User, UserRole } from '../types';
import { TabType } from './Sidebar';
import {
  UserCheck, LogOut, Menu, X, FileSpreadsheet, FileJson,
  LayoutDashboard, Users, Camera, Wallet, Settings, Calendar, BookOpen, RefreshCw
} from 'lucide-react';
import { exportDatabaseToJson } from '../services/jsonStorage';
import { exportDatabaseToExcelXls } from '../services/exportUtils';

interface HeaderProps {
  currentUser: User;
  users: User[];
  onSwitchUser: (username: string) => void;
  onLogout: () => void;
  isMobileMenuOpen?: boolean;
  onToggleMobileMenu?: () => void;
  activeTab?: TabType;
  setActiveTab?: (tab: TabType) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  users,
  onSwitchUser,
  onLogout,
  isMobileMenuOpen = false,
  onToggleMobileMenu,
  activeTab = 'dashboard',
  setActiveTab
}) => {
  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return <span className="bg-purple-100 text-purple-800 text-[10px] font-black px-2 py-0.5 rounded-md border border-purple-200">SUPER ADMIN</span>;
      case 'MANAGEMENT':
        return <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-2 py-0.5 rounded-md border border-blue-200">MANAGEMENT</span>;
      case 'TENTOR':
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-md border border-emerald-200">TENTOR</span>;
      default:
        return null;
    }
  };

  const getPageMeta = (tab: string) => {
    switch (tab) {
      case 'dashboard':
        return { label: 'Dashboard', icon: LayoutDashboard, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' };
      case 'schedule':
        return { label: 'Penjadwalan Les', icon: Calendar, color: 'text-sky-600 bg-sky-50 border-sky-200' };
      case 'attendance':
        return { label: 'Presensi & Foto', icon: Camera, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
      case 'reports':
        return { label: 'Raport & Evaluasi', icon: FileSpreadsheet, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' };
      case 'modules':
        return { label: 'Materi & Modul', icon: BookOpen, color: 'text-amber-600 bg-amber-50 border-amber-200' };
      case 'master':
        return { label: 'Data Master', icon: Users, color: 'text-purple-600 bg-purple-50 border-purple-200' };
      case 'finance':
        return { label: 'Keuangan & SPP', icon: Wallet, color: 'text-teal-600 bg-teal-50 border-teal-200' };
      case 'settings':
        return { label: 'Pengaturan Sistem', icon: Settings, color: 'text-rose-600 bg-rose-50 border-rose-200' };
      default:
        return { label: 'Dashboard', icon: LayoutDashboard, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' };
    }
  };

  const pageMeta = getPageMeta(activeTab);
  const PageIcon = pageMeta.icon;

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/90 sticky top-0 z-30 px-2.5 sm:px-6 lg:px-8 py-2 sm:py-2.5 shadow-xs transition-all">
      <div className="flex items-center justify-between gap-2 max-w-7xl mx-auto">
        {/* Left: Brand, Hamburger & Active Tab Breadcrumb */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Mobile Menu Toggle Button */}
          {onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="lg:hidden p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 transition-all cursor-pointer border border-slate-200 shadow-2xs active:scale-95 shrink-0"
              aria-label="Toggle Navigation Menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5 text-rose-600" /> : <Menu className="w-5 h-5" />}
            </button>
          )}

          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-700 text-white flex items-center justify-center font-black text-xs sm:text-base shadow-md shadow-indigo-200 shrink-0 border border-indigo-400/30">
              ERP
            </div>
            <div className="min-w-0">
              <h1 className="text-xs sm:text-base font-black text-slate-900 tracking-tight leading-none flex items-center gap-1.5 truncate">
                <span className="truncate">ERP Bimbel</span>
                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200 hidden xs:inline-flex items-center gap-1 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Live
                </span>
              </h1>
              <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 line-clamp-1 font-medium hidden sm:block">Sistem Presensi, Penjadwalan & Keuangan</p>
            </div>
          </div>

          {/* Current Page Context Badge */}
          <div className="hidden md:flex items-center gap-2 pl-3 border-l border-slate-200 ml-1 shrink-0">
            <span className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg border shadow-2xs ${pageMeta.color}`}>
              <PageIcon className="w-3.5 h-3.5" />
              <span>{pageMeta.label}</span>
            </span>
          </div>
        </div>

        {/* Right: Quick Actions, Role Switcher & User Profile */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* JSON Backup & Excel Export Action Buttons */}
          {currentUser.role !== 'TENTOR' && (
            <div className="hidden xl:flex items-center gap-1 bg-slate-950 border border-slate-800 p-1 rounded-xl">
              <button
                onClick={() => {
                  exportDatabaseToJson();
                  alert('File backup JSON database ERP berhasil diunduh!');
                }}
                title="Unduh Backup Database ERP dalam format File JSON"
                className="flex items-center gap-1 text-[11px] hover:bg-slate-800 text-slate-100 font-bold px-2.5 py-1 rounded-lg transition-all cursor-pointer"
              >
                <FileJson className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>Backup JSON</span>
              </button>

              <button
                onClick={() => {
                  exportDatabaseToExcelXls();
                }}
                title="Unduh Tabel Database sebagai File Excel (.xls)"
                className="flex items-center gap-1 text-[11px] hover:bg-slate-800 text-teal-300 font-bold px-2.5 py-1 rounded-lg transition-all cursor-pointer border-l border-slate-800"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>Unduh Excel</span>
              </button>
            </div>
          )}

          {/* Role Switcher (Hidden for Tentors) */}
          {currentUser.role !== 'TENTOR' && (
            <div className="flex items-center gap-1 bg-indigo-50/80 border border-indigo-100 p-1 rounded-xl">
              <UserCheck className="w-3.5 h-3.5 text-indigo-600 ml-1 hidden sm:block" />
              <select
                value={currentUser.username}
                onChange={(e) => onSwitchUser(e.target.value)}
                className="text-[11px] sm:text-xs bg-white text-slate-800 font-extrabold px-1.5 sm:px-2 py-1 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 cursor-pointer max-w-[85px] xs:max-w-[105px] sm:max-w-none shadow-2xs truncate"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.username}>
                    {u.name.split(' ')[0]} ({u.role.substring(0, 3)})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* User Avatar & Logout */}
          <div className="flex items-center gap-1.5 sm:gap-2 pl-1.5 sm:pl-2 border-l border-slate-200">
            <button
              onClick={() => {
                if (window.confirm('Apakah Anda yakin ingin menghapus cache sistem?\n\nTindakan ini akan mengosongkan penyimpanan lokal dan mengunduh ulang data terbaru dari server.')) {
                  localStorage.clear();
                  window.location.reload();
                }
              }}
              title="Hapus Cache & Sinkron Ulang"
              className="flex items-center gap-1 text-[11px] sm:text-xs bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 px-2 sm:px-2.5 py-1.5 rounded-xl transition-all cursor-pointer font-bold shadow-2xs active:scale-95 shrink-0 mr-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="hidden xs:inline">Hapus Cache</span>
            </button>
            <div className="text-right hidden md:block">
              <div className="text-xs font-extrabold text-slate-900 leading-tight">{currentUser.name}</div>
              <div className="mt-0.5">{getRoleBadge(currentUser.role)}</div>
            </div>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-indigo-600 text-white font-black flex items-center justify-center text-xs shadow-xs shrink-0">
              {currentUser.name.charAt(0)}
            </div>
            <button
              onClick={onLogout}
              title="Keluar dari ERP"
              className="flex items-center gap-1 text-[11px] sm:text-xs bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 px-2 sm:px-3 py-1.5 rounded-xl transition-all cursor-pointer font-bold shadow-2xs active:scale-95 shrink-0"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};



