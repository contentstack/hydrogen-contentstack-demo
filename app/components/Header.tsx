import {Await, NavLink} from '@remix-run/react';
import {Suspense} from 'react';
import type {HeaderQuery} from 'storefrontapi.generated';
import type {LayoutProps} from './Layout';
import {useRootLoaderData} from '~/root';
import contentstack_logo from '../../public/contentstack_logo.svg';

type HeaderProps = Pick<LayoutProps, 'header' | 'cart' | 'isLoggedIn'>;

type Viewport = 'desktop' | 'mobile';

export function Header({header, isLoggedIn, cart}: HeaderProps) {
  const {shop, menu} = header;
  return (
    <header className="header">
      <div className="header-container flex text-center">
        <div className="menu-wrap">
          <NavLink prefetch="intent" to="/" style={activeLinkStyle} end>
            <img alt="contentstack" src={contentstack_logo} height="30px"></img>
          </NavLink>
          <HeaderMenu
            menu={menu}
            viewport="desktop"
            primaryDomainUrl={header.shop.primaryDomain.url}
          />
        </div>
        <HeaderCtas isLoggedIn={isLoggedIn} cart={cart} />
      </div>
    </header>
  );
}

export function HeaderMenu({
  menu,
  primaryDomainUrl,
  viewport,
}: {
  menu: HeaderProps['header']['menu'];
  primaryDomainUrl: HeaderQuery['shop']['primaryDomain']['url'];
  viewport: Viewport;
}) {
  const {publicStoreDomain} = useRootLoaderData();
  const className = `header-menu-${viewport}`;

  function closeAside(event: React.MouseEvent<HTMLAnchorElement>) {
    if (viewport === 'mobile') {
      event.preventDefault();
      window.location.href = event.currentTarget.href;
    }
  }

  return (
    <nav className={className} role="navigation">
      {viewport === 'mobile' && (
        <NavLink
          end
          onClick={closeAside}
          prefetch="intent"
          style={activeLinkStyle}
          to="/"
        >
          Home
        </NavLink>
      )}
      {(menu || FALLBACK_HEADER_MENU).items.map((item) => {
        if (!item.url) return null;

        // if the url is internal, we strip the domain
        const url =
          item.url.includes('myshopify.com') ||
          item.url.includes(publicStoreDomain) ||
          item.url.includes(primaryDomainUrl)
            ? new URL(item.url).pathname
            : item.url;
        return (
          <NavLink
            className="header-menu-item"
            end
            key={item.id}
            onClick={closeAside}
            prefetch="intent"
            style={activeLinkStyle}
            to={url}
          >
            {item.title}
          </NavLink>
        );
      })}
    </nav>
  );
}

