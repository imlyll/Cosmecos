import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useGoogleLogin } from '../../hooks/useAuth';
import { errorMessage } from '../../i18n';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// Google Identity Services, loaded once on first use.
let gisScript;
function loadGoogleScript() {
  gisScript ??= new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = resolve;
    script.onerror = () => {
      gisScript = null; // allow a retry on the next render
      reject(new Error('Could not load Google sign-in'));
    };
    document.head.append(script);
  });
  return gisScript;
}

/**
 * "Continue with Google" (Google's own button, in the site language), under an "or" divider.
 * Google returns an ID token, which the API exchanges for our session. Renders nothing when
 * VITE_GOOGLE_CLIENT_ID is not set.
 */
export default function GoogleButton({ onSuccess }) {
  const { t, i18n } = useTranslation();
  const container = useRef(null);
  const googleLogin = useGoogleLogin();
  // Google keeps the callback it was initialised with; this ref always points at the current props.
  const signIn = useRef();
  useEffect(() => {
    signIn.current = (credential) =>
      googleLogin.mutate({ credential }, { onSuccess, onError: (err) => toast.error(errorMessage(err)) });
  });
  const lang = i18n.resolvedLanguage;

  useEffect(() => {
    if (!CLIENT_ID) return undefined;
    let cancelled = false;
    loadGoogleScript()
      .then(() => {
        if (cancelled || !container.current) return;
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: ({ credential }) => signIn.current(credential),
        });
        window.google.accounts.id.renderButton(container.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          shape: 'rectangular',
          text: 'continue_with',
          logo_alignment: 'center',
          width: Math.min(container.current.offsetWidth || 400, 400),
          locale: lang,
        });
      })
      .catch(() => {
        if (!cancelled) toast.error(t('auth.googleUnavailable'));
      });
    return () => {
      cancelled = true;
    };
  }, [lang, t]);

  if (!CLIENT_ID) return null;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4 text-xs tracking-[0.2em] text-taupe uppercase">
        <span className="h-px flex-1 bg-line" />
        {t('auth.or')}
        <span className="h-px flex-1 bg-line" />
      </div>
      <div
        ref={container}
        className="flex min-h-11 justify-center"
        aria-busy={googleLogin.isPending || undefined}
      />
    </div>
  );
}
