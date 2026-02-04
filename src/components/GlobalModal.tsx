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
  const { signIn, signUp } = useAuth();
  const [formState, setFormState] = useState<AuthFormState>(initialFormState);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={closeModal}
      role="presentation"
    >
      <div
        className="glass-secondary rounded-2xl shadow-2xl p-8 w-full max-w-md relative text-white"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
      >
        <button
          className="absolute top-3 right-3 text-white/70 hover:text-white text-2xl font-bold"
          onClick={closeModal}
          aria-label="Close"
        >
          ×
        </button>
        <h2 className="text-2xl font-semibold mb-2 text-center" id="auth-modal-title">
          {isSignup ? 'Create your account' : 'Welcome back'}
        </h2>
        <p className="text-sm text-white/80 mb-6 text-center">
          {isSignup ? 'Start planning your next journey in minutes.' : 'Sign in to continue exploring.'}
        </p>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          {isSignup && (
            <input
              type="text"
              placeholder="Full name"
              value={formState.fullName}
              onChange={handleChange('fullName')}
              className="rounded px-4 py-2 bg-white/15 border border-white/30 text-white placeholder:text-white/70 focus:outline-none focus:ring-2 focus:ring-white/50"
              required
            />
          )}
          <input
            type="email"
            placeholder="Email address"
            value={formState.email}
            onChange={handleChange('email')}
            className="rounded px-4 py-2 bg-white/15 border border-white/30 text-white placeholder:text-white/70 focus:outline-none focus:ring-2 focus:ring-white/50"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={formState.password}
            onChange={handleChange('password')}
            className="rounded px-4 py-2 bg-white/15 border border-white/30 text-white placeholder:text-white/70 focus:outline-none focus:ring-2 focus:ring-white/50"
            required
          />
          {isSignup && (
            <input
              type="password"
              placeholder="Confirm password"
              value={formState.confirmPassword}
              onChange={handleChange('confirmPassword')}
              className="rounded px-4 py-2 bg-white/15 border border-white/30 text-white placeholder:text-white/70 focus:outline-none focus:ring-2 focus:ring-white/50"
              required
            />
          )}
          {!isSignup && (
            <label className="flex items-center gap-2 text-sm text-white/80">
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
            className="text-sm text-white"
          >
            {switchLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
