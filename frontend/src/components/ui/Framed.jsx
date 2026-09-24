import clsx from 'clsx';

/**
 * The theme's signature picture treatment: a 1px dark frame of the same size
 * as the content, shifted up-left by `offset` px and drawn on top of it.
 * On hover the frame slides onto the picture.
 */
export default function Framed({ offset = 20, className, frameClassName, children }) {
  return (
    <div className={clsx('group/frame relative', className)} style={{ paddingTop: offset, paddingLeft: offset }}>
      {children}
      <span
        aria-hidden
        className={clsx(
          'pointer-events-none absolute top-0 left-0 z-10 border border-ink transition-transform duration-700 ease-[var(--ease-luxe)]',
          frameClassName
        )}
        style={{ width: `calc(100% - ${offset}px)`, height: `calc(100% - ${offset}px)` }}
      />
    </div>
  );
}
