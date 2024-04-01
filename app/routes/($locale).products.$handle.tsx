import {Fragment, Suspense} from 'react';
import {defer, redirect, type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {
  Await,
  Link,
  useLoaderData,
  type MetaFunction,
  type FetcherWithComponents,
} from '@remix-run/react';
import type {
  ProductFragment,
  ProductVariantsQuery,
  ProductVariantFragment,
} from 'storefrontapi.generated';
import NoImg from '../../public/NoImg.svg';

import {
  Image,
  Money,
  VariantSelector,
  type VariantOption,
  getSelectedProductOptions,
  CartForm,
} from '@shopify/hydrogen';
import type {
  CartLineInput,
  SelectedOption,
} from '@shopify/hydrogen/storefront-api-types';
import {getVariantUrl} from '~/utils';
import {getEntry} from '~/components/contentstack-sdk';

export const meta: MetaFunction<typeof loader> = ({data}) => {
  return [{title: `Hydrogen | ${data?.product.title ?? ''}`}];
};

export async function loader({params, request, context}: LoaderFunctionArgs) {
  const {handle} = params;
  const {storefront} = context;

  const selectedOptions = getSelectedProductOptions(request).filter(
    (option) =>
      // Filter out Shopify predictive search query params
      !option.name.startsWith('_sid') &&
      !option.name.startsWith('_pos') &&
      !option.name.startsWith('_psq') &&
      !option.name.startsWith('_ss') &&
      !option.name.startsWith('_v') &&
      // Filter out third party tracking params
      !option.name.startsWith('fbclid'),
  );

  const envConfig = context?.env;
  const fetchData = async () => {
    try {
      const result = await getEntry({
        contentTypeUid: 'product_detail_page',
        envConfig,
      });
      return result;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('ERROR', error);
    }
  };

  if (!handle) {
    throw new Error('Expected product handle to be defined');
  }

  // await the query for the critical product data
  const {product} = await storefront.query(PRODUCT_QUERY, {
    variables: {handle, selectedOptions},
  });
  if (!product?.id) {
    throw new Response(null, {status: 404});
  }
  const productID = product?.id;
  // Fetch related products using the product ID
  const relatedProductQueryResults = await storefront.query(
    RELATED_PRODUCT_QUERY,
    {
      variables: {productID}, // Pass the product ID as the $productID variable
    },
  );

  const firstVariant = product.variants?.nodes[0];
  const firstVariantIsDefault = Boolean(
    firstVariant?.selectedOptions?.find(
      (option: SelectedOption) =>
        option?.name === 'Title' && option?.value === 'Default Title',
    ),
  );

  if (firstVariantIsDefault) {
    product.selectedVariant = firstVariant;
  } else {
    // if no selected variant was returned from the selected options,
    // we redirect to the first variant's url with it's selected options applied
    if (!product.selectedVariant) {
      throw redirectToFirstVariant({product, request});
    }
  }

  // In order to show which variants are available in the UI, we need to query
  // all of them. But there might be a *lot*, so instead separate the variants
  // into it's own separate query that is deferred. So there's a brief moment
  // where variant options might show as available when they're not, but after
  // this deffered query resolves, the UI will update.
  const variants = storefront.query(VARIANTS_QUERY, {
    variables: {handle},
  });

  return defer({
    product,
    variants,
    fetchedData: await fetchData(),
    relatedProductQueryResults,
  });
}

function redirectToFirstVariant({
  product,
  request,
}: {
  product: ProductFragment;
  request: Request;
}) {
  const url = new URL(request?.url);
  const firstVariant = product?.variants?.nodes[0];

  return redirect(
    getVariantUrl({
      pathname: url?.pathname,
      handle: product?.handle,
      selectedOptions: firstVariant?.selectedOptions,
      searchParams: new URLSearchParams(url?.search),
    }),
    {
      status: 302,
    },
  );
}

export default function Product() {
  const {product, variants, relatedProductQueryResults, fetchedData} =
    useLoaderData<typeof loader>();
  const {selectedVariant} = product;
  return (
    <>
      <div className="product container">
        <ProductImage image={selectedVariant?.image} />
        <ProductMain
          selectedVariant={selectedVariant}
          product={product}
          variants={variants}
        />
      </div>
      <div className="related-wrapper">
        <Suspense fallback={<div>Loading...</div>}>
          <div className="featured_wrapper container">
            <div className="featuredContent">
              <h2 className="product_css">{fetchedData?.heading}</h2>
            </div>
            <div className="feature-products-grid">
              {relatedProductQueryResults?.productRecommendations?.map(
                (product: any) => {
                  return (
                    <Fragment key={product?.id}>
                      <Link
                        className="feature-product"
                        to={`/products/${product?.handle}`}
                      >
                        {product?.images?.nodes[0] ? (
                          <Image
                            data={product?.images?.nodes[0]}
                            aspectRatio="1/1"
                            sizes="(min-width: 45em) 20vw, 50vw"
                          />
                        ) : (
                          // eslint-disable-next-line jsx-a11y/img-redundant-alt
                          <img
                            src={NoImg}
                            alt="No Image"
                            style={{height: '85% !important'}}
                          />
                        )}
                        <p className="product_cta">{product?.title}</p>
                        <small className="product_small_cta">
                          {product?.title}
                        </small>
                        <>
                          <Money
                            className="product_price"
                            data={product?.priceRange?.minVariantPrice}
                          />
                        </>
                      </Link>
                    </Fragment>
                  );
                },
              )}
            </div>
          </div>
        </Suspense>
      </div>
    </>
  );
}

function ProductImage({image}: {image: ProductVariantFragment['image']}) {
  if (!image) {
    return <div className="product-image" />;
  }
  return (
    <div className="product-image">
      <Image
        alt={image?.altText ?? 'Product Image'}
        aspectRatio="1/1"
        data={image}
        key={image?.id}
        sizes="(min-width: 45em) 50vw, 100vw"
      />
    </div>
  );
}

function ProductMain({
  selectedVariant,
  product,
  variants,
}: {
  product: ProductFragment;
  selectedVariant: ProductFragment['selectedVariant'];
  variants: Promise<ProductVariantsQuery>;
}) {
  const {title, descriptionHtml, metafield} = product;
  const valueMap = new Map();
  metafield?.reference?.fields.forEach((field: any) => {
    valueMap.set(field.key, field.value);
  });
  function generateStars(rating: any) {
    const roundedRating = Math.round(parseFloat(rating));
    const fullStars = '★'.repeat(roundedRating);
    const emptyStars = '☆'.repeat(5 - roundedRating);
    return fullStars + emptyStars;
  }

  const rating = '4.4';
  const stars = generateStars(rating);

  return (
    <div className="product-main">
      <h1>{title}</h1>
      <br />
      <div
        className="description"
        dangerouslySetInnerHTML={{__html: descriptionHtml}}
      />
      <ProductPrice selectedVariant={selectedVariant} />
      <br />
      <Suspense
        fallback={
          <ProductForm
            product={product}
            selectedVariant={selectedVariant}
            variants={[]}
          />
        }
      >
        <Await
          errorElement="There was a problem loading product variants"
          resolve={variants}
        >
          {(data) => (
            <ProductForm
              product={product}
              selectedVariant={selectedVariant}
              variants={data?.product?.variants.nodes || []}
            />
          )}
        </Await>
      </Suspense>

      <br />
      {stars && (
        <div
          className="star_rating"
          dangerouslySetInnerHTML={{
            __html: stars,
          }}
        />
      )}

      <br />
      {valueMap.get('product_review') && (
        <>
          <p>
            <strong>Reviews</strong>
          </p>
          <br />
          <div
            dangerouslySetInnerHTML={{
              __html: valueMap.get('product_review'),
            }}
          />
        </>
      )}

      <br />
      {valueMap.get('shipping_return_policy') && (
        <>
          <p>
            <strong>Shipping and Return</strong>
          </p>
          <br />
          <div
            dangerouslySetInnerHTML={{
              __html: valueMap.get('shipping_return_policy'),
            }}
          />
        </>
      )}

      <br />
    </div>
  );
}

function ProductPrice({
  selectedVariant,
}: {
  selectedVariant: ProductFragment['selectedVariant'];
}) {
  return (
    <div className="product-price">
      {selectedVariant?.compareAtPrice ? (
        <>
          <br />
          <div className="product-price-on-sale">
            {selectedVariant ? (
              <Money className="price" data={selectedVariant?.price} />
            ) : null}
            <s>
              <Money
                className="comparePrice"
                data={selectedVariant?.compareAtPrice}
              />
            </s>
          </div>
        </>
      ) : (
        selectedVariant?.price && <Money data={selectedVariant?.price} />
      )}
    </div>
  );
}

function ProductForm({
  product,
  selectedVariant,
  variants,
}: {
  product: ProductFragment;
  selectedVariant: ProductFragment['selectedVariant'];
  variants: Array<ProductVariantFragment>;
}) {
  return (
    <div className="product-form">
      <VariantSelector
        handle={product.handle}
        options={product.options}
        variants={variants}
      >
        {({option}) => {
          return <ProductOptions key={option?.name} option={option} />;
        }}
        {/* <ProductOptions option={product.options as any} />; */}
      </VariantSelector>
      <br />
      <AddToCartButton
        disabled={!selectedVariant || !selectedVariant?.availableForSale}
        onClick={() => {
          window.location.href = window.location.href + '#cart-aside';
        }}
        lines={
          selectedVariant
            ? [
                {
                  merchandiseId: selectedVariant?.id,
                  quantity: 1,
                },
              ]
            : []
        }
      >
        {selectedVariant?.availableForSale ? 'Add to cart' : 'Sold out'}
      </AddToCartButton>
    </div>
  );
}

function ProductOptions({option}: {option: VariantOption}) {
  return (
    <div className="product-options" key={option?.name}>
      <h5>{option?.name}</h5>
      <div className="product-options-grid">
        {option?.values?.map(({value, isAvailable, isActive, to}) => {
          return (
            <Link
              className="product-options-item"
              key={option?.name + value}
              prefetch="intent"
              preventScrollReset
              replace
              to={to}
              style={{
                border: isActive ? '1px solid black' : '1px solid transparent',
                opacity: isAvailable ? 1 : 0.3,
              }}
            >
              {value}
            </Link>
          );
        })}
      </div>
      <br />
    </div>
  );
}

function AddToCartButton({
  analytics,
  children,
  disabled,
  lines,
  onClick,
}: {
  analytics?: unknown;
  children: React.ReactNode;
  disabled?: boolean;
  lines: CartLineInput[];
  onClick?: () => void;
}) {
  return (
    <CartForm route="/cart" inputs={{lines}} action={CartForm.ACTIONS.LinesAdd}>
      {(fetcher: FetcherWithComponents<any>) => (
        <>
          <input
            name="analytics"
            type="hidden"
            value={JSON.stringify(analytics)}
          />
          <button
            className="banner_repo_cta"
            type="submit"
            onClick={onClick}
            disabled={disabled ?? fetcher.state !== 'idle'}
          >
            {children}
          </button>
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
        </>
      )}
    </CartForm>
  );
}
const PRODUCT_VARIANT_FRAGMENT = `#graphql
  fragment ProductVariant on ProductVariant {
    availableForSale
    compareAtPrice {
      amount
      currencyCode
    }
    id
    image {
      __typename
      id
      url
      altText
      width
      height
    }
    price {
      amount
      currencyCode
    }
    product {
      title
      handle
    }
    selectedOptions {
      name
      value
    }
    sku
    title
    unitPrice {
      amount
      currencyCode
    }
  }
` as const;

const PRODUCT_FRAGMENT = `#graphql
  fragment Product on Product {
    id
    title
    vendor
    handle
    descriptionHtml
    description
    options {
      name
      values
    }
    selectedVariant: variantBySelectedOptions(selectedOptions: $selectedOptions) {
      ...ProductVariant
    }
    variants(first: 1) {
      nodes {
        ...ProductVariant
      }
    }
    seo {
      description
      title
    }
  }
  ${PRODUCT_VARIANT_FRAGMENT}
` as const;

const PRODUCT_QUERY = `#graphql
  query Product(
    $country: CountryCode
    $handle: String!
    $language: LanguageCode
    $selectedOptions: [SelectedOptionInput!]!
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      ...Product
      metafield(namespace: "custom", key: "information") {
              key
              value
              reference {
                    ... on Metaobject {
                      id
                      fields {
                        key
                        value
                      }
                    }
              }
        }
    }
  }
  ${PRODUCT_FRAGMENT}
` as const;

const PRODUCT_VARIANTS_FRAGMENT = `#graphql
  fragment ProductVariants on Product {
    variants(first: 250) {
      nodes {
        ...ProductVariant
      }
    }
  }
  ${PRODUCT_VARIANT_FRAGMENT}
` as const;

const VARIANTS_QUERY = `#graphql
  ${PRODUCT_VARIANTS_FRAGMENT}
  query ProductVariants(
    $country: CountryCode
    $language: LanguageCode
    $handle: String!
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      ...ProductVariants
    }
  }
` as const;

const RELATED_PRODUCT_QUERY = `#graphql
  query productRecommendations(
    $country: CountryCode
    $language: LanguageCode
    $productID: ID!
  ) @inContext(country: $country, language: $language) {
    productRecommendations(productId: $productID, intent: RELATED) {
      id,
      title
      priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
      maxVariantPrice {
        amount
        currencyCode
      }
    }
      images(first:1){
        nodes{
          id
        url
        altText
        width
        height
        }
      }
    }
  }
` as const;
