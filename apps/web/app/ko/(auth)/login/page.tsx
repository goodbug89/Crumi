'use client';

import { createClient } from '@/lib/supabase/client';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const t = useTranslations('auth');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(
          authError.message === 'Invalid login credentials'
            ? t('invalidCredentials')
            : authError.message,
        );
        return;
      }

      router.push('/ko/workspace-select');
      router.refresh();
    } catch {
      setError(t('loginError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="flex flex-col gap-6">
      <h2 className="text-xl font-bold text-slate-900 tracking-tight">{t('loginTitle')}</h2>

      {error && (
        <div className="rounded-lg bg-rose-50 border border-rose-100 px-4 py-3 text-xs font-bold text-rose-600">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label
          htmlFor="email"
          className="text-xs font-bold text-slate-700 uppercase tracking-wider"
        >
          {t('emailLabel')}
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('emailPlaceholder')}
          required
          className="h-11 rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="password"
          className="text-xs font-bold text-slate-700 uppercase tracking-wider"
        >
          {t('passwordLabel')}
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          minLength={6}
          className="h-11 rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="h-11 rounded-lg bg-emerald-600 font-bold text-white transition-all hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-600/10 mt-2"
      >
        {loading ? t('loginLoading') : t('loginButton')}
      </button>

      <p className="text-center text-sm text-slate-500 font-medium">
        {t('noAccount')}{' '}
        <Link href="/ko/register" className="font-bold text-emerald-600 hover:text-emerald-700">
          {t('registerFree')}
        </Link>
      </p>
    </form>
  );
}
