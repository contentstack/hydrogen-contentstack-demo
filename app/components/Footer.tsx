import {NavLink, useLoaderData, type MetaFunction} from '@remix-run/react';
import type {FooterQuery, HeaderQuery} from 'storefrontapi.generated';
import {useRootLoaderData} from '~/root';
// import {useLoaderData} from '@remix-run/react';

import '../styles/pages.css';
import {getPaginationVariables} from '@shopify/hydrogen';
import type {LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {defer} from '@shopify/remix-oxygen';
import {getEntryByUid} from './contentstack-sdk';
import contentstack_logo from '../../public/cms_white_logo.svg';

export const meta: MetaFunction = () => {
  return [{title: 'Hydrogen | Home'}];
};

export async function loader({context, request}: LoaderFunctionArgs) {
  const {storefront} = context;
  // const recommendedProducts = storefront.query(RECOMMENDED_PRODUCTS_QUERY);
  const envConfig = context.env;
  const fetchData = async () => {
    try {
      const result = await getEntryByUid({
        contentTypeUid: 'shopify_footer',
        entryUid: 'blte6a28f48813275ca',
        envConfig,
      });
      return result;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('ERROR', error);
    }
  };
  return defer({
    // recommendedProducts,
    fetchedData: await fetchData(),
    // collections,
  });
}

export function Footer() {
  const data = useLoaderData<typeof loader>();
  return (
    <footer className="footer_wrapper">
      <div className="container">
        <div className="row footer_row">
          <div className="footer_col_left">
            <h2 className="footer_heading">
              Subscribe to our news letter to get <br /> updated on our latest
              products
            </h2>
            <p className="footer_info">
              Get 20% off on your first order just by subscribing our news
              letter
            </p>
            <div>
              <input
                className="footer_email"
                type="email"
                placeholder="Enter your Mail id"
              />
              <a href="" rel="noreferrer" className="offers_cta" target="">
                Subscribe
              </a>
            </div>
          </div>
          <div className="footer_col_right">
            <div className="footer_products_wrap">
              <div>
                <h2 className="footer_product_heading">Products</h2>
                <ul>
                  <li>Men's Wear</li>
                  <li>Women's Wear</li>
                  <li>Footwear</li>
                  <li>Bottom Wear</li>
                  <li>Acccessories</li>
                </ul>
              </div>
              <div>
                <h2 className="footer_product_heading">Collection</h2>
                <ul>
                  <li>Men's Wear</li>
                  <li>Women's Wear</li>
                  <li>Footwear</li>
                  <li>Bottom Wear</li>
                  <li>Acccessories</li>
                </ul>
              </div>
              <div>
                <h2 className="footer_product_heading">Company</h2>
                <ul>
                  <li>Men's Wear</li>
                  <li>Women's Wear</li>
                  <li>Footwear</li>
                  <li>Bottom Wear</li>
                  <li>Acccessories</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="footer_logoWrap">
          <NavLink prefetch="intent" to="/" style={activeLinkStyle} end>
            <img alt="contentstack" src={contentstack_logo} height="30px"></img>
          </NavLink>
          <div className="footer_social_logos">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M12 2C6.477 2 2 6.477 2 12C2 17.013 5.693 21.153 10.505 21.876V14.65H8.031V12.021H10.505V10.272C10.505 7.376 11.916 6.105 14.323 6.105C15.476 6.105 16.085 6.19 16.374 6.229V8.523H14.732C13.71 8.523 13.353 9.492 13.353 10.584V12.021H16.348L15.942 14.65H13.354V21.897C18.235 21.236 22 17.062 22 12C22 6.477 17.523 2 12 2Z"
                fill="white"
              />
            </svg>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M22 3.99902C21.22 4.46202 19.655 5.09302 18.735 5.27502C18.708 5.28202 18.686 5.29102 18.66 5.29802C17.847 4.49602 16.733 3.99902 15.5 3.99902C13.015 3.99902 11 6.01402 11 8.49902C11 8.63002 10.989 8.87102 11 8.99902C7.647 8.99902 5.095 7.24302 3.265 4.99902C3.066 5.49902 2.979 6.28902 2.979 7.03102C2.979 8.43202 4.074 9.80802 5.779 10.661C5.465 10.742 5.119 10.8 4.759 10.8C4.178 10.8 3.563 10.647 3 10.183C3 10.2 3 10.216 3 10.234C3 12.192 5.078 13.525 6.926 13.896C6.551 14.117 5.795 14.139 5.426 14.139C5.166 14.139 4.246 14.02 4 13.974C4.514 15.579 6.368 16.481 8.135 16.513C6.753 17.597 5.794 17.999 2.964 17.999H2C3.788 19.145 6.065 20 8.347 20C15.777 20 20 14.337 20 8.99902C20 8.91302 19.998 8.73302 19.995 8.55202C19.995 8.53402 20 8.51702 20 8.49902C20 8.47202 19.992 8.44602 19.992 8.41902C19.989 8.28302 19.986 8.15602 19.983 8.09002C20.773 7.52002 21.458 6.80902 22 5.99902C21.275 6.32102 20.497 6.53702 19.68 6.63502C20.514 6.13502 21.699 4.94302 22 3.99902Z"
                fill="white"
              />
            </svg>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M19 3H5C3.895 3 3 3.895 3 5V19C3 20.105 3.895 21 5 21H19C20.105 21 21 20.105 21 19V5C21 3.895 20.105 3 19 3ZM9 17H6.477V10H9V17ZM7.694 8.717C6.923 8.717 6.408 8.203 6.408 7.517C6.408 6.831 6.922 6.317 7.779 6.317C8.55 6.317 9.065 6.831 9.065 7.517C9.065 8.203 8.551 8.717 7.694 8.717ZM18 17H15.558V13.174C15.558 12.116 14.907 11.872 14.663 11.872C14.419 11.872 13.605 12.035 13.605 13.174C13.605 13.337 13.605 17 13.605 17H11.082V10H13.605V10.977C13.93 10.407 14.581 10 15.802 10C17.023 10 18 10.977 18 13.174V17Z"
                fill="white"
              />
            </svg>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M8 3C5.239 3 3 5.239 3 8V16C3 18.761 5.239 21 8 21H16C18.761 21 21 18.761 21 16V8C21 5.239 18.761 3 16 3H8ZM18 5C18.552 5 19 5.448 19 6C19 6.552 18.552 7 18 7C17.448 7 17 6.552 17 6C17 5.448 17.448 5 18 5ZM12 7C14.761 7 17 9.239 17 12C17 14.761 14.761 17 12 17C9.239 17 7 14.761 7 12C7 9.239 9.239 7 12 7ZM12 9C11.2044 9 10.4413 9.31607 9.87868 9.87868C9.31607 10.4413 9 11.2044 9 12C9 12.7956 9.31607 13.5587 9.87868 14.1213C10.4413 14.6839 11.2044 15 12 15C12.7956 15 13.5587 14.6839 14.1213 14.1213C14.6839 13.5587 15 12.7956 15 12C15 11.2044 14.6839 10.4413 14.1213 9.87868C13.5587 9.31607 12.7956 9 12 9Z"
                fill="white"
              />
            </svg>
          </div>
        </div>
        <div className="footer_copyright_sec">
          <p>
            2024 Contentstack. All rights reserved. Support | Privacy | Terms
          </p>
        </div>
      </div>
    </footer>
  );
}

// function FooterMenu({
//   menu,
//   primaryDomainUrl,
// }: {
//   menu: FooterQuery['menu'];
//   primaryDomainUrl: HeaderQuery['shop']['primaryDomain']['url'];
// }) {
//   const {publicStoreDomain} = useRootLoaderData();

//   return (
//     // <nav className="footer-menu" role="navigation">
//     //   {(menu || FALLBACK_FOOTER_MENU).items.map((item) => {
//     //     if (!item.url) return null;
//     //     // if the url is internal, we strip the domain
//     //     const url =
//     //       item.url.includes('myshopify.com') ||
//     //       item.url.includes(publicStoreDomain) ||
//     //       item.url.includes(primaryDomainUrl)
//     //         ? new URL(item.url).pathname
//     //         : item.url;
//     //     const isExternal = !url.startsWith('/');
//     //     return isExternal ? (
//     //       <a href={url} key={item.id} rel="noopener noreferrer" target="_blank">
//     //         {item.title}
//     //       </a>
//     //     ) : (
//     //       <NavLink
//     //         end
//     //         key={item.id}
//     //         prefetch="intent"
//     //         style={activeLinkStyle}
//     //         to={url}
//     //       >
//     //         {item.title}
//     //       </NavLink>
//     //     );
//     //   })}
//     // </nav>

//     <h1>Thanks for Subscribing</h1>
//   );
// }

const FALLBACK_FOOTER_MENU = {
  id: 'gid://shopify/Menu/199655620664',
  items: [
    {
      id: 'gid://shopify/MenuItem/461633060920',
      resourceId: 'gid://shopify/ShopPolicy/23358046264',
      tags: [],
      title: 'Privacy Policy',
      type: 'SHOP_POLICY',
      url: '/policies/privacy-policy',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461633093688',
      resourceId: 'gid://shopify/ShopPolicy/23358013496',
      tags: [],
      title: 'Refund Policy',
      type: 'SHOP_POLICY',
      url: '/policies/refund-policy',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461633126456',
      resourceId: 'gid://shopify/ShopPolicy/23358111800',
      tags: [],
      title: 'Shipping Policy',
      type: 'SHOP_POLICY',
      url: '/policies/shipping-policy',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461633159224',
      resourceId: 'gid://shopify/ShopPolicy/23358079032',
      tags: [],
      title: 'Terms of Service',
      type: 'SHOP_POLICY',
      url: '/policies/terms-of-service',
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
    color: isPending ? 'grey' : 'white',
  };
}
