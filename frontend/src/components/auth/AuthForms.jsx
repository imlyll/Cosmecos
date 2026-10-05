import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import Field, { applyServerErrors } from '../ui/Field';
import Button from '../ui/Button';
import { RotateCw } from 'lucide-react';
import clsx from 'clsx';
import { useForgotPassword, useLogin, useRegister, useResetPassword } from '../../hooks/useAuth';
import { errorMessage } from '../../i18n';
import { formatTime, useCountdown } from './OtpForm';

// Messages are translation keys, resolved when rendered so they follow the current language.
const loginSchema = z.object({
  email: z.string().trim().email('auth.errors.email'),
  password: z.string().min(1, 'auth.errors.passwordRequired'),
});

const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'auth.errors.name'),
    email: z.string().trim().email('auth.errors.email'),
    password: z
      .string()
      .min(8, 'auth.errors.min8')
      .regex(/[A-Za-z]/, 'auth.errors.letter')
      .regex(/\d/, 'auth.errors.number'),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { message: 'auth.errors.mismatch', path: ['confirm'] });

const forgotSchema = z.object({ email: z.string().trim().email('auth.errors.email') });

const resetSchema = z
  .object({
    code: z.string().trim().regex(/^\d{6}$/, 'forgot.errors.code'),
    password: z
      .string()
      .min(8, 'auth.errors.min8')
      .regex(/[A-Za-z]/, 'auth.errors.letter')
      .regex(/\d/, 'auth.errors.number'),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { message: 'auth.errors.mismatch', path: ['confirm'] });

function FormError({ message }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.p
          role="alert"
          className="border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          {message}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

/** Translates a field error (a key from the schemas above, or a server message that is shown as-is). */
function useFieldError() {
  const { t } = useTranslation();
  return (error) => error?.message && t(error.message);
}

/**
 * `onVerify({ email, resendAvailableIn })` is called when the account exists but its email
 * is not verified yet; the API has just emailed a new code.
 */
export function LoginForm({ onSuccess, onSwitch, onVerify, onForgot }) {
  const { t } = useTranslation();
  const fieldError = useFieldError();
  const login = useLogin();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(loginSchema) });

  const onSubmit = (values) =>
    login.mutate(values, {
      onSuccess,
      onError: (err) => {
        if (err.code === 'EMAIL_NOT_VERIFIED' && onVerify) {
          toast(t('toast.verifyFirst'));
          onVerify({ email: err.data?.email || values.email.trim().toLowerCase(), resendAvailableIn: err.data?.resendAvailableIn });
        }
      },
    });

  const unverified = login.error?.code === 'EMAIL_NOT_VERIFIED' && onVerify;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <FormError message={!unverified && errorMessage(login.error)} />
      <Field label={t('auth.email')} type="email" autoComplete="email" error={fieldError(errors.email)} {...register('email')} />
      <Field
        label={t('auth.password')}
        type="password"
        autoComplete="current-password"
        error={fieldError(errors.password)}
        {...register('password')}
      />
      {onForgot && (
        <p className="-mt-2 text-right text-sm">
          <button type="button" onClick={onForgot} className="link-underline text-taupe hover:text-ink">
            {t('forgot.link')}
          </button>
        </p>
      )}
      <Button type="submit" className="w-full" loading={login.isPending}>
        {t('common.signIn')}
      </Button>
      {onSwitch && (
        <p className="text-center text-sm text-taupe">
          {t('auth.newHere')}{' '}
          <button type="button" onClick={onSwitch} className="link-underline font-medium text-ink">
            {t('auth.createAnAccount')}
          </button>
        </p>
      )}
    </form>
  );
}

/** Registration step 1. `onVerify({ email, resendAvailableIn, expiresInMinutes })` moves on to the code screen. */
export function RegisterForm({ onVerify, onSwitch }) {
  const { t } = useTranslation();
  const fieldError = useFieldError();
  const registerUser = useRegister();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({ resolver: zodResolver(registerSchema) });

  const onSubmit = ({ confirm: _confirm, ...values }) =>
    registerUser.mutate(values, {
      onSuccess: (data) => onVerify?.(data),
      onError: (err) => applyServerErrors(err, setError),
    });

  const formError = registerUser.error?.message !== 'Validation failed' && errorMessage(registerUser.error);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <FormError message={formError} />
      <Field label={t('auth.fullName')} autoComplete="name" error={fieldError(errors.name)} {...register('name')} />
      <Field label={t('auth.email')} type="email" autoComplete="email" error={fieldError(errors.email)} {...register('email')} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label={t('auth.password')}
          type="password"
          autoComplete="new-password"
          error={fieldError(errors.password)}
          {...register('password')}
        />
        <Field
          label={t('auth.confirm')}
          type="password"
          autoComplete="new-password"
          error={fieldError(errors.confirm)}
          {...register('confirm')}
        />
      </div>
      <Button type="submit" className="w-full" loading={registerUser.isPending}>
        {t('auth.createAccount')}
      </Button>
      {onSwitch && (
        <p className="text-center text-sm text-taupe">
          {t('auth.haveAccount')}{' '}
          <button type="button" onClick={onSwitch} className="link-underline font-medium text-ink">
            {t('common.signIn')}
          </button>
        </p>
      )}
    </form>
  );
}

