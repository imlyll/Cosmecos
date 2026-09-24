import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AnimatePresence, motion } from 'framer-motion';
import Field, { applyServerErrors } from '../ui/Field';
import Button from '../ui/Button';
import { useLogin, useRegister } from '../../hooks/useAuth';

const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Please enter your name'),
    email: z.string().trim().email('Enter a valid email address'),
    password: z
      .string()
      .min(8, 'At least 8 characters')
      .regex(/[A-Za-z]/, 'Include at least one letter')
      .regex(/\d/, 'Include at least one number'),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { message: 'Passwords do not match', path: ['confirm'] });

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

export function LoginForm({ onSuccess, onSwitch }) {
  const login = useLogin();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(loginSchema) });

  const onSubmit = (values) => login.mutate(values, { onSuccess });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <FormError message={login.error?.message} />
      <Field label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
      <Field
        label="Password"
        type="password"
        autoComplete="current-password"
        error={errors.password?.message}
        {...register('password')}
      />
      <Button type="submit" className="w-full" loading={login.isPending}>
        Sign in
      </Button>
      {onSwitch && (
        <p className="text-center text-sm text-taupe">
          New to Cosmecos?{' '}
          <button type="button" onClick={onSwitch} className="link-underline font-medium text-ink">
            Create an account
          </button>
        </p>
      )}
    </form>
  );
}

export function RegisterForm({ onSuccess, onSwitch }) {
  const registerUser = useRegister();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({ resolver: zodResolver(registerSchema) });

  const onSubmit = ({ confirm: _confirm, ...values }) =>
    registerUser.mutate(values, {
      onSuccess,
      onError: (err) => applyServerErrors(err, setError),
    });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <FormError message={registerUser.error?.message !== 'Validation failed' && registerUser.error?.message} />
      <Field label="Full name" autoComplete="name" error={errors.name?.message} {...register('name')} />
      <Field label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Password"
          type="password"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <Field
          label="Confirm"
          type="password"
          autoComplete="new-password"
          error={errors.confirm?.message}
          {...register('confirm')}
        />
      </div>
      <Button type="submit" className="w-full" loading={registerUser.isPending}>
        Create account
      </Button>
      {onSwitch && (
        <p className="text-center text-sm text-taupe">
          Already have an account?{' '}
          <button type="button" onClick={onSwitch} className="link-underline font-medium text-ink">
            Sign in
          </button>
        </p>
      )}
    </form>
  );
}
