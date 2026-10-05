import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Modal } from '../ui/Drawer';
import { ForgotPasswordForm, LoginForm, RegisterForm } from './AuthForms';
import OtpForm from './OtpForm';
import { useUIStore } from '../../store/ui';
import { sizedImage } from '../../lib/api';
import { EASE } from '../../lib/motion';

const IMAGE = 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&q=80';

export default function AuthModal() {
  const { t } = useTranslation();
  const { authModal, closeAuth, setAuthView, runPendingAction } = useUIStore();
  // Set once registration (or login to an unverified account) has emailed a code.
  const [verification, setVerification] = useState(null);
  const step = verification ? 'verify' : authModal.view;

  useEffect(() => {
    if (!authModal.open) setVerification(null);
  }, [authModal.open]);

  const onSuccess = () => {
    // Close without clearing the pending action, then run it (e.g. add to cart).
    useUIStore.setState((s) => ({ authModal: { ...s.authModal, open: false } }));
    runPendingAction();
  };

  const switchTo = (view) => {
    setVerification(null);
    setAuthView(view);
  };

  const [eyebrow, title] = {
    login: [t('auth.welcomeBack'), t('auth.signIn')],
    register: [t('auth.joinUs'), t('auth.createAccount')],
    forgot: [t('forgot.eyebrow'), t('forgot.title')],
    verify: [t('otp.eyebrow'), t('otp.title')],
  }[step];

  return (
    <Modal open={authModal.open} onClose={closeAuth} className="max-w-4xl" label={title}>
      <div className="grid md:grid-cols-2">
        <div className="relative hidden overflow-hidden md:block">
          <img src={sizedImage(IMAGE, 900)} alt="" className="absolute inset-0 size-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/60 to-transparent" />
          <p className="absolute right-8 bottom-8 left-8 font-serif text-3xl leading-tight text-cream italic">
            {t('auth.quoteModal')}
          </p>
        </div>
        <div className="p-8 sm:p-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4, ease: EASE }}
            >
              <p className="eyebrow">{eyebrow}</p>
              <h2 className="mt-3 mb-8 text-4xl">{title}</h2>
              {step === 'verify' ? (
                <OtpForm {...verification} onSuccess={onSuccess} onBack={() => switchTo('register')} />
              ) : step === 'forgot' ? (
                <ForgotPasswordForm onSuccess={onSuccess} onBack={() => switchTo('login')} />
              ) : step === 'login' ? (
                <LoginForm
                  onSuccess={onSuccess}
                  onVerify={setVerification}
                  onSwitch={() => switchTo('register')}
                  onForgot={() => switchTo('forgot')}
                />
              ) : (
                <RegisterForm onVerify={setVerification} onSwitch={() => switchTo('login')} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </Modal>
  );
}
