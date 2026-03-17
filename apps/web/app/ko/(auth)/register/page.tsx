'use client';

import { createClient } from '@/lib/supabase/client';
import { CheckCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function RegisterPage() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const t = useTranslations('auth');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError(t('passwordMismatch'));
      return;
    }

    if (password.length < 6) {
      setError(t('passwordMinLength'));
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          setError(t('alreadyRegistered'));
        } else {
          setError(authError.message);
        }
        return;
      }

      setSuccess(true);
    } catch {
      setError(t('registerError'));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center gap-5 py-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 shadow-lg shadow-emerald-600/5">
          <CheckCircle className="w-8 h-8" strokeWidth={1.5} />
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">{t('successTitle')}</h2>
          <p className="text-sm font-medium text-slate-500 leading-relaxed">
            {t('successMessage')}
            <br />
            {t('successMessage2')}
          </p>
        </div>
        <Link
          href="/ko/login"
          className="mt-4 inline-flex h-11 items-center justify-center rounded-lg bg-emerald-600 px-10 font-bold text-white transition-all hover:bg-emerald-700 active:scale-[0.98] shadow-lg shadow-emerald-600/10"
        >
          {t('goToLoginButton')}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleRegister} className="flex flex-col gap-6">
      <h2 className="text-xl font-bold text-slate-900 tracking-tight">{t('registerTitle')}</h2>

      {error && (
        <p className="flex items-center gap-1.5 text-xs font-medium text-rose-600">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
          {error}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <label
          htmlFor="displayName"
          className="text-xs font-bold text-slate-700 uppercase tracking-wider"
        >
          {t('nameLabel')}
        </label>
        <input
          id="displayName"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder={t('namePlaceholder')}
          required
          className="h-11 rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
        />
      </div>

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
          placeholder={t('passwordPlaceholder')}
          required
          minLength={6}
          className="h-11 rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="confirmPassword"
          className="text-xs font-bold text-slate-700 uppercase tracking-wider"
        >
          {t('confirmPasswordLabel')}
        </label>
        <input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder={t('confirmPasswordPlaceholder')}
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
        {loading ? t('registerLoading') : t('registerButton')}
      </button>

      <p className="text-center text-sm text-slate-500 font-medium">
        {t('hasAccount')}{' '}
        <Link href="/ko/login" className="font-bold text-emerald-600 hover:text-emerald-700">
          {t('goToLogin')}
        </Link>
      </p>
    </form>
  );
}
