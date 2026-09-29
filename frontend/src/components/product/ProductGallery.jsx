import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Expand } from 'lucide-react';
import clsx from 'clsx';
import { Modal } from '../ui/Drawer';
import { sizedImage } from '../../lib/api';
import { EASE } from '../../lib/motion';
import { useTranslation } from 'react-i18next';

const slide = {
  enter: (dir) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0.4 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir > 0 ? '-40%' : '40%', opacity: 0 }),
};

/** Main image with hover zoom, swipe/arrow navigation, thumbnails and a lightbox. */
export default function ProductGallery({ images = [], name, badge }) {
  const { t } = useTranslation();
  const [[index, dir], setIndex] = useState([0, 0]);
  const [zoom, setZoom] = useState({ active: false, x: 50, y: 50 });
  const [lightbox, setLightbox] = useState(false);
  const dragged = useRef(false); // a swipe must not also open the lightbox
  const count = images.length;
  const current = images[index] || images[0];

  const go = (next) => {
    if (!count) return;
    const target = (next + count) % count;
    setIndex([target, next > index ? 1 : -1]);
  };

  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setZoom({ active: true, x: ((e.clientX - rect.left) / rect.width) * 100, y: ((e.clientY - rect.top) / rect.height) * 100 });
  };

  if (!current) return <div className="aspect-square bg-beige" />;

  return (
    <div className="flex flex-col-reverse gap-4">
      {/* Thumbnails */}
      {count > 1 && (
        <div className="no-scrollbar flex gap-4 overflow-x-auto">
          {images.map((img, i) => (
            <button
              key={img._id || img.url}
              type="button"
              onClick={() => setIndex([i, i > index ? 1 : -1])}
              aria-label={t('a11y.showImage', { n: i + 1 })}
              aria-current={i === index}
              className={clsx(
                'relative aspect-square w-24 shrink-0 overflow-hidden bg-beige transition-opacity duration-300',
                i === index ? 'opacity-100' : 'opacity-50 hover:opacity-100'
              )}
            >
              <img src={sizedImage(img.url, 200)} alt="" className="size-full object-cover" />
              {i === index && (
                <motion.span layoutId="thumb-ring" className="absolute inset-0 border border-ink" transition={{ duration: 0.4 }} />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Main image */}
      <div className="relative flex-1">
        <div
          className="group relative aspect-square cursor-zoom-in overflow-hidden bg-beige"
          onMouseMove={onMove}
          onMouseLeave={() => setZoom((z) => ({ ...z, active: false }))}
          onClick={() => {
            if (!dragged.current) setLightbox(true);
            dragged.current = false;
          }}
        >
          <AnimatePresence initial={false} custom={dir}>
            <motion.div
              key={index}
              custom={dir}
              variants={slide}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.7, ease: EASE }}
              className="absolute inset-0"
              drag={count > 1 ? 'x' : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragStart={() => (dragged.current = true)}
              onDragEnd={(_, info) => {
                if (info.offset.x < -60) go(index + 1);
                else if (info.offset.x > 60) go(index - 1);
              }}
            >
              <img
                src={sizedImage(current.url, 1400)}
                alt={current.alt || name}
                draggable={false}
                className="size-full object-cover transition-transform duration-300 ease-out"
                style={{
                  transformOrigin: `${zoom.x}% ${zoom.y}%`,
                  transform: zoom.active ? 'scale(1.9)' : 'scale(1)',
                }}
              />
            </motion.div>
          </AnimatePresence>

          <span className="frame-inset inset-5" aria-hidden />
          {badge}

          <span className="pointer-events-none absolute top-8 right-8 grid size-10 place-items-center bg-white opacity-0 transition-opacity group-hover:opacity-100">
            <Expand className="size-4" />
          </span>
        </div>

        {count > 1 && (
          <>
            {[
              { d: -1, icon: ChevronLeft, pos: 'left-8', label: t('a11y.prevImage') },
              { d: 1, icon: ChevronRight, pos: 'right-8', label: t('a11y.nextImage') },
            ].map(({ d, icon: Icon, pos, label }) => (
              <button
                key={d}
                type="button"
                onClick={() => go(index + d)}
                aria-label={label}
                className={clsx(
                  'absolute top-1/2 grid size-11 -translate-y-1/2 place-items-center border border-ink bg-white transition-all hover:bg-ink hover:text-white',
                  pos
                )}
              >
                <Icon className="size-4" />
              </button>
            ))}
            <p className="absolute right-8 bottom-8 font-serif text-[13px] font-bold text-ink">
              {index + 1} / {count}
            </p>
          </>
        )}
      </div>

      <Modal open={lightbox} onClose={() => setLightbox(false)} className="max-w-5xl bg-beige" label={t('a11y.productImage', { name })}>
        <img src={sizedImage(current.url, 2000)} alt={current.alt || name} className="max-h-[88vh] w-full object-contain" />
      </Modal>
    </div>
  );
}
