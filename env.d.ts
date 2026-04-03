import type {
  HydrogenCart,
  HydrogenEnv,
  HydrogenSession,
  Storefront,
} from '@shopify/hydrogen';

declare global {
  /** Worker / Oxygen bindings; matches `hydrogen env pull` shape. */
  interface Env extends HydrogenEnv {}
}

declare module '@remix-run/server-runtime' {
  interface AppLoadContext {
    cart: HydrogenCart;
    env: HydrogenEnv;
    session: HydrogenSession;
    storefront: Storefront;
    waitUntil?: (promise: Promise<unknown>) => void;
  }
}