function HeaderCtas({
  isLoggedIn,
  cart,
}: Pick<HeaderProps, 'isLoggedIn' | 'cart'>) {
  return (
    <>
      <nav className="header-ctas" role="navigation">
        <HeaderMenuMobileToggle />
        <SearchToggle />
      </nav>
      <nav>
        <div>
          <CartToggle cart={cart} />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 32 32"
            fill="none"
            className="svg-icon"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M16 4C10.5998 4 6.63888 9.38524 7.92483 14.9399C8.23755 16.2908 8.00775 17.7221 7.29007 18.8846L6.40027 20.326C5.34395 22.037 6.50176 24.3077 8.43056 24.3077H12.5175C12.5175 24.7926 12.6076 25.2727 12.7826 25.7207C12.9576 26.1686 13.2141 26.5757 13.5375 26.9185C13.8609 27.2614 14.2448 27.5334 14.6673 27.7189C15.0898 27.9045 15.5427 28 16 28C16.4573 28 16.9102 27.9045 17.3327 27.7189C17.7552 27.5334 18.1391 27.2614 18.4625 26.9185C18.7859 26.5757 19.0424 26.1686 19.2174 25.7207C19.3924 25.2727 19.4825 24.7926 19.4825 24.3077H23.5694C25.4982 24.3077 26.656 22.037 25.5997 20.326L24.7099 18.8846C23.9922 17.7221 23.7625 16.2908 24.0752 14.9399C25.3611 9.38523 21.4002 4 16 4ZM17.7412 24.3077H14.2588C14.2588 24.5501 14.3038 24.7902 14.3913 25.0142C14.4788 25.2382 14.6071 25.4417 14.7688 25.6131C14.9304 25.7846 15.1224 25.9205 15.3337 26.0133C15.5449 26.1061 15.7713 26.1538 16 26.1538C16.2287 26.1538 16.4551 26.1061 16.6663 26.0133C16.8776 25.9205 17.0696 25.7846 17.2312 25.6131C17.3929 25.4417 17.5212 25.2382 17.6087 25.0142C17.6962 24.7902 17.7412 24.5501 17.7412 24.3077ZM9.61587 14.4999C8.59788 10.1026 11.7352 5.84615 16 5.84615C20.2648 5.84615 23.4021 10.1026 22.3841 14.4999C21.9566 16.3464 22.2701 18.3036 23.253 19.8957L24.1428 21.337C24.4412 21.8203 24.1142 22.4615 23.5694 22.4615H8.43056C7.88583 22.4615 7.55885 21.8203 7.85717 21.337L8.74697 19.8957C9.72988 18.3036 10.0434 16.3464 9.61587 14.4999Z"
              fill="#212121"
            />
          </svg>
          <NavLink
            prefetch="intent"
            to="/account"
            style={activeLinkStyle}
            className="pl-7"
          >
            {isLoggedIn ? (
              'Account'
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 32 32"
                fill="none"
                className="svg-icon"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M16 6C13.7909 6 12 7.79086 12 10C12 12.2091 13.7909 14 16 14C18.2091 14 20 12.2091 20 10C20 7.79086 18.2091 6 16 6ZM10 10C10 6.68629 12.6863 4 16 4C19.3137 4 22 6.68629 22 10C22 13.3137 19.3137 16 16 16C12.6863 16 10 13.3137 10 10Z"
                  fill="#212121"
                />
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M11.2518 19.5765C10.1973 19.0972 9 19.8681 9 21.0265V23.7142C9 24.9766 10.0234 26 11.2858 26H20.7142C21.9766 26 23 24.9766 23 23.7142V21.0265C23 19.8681 21.8027 19.0972 20.7482 19.5765C17.7313 20.9479 14.2687 20.9479 11.2518 19.5765ZM7 21.0265C7 18.4136 9.70066 16.6746 12.0794 17.7558C14.5705 18.8881 17.4295 18.8881 19.9206 17.7558C22.2993 16.6746 25 18.4136 25 21.0265V23.7142C25 26.0812 23.0812 28 20.7142 28H11.2858C8.91881 28 7 26.0812 7 23.7142V21.0265Z"
                  fill="#212121"
                />
              </svg>
            )}
          </NavLink>
        </div>
      </nav>
    </>
  );
}

function HeaderMenuMobileToggle() {
  return (
    <a className="header-menu-mobile-toggle" href="#mobile-menu-aside">
      <h3>☰</h3>
    </a>
  );
}

function SearchToggle() {
  return (
    <a href="#search-aside">
      <div className="search-wrap">
        <div className="search-content">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            className="search-cion"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M10.6062 3C6.40541 3 3 6.40541 3 10.6062C3 14.807 6.40541 18.2124 10.6062 18.2124C12.4365 18.2124 14.1158 17.5659 15.4282 16.4889L19.7179 20.7785C20.0108 21.0714 20.4856 21.0714 20.7785 20.7785C21.0714 20.4856 21.0714 20.0107 20.7785 19.7179L16.4889 15.4282C17.5659 14.1158 18.2124 12.4365 18.2124 10.6062C18.2124 6.40541 14.807 3 10.6062 3ZM4.5 10.6062C4.5 7.23384 7.23384 4.5 10.6062 4.5C13.9786 4.5 16.7124 7.23384 16.7124 10.6062C16.7124 13.9786 13.9786 16.7124 10.6062 16.7124C7.23384 16.7124 4.5 13.9786 4.5 10.6062Z"
              fill="#475161"
            />
          </svg>
          <p className="search-text">Search</p>
        </div>
      </div>
    </a>
  );
}

