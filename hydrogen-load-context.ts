import {
  cartGetIdDefault,
  cartSetIdDefault,
  createCartHandler,
  createStorefrontClient,
  InMemoryCache,
  type HydrogenEnv,
  type I18nBase,
} from '@shopify/hydrogen';
import {
  createCookieSessionStorage,
  getStorefrontHeaders,
  type Session,
  type SessionStorage,
} from '@shopify/remix-oxygen';

export class HydrogenSession {
  #sessionStorage: SessionStorage;
  #session: Session;

  constructor(sessionStorage: SessionStorage, session: Session) {
    this.#sessionStorage = sessionStorage;
    this.#session = session;
  }

  static async init(request: Request, secrets: string[]) {
    const storage = createCookieSessionStorage({
      cookie: {
        name: 'session',
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
        secrets,
      },
    });

    const session = await storage.getSession(request.headers.get('Cookie'));

    return new this(storage, session);
  }

  get has() {
    return this.#session.has;
  }

  get get() {
    return this.#session.get;
  }

  get flash() {
    return this.#session.flash;
  }

  get unset() {
    return this.#session.unset;
  }

  get set() {
    return this.#session.set;
  }

  destroy() {
    return this.#sessionStorage.destroySession(this.#session);
  }

  commit() {
    return this.#sessionStorage.commitSession(this.#session);
  }
}

function getLocaleFromRequest(request: Request): I18nBase & {pathPrefix: string} {
  const url = new URL(request.url);
  const firstPathPart = url.pathname.split('/')[1]?.toUpperCase() ?? '';

  type I18nFromUrl = [I18nBase['language'], I18nBase['country']];

  let pathPrefix = '';
  let [language, country]: I18nFromUrl = ['EN', 'US'];

  if (/^[A-Z]{2}-[A-Z]{2}$/i.test(firstPathPart)) {
    pathPrefix = '/' + firstPathPart;
    [language, country] = firstPathPart.split('-') as I18nFromUrl;
  }

  return {language, country, pathPrefix};
}

const CART_QUERY_FRAGMENT = `#graphql
  fragment Money on MoneyV2 {
    currencyCode
    amount
  }
  fragment CartLine on CartLine {
    id
    quantity
    attributes {
      key
      value
    }
    cost {
      totalAmount {
        ...Money
      }
      amountPerQuantity {
        ...Money
      }
      compareAtAmountPerQuantity {
        ...Money
      }
    }
    merchandise {
      ... on ProductVariant {
        id
        availableForSale
        compareAtPrice {
          ...Money
        }
        price {
          ...Money
        }
        requiresShipping
        title
        image {
          id
          url
          altText
          width
          height

        }
        product {
          handle
          title
          id
        }
        selectedOptions {
          name
          value
        }
      }
    }
  }
  fragment CartApiQuery on Cart {
    id
    checkoutUrl
    totalQuantity
    buyerIdentity {
      countryCode
      customer {
        id
        email
        firstName
        lastName
        displayName
      }
      email
      phone
    }
    lines(first: $numCartLines) {
      nodes {
        ...CartLine
      }
    }
    cost {
      subtotalAmount {
        ...Money
      }
      totalAmount {
        ...Money
      }
      totalDutyAmount {
        ...Money
      }
      totalTaxAmount {
        ...Money
      }
    }
    note
    attributes {
      key
      value
    }
    discountCodes {
      code
      applicable
    }
  }
` as const;

export type HydrogenRemixLoadContext = {
  session: HydrogenSession;
  storefront: ReturnType<typeof createStorefrontClient>['storefront'];
  cart: ReturnType<typeof createCartHandler>;
  env: HydrogenEnv;
  waitUntil: (promise: Promise<unknown>) => void;
};

/**
 * Shared Remix load context for Oxygen (`server.ts`) and Vite SSR dev
 * (`setRemixDevLoadContext`).
 */
export async function createHydrogenRemixLoadContext(
  request: Request,
  env: HydrogenEnv,
  waitUntil: (promise: Promise<unknown>) => void,
): Promise<HydrogenRemixLoadContext> {
  if (!env?.SESSION_SECRET) {
    throw new Error('SESSION_SECRET environment variable is not set');
  }

  const cache =
    typeof caches !== 'undefined'
      ? await caches.open('hydrogen')
      : new InMemoryCache();

  const session = await HydrogenSession.init(request, [env.SESSION_SECRET]);

  const {storefront} = createStorefrontClient({
    cache,
    waitUntil,
    i18n: getLocaleFromRequest(request),
    publicStorefrontToken: env.PUBLIC_STOREFRONT_API_TOKEN,
    privateStorefrontToken: env.PRIVATE_STOREFRONT_API_TOKEN,
    storeDomain: env.PUBLIC_STORE_DOMAIN,
    storefrontId: env.PUBLIC_STOREFRONT_ID,
    storefrontHeaders: getStorefrontHeaders(request),
  });

  const cart = createCartHandler({
    storefront,
    getCartId: cartGetIdDefault(request.headers),
    setCartId: cartSetIdDefault(),
    cartQueryFragment: CART_QUERY_FRAGMENT,
  });

  return {session, storefront, cart, env, waitUntil};
}

/** Populate env from `process.env` when running Remix Vite dev (no worker bindings). */
export function hydrogenEnvFromProcess(): HydrogenEnv {
  const e = process.env;
  if (!e.SESSION_SECRET) {
    throw new Error('SESSION_SECRET environment variable is not set');
  }
  return {
    SESSION_SECRET: e.SESSION_SECRET,
    PUBLIC_STOREFRONT_API_TOKEN: e.PUBLIC_STOREFRONT_API_TOKEN ?? '',
    PRIVATE_STOREFRONT_API_TOKEN: e.PRIVATE_STOREFRONT_API_TOKEN ?? '',
    PUBLIC_STORE_DOMAIN: e.PUBLIC_STORE_DOMAIN ?? '',
    PUBLIC_STOREFRONT_ID: e.PUBLIC_STOREFRONT_ID ?? '',
    PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID:
      e.PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID ?? '',
    PUBLIC_CUSTOMER_ACCOUNT_API_URL: e.PUBLIC_CUSTOMER_ACCOUNT_API_URL ?? '',
    PUBLIC_CHECKOUT_DOMAIN: e.PUBLIC_CHECKOUT_DOMAIN ?? '',
    SHOP_ID: e.SHOP_ID ?? '',
  } as HydrogenEnv;
}
