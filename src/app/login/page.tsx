'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Lock, User, LogIn, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim() || !password.trim()) {
      setErrorMsg('Por favor ingresa usuario y contraseña.');
      return;
    }

    setLoading(true);

    try {
      // Consultar directamente la tabla personalizada app_users
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('username', username.trim())
        .eq('password', password.trim())
        .maybeSingle();

      if (error) {
        console.error('Error de base de datos:', error);
        setErrorMsg('Error al conectar con la base de datos. Verifica si creaste la tabla app_users.');
        setLoading(false);
        return;
      }

      if (!data) {
        setErrorMsg('Usuario o contraseña incorrectos.');
        setLoading(false);
        return;
      }

      // Guardar sesión simple en localStorage
      const sessionData = {
        id: data.id,
        username: data.username,
        role: data.role,
        loggedInAt: new Date().toISOString()
      };
      
      localStorage.setItem('session_user', JSON.stringify(sessionData));
      
      // Redirigir al dashboard
      router.push('/');
      // Forzar recarga ligera para sincronizar estados de layout
      router.refresh();
    } catch (err: any) {
      console.error('Login error:', err);
      setErrorMsg('Ocurrió un error inesperado al intentar iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50/50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-[32px] p-8 md:p-10 shadow-xl shadow-slate-100 border border-slate-200/80 transition-all">
        
        {/* Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-200 mb-4 animate-pulse">
            <LogIn size={28} />
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-none">PRENSA</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">Monitoreo • Control de Acceso</p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-600 animate-fadeIn">
            <AlertCircle size={20} className="shrink-0 mt-0.5" />
            <p className="text-xs font-semibold leading-normal">{errorMsg}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          {/* Username Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-1">Usuario</label>
            <div className="relative flex items-center">
              <User size={18} className="absolute left-4 text-slate-400" />
              <input
                type="text"
                placeholder="Ingresa tu usuario (ej. admin)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all disabled:opacity-70"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-1">Contraseña</label>
            <div className="relative flex items-center">
              <Lock size={18} className="absolute left-4 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all disabled:opacity-70"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute right-4 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-700 active:scale-[0.98] transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-70 disabled:pointer-events-none"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>Ingresar <LogIn size={16} /></>
            )}
          </button>
        </form>

      </div>
    </main>
  );
}
