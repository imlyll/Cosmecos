import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import Field, { applyServerErrors } from '../../components/ui/Field';
import Button from '../../components/ui/Button';
import { ErrorState, Skeleton } from '../../components/ui/Feedback';
import ImageUploader from '../ImageUploader';
import { Card, PageHeader, Switch } from '../ui';
import { useAdminProduct, useSaveProduct } from '../useAdmin';
import { useCategories } from '../../hooks/useCatalog';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

const SKIN_TYPES = ['all', 'dry', 'oily', 'combination', 'normal', 'sensitive'];
// Optional number: '' stays '' (unset). Required number: '' is treated as missing, not 0.
const num = (msg) => z.union([z.literal(''), z.coerce.number({ invalid_type_error: msg }).min(0, 'admin.form.errors.min0')]);
const requiredNum = (msg) => z.preprocess((v) => (v === '' || v == null ? undefined : v), z.coerce.number({ invalid_type_error: msg }));

const variantSchema = z.object({
  _id: z.string().optional(),
  name: z.string().trim().min(1, 'admin.form.errors.variantName'),
  shade: z.string().trim().optional(),
  colorHex: z
    .string()
    .trim()
    .refine((v) => !v || /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v), 'admin.form.errors.hex')
    .optional(),
  size: z.string().trim().optional(),
  sku: z.string().trim().optional(),
  price: num('admin.form.errors.price'),
  stock: requiredNum('admin.form.errors.stock').pipe(z.number().int('admin.form.errors.whole').min(0, 'admin.form.errors.min0')),
});

// Azerbaijani / Russian versions of the text fields; blanks fall back to English in the shop.
// Language names are shown in their own language, whatever the admin UI language is.
const TRANSLATION_LANGS = [
  { code: 'az', label: 'Azərbaycan (AZE)' },
  { code: 'ru', label: 'Русский (RU)' },
];
const TEXT_FIELDS = ['name', 'shortDescription', 'description', 'ingredients', 'howToUse'];
const translationSchema = z.object({
  name: z.string().trim().max(150),
  shortDescription: z.string().trim().max(600),
  description: z.string().trim().max(20000),
  ingredients: z.string().trim().max(5000),
  howToUse: z.string().trim().max(3000),
});
const emptyTranslation = () => Object.fromEntries(TEXT_FIELDS.map((f) => [f, '']));

const schema = z
  .object({
    name: z.string().trim().min(2, 'admin.form.errors.name').max(150),
    translations: z.object({ az: translationSchema, ru: translationSchema }),
    brand: z.string().trim().max(60),
    category: z.string().min(1, 'admin.form.errors.category'),
    shortDescription: z.string().trim().max(300, 'admin.form.errors.shortMax'),
    description: z.string().trim().min(10, 'admin.form.errors.description'),
    ingredients: z.string().trim().max(5000),
    howToUse: z.string().trim().max(3000),
    price: requiredNum('admin.form.errors.price').pipe(z.number().min(0, 'admin.form.errors.min0')),
    compareAtPrice: num('admin.form.errors.number'),
    sku: z.string().trim().max(60),
    stock: requiredNum('admin.form.errors.stock').pipe(z.number().int('admin.form.errors.whole').min(0, 'admin.form.errors.min0')),
    tags: z.string(),
    skinTypes: z.array(z.string()),
    isFeatured: z.boolean(),
    isActive: z.boolean(),
    variants: z.array(variantSchema),
  })
  .refine((v) => v.compareAtPrice === '' || v.compareAtPrice >= v.price, {
    message: 'admin.form.errors.compareAt',
    path: ['compareAtPrice'],
  });

const EMPTY = {
  name: '',
  translations: { az: emptyTranslation(), ru: emptyTranslation() },
  brand: 'Cosmecos',
  category: '',
  shortDescription: '',
  description: '',
  ingredients: '',
  howToUse: '',
  price: '',
  compareAtPrice: '',
  sku: '',
  stock: 0,
  tags: '',
  skinTypes: [],
  isFeatured: false,
  isActive: true,
  variants: [],
};

