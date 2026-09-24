import { Navigate, useLocation, useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router';
import { toast } from 'sonner';
import Field from '../components/ui/Field';
import Button from '../components/ui/Button';
import { api, ApiError } from '../lib/api';
import { useAuthStore } from '../store/auth';
import { EASE } from '../lib/motion';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const schema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export default function AdminLogin() {
  useDocumentTitle('Admin sign in');
  const { token, user, setAuth } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const qc = useQueryClient();
  const from = location.state?.from?.startsWith('/admin') ? location.state.from : '/admin';

  const login = useMutation({
    mutationFn: async (body) => {
      const data = await api('/auth/login', { method: 'POST', body });
      // Only admins may enter; a customer's credentials never create a session here.
      if (data.user.role !== 'admin') throw new ApiError('This account does not have admin access.', 403);
      return data;
    },
    onSuccess: (data) => {
      setAuth(data);
      qc.invalidateQueries();
      toast.success(`Welcome back, ${data.user.name.split(' ')[0]}`);
      navigate(from, { replace: true });
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  if (token && user?.role === 'admin') return <Navigate to={from} replace />;

  return (
    <div className="grid min-h-svh place-items-center bg-ink px-4 py-12">
      <motion.div
        className="w-full max-w-md bg-cream p-8 shadow-2xl sm:p-12"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: EASE }}
      >
        <p className="font-serif text-3xl">
          cosme<span className="text-rose italic">cos</span>
        </p>
        <p className="mt-8 flex items-center gap-2 eyebrow">
          <ShieldCheck className="size-4" /> Admin panel
        </p>
        <h1 className="mt-3 mb-8 text-4xl">Sign in</h1>

        {token && user && user.role !== 'admin' && (
          <p className="mb-5 border border-line bg-beige px-4 py-3 text-sm">
            You’re signed in as {user.email}, which isn’t an admin account. Sign in with admin credentials below.
          </p>
        )}
        {login.error && (
          <p role="alert" className="mb-5 border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
            {login.error.message}
          </p>
        )}

        <form onSubmit={handleSubmit((v) => login.mutate(v))} className="space-y-5" noValidate>
          <Field label="Email" type="email" autoComplete="username" error={errors.email?.message} {...register('email')} />
          <Field
            label="Password"
            type="password"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register('password')}
          />
          <Button type="submit" className="w-full" loading={login.isPending}>
            Sign in to dashboard
          </Button>
        </form>

        <Link to="/" className="group mt-8 flex items-center gap-2 text-xs tracking-[0.2em] text-taupe uppercase hover:text-ink">
          <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" /> Back to store
        </Link>
      </motion.div>
    </div>
  );
}
