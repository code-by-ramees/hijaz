import { useState } from 'react';
import { X, Loader2, ShieldCheck, Sparkles, ShoppingBag, Package, CheckCircle } from 'lucide-react';
import {
  signInWithGoogle,
  setDisplayName,
  type User,
} from '../firebase';

// ─── Types ────────────────────────────────────────────────────────────────────

export type AuthUser = {
  uid: string;
  name: string;
  identifier: string;
  method: 'google' | 'phone';
  photoURL?: string;
};

type Props = {
  onSuccess: (user: AuthUser) => void;
  onClose: () => void;
};

// ─── Shared Input Style ────────────────────────────────────────────────────────

const INPUT_BASE: React.CSSProperties = {
  width: '100%',
  padding: '0.85rem 1.1rem',
  background: 'rgba(255,255,255,0.04)',
  border: '1.5px solid rgba(255,255,255,0.1)',
  borderRadius: '12px',
  color: 'white',
  outline: 'none',
  fontSize: '1rem',
  fontFamily: "'Inter', sans-serif",
  transition: 'all 200ms ease',
  boxSizing: 'border-box',
};

// ─── Main Modal ───────────────────────────────────────────────────────────────

export default function LoginModal({ onSuccess, onClose }: Props) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingUser, setPendingUser] = useState<User | null>(null);
  const [name, setName] = useState('');

  // ── Google Sign-In ──────────────────────────────────────────────────────────
  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    try {
      const user = await signInWithGoogle();
      // If user profile doesn't have a display name, prompt for one
      if (!user.displayName) {
        setPendingUser(user);
        setLoading(false);
        return;
      }
      onSuccess({
        uid:        user.uid,
        name:       user.displayName,
        identifier: user.email ?? '',
        method:     'google',
        photoURL:   user.photoURL ?? undefined,
      });
    } catch (e: any) {
      if (e?.code === 'auth/popup-closed-by-user') {
        setError('Sign-in cancelled. Please try again.');
      } else {
        setError(e?.message ?? 'Google sign-in failed. Please try again.');
      }
      setLoading(false);
    }
  };

  // ── Save Name (if Google account has no display name) ─────────────────────────
  const handleSaveName = async () => {
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      if (pendingUser) {
        await setDisplayName(pendingUser, name.trim());
        onSuccess({
          uid:        pendingUser.uid,
          name:       name.trim(),
          identifier: pendingUser.email ?? '',
          method:     'google',
          photoURL:   pendingUser.photoURL ?? undefined,
        });
      }
    } catch (e: any) {
      setError('Failed to save your name. Please try again.');
      setLoading(false);
    }
  };

  // ── Overlay Click ───────────────────────────────────────────────────────────
  const handleOverlay = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleOverlay}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          animation: 'fadeIn 200ms ease forwards',
        }}
      >
        {/* Card */}
        <div
          style={{
            width: '100%',
            maxWidth: '430px',
            background: 'linear-gradient(160deg, #161311 0%, #0c0a09 100%)',
            border: '1px solid rgba(155,106,69,0.25)',
            borderRadius: '28px',
            padding: '2.5rem 2rem',
            position: 'relative',
            boxShadow: '0 40px 80px rgba(0,0,0,0.8), 0 0 60px rgba(155,106,69,0.12)',
            animation: 'slideUp 280ms cubic-bezier(0.34,1.28,0.64,1) forwards',
          }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              position: 'absolute',
              top: '1.25rem',
              right: '1.25rem',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.04)',
              color: 'rgba(255,255,255,0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 150ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
              e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
            }}
          >
            <X size={16} />
          </button>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.3rem 0.8rem',
              borderRadius: '999px',
              background: 'rgba(155,106,69,0.12)',
              border: '1px solid rgba(155,106,69,0.3)',
              marginBottom: '0.75rem',
            }}>
              <Sparkles size={12} color="#c8976a" />
              <span style={{
                fontSize: '0.68rem',
                fontWeight: 800,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: '#c8976a',
              }}>
                HIJAZ LUXURY
              </span>
            </div>

            <h2 style={{
              fontSize: '1.6rem',
              fontWeight: 800,
              color: 'white',
              margin: '0.2rem 0 0',
              letterSpacing: '-0.02em',
            }}>
              {pendingUser ? "What's your name?" : "Welcome to HIJAZ"}
            </h2>
            <p style={{
              fontSize: '0.84rem',
              color: 'rgba(255,255,255,0.5)',
              margin: '0.5rem 0 0',
              lineHeight: 1.5,
            }}>
              {pendingUser
                ? 'Please complete your profile to continue'
                : 'Sign in with your Google account for a personalized shopping experience'}
            </p>
          </div>

          {/* Name step if Google account missing displayName */}
          {pendingUser ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input
                type="text"
                placeholder="Your full name"
                value={name}
                autoFocus
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveName(); }}
                style={INPUT_BASE}
              />
              {error && <ErrorMsg text={error} />}
              <button
                onClick={handleSaveName}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '0.9rem',
                  borderRadius: '14px',
                  border: 'none',
                  background: loading ? 'rgba(155,106,69,0.35)' : 'linear-gradient(135deg, #7A4E2D, #9B6A45)',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  cursor: loading ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'all 200ms ease',
                  boxShadow: '0 4px 18px rgba(122,78,45,0.35)',
                }}
              >
                {loading ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle size={16} />}
                Continue
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Google Button */}
              <button
                onClick={handleGoogle}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '0.95rem 1.25rem',
                  borderRadius: '16px',
                  border: '1.5px solid rgba(255,255,255,0.15)',
                  background: loading ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.08)',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.85rem',
                  cursor: loading ? 'default' : 'pointer',
                  transition: 'all 200ms ease',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                  opacity: loading ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.14)';
                    e.currentTarget.style.borderColor = 'rgba(155,106,69,0.5)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                {loading ? (
                  <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <svg width="22" height="22" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                Continue with Google
              </button>

              {error && <ErrorMsg text={error} />}

              {/* Benefits feature list */}
              <div style={{
                background: 'rgba(255,255,255,0.02)',
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.05)',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '8px',
                    background: 'rgba(155,106,69,0.15)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', color: '#c8976a', flexShrink: 0
                  }}>
                    <ShoppingBag size={14} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'white' }}>Personalized Cart</div>
                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>Saved specifically to your account</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '8px',
                    background: 'rgba(155,106,69,0.15)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', color: '#c8976a', flexShrink: 0
                  }}>
                    <Package size={14} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'white' }}>Private Order History</div>
                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>Track your luxury orders securely</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '8px',
                    background: 'rgba(155,106,69,0.15)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', color: '#c8976a', flexShrink: 0
                  }}>
                    <ShieldCheck size={14} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'white' }}>Secure Single Sign-On</div>
                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>Protected by Google Security</div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <p style={{
                textAlign: 'center',
                fontSize: '0.72rem',
                color: 'rgba(255,255,255,0.3)',
                lineHeight: 1.6,
                margin: 0,
              }}>
                By signing in you agree to HIJAZ's{' '}
                <span style={{ color: '#c8976a', cursor: 'pointer' }}>Terms of Service</span>
                {' '}and{' '}
                <span style={{ color: '#c8976a', cursor: 'pointer' }}>Privacy Policy</span>.
              </p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px) scale(0.98) } to { opacity: 1; transform: translateY(0) scale(1) } }
        @keyframes spin    { to { transform: rotate(360deg) } }
      `}</style>
    </>
  );
}

// ─── Shared small components ──────────────────────────────────────────────────

function ErrorMsg({ text }: { text: string }) {
  return (
    <p style={{
      fontSize: '0.8rem',
      color: '#f87171',
      background: 'rgba(248,113,113,0.08)',
      border: '1px solid rgba(248,113,113,0.15)',
      borderRadius: '8px',
      padding: '0.6rem 0.85rem',
      margin: 0,
    }}>
      {text}
    </p>
  );
}
