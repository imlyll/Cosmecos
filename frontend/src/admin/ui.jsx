import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, ChevronDown, Search } from 'lucide-react';
import clsx from 'clsx';
import { Modal } from '../components/ui/Drawer';
import Button from '../components/ui/Button';
import { EASE } from '../lib/motion';

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-4xl md:text-5xl">{title}</h1>
        {subtitle && <p className="mt-2 text-sm text-taupe">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </div>
  );
}

export function Card({ className, children, title, action }) {
  return (
    <section className={clsx('border border-line bg-white', className)}>
      {title && (
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-sans text-[11px] font-medium tracking-[0.22em] uppercase">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

const STATUS_STYLES = {
  Pending: 'bg-nude/70 text-ink',
  Processing: 'bg-sand/50 text-ink',
  Shipped: 'bg-blush/25 text-rose',
  Delivered: 'bg-success/15 text-success',
  Cancelled: 'bg-danger/10 text-danger',
  Active: 'bg-success/15 text-success',
  Hidden: 'bg-line text-taupe',
  Paid: 'bg-success/15 text-success',
  Unpaid: 'bg-line text-taupe',
  Admin: 'bg-ink text-cream',
  Customer: 'bg-beige text-ink',
  Disabled: 'bg-danger/10 text-danger',
};

// Status colour is never the only signal: the label text always travels with it.
export function Badge({ children, tone }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-1 text-[11px] font-medium tracking-wide whitespace-nowrap',
        STATUS_STYLES[tone || children] || 'bg-beige text-ink'
      )}
    >
      {children}
    </span>
  );
}

export function Switch({ checked, onChange, label, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={clsx(
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-300 disabled:opacity-40',
        checked ? 'bg-ink' : 'bg-line'
      )}
    >
      <motion.span
        className="absolute size-4.5 rounded-full bg-white shadow"
        animate={{ left: checked ? 23 : 3 }}
        transition={{ type: 'spring', stiffness: 500, damping: 32 }}
      />
    </button>
  );
}

/** Search box that reports its value after the user pauses typing. */
export function SearchInput({ value, onChange, placeholder = 'Search…', className }) {
  const [local, setLocal] = useState(value || '');
  useEffect(() => setLocal(value || ''), [value]);
  useEffect(() => {
    if (local === (value || '')) return undefined;
    const t = setTimeout(() => onChange(local.trim()), 350);
    return () => clearTimeout(t);
  }, [local]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <label className={clsx('relative block', className)}>
      <span className="sr-only">{placeholder}</span>
      <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-taupe" />
      <input
        type="search"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder={placeholder}
        className="h-11 w-full border border-line bg-white pr-3 pl-10 text-sm outline-none transition-colors focus:border-ink"
      />
    </label>
  );
}

export function Select({ value, onChange, options, label, className }) {
  return (
    <label className={clsx('relative block', className)}>
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full appearance-none border border-line bg-white pr-9 pl-3.5 text-sm outline-none transition-colors focus:border-ink"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-taupe" />
    </label>
  );
}

/** Horizontally scrollable table wrapper so wide tables never break mobile layouts. */
export function Table({ children, minWidth = 720 }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm" style={{ minWidth }}>
        {children}
      </table>
    </div>
  );
}

export function Th({ children, className }) {
  return (
    <th
      scope="col"
      className={clsx('border-b border-line px-5 py-3.5 text-[10px] font-medium tracking-[0.2em] text-taupe uppercase', className)}
    >
      {children}
    </th>
  );
}

export function Td({ children, className }) {
  return <td className={clsx('border-b border-line px-5 py-4 align-middle', className)}>{children}</td>;
}

export function SkeletonRows({ rows = 6, cols = 5 }) {
  return Array.from({ length: rows }, (_, r) => (
    <tr key={r}>
      {Array.from({ length: cols }, (_, c) => (
        <Td key={c}>
          <div className="h-4 animate-pulse bg-beige" style={{ width: `${50 + ((r + c) % 3) * 20}%` }} />
        </Td>
      ))}
    </tr>
  ));
}

export function EmptyRow({ cols, children }) {
  return (
    <tr>
      <td colSpan={cols} className="px-5 py-16 text-center text-sm text-taupe">
        {children}
      </td>
    </tr>
  );
}

export function ConfirmDialog({ open, onClose, onConfirm, title, text, confirmLabel = 'Delete', loading }) {
  return (
    <Modal open={open} onClose={onClose} className="max-w-md" label={title}>
      <div className="p-8">
        <div className="grid size-12 place-items-center rounded-full bg-danger/10 text-danger">
          <AlertTriangle className="size-5" />
        </div>
        <h2 className="mt-5 text-3xl">{title}</h2>
        <p className="mt-2 text-sm text-taupe">{text}</p>
        <div className="mt-8 flex justify-end gap-3">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" className="bg-danger hover:bg-ink" onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export function FadeIn({ children, className }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}
