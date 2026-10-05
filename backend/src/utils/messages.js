/**
 * Azerbaijani and Russian versions of the API error messages that shoppers can see (toasts, form errors).
 * Errors are thrown in English throughout the code; the error handler translates them for the request's
 * language (req.lang). Messages not listed here, e.g. admin-only ones, stay in English.
 * Each entry: [English text or RegExp, az, ru]; for a RegExp, $1… refer to its capture groups, or the
 * translation is a function (match, statusTranslator) => string.
 */
const MESSAGES = [
  ['Validation failed', 'Məlumatlar yanlışdır', 'Проверьте введённые данные'],
  ['Invalid email or password', 'E-poçt və ya şifrə yanlışdır', 'Неверный e-mail или пароль'],
  ['Email is already registered', 'Bu e-poçt artıq qeydiyyatdan keçib', 'Этот e-mail уже зарегистрирован'],
  ['This account has been disabled', 'Bu hesab deaktiv edilib', 'Этот аккаунт отключён'],
  ['Current password is incorrect', 'Cari şifrə yanlışdır', 'Текущий пароль указан неверно'],
  ['Password must contain a letter', 'Şifrədə ən azı bir hərf olmalıdır', 'Пароль должен содержать букву'],
  ['Password must contain a number', 'Şifrədə ən azı bir rəqəm olmalıdır', 'Пароль должен содержать цифру'],
  ['Password must be at least 8 characters', 'Şifrə ən azı 8 simvol olmalıdır', 'Пароль должен быть не короче 8 символов'],
  ['New password must differ from the current one', 'Yeni şifrə cari şifrədən fərqli olmalıdır', 'Новый пароль должен отличаться от текущего'],
  ['Please verify your email address to continue', 'Davam etmək üçün e-poçt ünvanınızı təsdiqləyin', 'Подтвердите адрес эл. почты, чтобы продолжить'],
  ['Incorrect verification code', 'Təsdiq kodu yanlışdır', 'Неверный код подтверждения'],
  ['Enter the 6-digit code', '6 rəqəmli kodu daxil edin', 'Введите 6-значный код'],
  ['This code has expired. Please request a new one.', 'Kodun müddəti bitib. Yeni kod tələb edin.', 'Срок действия кода истёк. Запросите новый.'],
  ['Too many incorrect attempts. Please request a new code.', 'Çox sayda yanlış cəhd. Yeni kod tələb edin.', 'Слишком много неверных попыток. Запросите новый код.'],
  [/^Please wait (\d+)s before requesting a new code$/, 'Yeni kod tələb etmək üçün $1 saniyə gözləyin', 'Подождите $1 с, прежде чем запросить новый код'],
  ['This email is already verified. Please sign in.', 'Bu e-poçt artıq təsdiqlənib. Zəhmət olmasa daxil olun.', 'Эта почта уже подтверждена. Пожалуйста, войдите.'],
  ['We could not send the verification email. Please try again shortly.', 'Təsdiq məktubunu göndərə bilmədik. Bir azdan yenidən cəhd edin.', 'Не удалось отправить письмо с кодом. Попробуйте чуть позже.'],
  ['If this email is registered, we sent a code to reset your password', 'Bu e-poçt qeydiyyatdadırsa, şifrəni bərpa etmək üçün kod göndərdik', 'Если этот адрес зарегистрирован, мы отправили код для сброса пароля'],
  ['Too many attempts, please try again later', 'Çox sayda cəhd. Bir az sonra yenidən cəhd edin', 'Слишком много попыток, попробуйте позже'],
  ['Authentication token missing', 'Davam etmək üçün daxil olun', 'Войдите, чтобы продолжить'],
  ['Token expired, please log in again', 'Sessiyanın müddəti bitib, yenidən daxil olun', 'Сеанс истёк, войдите снова'],
  ['Password was changed recently, please log in again', 'Şifrə bu yaxınlarda dəyişdirilib, yenidən daxil olun', 'Пароль недавно изменён, войдите снова'],
  ['This coupon code is not valid', 'Bu kupon kodu etibarsızdır', 'Этот промокод недействителен'],
  ['This coupon has expired', 'Bu kuponun müddəti bitib', 'Срок действия промокода истёк'],
  ['This coupon has reached its usage limit', 'Bu kuponun istifadə limiti dolub', 'Лимит использования промокода исчерпан'],
  [/^Spend at least \$(\S+) to use this coupon$/, 'Bu kupondan istifadə üçün ən azı $$1 məbləğində alış edin', 'Минимальная сумма заказа для этого промокода — $$1'],
  ['Your cart is empty', 'Səbətiniz boşdur', 'Ваша корзина пуста'],
  [/^Only (\d+) item\(s\) in stock$/, 'Stokda yalnız $1 ədəd var', 'В наличии только $1 шт.'],
  [/^Insufficient stock for (.+)$/, '"$1" üçün stok kifayət deyil', 'Недостаточно товара «$1» на складе'],
  ['Please choose a variant (shade/size) for this product', 'Bu məhsul üçün çalar və ya ölçü seçin', 'Выберите оттенок или размер для этого товара'],
  ['Selected variant does not exist', 'Seçilmiş variant mövcud deyil', 'Выбранный вариант не существует'],
  ['This product has no variants', 'Bu məhsulun variantları yoxdur', 'У этого товара нет вариантов'],
  [/^Please choose a valid variant for (.+)$/, '"$1" üçün düzgün variant seçin', 'Выберите корректный вариант для «$1»'],
  [/^(.+) has no variants$/, '"$1" məhsulunun variantları yoxdur', 'У товара «$1» нет вариантов'],
  [/^Product \S+ is no longer available$/, 'Məhsullardan biri artıq satışda deyil', 'Один из товаров больше не доступен'],
  ['Product not found', 'Məhsul tapılmadı', 'Товар не найден'],
  ['Cart item not found', 'Səbətdə belə məhsul yoxdur', 'Товар в корзине не найден'],
  ['Order not found', 'Sifariş tapılmadı', 'Заказ не найден'],
  ['Only pending or processing orders can be cancelled', 'Yalnız gözləmədə və ya hazırlanmaqda olan sifarişlər ləğv edilə bilər', 'Отменить можно только ожидающие или обрабатываемые заказы'],
  ['Internal server error', 'Serverdə xəta baş verdi', 'Внутренняя ошибка сервера'],

  // Admin panel
  ['User not found', 'İstifadəçi tapılmadı', 'Пользователь не найден'],
  ['Category not found', 'Kateqoriya tapılmadı', 'Категория не найдена'],
  ['Category does not exist', 'Belə kateqoriya yoxdur', 'Такой категории не существует'],
  ['A category cannot be its own parent', 'Kateqoriya özünün ana kateqoriyası ola bilməz', 'Категория не может быть родителем самой себя'],
  ['Image not found', 'Şəkil tapılmadı', 'Изображение не найдено'],
  ['Coupon not found', 'Kupon tapılmadı', 'Промокод не найден'],
  ['Message not found', 'Mesaj tapılmadı', 'Сообщение не найдено'],
  ['You cannot change your own role or status', 'Öz rolunuzu və ya statusunuzu dəyişə bilməzsiniz', 'Нельзя изменить собственную роль или статус'],
  ['Order was modified by someone else, please reload', 'Sifariş başqa biri tərəfindən dəyişdirilib, səhifəni yeniləyin', 'Заказ был изменён другим пользователем, обновите страницу'],
  ['compareAtPrice must be greater than or equal to price', 'Köhnə qiymət cari qiymətdən az olmamalıdır', 'Старая цена должна быть не ниже текущей'],
  [/^Order is already (\w+)$/, (m, s) => `Sifariş artıq "${s(m[1])}" statusundadır`, (m, s) => `Заказ уже в статусе «${s(m[1])}»`],
  [
    /^Cannot change status from (\w+) to (\w+)\. Allowed: (.+)$/,
    (m, s) => `Status "${s(m[1])}" → "${s(m[2])}" dəyişdirilə bilməz. İcazə verilən: ${s.list(m[3])}`,
    (m, s) => `Нельзя изменить статус «${s(m[1])}» на «${s(m[2])}». Допустимо: ${s.list(m[3])}`,
  ],
  [/^Unsupported file type: (\S+)\. Use JPEG, PNG, WebP or AVIF\.$/, 'Dəstəklənməyən fayl növü: $1. JPEG, PNG, WebP və ya AVIF istifadə edin.', 'Неподдерживаемый тип файла: $1. Используйте JPEG, PNG, WebP или AVIF.'],
  ['Upload error: File too large', 'Yükləmə xətası: fayl 5 MB-dan böyükdür', 'Ошибка загрузки: файл больше 5 МБ'],
  [/^Upload error: (.+)$/, 'Yükləmə xətası: $1', 'Ошибка загрузки: $1'],
];

