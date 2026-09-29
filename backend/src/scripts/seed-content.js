/* Demo catalogue copy in English, Azerbaijani and Russian, used by seed.js. */

const CATEGORY_TRANSLATIONS = {
  'Awesome Soap': {
    az: { name: 'Möhtəşəm sabunlar', description: 'Əl işi sabunlar və təmizləyici bərk sabunlar.' },
    ru: { name: 'Чудесное мыло', description: 'Мыло ручной работы и очищающие бруски.' },
  },
  'Body Care': {
    az: { name: 'Bədən baxımı', description: 'Bədən üçün losyonlar, yağlar və kremlər.' },
    ru: { name: 'Уход за телом', description: 'Лосьоны, масла и кремы для тела.' },
  },
  Cosmetics: {
    az: { name: 'Kosmetika', description: 'Makiyaj, ətriyyat və dekorativ kosmetika.' },
    ru: { name: 'Косметика', description: 'Макияж, парфюмерия и декоративная косметика.' },
  },
  'Hair Care': {
    az: { name: 'Saç baxımı', description: 'Saç üçün yağlar, maskalar və baxım vasitələri.' },
    ru: { name: 'Уход за волосами', description: 'Масла, маски и средства ухода за волосами.' },
  },
  'Makeup Equipment': {
    az: { name: 'Makiyaj ləvazimatları', description: 'Fırçalar, süngərlər və alətlər.' },
    ru: { name: 'Аксессуары для макияжа', description: 'Кисти, спонжи и инструменты.' },
  },
  'Perfect Concealer': {
    az: { name: 'Mükəmməl konsiler', description: 'Konsilerlər və korrektorlar.' },
    ru: { name: 'Идеальный консилер', description: 'Консилеры и корректоры.' },
  },
};

const PRODUCT_NAMES = {
  'Body Oil & Lotion': { az: 'Bədən yağı və losyonu', ru: 'Масло и лосьон для тела' },
  'Perfect Concealer': { az: 'Mükəmməl konsiler', ru: 'Идеальный консилер' },
  'Soft Hand Lotion': { az: 'Yumşaq əl losyonu', ru: 'Мягкий лосьон для рук' },
  'Foundation Lotion': { az: 'Tonal losyon', ru: 'Тональный лосьон' },
  'Soft BB Cream': { az: 'Yumşaq BB krem', ru: 'Мягкий BB-крем' },
  'Face Day Cream': { az: 'Üz üçün gündüz kremi', ru: 'Дневной крем для лица' },
  'Face BB CReam': { az: 'Üz üçün BB krem', ru: 'BB-крем для лица' },
  'Silk Hand Cream': { az: 'İpək əl kremi', ru: 'Шёлковый крем для рук' },
  'Basic Foundation': { az: 'Əsas tonal krem', ru: 'Базовый тональный крем' },
  'Lipstick Brown': { az: 'Qəhvəyi dodaq boyası', ru: 'Коричневая помада' },
  'Dropped Body Oil': { az: 'Damcılı bədən yağı', ru: 'Масло для тела с пипеткой' },
  'Nail Polish Nova': { az: 'Nova dırnaq lakı', ru: 'Лак для ногтей Nova' },
  'Dropped Beard Oil': { az: 'Damcılı saqqal yağı', ru: 'Масло для бороды с пипеткой' },
  'Dropper Beard Oil': { az: 'Damcılı saqqal yağı', ru: 'Масло для бороды с пипеткой' },
  Mascara: { az: 'Kirpik tuşu', ru: 'Тушь для ресниц' },
  'Cream Soap': { az: 'Kremli sabun', ru: 'Кремовое мыло' },
};

// Paragraph text, then "- " lines that the product page renders as a checklist.
const COPY = {
  en: {
    shortDescription:
      'A lightweight, fast-absorbing formula enriched with botanical oils and vitamin E. It nourishes and softens the skin, leaving a subtle radiance without a greasy finish.',
    description: [
      'Crafted in small batches from carefully selected natural ingredients, this everyday essential restores comfort and a healthy glow. The silky texture melts into the skin, locks in moisture for up to 24 hours and layers beautifully under makeup.',
      '- Dermatologically tested and suitable for sensitive skin',
      '- Free from parabens, sulfates and synthetic fragrance',
      '- Cruelty-free, vegan formula in recyclable packaging',
    ].join('\n'),
  },
  az: {
    shortDescription:
      'Bitki yağları və E vitamini ilə zənginləşdirilmiş yüngül, tez hopan formula. Dərini qidalandırır və yumşaldır, yağlı iz qoymadan incə parıltı bəxş edir.',
    description: [
      'Diqqətlə seçilmiş təbii inqrediyentlərdən kiçik partiyalarla hazırlanan bu gündəlik vasitə dəriyə rahatlıq və sağlam parıltı qaytarır. İpək kimi teksturası dəriyə asanlıqla hopur, nəmi 24 saatadək saxlayır və makiyaj altında gözəl oturur.',
      '- Dermatoloji testlərdən keçib, həssas dəri üçün uyğundur',
      '- Paraben, sulfat və sintetik ətirlər yoxdur',
      '- Heyvanlar üzərində sınanmayıb, vegan formula, təkrar emal olunan qablaşdırma',
    ].join('\n'),
  },
  ru: {
    shortDescription:
      'Лёгкая, быстро впитывающаяся формула, обогащённая растительными маслами и витамином E. Питает и смягчает кожу, придаёт деликатное сияние без жирного блеска.',
    description: [
      'Созданное небольшими партиями из тщательно отобранных натуральных ингредиентов, это средство на каждый день возвращает коже комфорт и здоровое сияние. Шелковистая текстура мгновенно тает на коже, удерживает влагу до 24 часов и идеально ложится под макияж.',
      '- Дерматологически протестировано, подходит для чувствительной кожи',
      '- Без парабенов, сульфатов и синтетических отдушек',
      '- Не тестируется на животных, веганская формула, перерабатываемая упаковка',
    ].join('\n'),
  },
};

/** Translations object for a demo product, keyed by language. */
const productTranslations = (name) =>
  Object.fromEntries(
    ['az', 'ru'].map((lang) => [lang, { name: PRODUCT_NAMES[name]?.[lang], ...COPY[lang] }])
  );

// Placeholder text used by earlier versions of the seed; replaced when found.
const LEGACY_SHORT_DESCRIPTION_START = 'False brotula viperfish';

module.exports = { CATEGORY_TRANSLATIONS, PRODUCT_NAMES, COPY, productTranslations, LEGACY_SHORT_DESCRIPTION_START };
