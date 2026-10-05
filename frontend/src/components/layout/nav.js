// Main menu. `label` is a translation key; items with `children` open a dark dropdown on hover.
export const NAV_LINKS = [
  { id: 'home', label: 'nav.home', to: '/' },
  {
    id: 'pages',
    label: 'nav.pages',
    to: '/about-us',
    children: [
      { label: 'nav.aboutUs', to: '/about-us' },
      { label: 'nav.wishlist', to: '/wishlist' },
      { label: 'nav.myAccount', to: '/profile' },
      { label: 'nav.privacy', to: '/privacy' },
    ],
  },
  {
    id: 'shop',
    label: 'nav.shop',
    to: '/shop',
    children: [
      { label: 'nav.shopCatalog', to: '/shop' },
      { label: 'nav.bodyCare', to: '/shop?category=body-care' },
      { label: 'nav.cosmetics', to: '/shop?category=cosmetics' },
      { label: 'nav.hairCare', to: '/shop?category=hair-care' },
      { label: 'nav.cart', to: '/cart' },
      { label: 'nav.checkout', to: '/checkout' },
    ],
  },
  { id: 'contacts', label: 'nav.contacts', to: '/contacts' },
];

export const STORE_INFO = {
  address: '58 White St., New York',
  phone: '+1 (800) 987 456 98',
  phone2: '+1 (800) 987 456 99',
  email: 'cosmecos_company@mail.com',
};

export const telHref = (phone) => `tel:${phone.replace(/[^\d+]/g, '')}`;