// Order statuses as they appear inside messages.
const STATUS = {
  az: { Pending: 'Gözləmədə', Processing: 'Hazırlanır', Shipped: 'Göndərilib', Delivered: 'Çatdırılıb', Cancelled: 'Ləğv edilib', none: 'yoxdur' },
  ru: { Pending: 'Ожидает', Processing: 'В обработке', Shipped: 'Отправлен', Delivered: 'Доставлен', Cancelled: 'Отменён', none: 'нет' },
};

/** Status translator passed to function templates: s('Shipped'), s.list('Shipped, Cancelled'). */
function statusHelper(lang) {
  const s = (name) => STATUS[lang]?.[name] || name;
  s.list = (text) => text.split(/,\s*/).map(s).join(', ');
  return s;
}

const INDEX = { az: 1, ru: 2 };

/** The message in `lang`, or the original when it isn't a known shopper-facing message. */
function translateMessage(message, lang) {
  const col = INDEX[lang];
  if (!col || typeof message !== 'string') return message;
  for (const entry of MESSAGES) {
    const [source] = entry;
    if (typeof source === 'string') {
      if (source === message) return entry[col];
    } else {
      const m = message.match(source);
      if (!m) continue;
      const template = entry[col];
      if (typeof template === 'function') return template(m, statusHelper(lang));
      return template.replace(/\$(\d)/g, (_, n) => m[Number(n)] ?? '');
    }
  }
  return message;
}

module.exports = { translateMessage };
