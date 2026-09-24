import { forwardRef, useId, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import clsx from 'clsx';

/** Labelled input with animated error message; spreads react-hook-form's register(). */
const Field = forwardRef(function Field({ label, error, type = 'text', as, className, ...props }, ref) {
  const id = useId();
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  const Tag = as === 'textarea' ? 'textarea' : 'input';

  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="label-luxe">
          {label}
        </label>
      )}
      <div className="relative">
        <Tag
          id={id}
          ref={ref}
          type={Tag === 'input' ? (isPassword && show ? 'text' : type) : undefined}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={clsx('input-luxe', isPassword && 'pr-12', Tag === 'textarea' && 'min-h-36 resize-y')}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute inset-y-0 right-0 grid w-12 place-items-center text-taupe hover:text-ink"
            aria-label={show ? 'Hide password' : 'Show password'}
          >
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}
      </div>
      <AnimatePresence>
        {error && (
          <motion.p
            id={`${id}-error`}
            className="mt-1.5 text-xs text-danger"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
});

export default Field;

/** Copies API validation errors ({ field, message }) onto react-hook-form fields. */
export function applyServerErrors(err, setError) {
  let applied = false;
  (err?.errors || []).forEach((e) => {
    if (e.field) {
      setError(e.field.replace(/^body\./, ''), { message: e.message });
      applied = true;
    }
  });
  return applied;
}
