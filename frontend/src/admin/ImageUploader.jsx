import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ImagePlus, Link2, UploadCloud, X } from 'lucide-react';
import clsx from 'clsx';
import { toast } from 'sonner';
import { sizedImage } from '../lib/api';

export const MAX_IMAGES = 8;
// crypto.randomUUID needs a secure context (fails over plain-http LAN IPs), so use a simple id.
const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const MAX_SIZE = 5 * 1024 * 1024;
const TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

/**
 * Multi-image picker with drag & drop and instant previews.
 *  existing: saved images [{_id, url}] (edit mode), removedIds: ids marked for deletion,
 *  files: new File uploads [{ id, file, preview }], urls: external image URLs [{ id, url }].
 */
export default function ImageUploader({ existing = [], removedIds, onToggleRemove, files, setFiles, urls, setUrls }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [urlInput, setUrlInput] = useState('');

  const kept = existing.filter((img) => !removedIds.includes(img._id));
  const count = kept.length + files.length + urls.length;

  // Release preview object URLs when files are removed or the form unmounts.
  const filesRef = useRef(files);
  filesRef.current = files;
  useEffect(() => () => filesRef.current.forEach((f) => URL.revokeObjectURL(f.preview)), []);

  const addFiles = (list) => {
    const incoming = [...list];
    const accepted = [];
    for (const file of incoming) {
      if (!TYPES.includes(file.type)) {
        toast.error(`${file.name}: use JPEG, PNG, WebP or AVIF`);
      } else if (file.size > MAX_SIZE) {
        toast.error(`${file.name} is larger than 5 MB`);
      } else if (count + accepted.length >= MAX_IMAGES) {
        toast.error(`A product can have at most ${MAX_IMAGES} images`);
        break;
      } else {
        accepted.push({ id: uid(), file, preview: URL.createObjectURL(file) });
      }
    }
    if (accepted.length) setFiles((prev) => [...prev, ...accepted]);
  };

  const removeFile = (id) =>
    setFiles((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target) URL.revokeObjectURL(target.preview);
      return prev.filter((f) => f.id !== id);
    });

  const addUrl = () => {
    const value = urlInput.trim();
    try {
      const u = new URL(value);
      if (!/^https?:$/.test(u.protocol)) throw new Error();
    } catch {
      toast.error('Enter a valid http(s) image URL');
      return;
    }
    if (count >= MAX_IMAGES) return toast.error(`A product can have at most ${MAX_IMAGES} images`);
    setUrls((prev) => [...prev, { id: uid(), url: value }]);
    setUrlInput('');
  };

  const tiles = [
    ...existing.map((img) => ({ key: img._id, src: sizedImage(img.url, 300), kind: 'saved', removed: removedIds.includes(img._id), onRemove: () => onToggleRemove(img._id) })),
    ...files.map((f) => ({ key: f.id, src: f.preview, kind: 'new', label: f.file.name, onRemove: () => removeFile(f.id) })),
    ...urls.map((u) => ({ key: u.id, src: sizedImage(u.url, 300), kind: 'url', onRemove: () => setUrls((prev) => prev.filter((x) => x.id !== u.id)) })),
  ];

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          addFiles(e.dataTransfer.files);
        }}
        className={clsx(
          'flex cursor-pointer flex-col items-center justify-center border-2 border-dashed px-6 py-10 text-center transition-colors',
          dragging ? 'border-rose bg-rose/5' : 'border-line bg-cream hover:border-taupe'
        )}
      >
        <UploadCloud className="size-8 text-rose" strokeWidth={1.3} />
        <p className="mt-3 text-sm">
          <span className="font-medium">Click to upload</span> or drag and drop
        </p>
        <p className="mt-1 text-xs text-taupe">
          JPEG, PNG, WebP or AVIF · up to 5 MB each · {count}/{MAX_IMAGES} images
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={TYPES.join(',')}
          multiple
          className="sr-only"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      <div className="mt-3 flex gap-2">
        <label className="relative flex-1">
          <span className="sr-only">Image URL</span>
          <Link2 className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-taupe" />
          <input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addUrl();
              }
            }}
            placeholder="…or paste a high-res image URL"
            className="h-11 w-full border border-line bg-white pr-3 pl-9 text-sm outline-none focus:border-ink"
          />
        </label>
        <button type="button" onClick={addUrl} className="h-11 border border-ink px-4 text-xs tracking-[0.18em] uppercase hover:bg-ink hover:text-cream">
          Add
        </button>
      </div>

      {tiles.length > 0 && (
        <ul className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
          <AnimatePresence initial={false}>
            {tiles.map((t, i) => (
              <motion.li
                key={t.key}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="group relative aspect-square overflow-hidden bg-beige"
              >
                <img src={t.src} alt={t.label || `Product image ${i + 1}`} className={clsx('size-full object-cover transition', t.removed && 'opacity-30 grayscale')} />
                <span className="absolute bottom-1.5 left-1.5 bg-cream/90 px-1.5 py-0.5 text-[10px] tracking-wider uppercase">
                  {t.removed ? 'Removing' : t.kind === 'saved' ? (i === 0 ? 'Cover' : 'Saved') : t.kind === 'new' ? 'New' : 'URL'}
                </span>
                <button
                  type="button"
                  onClick={t.onRemove}
                  aria-label={t.removed ? 'Keep this image' : 'Remove this image'}
                  className="absolute top-1.5 right-1.5 grid size-7 place-items-center rounded-full bg-cream/90 text-ink shadow transition-colors hover:bg-ink hover:text-cream"
                >
                  {t.removed ? <ImagePlus className="size-3.5" /> : <X className="size-3.5" />}
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}
