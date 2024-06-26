import {Await, NavLink} from '@remix-run/react';
import {Suspense} from 'react';
import type {HeaderQuery} from 'storefrontapi.generated';
import type {LayoutProps} from './Layout';
import {useRootLoaderData} from '~/root';
import contentstack_logo from '../../public/contentstack.svg';

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
      <nav className="flex">
        {/* <div> */}
        <SearchToggle />
        <CartToggle cart={cart} />
        <NavLink
          prefetch="intent"
          to="/account"
          style={activeLinkStyle}
          className="pl-7 tooltip"
        >
          {isLoggedIn ? (
            // 'Account'
            <svg
              width="32"
              height="32"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M20 13C20 15.2091 18.2091 17 16 17C13.7909 17 12 15.2091 12 13C12 10.7909 13.7909 9 16 9C18.2091 9 20 10.7909 20 13Z"
                fill="#212121"
              />
              <path
                d="M10 18.994C10 17.6096 11.4483 16.7022 12.694 17.3062C14.7818 18.3184 17.2182 18.3184 19.306 17.3062C20.5517 16.7022 22 17.6096 22 18.994V21.4196C22 22.8447 20.8447 24 19.4196 24H12.5804C11.1553 24 10 22.8447 10 21.4196V18.994Z"
                fill="#212121"
              />
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M16 4.5C9.64873 4.5 4.5 9.64873 4.5 16C4.5 22.3513 9.64873 27.5 16 27.5C22.3513 27.5 27.5 22.3513 27.5 16C27.5 9.64873 22.3513 4.5 16 4.5ZM3.5 16C3.5 9.09644 9.09644 3.5 16 3.5C22.9036 3.5 28.5 9.09644 28.5 16C28.5 22.9036 22.9036 28.5 16 28.5C9.09644 28.5 3.5 22.9036 3.5 16Z"
                fill="#212121"
              />
            </svg>
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
          <span className="tooltiptext">
            {isLoggedIn ? 'Account' : 'SignIn'}
          </span>
        </NavLink>
        {/* </div> */}
      </nav>
    </>
  );
}

function SearchToggle() {
  return (
    <a href="#search-aside" className="pr-7 tooltip">
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="svg-icon"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M14.1416 4C8.54055 4 4 8.54055 4 14.1416C4 19.7426 8.54055 24.2832 14.1416 24.2832C16.582 24.2832 18.821 23.4212 20.5709 21.9852L26.2905 27.7047C26.681 28.0952 27.3142 28.0952 27.7047 27.7047C28.0952 27.3142 28.0952 26.681 27.7047 26.2905L21.9852 20.5709C23.4212 18.821 24.2832 16.582 24.2832 14.1416C24.2832 8.54055 19.7426 4 14.1416 4ZM6 14.1416C6 9.64512 9.64512 6 14.1416 6C18.6381 6 22.2832 9.64512 22.2832 14.1416C22.2832 18.6381 18.6381 22.2832 14.1416 22.2832C9.64512 22.2832 6 18.6381 6 14.1416Z"
          fill="#212121"
        />
      </svg>
      <span className="tooltiptext">Search</span>
    </a>
  );
}

function CartBadge({count}: {count: number}) {
  return (
    <a href="#cart-aside" className="pl-7 tooltip">
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
      <span className="tooltiptext">Cart</span>
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
