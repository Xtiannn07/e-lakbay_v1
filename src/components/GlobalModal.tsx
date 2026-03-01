import React, { useEffect, useMemo, useState } from 'react';
import { useModal } from './ModalContext';
import { Button } from './modern-ui/button';
import { useAuth } from './AuthProvider';
import {
  type AuthFormState,
  type AuthMode,
  validateAuthForm,
} from '../lib/utils';

interface GlobalModalProps {
  onModeChange?: (mode: AuthMode) => void;
}

const initialFormState: AuthFormState = {
  email: '',
  password: '',
  confirmPassword: '',
  fullName: '',
  remember: false,
};

export const GlobalModal: React.FC<GlobalModalProps> = ({ onModeChange }) => {
  const { open, type, closeModal, openModal } = useModal();
  const { signIn, signInWithGoogle, signUp } = useAuth();
  const [formState, setFormState] = useState<AuthFormState>(initialFormState);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  useEffect(() => {
    setFormState(initialFormState);
    setFormError(null);
    setIsSubmitting(false);
  }, [type]);

  const isSignup = type === 'signup';

  const primaryLabel = useMemo(() => (isSignup ? 'Create Account' : 'Log In'), [isSignup]);
  const switchLabel = useMemo(
    () => (isSignup ? 'Already have an account? Log in' : "Don't have an account? Sign up"),
    [isSignup]
  );

  const handleChange = (key: keyof AuthFormState) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = key === 'remember' ? event.target.checked : event.target.value;
    setFormState((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!type) return;
    if (isSubmitting) return;

    const validationError = validateAuthForm(type, formState);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setFormError(null);
    setIsSubmitting(true);
    try {
      const errorMessage = isSignup
        ? await signUp(formState.email, formState.password, formState.fullName)
        : await signIn(formState.email, formState.password);

      if (errorMessage) {
        setFormError(errorMessage);
        return;
      }

      closeModal();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Something went wrong. Please try again.';
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    const viewport = window.visualViewport;
    if (!viewport) return;

    const updateKeyboardState = () => {
      const heightDiff = window.innerHeight - viewport.height;
      setIsKeyboardOpen(heightDiff > 140);
    };

    updateKeyboardState();
    viewport.addEventListener('resize', updateKeyboardState);
    viewport.addEventListener('scroll', updateKeyboardState);
    return () => {
      viewport.removeEventListener('resize', updateKeyboardState);
      viewport.removeEventListener('scroll', updateKeyboardState);
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex justify-center bg-black/50 px-4 overflow-y-auto ${
        isKeyboardOpen ? 'items-start py-3' : 'items-center py-6'
      }`}
      onClick={closeModal}
      role="presentation"
    >
      <div
        className="glass-secondary modal-stone-text rounded-2xl p-8 w-full max-w-md relative max-h-[85vh] md:max-h-none overflow-y-auto hide-scrollbar"
        style={isKeyboardOpen ? { marginTop: '0.5rem' } : undefined}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
      >
        <button
          className="absolute top-3 right-3 modal-stone-muted hover:opacity-80 text-2xl font-bold"
          onClick={closeModal}
          aria-label="Close"
        >
          ×
        </button>
        <h2 className="text-2xl font-semibold mb-2 text-center" id="auth-modal-title">
          {isSignup ? 'Create your account' : 'Welcome back'}
        </h2>
        <p className="text-sm modal-stone-muted mb-6 text-center">
          {isSignup ? 'Start planning your next journey in minutes.' : 'Sign in to continue exploring.'}
        </p>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          {!isSignup && (
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-full"
              onClick={async () => {
                if (isSubmitting) return;
                setFormError(null);
                setIsSubmitting(true);
                try {
                  const errorMessage = await signInWithGoogle();
                  if (errorMessage) {
                    setFormError(errorMessage);
                  }
                } catch (error) {
                  const message = error instanceof Error ? error.message : 'Something went wrong. Please try again.';
                  setFormError(message);
                } finally {
                  setIsSubmitting(false);
                }
              }}
              loading={isSubmitting}
            >
              Continue with Google
            </Button>
          )}
          {!isSignup && (
            <div className="flex items-center gap-3 text-xs modal-stone-soft">
              <span className="h-px flex-1 bg-white/10" />
              OR
              <span className="h-px flex-1 bg-white/10" />
            </div>
          )}
          {isSignup && (
            <input
              type="text"
              placeholder="Full name"
              value={formState.fullName}
              onChange={handleChange('fullName')}
              className="rounded px-4 py-2 bg-white/15 border border-white/30 modal-stone-text placeholder:text-primary focus:outline-none focus:ring-2 focus:ring-white/50"
              required
            />
          )}
          <input
            type="email"
            placeholder="Email address"
            value={formState.email}
            onChange={handleChange('email')}
            className="rounded px-4 py-2 bg-white/15 border border-white/30 modal-stone-text placeholder:text-primary focus:outline-none focus:ring-2 focus:ring-white/50"
            required
          />
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={formState.password}
              onChange={handleChange('password')}
              className="w-full rounded px-4 py-2 pr-10 bg-white/15 border border-white/30 modal-stone-text placeholder:text-primary focus:outline-none focus:ring-2 focus:ring-white/50"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white/90 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
          {isSignup && (
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm password"
                value={formState.confirmPassword}
                onChange={handleChange('confirmPassword')}
                className="w-full rounded px-4 py-2 pr-10 bg-white/15 border border-white/30 modal-stone-text placeholder:text-primary focus:outline-none focus:ring-2 focus:ring-white/50"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white/90 transition-colors"
                tabIndex={-1}
              >
                {showConfirmPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          )}
          {!isSignup && (
            <label className="flex items-center gap-2 text-sm modal-stone-muted">
              <input
                type="checkbox"
                checked={formState.remember}
                onChange={handleChange('remember')}
                className="h-4 w-4 rounded border-white/40 bg-white/20"
              />
              Remember me
            </label>
          )}
          {formError && (
            <div className="text-sm text-red-200 bg-red-500/20 border border-red-200/30 rounded px-3 py-2">
              {formError}
            </div>
          )}
          <Button
            className="w-full rounded-full mt-2"
            variant="default"
            type="submit"
            loading={isSubmitting}
          >
            {isSubmitting ? 'Please wait...' : primaryLabel}
          </Button>
        </form>
        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={() => {
              const nextMode = isSignup ? 'login' : 'signup';
              onModeChange?.(nextMode);
              openModal(nextMode);
            }}
            className="text-sm modal-stone-text"
          >
            {switchLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
