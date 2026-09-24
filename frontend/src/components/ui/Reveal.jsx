import { motion } from 'framer-motion';
import { EASE } from '../../lib/motion';

/** Fades and lifts its children into view once, when scrolled into the viewport. */
export default function Reveal({ as = 'div', delay = 0, y = 32, className, children, ...rest }) {
  const Component = motion[as];
  return (
    <Component
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.9, ease: EASE, delay }}
      {...rest}
    >
      {children}
    </Component>
  );
}
