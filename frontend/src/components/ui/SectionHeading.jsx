import clsx from 'clsx';
import Reveal from './Reveal';

/**
 * Section title in the Cosmecos style: a peach hand-lettered eyebrow above
 * a light, uppercase Raleway heading and an optional grey lead line.
 */
export default function SectionHeading({ eyebrow, title, subtitle, align = 'center', className, children }) {
  return (
    <div className={clsx('mb-10 md:mb-12', align === 'center' && 'mx-auto max-w-3xl text-center', className)}>
      {eyebrow && (
        <Reveal as="p" className="eyebrow mb-0.5">
          {eyebrow}
        </Reveal>
      )}
      <Reveal
        as="h2"
        delay={0.08}
        className="text-[28px] leading-[1.47] font-light uppercase md:text-[38px] md:leading-[56px]"
      >
        {title}
      </Reveal>
      {subtitle && (
        <Reveal as="p" delay={0.16} className="mt-2.5 text-lg leading-[1.875] text-[#9a9a9a]">
          {subtitle}
        </Reveal>
      )}
      {children}
    </div>
  );
}
