import React from 'react';
import { UserRole } from '../types';
import {
  LayoutDashboard, Users, Camera,
  Wallet, Settings, Calendar, X, BookOpen,
  Sparkles, ShieldCheck, ChevronRight, FileSpreadsheet
} from 'lucide-react';

export type TabType =
  | 'dashboard'
  | 'master'
  | 'schedule'
  | 'attendance'
  | 'reports'
  | 'finance'
  | 'modules'
  | 'settings'
  | 'jantung';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  userRole: UserRole;
  pendingApprovalsCount?: number;
  isMobileMenuOpen?: boolean;
  onCloseMobileMenu?: () => void;
}

interface MenuItem {
  id: TabType;
  label: string;
  subLabel?: string;
  icon: React.ElementType;
  roles: UserRole[];
  badge?: number;
  badgeColor?: string;
  color: string;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  userRole,
  pendingApprovalsCount = 0,
  isMobileMenuOpen = false,
  onCloseMobileMenu
}) => {
  const menuSections: MenuSection[] = [
    {
      title: 'UTAMA',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard Overview',
          subLabel: 'Ringkasan & KPI Bimbel',
          icon: LayoutDashboard,
          roles: ['SUPER_ADMIN', 'MANAGEMENT', 'TENTOR'],
          color: 'indigo'
        }
      ]
    },
    {
      title: 'AKADEMIK & PRESENSI',
      items: [
        {
          id: 'schedule',
          label: 'Penjadwalan Les',
          subLabel: 'Jadwal Les & Bimbingan',
          icon: Calendar,
          roles: ['SUPER_ADMIN', 'MANAGEMENT', 'TENTOR'],
          color: 'sky'
        },
        {
          id: 'attendance',
          label: 'Presensi & Foto Mengajar',
          subLabel: 'Absensi Kamera Device',
          icon: Camera,
          roles: ['SUPER_ADMIN', 'MANAGEMENT', 'TENTOR'],
          color: 'emerald'
        },
        {
          id: 'reports',
          label: 'Raport & Evaluasi Siswa',
          subLabel: 'Laporan Belajar & WA Ortu',
          icon: FileSpreadsheet,
          roles: ['SUPER_ADMIN', 'MANAGEMENT', 'TENTOR'],
          color: 'indigo'
        },
        {
          id: 'modules',
          label: 'Modul & Materi Ajar',
          subLabel: 'Bank Soal & Bahan Ajar',
          icon: BookOpen,
          roles: ['SUPER_ADMIN', 'MANAGEMENT', 'TENTOR'],
          color: 'amber'
        }
      ]
    },
    {
      title: 'PENGELOLAAN ERP',
      items: [
        {
          id: 'master',
          label: 'Data Master',
          subLabel: 'Siswa, Tentor, Ortu & Mapel',
          icon: Users,
          roles: ['SUPER_ADMIN', 'MANAGEMENT'],
          badge: pendingApprovalsCount,
          badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
          color: 'purple'
        },
        {
          id: 'finance',
          label: 'Keuangan & SPP',
          subLabel: 'Pemasukan, Gaji & Invoicing',
          icon: Wallet,
          roles: ['SUPER_ADMIN', 'MANAGEMENT'],
          color: 'teal'
        },
        {
          id: 'settings',
          label: 'Pengaturan Sistem',
          subLabel: 'Konfigurasi & Hak Akses',
          icon: Settings,
          roles: ['SUPER_ADMIN', 'MANAGEMENT'],
          color: 'rose'
        },
        {
          id: 'jantung',
          label: 'Jantung Sistem',
          subLabel: 'Pusat Edit, Hapus & Reset',
          icon: ShieldCheck,
          roles: ['SUPER_ADMIN', 'MANAGEMENT'],
          color: 'rose'
        }
      ]
    }
  ];

  const handleSelectTab = (tab: TabType) => {
    setActiveTab(tab);
    if (onCloseMobileMenu) {
      onCloseMobileMenu();
    }
  };

  const getIconColorClasses = (color: string, isActive: boolean) => {
    if (isActive) return 'bg-white/20 text-white shadow-xs';
    switch (color) {
      case 'indigo': return 'bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20';
      case 'sky': return 'bg-sky-500/10 text-sky-400 group-hover:bg-sky-500/20';
      case 'emerald': return 'bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20';
      case 'amber': return 'bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20';
      case 'purple': return 'bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20';
      case 'teal': return 'bg-teal-500/10 text-teal-400 group-hover:bg-teal-500/20';
      case 'rose': return 'bg-rose-500/10 text-rose-400 group-hover:bg-rose-500/20';
      default: return 'bg-slate-800 text-slate-400';
    }
  };

  const navContent = (
    <div className="flex flex-col justify-between h-full space-y-6">
      <div className="space-y-6">
        {/* Sidebar Header Brand Card */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 text-white flex items-center justify-center font-black text-base shadow-lg shadow-indigo-950/80 shrink-0 border border-indigo-400/30">
              <Sparkles className="w-5 h-5 text-indigo-100" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white tracking-tight leading-none flex items-center gap-1.5">
                BIMBEL ERP
                <span className="bg-indigo-500/20 text-indigo-300 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md border border-indigo-500/30">PRO</span>
              </h2>
              <p className="text-[10px] text-slate-400 font-medium mt-1">Sistem Presensi & Management</p>
            </div>
          </div>

          {onCloseMobileMenu && (
            <button
              onClick={onCloseMobileMenu}
              className="lg:hidden p-1.5 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Categorized Menu Items */}
        <div className="space-y-5">
          {menuSections.map((section, idx) => {
            const filteredItems = section.items.filter(item => item.roles.includes(userRole));
            if (filteredItems.length === 0) return null;

            return (
              <div key={idx} className="space-y-1.5">
                <div className="px-3 text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-indigo-500/60"></span>
                  <span>{section.title}</span>
                </div>

                <nav className="space-y-1">
                  {filteredItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;

                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelectTab(item.id)}
                        className={`group w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer text-left relative ${
                          isActive
                            ? 'bg-gradient-to-r from-indigo-600 via-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-950/60 font-bold border-l-4 border-indigo-300'
                            : 'hover:bg-slate-800/80 text-slate-300 hover:text-white hover:translate-x-1'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`p-2 rounded-lg transition-colors shrink-0 ${getIconColorClasses(item.color, isActive)}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="truncate">
                            <div className="truncate font-bold text-xs">{item.label}</div>
                            {item.subLabel && (
                              <div className={`text-[10px] truncate ${isActive ? 'text-indigo-100/90 font-normal' : 'text-slate-400'}`}>
                                {item.subLabel}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          {item.badge && item.badge > 0 ? (
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${item.badgeColor || 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'}`}>
                              {item.badge}
                            </span>
                          ) : null}
                          {isActive && (
                            <ChevronRight className="w-3.5 h-3.5 text-indigo-200 shrink-0" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </nav>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Info Badge */}
      <div className="pt-4 border-t border-slate-800/80 text-xs text-slate-400 flex flex-col gap-2 px-1">
        <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <div className="text-[11px] font-bold text-slate-200">System Live</div>
              <div className="text-[10px] text-slate-400">Database Firestore & Sheet</div>
            </div>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 font-mono">
          <span>ERP Bimbel</span>
          <span className="text-indigo-400 font-bold">v2.5 Pro</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Permanent Sidebar */}
      <aside className="hidden lg:flex w-64 bg-slate-950 text-slate-300 flex-shrink-0 border-r border-slate-800/80 p-4 flex-col justify-between min-h-[calc(100vh-61px)] shadow-xl">
        {navContent}
      </aside>

      {/* Mobile Off-Canvas Slide Drawer Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobileMenu}
          />
          {/* Drawer Content */}
          <div className="relative w-72 max-w-[85vw] bg-slate-950 text-slate-300 p-4 shadow-2xl flex flex-col justify-between z-10 overflow-y-auto border-r border-slate-800">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
};


