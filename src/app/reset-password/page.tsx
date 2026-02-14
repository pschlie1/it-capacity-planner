'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { BarChart3, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong');
      } else {
        setSuccess(true);
      }
    } catch {
      setError('Network error');
    }

    setLoading(false);
  };

  if (!token) {
    return (
      <div className="text-center">
        <p className="text-sm text-red-400 mb-4">Invalid reset link. No token provided.</p>
        <Link href="/login" className="text-primary hover:underline text-sm">
          <ArrowLeft className="w-4 h-4 inline mr-1" /> Back to Login
        </Link>
      </div>
    );
  }

  return success ? (
    <div className="text-center">
      <p className="text-sm text-green-400 mb-4">Password reset successful!</p>
      <Link href="/login" className="text-primary hover:underline text-sm">
        <ArrowLeft className="w-4 h-4 inline mr-1" /> Sign In
      </Link>
    </div>
  ) : (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}
      <div className="mb-4">
        <label className="text-xs text-muted-foreground mb-1 block">New Password</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          minLength={6}
          className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>
      <div className="mb-6">
        <label className="text-xs text-muted-foreground mb-1 block">Confirm Password</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          required
          minLength={6}
          className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 disabled:opacity-50"
      >
        {loading ? 'Resetting...' : 'Reset Password'}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">Reset Password</h1>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <Suspense fallback={<div>Loading...</div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
