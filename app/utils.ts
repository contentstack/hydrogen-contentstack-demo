import {useLocation} from '@remix-run/react';
import type {SelectedOption} from '@shopify/hydrogen/storefront-api-types';
import {useMemo} from 'react';
import * as contentstack from 'contentstack';

export function useVariantUrl(
  handle: string,
  selectedOptions: SelectedOption[],
) {
  const {pathname} = useLocation();

  return useMemo(() => {
    return getVariantUrl({
      handle,
      pathname,
      searchParams: new URLSearchParams(),
      selectedOptions,
    });
  }, [handle, selectedOptions, pathname]);
}

export function getVariantUrl({
  handle,
  pathname,
  searchParams,
  selectedOptions,
}: {
  handle: string;
  pathname: string;
  searchParams: URLSearchParams;
  selectedOptions: SelectedOption[];
}) {
  const match = /(\/[a-zA-Z]{2}-[a-zA-Z]{2}\/)/g.exec(pathname);
  const isLocalePathname = match && match.length > 0;

  const path = isLocalePathname
    ? `${match![0]}products/${handle}`
    : `/products/${handle}`;

  selectedOptions.forEach((option) => {
    searchParams.set(option.name, option.value);
  });

  const searchString = searchParams.toString();

  return path + (searchString ? '?' + searchParams.toString() : '');
}

const Stack = (envConfig: any) => {
  return contentstack.Stack({
    api_key: envConfig.CONTENTSTACK_API_KEY,
    delivery_token: envConfig.CONTENTSTACK_DELIVERY_TOKEN,
    environment: envConfig.CONTENTSTACK_ENVIRONMENT,
  });
};

export const getEntry = async ({contentTypeUid, envConfig}: any) => {
  return new Promise((resolve, reject) => {
    const query: any = Stack(envConfig).ContentType(contentTypeUid).Query();
    query
      .toJSON()
      .includeCount()
      .find()
      .then(
        (result: any) => {
          resolve(result[0][0]);
        },
        (error: any) => {
          reject(error);
        },
      );
  });
};
