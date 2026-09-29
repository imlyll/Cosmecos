import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import Button from '../components/ui/Button';
import { EASE } from '../lib/motion';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function NotFound() {
  const { t } = useTranslation();
  useDocumentTitle(t('notFound.docTitle'));
  return (
    <section className="container-luxe flex min-h-[70vh] flex-col items-center justify-center py-24 text-center">
      <motion.p
        className="font-script text-[140px] leading-none text-sand md:text-[220px]"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, ease: EASE }}
      >
        4<span className="text-rose">0</span>4
      </motion.p>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.8, ease: EASE }}>
        <h1 className="text-[32px] font-light uppercase md:text-[38px]">{t('notFound.title')}</h1>
        <p className="mt-4 text-taupe">{t('notFound.text')}</p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Button to="/">{t('notFound.backHome')}</Button>
          <Button to="/shop" variant="outline">
            {t('notFound.visitShop')}
          </Button>
        </div>
      </motion.div>
    </section>
  );
}
