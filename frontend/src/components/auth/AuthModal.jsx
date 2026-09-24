import { AnimatePresence, motion } from 'framer-motion';
import { Modal } from '../ui/Drawer';
import { LoginForm, RegisterForm } from './AuthForms';
import { useUIStore } from '../../store/ui';
import { sizedImage } from '../../lib/api';
import { EASE } from '../../lib/motion';

const IMAGE = 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&q=80';

export default function AuthModal() {
  const { authModal, closeAuth, setAuthView, runPendingAction } = useUIStore();
  const isLogin = authModal.view === 'login';

  const onSuccess = () => {
    // Close without clearing the pending action, then run it (e.g. add to cart).
    useUIStore.setState((s) => ({ authModal: { ...s.authModal, open: false } }));
    runPendingAction();
  };

  return (
    <Modal open={authModal.open} onClose={closeAuth} className="max-w-4xl" label={isLogin ? 'Sign in' : 'Create account'}>
      <div className="grid md:grid-cols-2">
        <div className="relative hidden overflow-hidden md:block">
          <img src={sizedImage(IMAGE, 900)} alt="" className="absolute inset-0 size-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/60 to-transparent" />
          <p className="absolute right-8 bottom-8 left-8 font-serif text-3xl leading-tight text-cream italic">
            “Beauty begins the moment you decide to be yourself.”
          </p>
        </div>
        <div className="p-8 sm:p-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={authModal.view}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4, ease: EASE }}
            >
              <p className="eyebrow">{isLogin ? 'Welcome back' : 'Join us'}</p>
              <h2 className="mt-3 mb-8 text-4xl">{isLogin ? 'Sign in' : 'Create account'}</h2>
              {isLogin ? (
                <LoginForm onSuccess={onSuccess} onSwitch={() => setAuthView('register')} />
              ) : (
                <RegisterForm onSuccess={onSuccess} onSwitch={() => setAuthView('login')} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </Modal>
  );
}