function CartBadge({count}: {count: number}) {
  return (
    <a href="#cart-aside" className="pr-7">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        className="svg-icon"
      >
        <path
          d="M11.9979 12.9704C12.4865 12.7141 13.0901 12.9029 13.346 13.3921C13.5994 13.8764 13.98 14.2821 14.4469 14.5655C14.9138 14.8488 15.4491 14.9991 15.995 15C16.541 15.0009 17.0768 14.8524 17.5446 14.5706C18.0124 14.2888 18.3944 13.8843 18.6494 13.4009C18.9069 12.9125 19.5111 12.7257 19.9989 12.9836C20.4866 13.2415 20.6732 13.8465 20.4156 14.3349C19.9907 15.1405 19.354 15.8146 18.5744 16.2843C17.7947 16.754 16.9017 17.0015 15.9917 17C15.0818 16.9985 14.1896 16.7481 13.4115 16.2758C12.6334 15.8035 11.9989 15.1273 11.5767 14.3202C11.3207 13.831 11.5093 13.2267 11.9979 12.9704Z"
          fill="#212121"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M11.1064 8C11.569 5.71776 13.5842 4 16 4C18.4158 4 20.431 5.71776 20.8936 8H22.3874C23.7916 8 25.0075 8.9766 25.3121 10.3492L27.8791 21.9153C28.5721 25.0379 26.199 28 23.0045 28H8.99555C5.80095 28 3.42793 25.0379 4.12094 21.9153L6.68786 10.3492C6.99249 8.9766 8.20835 8 9.61263 8H11.1064ZM13.1744 8C13.5857 6.83481 14.6955 6 16 6C17.3045 6 18.4143 6.83481 18.8256 8H13.1744ZM9.61263 10C9.14454 10 8.73925 10.3255 8.63771 10.7831L6.07078 22.3492C5.65498 24.2227 7.07879 26 8.99555 26H23.0045C24.9212 26 26.345 24.2228 25.9292 22.3492L23.3623 10.7831C23.2607 10.3255 22.8555 10 22.3874 10H9.61263Z"
          fill="#212121"
        />
      </svg>
    </a>
  );
}

function CartToggle({cart}: Pick<HeaderProps, 'cart'>) {
  return (
    <Suspense fallback={<CartBadge count={0} />}>
      <Await resolve={cart}>
        {(cart) => {
          if (!cart) return <CartBadge count={0} />;
          return <CartBadge count={cart.totalQuantity || 0} />;
        }}
      </Await>
    </Suspense>
  );
}

const FALLBACK_HEADER_MENU = {
  id: 'gid://shopify/Menu/199655587896',
  items: [
    {
      id: 'gid://shopify/MenuItem/461609500728',
      resourceId: null,
      tags: [],
      title: 'Collections',
      type: 'HTTP',
      url: '/collections',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461609533496',
      resourceId: null,
      tags: [],
      title: 'Blog',
      type: 'HTTP',
      url: '/blogs/journal',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461609566264',
      resourceId: null,
      tags: [],
      title: 'Policies',
      type: 'HTTP',
      url: '/policies',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461609599032',
      resourceId: 'gid://shopify/Page/92591030328',
      tags: [],
      title: 'About',
      type: 'PAGE',
      url: '/pages/about',
      items: [],
    },
  ],
};

function activeLinkStyle({
  isActive,
  isPending,
}: {
  isActive: boolean;
  isPending: boolean;
}) {
  return {
    fontWeight: isActive ? 'bold' : undefined,
    color: isPending ? 'grey' : 'black',
  };
}
