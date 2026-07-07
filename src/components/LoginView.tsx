import React, { useState } from 'react';
import { User } from '../types';
import { Lock, User as UserIcon, Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';

interface LoginViewProps {
  users: User[];
  onLoginSuccess: (user: User) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ users, onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!username.trim() || !password.trim()) {
      setErrorMsg('Harap isi Username dan Password terlebih dahulu.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      // Find matching user by username
      const foundUser = users.find(
        (u) => u.username.toLowerCase() === username.trim().toLowerCase()
      );

      if (!foundUser) {
        setErrorMsg('Username tidak terdaftar dalam sistem. Hubungi Manajemen.');
        setIsSubmitting(false);
        return;
      }

      const expectedPassword = foundUser.passwordHash || 'admin123';

      if (password !== expectedPassword) {
        setErrorMsg('Password salah. Silakan periksa kembali password Anda.');
        setIsSubmitting(false);
        return;
      }

      if (foundUser.status === 'Nonaktif') {
        setErrorMsg('Akun Anda dalam status Nonaktif. Silakan hubungi Manajemen.');
        setIsSubmitting(false);
        return;
      }

      setIsSubmitting(false);
      onLoginSuccess(foundUser);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-2xl space-y-6">
        {/* Branding Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-md shadow-indigo-200 mx-auto border border-indigo-400">
            ERP
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Masuk Akun ERP</h1>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Sistem Operasional Bimbel Privat
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3.5 rounded-2xl flex items-start gap-3 text-xs animate-shake">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-bold">Gagal Masuk</div>
              <div>{errorMsg}</div>
            </div>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Username Akun
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <UserIcon className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username Anda"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password Anda"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs py-3 px-4 rounded-xl shadow-md shadow-indigo-200 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 active:scale-95 mt-2"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Masuk ke Sistem ERP</span>
              </>
            )}
          </button>
        </form>

        <div className="pt-2 text-center text-[11px] text-slate-400 border-t border-slate-100">
          Lupa password? Hubungi Tim Manajemen Bimbel.
        </div>
      </div>
    </div>
  );
};
