import { useParams } from 'react-router';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import Button from '../components/ui/Button';
import { Skeleton } from '../components/ui/Feedback';
import { useOrder } from '../hooks/useOrders';
import { sizedImage } from '../lib/api';
import { formatPrice } from '../lib/format';
import { EASE } from '../lib/motion';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

function AnimatedCheck() {
  return (
    <svg viewBox="0 0 80 80" className="mx-auto size-24" aria-hidden>
      <motion.circle
        cx="40"
        cy="40"
        r="36"
        fill="none"
        stroke="var(--color-rose)"
        strokeWidth="2"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, ease: EASE }}
      />
      <motion.path
        d="M25 41 L36 52 L56 30"
        fill="none"
        stroke="var(--color-ink)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, delay: 0.8, ease: EASE }}
      />
    </svg>
  );
}

export default function OrderSuccess() {
  const { t } = useTranslation();
  useDocumentTitle(t('orderSuccess.docTitle'));
  const { id } = useParams();
  const { data: order, isLoading } = useOrder(id);
  const firstName = order?.shippingAddress.fullName.split(' ')[0];

  return (
    <div className="container-luxe max-w-3xl py-20 text-center md:py-28">
      <AnimatedCheck />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.8, ease: EASE }}>
        <p className="eyebrow mt-8">{t('orderSuccess.confirmed')}</p>
        <h1 className="mt-4 text-[40px] leading-tight font-extralight md:text-[60px]">
          {firstName ? t('orderSuccess.thanksName', { name: firstName }) : t('orderSuccess.thanks')}
        </h1>
        <p className="mx-auto mt-4 max-w-md text-taupe">{t('orderSuccess.text')}</p>
      </motion.div>

      {isLoading ? (
        <Skeleton className="mt-12 h-64" />
      ) : (
        order && (
          <motion.div
            className="mt-12 border border-line p-6 text-left sm:p-10"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.8, ease: EASE }}
          >
            <div className="flex flex-wrap justify-between gap-4 border-b border-line pb-6 text-sm">
              <div>
                <p className="label-luxe">{t('orderSuccess.orderNumber')}</p>
                <p className="font-medium tracking-wider">{order.orderNumber}</p>
              </div>
              <div>
                <p className="label-luxe">{t('orderSuccess.status')}</p>
                <p>{t(`orderStatus.${order.status}`)}</p>
              </div>
              <div>
                <p className="label-luxe">{t('orderSuccess.total')}</p>
                <p className="font-medium">{formatPrice(order.totalPrice)}</p>
              </div>
            </div>
            <ul className="divide-y divide-line">
              {order.items.map((item) => (
                <li key={`${item.product}-${item.variantId}`} className="flex items-center gap-4 py-4">
                  <img src={sizedImage(item.image, 160)} alt="" className="h-20 w-16 bg-beige object-cover" />
                  <div className="flex-1">
                    <p className="font-serif text-lg leading-tight">{item.name}</p>
                    <p className="text-xs text-taupe">
                      {item.variantName ? `${item.variantName} · ` : ''}
                      {t('common.qty', { count: item.quantity })}
                    </p>
                  </div>
                  <p className="text-sm">{formatPrice(item.subtotal)}</p>
                </li>
              ))}
            </ul>
            {order.discount > 0 && (
              <p className="flex justify-between border-t border-line pt-4 text-sm text-rose">
                <span>
                  {t('summary.discount')} ({order.couponCode})
                </span>
                <span>−{formatPrice(order.discount)}</span>
              </p>
            )}
          </motion.div>
        )
      )}

      <div className="mt-12 flex flex-wrap justify-center gap-4">
        <Button to="/profile">{t('orderSuccess.viewOrders')}</Button>
        <Button to="/shop" variant="outline">
          {t('common.continueShopping')}
        </Button>
      </div>
    </div>
  );
}
