'use client';

import { createClient } from '@/lib/supabase/client';
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
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/20 text-3xl">
          🎉
        </div>
        <h2 className="text-xl font-semibold text-foreground">{t('successTitle')}</h2>
        <p className="text-sm text-muted-foreground">
          {t('successMessage')}
          <br />
          {t('successMessage2')}
        </p>
        <Link
          href="/ko/login"
          className="mt-2 inline-flex h-11 items-center justify-center rounded-xl bg-primary px-8 font-semibold text-primary-foreground transition-all hover:bg-primary/90"
        >
          {t('goToLoginButton')}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleRegister} className="flex flex-col gap-5">
      <h2 className="text-center text-xl font-semibold text-foreground">{t('registerTitle')}</h2>

      {error && (
        <div className="rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">{error}</div>
      )}

      <div className="flex flex-col gap-2">
        <label htmlFor="displayName" className="text-sm font-medium text-foreground">
          {t('nameLabel')}
        </label>
        <input
          id="displayName"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder={t('namePlaceholder')}
          required
          className="h-11 rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="text-sm font-medium text-foreground">
          {t('emailLabel')}
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('emailPlaceholder')}
          required
          className="h-11 rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="text-sm font-medium text-foreground">
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
          className="h-11 rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
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
          className="h-11 rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="h-11 rounded-xl bg-primary font-semibold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? t('registerLoading') : t('registerButton')}
      </button>

      <p className="text-center text-sm text-muted-foreground">
        {t('hasAccount')}{' '}
        <Link href="/ko/login" className="font-medium text-primary hover:underline">
          {t('goToLogin')}
        </Link>
      </p>
    </form>
  );
}
