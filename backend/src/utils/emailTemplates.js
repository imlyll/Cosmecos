const LANGS = ['en', 'az', 'ru'];

const COPY = {
  en: {
    subject: (code) => `${code} is your Cosmecos verification code`,
    greeting: (name) => `Hello ${name},`,
    intro: 'Thank you for joining Cosmecos. Use the code below to verify your email address:',
    expires: (m) => `This code expires in ${m} minutes.`,
    ignore: "If you didn't create a Cosmecos account, you can safely ignore this email.",
    reset: {
      subject: (code) => `${code} is your Cosmecos password reset code`,
      intro: 'We received a request to reset your Cosmecos password. Use the code below to choose a new one:',
      ignore: "If you didn't ask to reset your password, you can safely ignore this email. Your password won't change.",
    },
  },
  az: {
    subject: (code) => `${code} — Cosmecos təsdiq kodunuz`,
    greeting: (name) => `Salam, ${name},`,
    intro: 'Cosmecos-a qoşulduğunuz üçün təşəkkür edirik. E-poçt ünvanınızı təsdiqləmək üçün aşağıdakı koddan istifadə edin:',
    expires: (m) => `Bu kodun etibarlılıq müddəti ${m} dəqiqədir.`,
    ignore: 'Əgər Cosmecos hesabı yaratmamısınızsa, bu məktubu nəzərə almayın.',
    reset: {
      subject: (code) => `${code} — Cosmecos şifrə bərpa kodunuz`,
      intro: 'Cosmecos şifrənizi bərpa etmək üçün sorğu aldıq. Yeni şifrə təyin etmək üçün aşağıdakı koddan istifadə edin:',
      ignore: 'Əgər şifrəni bərpa etmək istəməmisinizsə, bu məktubu nəzərə almayın. Şifrəniz dəyişməyəcək.',
    },
  },
  ru: {
    subject: (code) => `${code} — ваш код подтверждения Cosmecos`,
    greeting: (name) => `Здравствуйте, ${name}!`,
    intro: 'Спасибо, что присоединились к Cosmecos. Используйте этот код, чтобы подтвердить адрес электронной почты:',
    expires: (m) => `Код действителен ${m} минут.`,
    ignore: 'Если вы не создавали аккаунт Cosmecos, просто проигнорируйте это письмо.',
    reset: {
      subject: (code) => `${code} — код для сброса пароля Cosmecos`,
      intro: 'Мы получили запрос на сброс пароля Cosmecos. Используйте этот код, чтобы задать новый пароль:',
      ignore: 'Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо. Ваш пароль не изменится.',
    },
  },
};

const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/** Branded email with the 6-digit code, in the shopper's language. `purpose` picks the wording (see models/Otp.js). */
function verificationEmail({ name, code, minutes, lang = 'en', purpose = 'register' }) {
  const copy = COPY[LANGS.includes(lang) ? lang : 'en'];
  const c = purpose === 'reset_password' ? { ...copy, ...copy.reset } : copy;
  const safeName = escapeHtml(name);
  const digits = code
    .split('')
    .map(
      (d) =>
        `<td style="width:44px;height:56px;border:1px solid #232323;text-align:center;font:600 26px/56px Georgia,serif;color:#232323">${d}</td>`
    )
    .join('<td style="width:8px"></td>');

  const html = `<!doctype html>
<html lang="${lang}">
<body style="margin:0;padding:0;background:#f3f4f8">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f8;padding:40px 16px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff">
        <tr><td style="background:#232323;padding:28px;text-align:center">
          <span style="font:300 26px Georgia,serif;letter-spacing:6px;color:#ffffff">COSMECOS</span>
        </td></tr>
        <tr><td style="padding:40px 36px;font:15px/26px Helvetica,Arial,sans-serif;color:#616161">
          <p style="margin:0 0 12px;color:#232323;font-size:17px">${c.greeting(safeName)}</p>
          <p style="margin:0 0 28px">${c.intro}</p>
          <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto 28px"><tr>${digits}</tr></table>
          <p style="margin:0 0 8px;text-align:center;color:#eaaa85;font-size:13px;letter-spacing:1px;text-transform:uppercase">${c.expires(minutes)}</p>
          <hr style="border:none;border-top:1px solid #e0e0e0;margin:28px 0">
          <p style="margin:0;font-size:13px;color:#969696">${c.ignore}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = `${c.greeting(name)}\n\n${c.intro}\n\n${code}\n\n${c.expires(minutes)}\n\n${c.ignore}`;
  return { subject: c.subject(code), html, text };
}

module.exports = { verificationEmail, LANGS };
