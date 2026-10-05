import { forwardRef } from 'react';
import { Link } from 'react-router';
import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

// Every button in the theme is an outlined 1px frame that fills on hover.
const VARIANTS = {
  primary: 'border border-ink bg-ink text-white hover:bg-transparent hover:text-ink',
  outline: 'border border-ink text-ink hover:bg-ink hover:text-white',
  light: 'border border-white text-white hover:bg-white hover:text-ink',
  ghost: 'text-ink hover:text-rose',
  danger: 'border border-danger text-danger hover:bg-danger hover:text-white',
};

const SIZES = {
  sm: 'h-11 px-6',
  md: 'h-14 px-[38px]',
  lg: 'h-14 px-[38px]',
};

/** Theme button; renders a router Link when `to` is given. */
const Button = forwardRef(function Button(
  { to, variant = 'primary', size = 'md', loading = false, className, children, disabled, ...props },
  ref
) {
  const classes = clsx(
    'group relative inline-flex items-center justify-center gap-2 overflow-hidden font-serif text-[13px] leading-4 font-bold uppercase',
    'transition-colors duration-300 disabled:opacity-50',
    VARIANTS[variant],
    SIZES[size],
    className
  );
  const content = (
    <>
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      <span className="relative inline-flex items-center gap-2">{children}</span>
    </>
  );

  if (to) {
    return (
      <Link ref={ref} to={to} className={classes} {...props}>
        {content}
      </Link>
    );
  }
  return (
    <button ref={ref} className={classes} disabled={disabled || loading} {...props}>
      {content}
    </button>
  );
});

export default Button;
