import { Star } from 'lucide-react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';

export default function Rating({ value = 0, count, size = 'sm', className }) {
  const { t } = useTranslation();
  const px = size === 'sm' ? 'size-[11px]' : 'size-3.5';
  return (
    <div className={clsx('flex items-center gap-2', className)}>
      <div className="relative flex" aria-label={t('a11y.rated', { value: value.toFixed(1) })} role="img">
        <div className="flex gap-[4px] text-[#d4d4d4] dark:text-[#3d3a37]">
          {Array.from({ length: 5 }, (_, i) => (
            <Star key={i} className={clsx(px, 'fill-current')} aria-hidden />
          ))}
        </div>
        <div className="absolute inset-0 flex gap-[4px] overflow-hidden text-[#f39c73]" style={{ width: `${(value / 5) * 100}%` }}>
          {Array.from({ length: 5 }, (_, i) => (
            <Star key={i} className={clsx(px, 'shrink-0 fill-current')} aria-hidden />
          ))}
        </div>
      </div>
      {count !== undefined && <span className="text-xs text-mute">({count})</span>}
    </div>
  );
}
