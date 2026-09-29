import { useTranslation } from 'react-i18next';
import Reveal from '../ui/Reveal';

const FEATURES = [
  { icon: '/images/1.png', key: 'naturalBeauty' },
  { icon: '/images/2.png', key: 'naturalIngredients' },
  { icon: '/images/3.png', key: 'hypoallergenic' },
  { icon: '/images/4.png', key: 'organic' },
];

/** Four hand-drawn badges with a caption. */
export default function Features() {
  const { t } = useTranslation();
  return (
    <section className="container-luxe grid grid-cols-2 gap-y-12 pt-[60px] pb-[150px] max-md:pb-20 lg:grid-cols-4">
      {FEATURES.map((f, i) => (
        <Reveal key={f.key} delay={i * 0.1} className="text-center">
          <img
            src={f.icon}
            alt=""
            className="mx-auto h-[130px] w-auto transition-transform duration-700 ease-[var(--ease-luxe)] hover:-translate-y-2"
          />
          <h3 className="mt-5 text-lg font-normal md:text-xl">{t(`home.features.${f.key}`)}</h3>
        </Reveal>
      ))}
    </section>
  );
}
