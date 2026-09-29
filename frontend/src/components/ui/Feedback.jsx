import { motion } from 'framer-motion';
import clsx from 'clsx';
import Button from './Button';
import { EASE } from '../../lib/motion';
import { useTranslation } from 'react-i18next';

export function Skeleton({ className }) {
  return <div className={clsx('animate-pulse bg-beige', className)} />;
}

export function ProductCardSkeleton() {
  return (
    <div>
      <Skeleton className="aspect-[5/6] w-full" />
      <Skeleton className="mx-auto mt-8 h-3 w-1/4" />
      <Skeleton className="mx-auto mt-5 h-5 w-2/3" />
      <Skeleton className="mt-[26px] h-14 w-full" />
    </div>
  );
}

export function EmptyState({ icon: Icon, title, text, action, to }) {
  return (
    <motion.div
      className="mx-auto flex max-w-md flex-col items-center py-20 text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: EASE }}
    >
      {Icon && (
        <div className="mb-6 grid size-20 place-items-center rounded-full bg-beige">
          <Icon className="size-8 text-rose" strokeWidth={1.2} aria-hidden />
        </div>
      )}
      <h2 className="text-3xl font-light md:text-[38px]">{title}</h2>
      {text && <p className="mt-3 text-base text-body">{text}</p>}
      {action && (
        <Button to={to} className="mt-8">
          {action}
        </Button>
      )}
    </motion.div>
  );
}

export function ErrorState({ error, onRetry }) {
  const { t } = useTranslation();
  return (
    <div className="py-16 text-center">
      <p className="text-sm text-danger">{error?.message || t('common.somethingWrong')}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          {t('common.tryAgain')}
        </Button>
      )}
    </div>
  );
}
