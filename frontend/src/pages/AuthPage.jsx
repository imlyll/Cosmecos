import { Navigate, useLocation, useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { LoginForm, RegisterForm } from '../components/auth/AuthForms';
import { useAuthStore } from '../store/auth';
import { sizedImage } from '../lib/api';
import { EASE } from '../lib/motion';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const IMAGES = {
  login: 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&q=80',
  register: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&q=80',
};

/** Dedicated /login and /register pages (the modal covers in-context sign-in). */
export default function AuthPage({ mode }) {
  const token = useAuthStore((s) => s.token);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/profile';
  const isLogin = mode === 'login';
  useDocumentTitle(isLogin ? 'Sign in' : 'Create account');

  if (token) return <Navigate to={from} replace />;

  const onSuccess = () => navigate(from, { replace: true });

  return (
    <div className="grid min-h-[calc(100svh-7.5rem)] lg:grid-cols-2">
      <div className="relative hidden overflow-hidden lg:block">
        <motion.img
          key={mode}
          src={sizedImage(IMAGES[mode], 1400)}
          alt=""
          className="absolute inset-0 size-full object-cover"
          initial={{ scale: 1.15, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.6, ease: EASE }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent" />
        <p className="absolute right-12 bottom-12 left-12 font-script text-5xl leading-tight text-white">
          {isLogin ? '“Your ritual, remembered.”' : '“Join a community that celebrates natural beauty.”'}
        </p>
      </div>

      <div className="flex items-center justify-center px-4 py-16 sm:px-10">
        <motion.div
          key={mode}
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE }}
        >
          <p className="eyebrow">{isLogin ? 'Welcome back' : 'Join Cosmecos'}</p>
          <h1 className="mt-3 mb-10 text-[40px] leading-tight font-extralight md:text-[56px]">{isLogin ? 'Sign in' : 'Create account'}</h1>
          {isLogin ? (
            <LoginForm onSuccess={onSuccess} onSwitch={() => navigate('/register', { state: location.state })} />
          ) : (
            <RegisterForm onSuccess={onSuccess} onSwitch={() => navigate('/login', { state: location.state })} />
          )}
        </motion.div>
      </div>
    </div>
  );
}
