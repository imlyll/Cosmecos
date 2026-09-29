import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useAnimationControls } from 'framer-motion';
import { Trans, useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { MailCheck, RotateCw } from 'lucide-react';
import clsx from 'clsx';
import Button from '../ui/Button';
import { useResendOtp, useVerifyOtp } from '../../hooks/useAuth';
import { errorMessage } from '../../i18n';

const LENGTH = 6;
const EMPTY = Array(LENGTH).fill('');

const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

/** Counts down from `seconds`; restart by passing a new value to `restart`. */
function useCountdown(initial) {
  const [left, setLeft] = useState(initial);
  useEffect(() => {
    if (left <= 0) return undefined;
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);
  return [left, setLeft];
}

/**
 * Six single-digit boxes for the emailed verification code. Typing advances, Backspace goes back,
 * pasting or SMS/email autofill spreads across the boxes, and a full code submits automatically.
 */
export default function OtpForm({ email, resendAvailableIn = 60, expiresInMinutes = 10, onSuccess, onBack }) {
  const { t } = useTranslation();
  const [digits, setDigits] = useState(EMPTY);
  const shake = useAnimationControls();
  const inputs = useRef([]);
  const verify = useVerifyOtp();
  const resend = useResendOtp();
  const [cooldown, setCooldown] = useCountdown(resendAvailableIn);

  const code = digits.join('');
  const focus = (i) => inputs.current[Math.max(0, Math.min(LENGTH - 1, i))]?.focus();

  useEffect(() => {
    focus(0);
  }, []);

  const submit = (value = code) => {
    if (value.length !== LENGTH || verify.isPending) return;
    verify.mutate(
      { email, code: value },
      {
        onSuccess,
        onError: (err) => {
          toast.error(errorMessage(err));
          shake.start({ x: [0, -10, 10, -6, 6, 0], transition: { duration: 0.4 } });
          setDigits(EMPTY);
          focus(0);
        },
      }
    );
  };

  // Writes `chars` starting at box `start`; submits once every box is filled.
  const fill = (start, chars) => {
    const next = [...digits];
    chars.slice(0, LENGTH - start).forEach((c, k) => (next[start + k] = c));
    setDigits(next);
    if (verify.isError) verify.reset();
    if (next.every(Boolean)) {
      inputs.current[LENGTH - 1]?.blur();
      submit(next.join(''));
    } else {
      focus(start + chars.length);
    }
  };

  const onChange = (i, value) => {
    const chars = value.replace(/\D/g, '').split('');
    if (chars.length === 0) setDigits((d) => d.map((x, k) => (k === i ? '' : x)));
    // A whole code (autofill into the first box) spreads across every box.
    else if (chars.length >= LENGTH) fill(0, chars.slice(0, LENGTH));
    // Otherwise the newest keystroke replaces this box.
    else fill(i, chars.slice(-1));
  };

  const onKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      e.preventDefault();
      setDigits((d) => d.map((x, k) => (k === i - 1 ? '' : x)));
      focus(i - 1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      focus(i - 1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      focus(i + 1);
    } else if (e.key === 'Enter') {
      submit();
    }
  };

  const onPaste = (i, e) => {
    const chars = e.clipboardData.getData('text').replace(/\D/g, '').split('');
    if (!chars.length) return;
    e.preventDefault();
    fill(chars.length >= LENGTH ? 0 : i, chars);
  };

  const onResend = () =>
    resend.mutate(
      { email },
      {
        onSuccess: (data) => {
          setCooldown(data.resendAvailableIn ?? 60);
          setDigits(EMPTY);
          verify.reset();
          focus(0);
        },
        onError: (err) => {
          toast.error(errorMessage(err));
          if (err.data?.resendAvailableIn) setCooldown(err.data.resendAvailableIn);
        },
      }
    );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="space-y-7"
      noValidate
    >
      <div className="flex gap-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-nude text-rose">
          <MailCheck className="size-5" strokeWidth={1.4} />
        </span>
        <div className="text-sm leading-6 text-taupe">
          <p>
            <Trans i18nKey="otp.sentTo" values={{ email }} components={{ strong: <strong className="font-semibold break-words text-ink" /> }} />
          </p>
          <p className="mt-1 text-xs tracking-wide text-mute">{t('otp.expires', { minutes: expiresInMinutes })}</p>
        </div>
      </div>

      <fieldset>
        <legend className="label-luxe">{t('otp.codeLabel')}</legend>
        <motion.div className="flex justify-between gap-2 sm:gap-3" animate={shake}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => (inputs.current[i] = el)}
              value={d}
              onChange={(e) => onChange(i, e.target.value)}
              onKeyDown={(e) => onKeyDown(i, e)}
              onPaste={(e) => onPaste(i, e)}
              onFocus={(e) => e.target.select()}
              inputMode="numeric"
              autoComplete={i === 0 ? 'one-time-code' : 'off'}
              maxLength={i === 0 ? LENGTH : 1}
              pattern="\d*"
              aria-label={t('otp.digitLabel', { n: i + 1 })}
              aria-invalid={verify.isError ? 'true' : undefined}
              // readOnly rather than disabled, so focus can return to the first box after a wrong code.
              readOnly={verify.isPending}
              className={clsx(
                'aspect-[4/5] w-full min-w-0 border bg-white text-center font-serif text-2xl font-light text-ink caret-rose outline-none transition-colors duration-300 sm:text-3xl',
                'focus:border-rose focus:bg-nude/40 focus-visible:outline-none',
                verify.isError ? 'border-danger' : d ? 'border-ink' : 'border-line',
                verify.isPending && 'opacity-60'
              )}
            />
          ))}
        </motion.div>
        <AnimatePresence>
          {verify.isError && (
            <motion.p
              role="alert"
              className="mt-3 text-xs text-danger"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              {errorMessage(verify.error)}
            </motion.p>
          )}
        </AnimatePresence>
      </fieldset>

      <Button type="submit" className="w-full" loading={verify.isPending} disabled={code.length !== LENGTH}>
        {t('otp.verify')}
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
              onClick={onResend}
              disabled={resend.isPending}
              className="link-underline inline-flex items-center gap-1.5 font-medium text-ink"
            >
              <RotateCw className={clsx('size-3.5', resend.isPending && 'animate-spin')} />
              {resend.isPending ? t('otp.sending') : t('otp.resend')}
            </button>
          )}
        </p>
        {onBack && (
          <button type="button" onClick={onBack} className="link-underline text-taupe hover:text-ink">
            {t('otp.changeEmail')}
          </button>
        )}
      </div>
    </form>
  );
}
