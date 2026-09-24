// Main menu. Items with `children` open a dark dropdown on hover.
export const NAV_LINKS = [
  { label: 'Home', to: '/' },
  {
    label: 'Pages',
    to: '/about-us',
    children: [
      { label: 'About Us', to: '/about-us' },
      { label: 'Wishlist', to: '/wishlist' },
      { label: 'My Account', to: '/profile' },
    ],
  },
  {
    label: 'Shop',
    to: '/shop',
    children: [
      { label: 'Shop Catalog', to: '/shop' },
      { label: 'Body Care', to: '/shop?category=body-care' },
      { label: 'Cosmetics', to: '/shop?category=cosmetics' },
      { label: 'Hair Care', to: '/shop?category=hair-care' },
      { label: 'Cart', to: '/cart' },
      { label: 'Checkout', to: '/checkout' },
    ],
  },
  { label: 'Contacts', to: '/contacts' },
];

export const STORE_INFO = {
  address: '58 White St., New York',
  phone: '+1 (800) 987 456 98',
  phone2: '+1 (800) 987 456 99',
  email: 'cosmecos_company@mail.com',
};

export const telHref = (phone) => `tel:${phone.replace(/[^\d+]/g, '')}`;
