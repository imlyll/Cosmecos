import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import PageHero from '../components/ui/PageHero';
import Field, { applyServerErrors } from '../components/ui/Field';
import Reveal from '../components/ui/Reveal';
import { STORE_INFO, telHref } from '../components/layout/nav';
import { api } from '../lib/api';
import { useAuthStore } from '../store/auth';
import { EASE } from '../lib/motion';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const INFO = [
  { icon: '/images/icons/contact-0.png', title: 'Adress', lines: [{ text: STORE_INFO.address }] },
  {
    icon: '/images/icons/contact-1.png',
    title: 'Phone',
    lines: [STORE_INFO.phone, STORE_INFO.phone2].map((p) => ({ text: p, href: telHref(p) })),
  },
  { icon: '/images/icons/contact-2.png', title: 'Email', lines: [{ text: STORE_INFO.email, href: `mailto:${STORE_INFO.email}` }] },
];

const schema = z.object({
  name: z.string().trim().min(2, 'Please enter your name'),
  email: z.string().trim().email('Enter a valid email address'),
  subject: z.string().trim().max(120).optional().or(z.literal('')),
  message: z.string().trim().min(10, 'Tell us a little more (at least 10 characters)').max(3000),
});

function ContactForm() {
  const user = useAuthStore((s) => s.user);
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { name: user?.name || '', email: user?.email || '' } });

  const send = useMutation({
    mutationFn: (body) => api('/contact', { method: 'POST', body }),
    onSuccess: () => {
      setSent(true);
      reset({ name: user?.name || '', email: user?.email || '', subject: '', message: '' });
    },
    onError: (err) => applyServerErrors(err, setError),
  });

  const onSubmit = ({ subject, ...rest }) => send.mutate({ ...rest, ...(subject && { subject }) });

  return (
    <AnimatePresence mode="wait">
      {sent ? (
        <motion.div
          key="sent"
          className="flex min-h-[380px] flex-col items-start justify-center"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          <CheckCircle2 className="size-14 text-rose" strokeWidth={1} />
          <h3 className="mt-5 text-[28px] font-light uppercase">Message sent</h3>
          <p className="mt-2 max-w-sm text-taupe">Thank you for reaching out. We reply within one business day.</p>
          <button type="button" className="btn-cos mt-8" onClick={() => setSent(false)}>
            Send another message
          </button>
        </motion.div>
      ) : (
        <motion.form
          key="form"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <p className="mb-[30px] text-taupe">Your email address will not be published. Required fields are marked *</p>
          {send.error && !send.error.errors && (
            <p role="alert" className="mb-5 border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
              {send.error.message}
            </p>
          )}
          <div className="grid gap-[30px] sm:grid-cols-2">
            <Field placeholder="Full name *" aria-label="Full name" autoComplete="name" error={errors.name?.message} {...register('name')} />
            <Field placeholder="Email *" aria-label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
            <Field placeholder="Subject" aria-label="Subject" className="sm:col-span-2" error={errors.subject?.message} {...register('subject')} />
            <Field
              placeholder="Message"
              aria-label="Message"
              as="textarea"
              rows={5}
              className="sm:col-span-2"
              error={errors.message?.message}
              {...register('message')}
            />
          </div>
          <button type="submit" disabled={send.isPending} className="btn-cos mt-[30px] w-40">
            {send.isPending ? 'Sending…' : 'Send'}
          </button>
        </motion.form>
      )}
    </AnimatePresence>
  );
}

export default function Contacts() {
  useDocumentTitle('Contacts');
  const mapQuery = encodeURIComponent('58 White St, New York, NY');

  return (
    <>
      <PageHero title="Contacts" />

      <section className="container-luxe grid gap-14 py-[150px] text-center max-md:py-20 md:grid-cols-3">
        {INFO.map((item, i) => (
          <Reveal key={item.title} delay={i * 0.1}>
            <img src={item.icon} alt="" className="mx-auto h-[210px] w-[210px] object-contain" />
            <h3 className="-mt-4 text-2xl font-normal">{item.title}</h3>
            <div className="mt-2">
              {item.lines.map((l) =>
                l.href ? (
                  <a key={l.text} href={l.href} className="block transition-colors hover:text-rose">
                    {l.text}
                  </a>
                ) : (
                  <p key={l.text}>{l.text}</p>
                )
              )}
            </div>
          </Reveal>
        ))}
      </section>

      <section aria-label="Map" className="h-[400px] bg-[#e2e2e2] md:h-[550px]">
        <iframe
          title="Cosmecos on the map"
          src={`https://maps.google.com/maps?q=${mapQuery}&z=14&output=embed`}
          loading="lazy"
          className="size-full border-0 grayscale"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </section>

      <section className="container-luxe grid gap-14 py-[150px] max-md:py-20 lg:grid-cols-[1fr_370px] lg:gap-[120px]">
        <Reveal className="lg:pl-[20px]">
          <h2 className="mb-2 text-[28px] leading-10 font-light uppercase">Send message</h2>
          <ContactForm />
        </Reveal>
        <Reveal delay={0.1} className="hidden lg:block">
          <img src="/images/home1-image-2.jpg" alt="" className="w-full" />
        </Reveal>
      </section>
    </>
  );
}
