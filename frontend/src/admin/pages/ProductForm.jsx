import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import clsx from 'clsx';
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
const num = (msg) => z.union([z.literal(''), z.coerce.number({ invalid_type_error: msg }).min(0, 'Must be 0 or more')]);
const requiredNum = (msg) => z.preprocess((v) => (v === '' || v == null ? undefined : v), z.coerce.number({ invalid_type_error: msg }));

const variantSchema = z.object({
  _id: z.string().optional(),
  name: z.string().trim().min(1, 'Name is required'),
  shade: z.string().trim().optional(),
  colorHex: z
    .string()
    .trim()
    .refine((v) => !v || /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v), 'Use a hex colour like #C08081')
    .optional(),
  size: z.string().trim().optional(),
  sku: z.string().trim().optional(),
  price: num('Enter a price'),
  stock: requiredNum('Enter stock').pipe(z.number().int('Whole numbers only').min(0, 'Must be 0 or more')),
});

// Azerbaijani / Russian versions of the text fields; blanks fall back to English in the shop.
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
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(150),
    translations: z.object({ az: translationSchema, ru: translationSchema }),
    brand: z.string().trim().max(60),
    category: z.string().min(1, 'Choose a category'),
    shortDescription: z.string().trim().max(300, 'Keep it under 300 characters'),
    description: z.string().trim().min(10, 'Description must be at least 10 characters'),
    ingredients: z.string().trim().max(5000),
    howToUse: z.string().trim().max(3000),
    price: requiredNum('Enter a price').pipe(z.number().min(0, 'Must be 0 or more')),
    compareAtPrice: num('Enter a number'),
    sku: z.string().trim().max(60),
    stock: requiredNum('Enter stock').pipe(z.number().int('Whole numbers only').min(0, 'Must be 0 or more')),
    tags: z.string(),
    skinTypes: z.array(z.string()),
    isFeatured: z.boolean(),
    isActive: z.boolean(),
    variants: z.array(variantSchema),
  })
  .refine((v) => v.compareAtPrice === '' || v.compareAtPrice >= v.price, {
    message: 'Must be higher than the price (it’s the “was” price)',
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

function Textarea({ label, error, rows = 4, ...props }) {
  return <Field as="textarea" label={label} error={error} rows={rows} {...props} />;
}

/** AZE / RU tabs with the translatable text fields. */
function TranslationsCard({ register, errors }) {
  const [lang, setLang] = useState(TRANSLATION_LANGS[0].code);
  const e = errors.translations?.[lang] || {};
  const field = (name) => register(`translations.${lang}.${name}`);
  return (
    <Card
      title="Translations"
      action={
        <div className="flex gap-1" role="tablist" aria-label="Translation language">
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
          {TRANSLATION_LANGS.find((l) => l.code === lang).label}: shown when shoppers choose this language. Leave a field
          blank to show the English text.
        </p>
        <Field className="sm:col-span-2" label="Product name" error={e.name?.message} {...field('name')} />
        <Field className="sm:col-span-2" label="Short description" error={e.shortDescription?.message} {...field('shortDescription')} />
        <Textarea className="sm:col-span-2" label="Description" rows={5} error={e.description?.message} {...field('description')} />
        <Textarea label="Ingredients" error={e.ingredients?.message} {...field('ingredients')} />
        <Textarea label="How to use" error={e.howToUse?.message} {...field('howToUse')} />
      </div>
    </Card>
  );
}

export default function ProductForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  useDocumentTitle(isEdit ? 'Edit product · Admin' : 'New product · Admin');
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
      setError('root', { message: 'Add at least one product image.' });
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
        <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" /> All products
      </Link>
      <PageHeader
        title={isEdit ? 'Edit product' : 'Add new product'}
        subtitle={isEdit ? product?.name : 'Fill in the details below. Fields marked * are required.'}
        actions={
          <>
            <Button to="/admin/products" variant="outline">
              Cancel
            </Button>
            <Button type="submit" loading={save.isPending} disabled={isEdit && !isDirty && !imageChanges}>
              {isEdit ? 'Save changes' : 'Create product'}
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
            {errors.root?.message || save.error.message}
          </motion.p>
        )}
      </AnimatePresence>

      <div className="grid items-start gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Card title="Basic information">
            <div className="grid gap-5 p-5 sm:grid-cols-2">
              <Field className="sm:col-span-2" label="Product name *" error={errors.name?.message} {...register('name')} />
              <Field label="Brand" error={errors.brand?.message} {...register('brand')} />
              <div>
                <label htmlFor="category" className="label-luxe">
                  Category *
                </label>
                <select id="category" aria-invalid={errors.category ? 'true' : undefined} className="input-luxe" {...register('category')}>
                  <option value="">Choose a category…</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.parent ? `— ${c.name}` : c.name}
                    </option>
                  ))}
                </select>
                {errors.category && <p className="mt-1.5 text-xs text-danger">{errors.category.message}</p>}
              </div>
              <Field className="sm:col-span-2" label="Short description" error={errors.shortDescription?.message} {...register('shortDescription')} />
              <Textarea className="sm:col-span-2" label="Description *" rows={5} error={errors.description?.message} {...register('description')} />
              <Textarea label="Ingredients" error={errors.ingredients?.message} {...register('ingredients')} />
              <Textarea label="How to use" error={errors.howToUse?.message} {...register('howToUse')} />
            </div>
          </Card>

          <TranslationsCard register={register} errors={errors} />

          <Card title="Images *">
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
            title={`Variants${hasVariants ? ` (${variantFields.length})` : ''}`}
            action={
              <button
                type="button"
                onClick={() => append({ name: '', shade: '', colorHex: '', size: '', sku: '', price: '', stock: 0 })}
                className="flex items-center gap-1.5 text-xs tracking-[0.15em] uppercase hover:text-rose"
              >
                <Plus className="size-4" /> Add variant
              </button>
            }
          >
            <div className="p-5">
              {!hasVariants ? (
                <p className="text-sm text-taupe">
                  No variants. Add shades or sizes if customers should choose one — stock is then tracked per variant.
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
                          <Field className="sm:col-span-2" label="Name *" placeholder="Rose Nude / 50ml" error={e.name?.message} {...register(`variants.${i}.name`)} />
                          <Field label="Shade" error={e.shade?.message} {...register(`variants.${i}.shade`)} />
                          <div>
                            <Field label="Colour hex" placeholder="#C08081" error={e.colorHex?.message} {...register(`variants.${i}.colorHex`)} />
                            {hex && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex) && (
                              <span className="mt-1.5 inline-block size-4 rounded-full ring-1 ring-line" style={{ backgroundColor: hex }} />
                            )}
                          </div>
                          <Field label="Size" placeholder="30ml" error={e.size?.message} {...register(`variants.${i}.size`)} />
                          <Field label="SKU" error={e.sku?.message} {...register(`variants.${i}.sku`)} />
                          <Field className="sm:col-span-2" label="Price (blank = product price)" type="number" step="0.01" min="0" error={e.price?.message} {...register(`variants.${i}.price`)} />
                          <Field className="sm:col-span-2" label="Stock *" type="number" min="0" error={e.stock?.message} {...register(`variants.${i}.stock`)} />
                          <div className="flex items-end justify-end sm:col-span-2">
                            <button
                              type="button"
                              onClick={() => remove(i)}
                              className="flex h-12 items-center gap-2 px-3 text-xs tracking-[0.15em] text-taupe uppercase hover:text-danger"
                            >
                              <Trash2 className="size-4" /> Remove
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
          <Card title="Visibility">
            <div className="divide-y divide-line">
              {[
                { name: 'isActive', label: 'Active', hint: 'Visible in the shop' },
                { name: 'isFeatured', label: 'Featured', hint: 'Shown in featured collections' },
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

          <Card title="Pricing & inventory">
            <div className="grid gap-5 p-5 sm:grid-cols-2 xl:grid-cols-1">
              <Field label="Price (USD) *" type="number" step="0.01" min="0" error={errors.price?.message} {...register('price')} />
              <Field
                label="Compare-at price (was)"
                type="number"
                step="0.01"
                min="0"
                placeholder="Leave blank if not on sale"
                error={errors.compareAtPrice?.message}
                {...register('compareAtPrice')}
              />
              <Field label="SKU" error={errors.sku?.message} {...register('sku')} />
              {hasVariants ? (
                <div>
                  <p className="label-luxe">Stock</p>
                  <p className="border border-line bg-cream px-4 py-3.5 text-sm">{variantStock} (sum of variants)</p>
                </div>
              ) : (
                <Field label="Stock *" type="number" min="0" error={errors.stock?.message} {...register('stock')} />
              )}
            </div>
          </Card>

          <Card title="Organisation">
            <div className="space-y-5 p-5">
              <Field label="Tags" placeholder="serum, vitamin c, new" error={errors.tags?.message} {...register('tags')} />
              <fieldset>
                <legend className="label-luxe">Skin types</legend>
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
                          'border px-3 py-1.5 text-xs capitalize transition-colors',
                          on ? 'border-ink bg-ink text-cream' : 'border-line bg-white hover:border-ink'
                        )}
                      >
                        {s}
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
                <p className="text-xs text-taupe">Uploading images… {progress}%</p>
                <div className="mt-2 h-1 bg-line">
                  <motion.div className="h-full bg-rose" animate={{ width: `${progress}%` }} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <Button type="submit" size="lg" className="w-full" loading={save.isPending} disabled={isEdit && !isDirty && !imageChanges}>
            {isEdit ? 'Save changes' : 'Create product'}
          </Button>
        </div>
      </div>
    </form>
  );
}
