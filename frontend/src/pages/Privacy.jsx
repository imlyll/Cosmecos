import { useTranslation } from 'react-i18next';
import PageHero from '../components/ui/PageHero';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const PRIVACY_EMAIL = 'leylamustafayeva555@gmail.com';

/** Privacy policy: plain sections of text from the `privacy` translations. */
export default function Privacy() {
  const { t } = useTranslation();
  useDocumentTitle(t('privacy.title'));
  const sections = t('privacy.sections', { returnObjects: true });

  return (
    <>
      <PageHero title={t('privacy.title')} />
      <article className="container-luxe max-w-3xl py-[150px] leading-[30px] text-body max-md:py-20">
        <p className="text-sm tracking-wide text-mute uppercase">{t('privacy.updated')}</p>
        <p className="mt-6">{t('privacy.intro')}</p>
        {sections.map((section) => (
          <section key={section.title} className="mt-12">
            <h2 className="mb-4 text-2xl text-ink md:text-3xl">{section.title}</h2>
            {section.paragraphs.map((text) => (
              <p key={text} className="mt-3">
                {text}
              </p>
            ))}
          </section>
        ))}
        <section className="mt-12">
          <h2 className="mb-4 text-2xl text-ink md:text-3xl">{t('privacy.contactTitle')}</h2>
          <p>
            {t('privacy.contactText')}{' '}
            <a href={`mailto:${PRIVACY_EMAIL}`} className="link-underline font-medium text-ink">
              {PRIVACY_EMAIL}
            </a>
          </p>
        </section>
      </article>
    </>
  );
}