function toFormValues(p) {
  return {
    ...EMPTY,
    name: p.name,
    translations: Object.fromEntries(
      TRANSLATION_LANGS.map(({ code }) => [
        code,
        Object.fromEntries(TEXT_FIELDS.map((f) => [f, p.translations?.[code]?.[f] || ''])),
      ])
    ),
    brand: p.brand || '',
    category: p.category?._id || p.category || '',
    shortDescription: p.shortDescription || '',
    description: p.description || '',
    ingredients: p.ingredients || '',
    howToUse: p.howToUse || '',
    price: p.price,
    compareAtPrice: p.compareAtPrice ?? '',
    sku: p.sku || '',
    stock: p.stock,
    tags: (p.tags || []).join(', '),
    skinTypes: p.skinTypes || [],
    isFeatured: p.isFeatured,
    isActive: p.isActive,
    variants: (p.variants || []).map((v) => ({
      _id: v._id,
      name: v.name,
      shade: v.shade || '',
      colorHex: v.colorHex || '',
      size: v.size || '',
      sku: v.sku || '',
      price: v.price ?? '',
      stock: v.stock,
    })),
  };
}

// Drops empty optional strings so the API's validators only see real values.
const compact = (obj) => Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== '' && v !== undefined));

function buildFormData(values, { isEdit, files, urls, removedIds }) {
  const fd = new FormData();
  const plain = [
    'name', 'brand', 'category', 'shortDescription', 'description', 'ingredients', 'howToUse', 'price', 'sku',
  ];
  plain.forEach((k) => fd.append(k, values[k]));
  // On edit an empty "was" price clears it; on create it's simply omitted.
  if (values.compareAtPrice !== '' || isEdit) fd.append('compareAtPrice', values.compareAtPrice);
  if (!values.variants.length) fd.append('stock', values.stock);
  fd.append('tags', values.tags);
  fd.append(
    'translations',
    JSON.stringify(Object.fromEntries(TRANSLATION_LANGS.map(({ code }) => [code, compact(values.translations[code])])))
  );
  fd.append('skinTypes', JSON.stringify(values.skinTypes));
  fd.append('isFeatured', String(values.isFeatured));
  fd.append('isActive', String(values.isActive));
  fd.append('variants', JSON.stringify(values.variants.map(compact)));
  if (urls.length) fd.append('imageUrls', JSON.stringify(urls.map((u) => ({ url: u.url }))));
  if (removedIds.length) fd.append('removeImageIds', JSON.stringify(removedIds));
  files.forEach((f) => fd.append('images', f.file));
  return fd;
}

/** Translated validation message: form errors are translation keys, server errors arrive translated. */
function useErr() {
  const { t } = useTranslation();
  return (e) => e?.message && t(e.message);
}

function Textarea({ label, error, rows = 4, ...props }) {
  return <Field as="textarea" label={label} error={error} rows={rows} {...props} />;
}

/** AZE / RU tabs with the translatable text fields. */
function TranslationsCard({ register, errors }) {
  const { t } = useTranslation();
  const err = useErr();
  const [lang, setLang] = useState(TRANSLATION_LANGS[0].code);
  const e = errors.translations?.[lang] || {};
  const field = (name) => register(`translations.${lang}.${name}`);
  return (
    <Card
      title={t('admin.form.translations')}
      action={
        <div className="flex gap-1" role="tablist" aria-label={t('admin.form.translationLanguage')}>
          {TRANSLATION_LANGS.map((l) => (
            <button
              key={l.code}
              type="button"
              role="tab"
              aria-selected={lang === l.code}
              onClick={() => setLang(l.code)}
              className={clsx(
                'border px-3 py-1 text-xs tracking-[0.1em] uppercase transition-colors',
                lang === l.code ? 'border-ink bg-ink text-cream' : 'border-line hover:border-ink'
              )}
            >
              {l.code}
            </button>
          ))}
        </div>
      }
    >
      <div key={lang} className="grid gap-5 p-5 sm:grid-cols-2">
        <p className="text-sm text-taupe sm:col-span-2">
          {t('admin.form.translationHint', { language: TRANSLATION_LANGS.find((l) => l.code === lang).label })}
        </p>
        <Field className="sm:col-span-2" label={t('admin.form.trName')} error={err(e.name)} {...field('name')} />
        <Field className="sm:col-span-2" label={t('admin.form.trShort')} error={err(e.shortDescription)} {...field('shortDescription')} />
        <Textarea className="sm:col-span-2" label={t('admin.form.trDescription')} rows={5} error={err(e.description)} {...field('description')} />
        <Textarea label={t('admin.form.ingredients')} error={err(e.ingredients)} {...field('ingredients')} />
        <Textarea label={t('admin.form.howToUse')} error={err(e.howToUse)} {...field('howToUse')} />
      </div>
    </Card>
  );
}

