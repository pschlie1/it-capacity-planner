'use client';

import { useState } from 'react';
import { BarChart3, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Something went wrong');
      } else {
        setSubmitted(true);
      }
    } catch {
      setError('Network error');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">Forgot Password</h1>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          {submitted ? (
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                If an account with that email exists, a reset link has been generated.
                Check the server logs for the reset URL.
              </p>
              <Link href="/login" className="text-primary hover:underline text-sm">
                <ArrowLeft className="w-4 h-4 inline mr-1" /> Back to Login
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
                <label className="text-xs text-muted-foreground mb-1 block">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="you@company.com"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
              <div className="mt-4 text-center">
                <Link href="/login" className="text-primary hover:underline text-sm">
                  <ArrowLeft className="w-4 h-4 inline mr-1" /> Back to Login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