/**
 * "Forgot password": step 1 asks for the email, step 2 takes the emailed code and the new password.
 * Success signs the user in (`onSuccess`). `onBack` returns to the sign-in form.
 */
export function ForgotPasswordForm({ onSuccess, onBack }) {
  const { t } = useTranslation();
  const fieldError = useFieldError();
  const forgot = useForgotPassword();
  const resetPassword = useResetPassword();
  const [email, setEmail] = useState(null);
  const [cooldown, setCooldown] = useCountdown(0);

  const emailForm = useForm({ resolver: zodResolver(forgotSchema) });
  const resetForm = useForm({ resolver: zodResolver(resetSchema) });

  const sendCode = (value) =>
    forgot.mutate(
      { email: value },
      {
        onSuccess: (data) => {
          setEmail(value.trim().toLowerCase());
          setCooldown(data.resendAvailableIn ?? 60);
          toast.success(t('forgot.codeSent'));
        },
      }
    );

  const onReset = ({ code, password }) =>
    resetPassword.mutate({ email, code, password }, { onSuccess, onError: (err) => applyServerErrors(err, resetForm.setError) });

  if (!email) {
    const { errors } = emailForm.formState;
    return (
      <form onSubmit={emailForm.handleSubmit(({ email: value }) => sendCode(value))} className="space-y-5" noValidate>
        <p className="text-sm leading-relaxed text-taupe">{t('forgot.intro')}</p>
        <FormError message={errorMessage(forgot.error)} />
        <Field label={t('auth.email')} type="email" autoComplete="email" error={fieldError(errors.email)} {...emailForm.register('email')} />
        <Button type="submit" className="w-full" loading={forgot.isPending}>
          {t('forgot.sendCode')}
        </Button>
        {onBack && (
          <p className="text-center text-sm">
            <button type="button" onClick={onBack} className="link-underline text-taupe hover:text-ink">
              {t('forgot.backToSignIn')}
            </button>
          </p>
        )}
      </form>
    );
  }

  const { errors } = resetForm.formState;
  const formError = resetPassword.error?.message !== 'Validation failed' && errorMessage(resetPassword.error);
  return (
    <form onSubmit={resetForm.handleSubmit(onReset)} className="space-y-5" noValidate>
      <p className="text-sm leading-relaxed text-taupe">{t('forgot.sentTo', { email })}</p>
      <FormError message={formError} />
      <Field
        label={t('forgot.code')}
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        error={fieldError(errors.code)}
        {...resetForm.register('code')}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label={t('forgot.newPassword')}
          type="password"
          autoComplete="new-password"
          error={fieldError(errors.password)}
          {...resetForm.register('password')}
        />
        <Field
          label={t('auth.confirm')}
          type="password"
          autoComplete="new-password"
          error={fieldError(errors.confirm)}
          {...resetForm.register('confirm')}
        />
      </div>
      <Button type="submit" className="w-full" loading={resetPassword.isPending}>
        {t('forgot.submit')}
      </Button>
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <p className="text-taupe">
          {t('otp.didntGet')}{' '}
          {cooldown > 0 ? (
            <span className="font-medium text-ink tabular-nums" aria-live="polite">
              {t('otp.resendIn', { time: formatTime(cooldown) })}
            </span>
          ) : (
            <button
              type="button"
              onClick={() => sendCode(email)}
              disabled={forgot.isPending}
              className="link-underline inline-flex items-center gap-1.5 font-medium text-ink"
            >
              <RotateCw className={clsx('size-3.5', forgot.isPending && 'animate-spin')} />
              {forgot.isPending ? t('otp.sending') : t('otp.resend')}
            </button>
          )}
        </p>
        <button type="button" onClick={() => setEmail(null)} className="link-underline text-taupe hover:text-ink">
          {t('otp.changeEmail')}
        </button>
      </div>
    </form>
  );
}