export default function ProductForm() {
  const { t } = useTranslation();
  const err = useErr();
  const { id } = useParams();
  const isEdit = Boolean(id);
  useDocumentTitle(t(isEdit ? 'admin.docTitle.editProduct' : 'admin.docTitle.newProduct'));
  const navigate = useNavigate();
  const { data: categories = [] } = useCategories();
  const { data: product, isLoading, isError, error, refetch } = useAdminProduct(id);
  const save = useSaveProduct();

  const [files, setFiles] = useState([]);
  const [urls, setUrls] = useState([]);
  const [removedIds, setRemovedIds] = useState([]);
  const [progress, setProgress] = useState(0);

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    formState: { errors, isDirty },
  } = useForm({ resolver: zodResolver(schema), defaultValues: EMPTY });
  const { fields: variantFields, append, remove } = useFieldArray({ control, name: 'variants' });

  useEffect(() => {
    if (product) reset(toFormValues(product));
  }, [product, reset]);

  const hasVariants = variantFields.length > 0;
  const skinTypes = watch('skinTypes');
  const variantsWatch = watch('variants');
  const variantStock = variantsWatch.reduce((s, v) => s + (Number(v.stock) || 0), 0);
  const imageChanges = files.length + urls.length + removedIds.length > 0;

  const onSubmit = (values) => {
    const existingCount = (product?.images || []).filter((i) => !removedIds.includes(i._id)).length;
    if (existingCount + files.length + urls.length === 0) {
      setError('root', { message: 'admin.form.needImage' });
      return;
    }
    setProgress(0);
    save.mutate(
      {
        id,
        body: buildFormData(values, { isEdit, files, urls, removedIds }),
        onUploadProgress: (e) => e.total && setProgress(Math.round((e.loaded / e.total) * 100)),
      },
      {
        onSuccess: () => navigate('/admin/products'),
        onError: (err) => applyServerErrors(err, setError),
      }
    );
  };

  if (isEdit && isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }
  if (isEdit && isError) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Link to="/admin/products" className="group mb-6 inline-flex items-center gap-2 text-xs tracking-[0.2em] text-taupe uppercase hover:text-ink">
        <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" /> {t('admin.form.back')}
      </Link>
      <PageHeader
        title={t(isEdit ? 'admin.form.editTitle' : 'admin.form.newTitle')}
        subtitle={isEdit ? product?.name : t('admin.form.newSubtitle')}
        actions={
          <>
            <Button to="/admin/products" variant="outline">
              {t('admin.common.cancel')}
            </Button>
            <Button type="submit" loading={save.isPending} disabled={isEdit && !isDirty && !imageChanges}>
              {t(isEdit ? 'admin.form.save' : 'admin.form.create')}
            </Button>
          </>
        }
      />

      <AnimatePresence>
        {(errors.root || (save.error && !save.error.errors)) && (
          <motion.p
            role="alert"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger"
          >
            {errors.root ? t(errors.root.message) : save.error.message}
          </motion.p>
        )}
      </AnimatePresence>

      <div className="grid items-start gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Card title={t('admin.form.basic')}>
            <div className="grid gap-5 p-5 sm:grid-cols-2">
              <Field className="sm:col-span-2" label={t('admin.form.name')} error={err(errors.name)} {...register('name')} />
              <Field label={t('admin.form.brand')} error={err(errors.brand)} {...register('brand')} />
              <div>
                <label htmlFor="category" className="label-luxe">
                  {t('admin.form.category')}
                </label>
                <select id="category" aria-invalid={errors.category ? 'true' : undefined} className="input-luxe" {...register('category')}>
                  <option value="">{t('admin.form.chooseCategory')}</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.parent ? `— ${c.name}` : c.name}
                    </option>
                  ))}
                </select>
                {errors.category && <p className="mt-1.5 text-xs text-danger">{err(errors.category)}</p>}
              </div>
              <Field className="sm:col-span-2" label={t('admin.form.shortDescription')} error={err(errors.shortDescription)} {...register('shortDescription')} />
              <Textarea className="sm:col-span-2" label={t('admin.form.description')} rows={5} error={err(errors.description)} {...register('description')} />
              <Textarea label={t('admin.form.ingredients')} error={err(errors.ingredients)} {...register('ingredients')} />
              <Textarea label={t('admin.form.howToUse')} error={err(errors.howToUse)} {...register('howToUse')} />
            </div>
          </Card>

          <TranslationsCard register={register} errors={errors} />

          <Card title={t('admin.form.images')}>
            <div className="p-5">
              <ImageUploader
                existing={product?.images || []}
                removedIds={removedIds}
                onToggleRemove={(imgId) =>
                  setRemovedIds((prev) => (prev.includes(imgId) ? prev.filter((x) => x !== imgId) : [...prev, imgId]))
                }
                files={files}
                setFiles={setFiles}
                urls={urls}
                setUrls={setUrls}
              />
            </div>
          </Card>

          <Card
            title={hasVariants ? t('admin.form.variantsCount', { count: variantFields.length }) : t('admin.form.variants')}
            action={
              <button
                type="button"
                onClick={() => append({ name: '', shade: '', colorHex: '', size: '', sku: '', price: '', stock: 0 })}
                className="flex items-center gap-1.5 text-xs tracking-[0.15em] uppercase hover:text-rose"
              >
                <Plus className="size-4" /> {t('admin.form.addVariant')}
              </button>
            }
          >
            <div className="p-5">
              {!hasVariants ? (
                <p className="text-sm text-taupe">
                  {t('admin.form.noVariants')}
                </p>
              ) : (
                <ul className="space-y-4">
                  <AnimatePresence initial={false}>
                    {variantFields.map((field, i) => {
                      const e = errors.variants?.[i] || {};
                      const hex = variantsWatch[i]?.colorHex;
                      return (
                        <motion.li
                          key={field.id}
                          layout
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, height: 0 }}
                          className="grid gap-3 border border-line p-4 sm:grid-cols-6"
                        >
                          <Field className="sm:col-span-2" label={t('admin.form.variantName')} placeholder={t('admin.form.variantNamePlaceholder')} error={err(e.name)} {...register(`variants.${i}.name`)} />
                          <Field label={t('admin.form.shade')} error={err(e.shade)} {...register(`variants.${i}.shade`)} />
                          <div>
                            <Field label={t('admin.form.colorHex')} placeholder="#C08081" error={err(e.colorHex)} {...register(`variants.${i}.colorHex`)} />
                            {hex && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex) && (
                              <span className="mt-1.5 inline-block size-4 rounded-full ring-1 ring-line" style={{ backgroundColor: hex }} />
                            )}
                          </div>
                          <Field label={t('admin.form.size')} placeholder={t('admin.form.sizePlaceholder')} error={err(e.size)} {...register(`variants.${i}.size`)} />
                          <Field label={t('admin.form.sku')} error={err(e.sku)} {...register(`variants.${i}.sku`)} />
                          <Field className="sm:col-span-2" label={t('admin.form.variantPrice')} type="number" step="0.01" min="0" error={err(e.price)} {...register(`variants.${i}.price`)} />
                          <Field className="sm:col-span-2" label={t('admin.form.stockRequired')} type="number" min="0" error={err(e.stock)} {...register(`variants.${i}.stock`)} />
                          <div className="flex items-end justify-end sm:col-span-2">
                            <button
                              type="button"
                              onClick={() => remove(i)}
                              className="flex h-12 items-center gap-2 px-3 text-xs tracking-[0.15em] text-taupe uppercase hover:text-danger"
                            >
                              <Trash2 className="size-4" /> {t('admin.form.remove')}
                            </button>
                          </div>
                        </motion.li>
                      );
                    })}
                  </AnimatePresence>
                </ul>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-6 xl:sticky xl:top-8">
          <Card title={t('admin.form.visibility')}>
            <div className="divide-y divide-line">
              {[
                { name: 'isActive', label: t('admin.form.active'), hint: t('admin.form.activeHint') },
                { name: 'isFeatured', label: t('admin.form.featured'), hint: t('admin.form.featuredHint') },
              ].map((s) => (
                <div key={s.name} className="flex items-center justify-between gap-4 px-5 py-4">
                  <div>
                    <p className="text-sm font-medium">{s.label}</p>
                    <p className="text-xs text-taupe">{s.hint}</p>
                  </div>
                  <Switch
                    label={s.label}
                    checked={watch(s.name)}
                    onChange={(v) => setValue(s.name, v, { shouldDirty: true })}
                  />
                </div>
              ))}
            </div>
          </Card>

          <Card title={t('admin.form.pricing')}>
            <div className="grid gap-5 p-5 sm:grid-cols-2 xl:grid-cols-1">
              <Field label={t('admin.form.price')} type="number" step="0.01" min="0" error={err(errors.price)} {...register('price')} />
              <Field
                label={t('admin.form.compareAt')}
                type="number"
                step="0.01"
                min="0"
                placeholder={t('admin.form.compareAtPlaceholder')}
                error={err(errors.compareAtPrice)}
                {...register('compareAtPrice')}
              />
              <Field label={t('admin.form.sku')} error={err(errors.sku)} {...register('sku')} />
              {hasVariants ? (
                <div>
                  <p className="label-luxe">{t('admin.form.stock')}</p>
                  <p className="border border-line bg-cream px-4 py-3.5 text-sm">{t('admin.form.stockSum', { count: variantStock })}</p>
                </div>
              ) : (
                <Field label={t('admin.form.stockRequired')} type="number" min="0" error={err(errors.stock)} {...register('stock')} />
              )}
            </div>
          </Card>

          <Card title={t('admin.form.organisation')}>
            <div className="space-y-5 p-5">
              <Field label={t('admin.form.tags')} placeholder={t('admin.form.tagsPlaceholder')} error={err(errors.tags)} {...register('tags')} />
              <fieldset>
                <legend className="label-luxe">{t('admin.form.skinTypes')}</legend>
                <div className="flex flex-wrap gap-2">
                  {SKIN_TYPES.map((s) => {
                    const on = skinTypes.includes(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        aria-pressed={on}
                        onClick={() =>
                          setValue('skinTypes', on ? skinTypes.filter((x) => x !== s) : [...skinTypes, s], { shouldDirty: true })
                        }
                        className={clsx(
                          'border px-3 py-1.5 text-xs transition-colors',
                          on ? 'border-ink bg-ink text-cream' : 'border-line bg-white hover:border-ink'
                        )}
                      >
                        {t(`admin.form.skin.${s}`)}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            </div>
          </Card>

          <AnimatePresence>
            {save.isPending && files.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="border border-line bg-white p-5">
                <p className="text-xs text-taupe">{t('admin.form.uploading', { progress })}</p>
                <div className="mt-2 h-1 bg-line">
                  <motion.div className="h-full bg-rose" animate={{ width: `${progress}%` }} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <Button type="submit" size="lg" className="w-full" loading={save.isPending} disabled={isEdit && !isDirty && !imageChanges}>
            {t(isEdit ? 'admin.form.save' : 'admin.form.create')}
          </Button>
        </div>
      </div>
    </form>
  );
}
