import {Fragment, Suspense, useState} from 'react';
import parse from 'html-react-parser';
import {defer, redirect, type LoaderFunctionArgs} from '@shopify/remix-oxygen';

import {
  useLocation,
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

export const meta: MetaFunction<typeof loader> = ({data}) => {
  return [{title: `Hydrogen | ${data?.product.title ?? ''}`}];
};

async function fetchAllMetaobjects(fetchQuery: any, first: number) {
  let allMetaobjects: any[] = [];
  let hasNextPage = true;
  let endCursor: string | null = null;

  while (hasNextPage) {
    // Fetch the next page of metaobjects
    const response: any = await fetchQuery({first, after: endCursor});

    if (response && response.metaobjects) {
      const metaobjects = response.metaobjects;

      if (metaobjects.edges) {
        allMetaobjects = [...allMetaobjects, ...metaobjects.edges];
      }

      hasNextPage = metaobjects.pageInfo?.hasNextPage ?? false;
      endCursor = metaobjects.pageInfo?.endCursor ?? null;
    } else {
      hasNextPage = false;
    }
  }

  return allMetaobjects;
}
function filterMetaobjectsByProductId(metaobjects: any, productId: any) {
  return metaobjects.filter(({node}: any) =>
    node.fields.some(
      (field: any) => field.key === 'product' && field.value === productId,
    ),
  );
}

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

  // Fetch metaobjects
  const metaobjects = await fetchAllMetaobjects(async (variables: any) => {
    return storefront.query(META_OBJECT_QUERY, {variables});
  }, 100);

  const headingQuery = await storefront?.query(HEADING_QUERY);

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

  // // Filter metaobjects by the product ID
  const filteredMetaobjects = filterMetaobjectsByProductId(
    metaobjects,
    productID,
  );
  // Fetch related products using the product ID
  const relatedProductQueryResults = await storefront.query(
    RELATED_PRODUCT_QUERY,
    {
      variables: {productID}, // Pass the product ID as the $productID variable
    },
  );

  const firstVariant = product.variants?.nodes[0];
  let firstVariantIsDefault = false;

  firstVariant?.selectedOptions?.forEach((option: SelectedOption) => {
    if (option?.name === 'Title' && option?.value === 'Default Title') {
      firstVariantIsDefault = true;
    }
  });

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
    relatedProductQueryResults,
    metaobjects: filteredMetaobjects,
    headingQuery,
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

interface LoaderData {
  product: any;
  variants: any;
  relatedProductQueryResults: any;
  metaobjects: any;
  headingQuery: any;
  // Add other properties if needed
}

export default function Product() {
  const location = useLocation();
  const {state} = location;
  const loaderData = useLoaderData<LoaderData>();
  const {
    product,
    variants,
    relatedProductQueryResults,
    metaobjects,
    headingQuery,
  } = loaderData;
  useLoaderData<typeof loader>();
  const {selectedVariant} = product;
  const collectionName = product?.collections?.edges?.[0]?.node?.title;
  const productName = product?.title;
  const limitedProducts =
    relatedProductQueryResults?.productRecommendations?.slice(0, 5);

  const matchedField: any[] = [];
  if (metaobjects?.[0]?.node?.fields) {
    metaobjects?.[0]?.node?.fields.forEach((node: any) => {
      matchedField.push(node);
    });
  }
  const fields = headingQuery?.metaobjects?.nodes?.[0]?.fields;

  return (
    <>
      <div className="breadcrumbs container">
        <ul>
          <li className="safari-only">
            <a href="/">Home</a>
          </li>
          {state?.previousTabUrl === '/variantUrl' ? (
            <li className="safari-only">
              <a href="/collections">Collections</a>
            </li>
          ) : (
            <li className="safari-only">
              <a href="/collections/all">Products</a>
            </li>
          )}

          {state?.previousTabUrl === '/variantUrl' ? (
            <li className="safari-only">
              <span>{collectionName}</span>
            </li>
          ) : (
            ''
          )}
          <li className="safari-only">
            <span>{productName}</span>
          </li>
        </ul>
      </div>
      <div className="product container">
        <ProductImage image={selectedVariant?.image} />
        <ProductMain
          selectedVariant={selectedVariant}
          product={product}
          variants={variants}
          matchedField={matchedField}
        />
      </div>
      {limitedProducts?.length ? (
        <div className="related-wrapper">
          <Suspense fallback={<div>Loading...</div>}>
            <div className="featured-wrapper container">
              <div className="featured-content">
                {Array.isArray(fields) &&
                  fields.map((field: any) => {
                    return (
                      <>
                        {field?.key === 'related_products_heading' && (
                          <h2 className="product-css">{field?.value}</h2>
                        )}
                      </>
                    );
                  })}
              </div>
              <div className="feature-products-grid">
                {limitedProducts?.length
                  ? limitedProducts?.map((product: any) => {
                      let priceOff: any;
                      // Check if the product is available for sale and all necessary price data is provided
                      if (
                        product.availableForSale &&
                        product.priceRange &&
                        product.compareAtPriceRange
                      ) {
                        const price = parseFloat(
                          product.priceRange.minVariantPrice.amount,
                        );
                        const compareAtPrice = parseFloat(
                          product.compareAtPriceRange.minVariantPrice.amount,
                        );

                        priceOff = compareAtPrice - price;
                      }

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
                            <p className="product-cta">{product?.title}</p>
                            <small className="product-small-cta">
                              {product?.title}
                            </small>
                            {
                              <div className="product-price-on-sale price-mobile">
                                {product?.priceRange ? (
                                  <Money
                                    className="price"
                                    data={product?.priceRange?.minVariantPrice}
                                  />
                                ) : null}
                                {product?.priceRange?.minVariantPrice?.amount <
                                product?.compareAtPriceRange?.minVariantPrice
                                  ?.amount ? (
                                  <s>
                                    <Money
                                      className="comparePrice"
                                      data={
                                        product?.compareAtPriceRange
                                          ?.minVariantPrice
                                      }
                                    />
                                  </s>
                                ) : (
                                  ''
                                )}
                                {priceOff > 0 ? (
                                  <p className="comparePrice">
                                    (${priceOff.toFixed(2)} OFF)
                                  </p>
                                ) : (
                                  ''
                                )}
                              </div>
                            }
                          </Link>
                        </Fragment>
                      );
                    })
                  : ''}
              </div>
            </div>
          </Suspense>
        </div>
      ) : (
        ''
      )}
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
  matchedField,
}: {
  product: any;
  selectedVariant: ProductFragment['selectedVariant'];
  variants: Promise<ProductVariantsQuery>;
  matchedField: any;
}) {
  const {title, descriptionHtml, metafield} = product;
  const valueMap = new Map();
  metafield?.reference?.fields?.forEach((field: any) => {
    valueMap.set(field.key, field.value);
  });

  return (
    <>
      <div className="product-main">
        <h1>{title}</h1>
        <br />
        {descriptionHtml && <div>{parse(descriptionHtml || '')}</div>}
        <ProductPrice selectedVariant={selectedVariant} />
        <br />
        <Suspense
          fallback={
            <ProductForm
              product={product}
              selectedVariant={selectedVariant}
              // variants={data?.product?.variants.nodes || []}
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
                variants={data.product?.variants.nodes || []}
              />
            )}
          </Await>
        </Suspense>

        <br />
        {valueMap.get('product_review') && (
          <>
            <p>
              <strong>Reviews</strong>
            </p>
            <br />
            <div>{parse(valueMap.get('product_review') || '')}</div>
            <br />
          </>
        )}

        {valueMap.get('shipping_return_policy') && (
          <>
            <p>
              <strong>Shipping and Return</strong>
            </p>
            <br />
            <div>{parse(valueMap.get('shipping_return_policy') || '')}</div>
            <br />
          </>
        )}
        <div className="shipping-container">
          <div className="postalcode-container">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 32 32"
              fill="none"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M3.86207 6C3.34787 6 2.93103 6.40508 2.93103 6.90476C2.93103 7.40445 3.34787 7.80952 3.86207 7.80952H16.0145C16.5287 7.80952 16.9456 8.2146 16.9456 8.71429V21.381H13.1394C12.9135 19.8463 11.5554 18.6667 9.91379 18.6667C8.28961 18.6667 6.94295 19.8214 6.69576 21.3321C6.33002 21.2101 6.06715 20.873 6.06715 20.4762V17.1587C6.06715 16.659 5.65031 16.254 5.13612 16.254C4.62192 16.254 4.20508 16.659 4.20508 17.1587V20.4762C4.20508 21.9657 5.43969 23.175 6.96869 23.1903C7.49165 24.2603 8.61382 25 9.91379 25C11.2137 25 12.3358 24.2603 12.8588 23.1905H20.0032C20.5262 24.2603 21.6484 25 22.9483 25C24.2482 25 25.3703 24.2603 25.8933 23.1905H26.2069C27.7495 23.1905 29 21.9752 29 20.4762V14.5952C29 14.4359 28.9567 14.2794 28.8745 14.1416L25.5904 8.63499C25.0909 7.79738 24.17 7.28175 23.1738 7.28175H18.3874C17.8944 6.5122 17.016 6 16.0145 6H3.86207ZM26.1739 21.381H26.2069C26.7211 21.381 27.1379 20.9759 27.1379 20.4762V15.5H18.8076V21.381H19.7227C19.9485 19.8463 21.3066 18.6667 22.9483 18.6667C24.5899 18.6667 25.948 19.8463 26.1739 21.381ZM26.4533 13.6905H18.8076V9.09127H23.1738C23.5059 9.09127 23.8128 9.26315 23.9793 9.54235L26.4533 13.6905ZM9.91379 20.4762C9.1425 20.4762 8.51724 21.0838 8.51724 21.8333C8.51724 22.5829 9.1425 23.1905 9.91379 23.1905C10.6851 23.1905 11.3103 22.5829 11.3103 21.8333C11.3103 21.0838 10.6851 20.4762 9.91379 20.4762ZM22.9483 20.4762C22.177 20.4762 21.5517 21.0838 21.5517 21.8333C21.5517 22.5829 22.177 23.1905 22.9483 23.1905C23.7196 23.1905 24.3448 22.5829 24.3448 21.8333C24.3448 21.0838 23.7196 20.4762 22.9483 20.4762Z"
                fill="#212121"
              />
              <path
                d="M2 11.4286C2 10.9289 2.41684 10.5238 2.93103 10.5238H7.58621C8.1004 10.5238 8.51724 10.9289 8.51724 11.4286C8.51724 11.9283 8.1004 12.3333 7.58621 12.3333H2.93103C2.41684 12.3333 2 11.9283 2 11.4286Z"
                fill="#212121"
              />
              <path
                d="M5.72414 13.2381C5.20994 13.2381 4.7931 13.6432 4.7931 14.1429C4.7931 14.6425 5.20994 15.0476 5.72414 15.0476H10.3793C10.8935 15.0476 11.3103 14.6425 11.3103 14.1429C11.3103 13.6432 10.8935 13.2381 10.3793 13.2381H5.72414Z"
                fill="#212121"
              />
            </svg>
          </div>

          <div className="details-container">
            <span className="Free-Delivery">Free Delivery</span>

            {matchedField.length > 0 ? (
              Array.isArray(matchedField) &&
              matchedField.map((field: any) => {
                if (field.key === 'free_delivery') {
                  return (
                    <span key={field.key} className="Postal-code">
                      {field.value === 'true'
                        ? 'Contentstack sponsered'
                        : 'Enter your postal code'}
                    </span>
                  );
                }
                return null;
              })
            ) : (
              <span className="Postal-code">Enter your postal code</span>
            )}
          </div>

          <div className="postalcode-container">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 32 32"
              fill="none"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M9.89809 5.62086C12.2031 4.29464 14.8817 3.76018 17.5212 4.09938C20.1608 4.43857 22.6158 5.63274 24.5078 7.49872C26.3999 9.36477 27.624 11.7992 27.9907 14.4272C28.0639 14.9523 27.6977 15.4374 27.1726 15.5107C26.6475 15.5839 26.1624 15.2177 26.0891 14.6926C25.7809 12.4835 24.7518 10.436 23.1596 8.86573C21.5673 7.29539 19.5002 6.28946 17.2765 6.0037C15.0527 5.71793 12.7965 6.16832 10.8556 7.28505C9.34967 8.15147 8.09857 9.38157 7.21111 10.8512H10.4801C11.0102 10.8512 11.44 11.281 11.44 11.8112C11.44 12.3414 11.0102 12.7712 10.4801 12.7712H5.67154C5.65701 12.7715 5.64245 12.7715 5.62787 12.7712H4.96011C4.42992 12.7712 4.00012 12.3414 4.00012 11.8112V6.3138C4.00012 5.78362 4.42992 5.35381 4.96011 5.35381C5.4903 5.35381 5.9201 5.78362 5.9201 6.3138V9.30902C6.9436 7.80429 8.30052 6.54002 9.89809 5.62086Z"
                fill="#212121"
              />
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M4.82744 16.4891C5.35254 16.4158 5.83761 16.7821 5.91089 17.3072C6.21914 19.5163 7.24822 21.5638 8.84041 23.134C10.4327 24.7044 12.4998 25.7103 14.7235 25.9961C16.9473 26.2818 19.2035 25.8314 21.1444 24.7147C22.6503 23.8483 23.9014 22.6182 24.7889 21.1486H21.5199C20.9898 21.1486 20.56 20.7188 20.56 20.1886C20.56 19.6584 20.9898 19.2286 21.5199 19.2286H26.3285C26.343 19.2282 26.3575 19.2282 26.3721 19.2286H27.0399C27.5701 19.2286 27.9999 19.6584 27.9999 20.1886V25.686C27.9999 26.2161 27.5701 26.646 27.0399 26.646C26.5097 26.646 26.0799 26.2161 26.0799 25.686V22.6907C25.0564 24.1955 23.6995 25.4597 22.1019 26.3789C19.7969 27.7051 17.1183 28.2396 14.4788 27.9004C11.8392 27.5612 9.38424 26.367 7.49222 24.501C5.60014 22.635 4.37605 20.2006 4.00933 17.5725C3.93606 17.0474 4.30234 16.5624 4.82744 16.4891Z"
                fill="#212121"
              />
            </svg>
          </div>

          <div className="details-container">
            <span className="Free-Delivery">Return Policy</span>
            {matchedField.length > 0 ? (
              Array.isArray(matchedField) &&
              matchedField.map((field: any) => {
                return (
                  <>
                    {field?.key === 'return_policy' && (
                      <span className="Postal-code">{field.value}</span>
                    )}
                  </>
                );
              })
            ) : (
              <span className="Postal-code">
                Free 30 Days Delivery Returns. Details
              </span>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function ProductPrice({
  selectedVariant,
}: {
  selectedVariant: ProductFragment['selectedVariant'];
}) {
  const originalPrice = parseFloat(
    selectedVariant?.compareAtPrice?.amount || '',
  );
  const discountedPrice = parseFloat(selectedVariant?.price?.amount || '');
  let priceOff;

  if (originalPrice && discountedPrice && discountedPrice < originalPrice) {
    priceOff = originalPrice - discountedPrice;
  }
  return (
    <>
      <div className="product-price">
        {selectedVariant?.compareAtPrice ? (
          <>
            <br />
            <div className="product-price-on-sale product-price-on-saleRef">
              {selectedVariant ? (
                <>
                  <Money className="price" data={selectedVariant.price} />
                </>
              ) : null}
              <s>
                <Money
                  className="comparePrice referencePrice"
                  data={selectedVariant.compareAtPrice}
                />
              </s>
              {priceOff ? (
                <p className="percentageOffPrice">(${priceOff} OFF)</p>
              ) : (
                ''
              )}
              <div className="verticalseprator">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="2"
                  height="18"
                  viewBox="0 0 2 18"
                  fill="none"
                >
                  <path
                    d="M1 1L1 17"
                    stroke="#545454"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              <span className="instock">IN STOCK</span>
            </div>
          </>
        ) : (
          selectedVariant?.price && <Money data={selectedVariant?.price} />
        )}
      </div>
      <div className="seprrator">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="600"
          height="2"
          viewBox="0 0 600 2"
          fill="none"
        >
          <path d="M0 1H600" stroke="#E6E6E6" />
        </svg>
      </div>
    </>
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
    <>
      <div className="product-options" key={option.name}>
        <h5>{option.name}</h5>
        <div className="product-options-grid">
          {option.values.map(({value, isAvailable, isActive, to}) => {
            return (
              <Link
                className="product-options-item"
                key={option.name + value}
                prefetch="intent"
                preventScrollReset
                replace
                to={to}
                style={{
                  height: '24px',
                  width: '24px',
                  border: isActive ? '1px solid black' : '1px solid black',
                  backgroundColor: isActive ? 'black' : 'transparent',
                  color: isActive ? 'white' : 'black',
                  borderRadius: '10px',
                  paddingTop: '7px',
                  paddingLeft: '13px',
                  paddingBottom: '7px',
                  paddingRight: '5px',
                }}
              >
                {value}
              </Link>
            );
          })}
        </div>
        <br />
      </div>
      <div className="seprrator">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="600"
          height="2"
          viewBox="0 0 600 2"
          fill="none"
        >
          <path d="M0 1H600" stroke="#E6E6E6" />
        </svg>
      </div>
    </>
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
  const [quantity, setQuantity] = useState(1);
  const handleIncrement = () => {
    setQuantity(quantity + 1);
  };
  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };
  return (
    <>
      <div className="add-to-cart-container">
        <CartForm
          route="/cart"
          inputs={{lines}}
          action={CartForm.ACTIONS.LinesAdd}
        >
          {(fetcher: FetcherWithComponents<any>) => (
            <>
              <input
                name="analytics"
                value={JSON.stringify(analytics)}
                type="hidden"
              />
              <div className="addtocartquantiy">
                <button className="decrement-button" onClick={handleDecrement}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M21 12C21 11.5858 20.69 11.25 20.3077 11.25L3.69231 11.25C3.30996 11.25 3 11.5858 3 12C3 12.4142 3.30996 12.75 3.69231 12.75L20.3077 12.75C20.69 12.75 21 12.4142 21 12Z"
                      fill="#212121"
                    />
                  </svg>
                </button>
                <span className="totalquantiy">{quantity - 1}</span>

                <button className="increment-button" onClick={handleIncrement}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M12 3C12.3824 3 12.6923 3.30996 12.6923 3.69231V20.3077C12.6923 20.69 12.3824 21 12 21C11.6176 21 11.3077 20.69 11.3077 20.3077V3.69231C11.3077 3.30996 11.6176 3 12 3Z"
                      fill="#212121"
                    />
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M21 12C21 12.3824 20.69 12.6923 20.3077 12.6923L3.69231 12.6923C3.30996 12.6923 3 12.3824 3 12C3 11.6176 3.30996 11.3077 3.69231 11.3077L20.3077 11.3077C20.69 11.3077 21 11.6176 21 12Z"
                      fill="#212121"
                    />
                  </svg>
                </button>
              </div>
              <Link
                className="banner-repo-cta banner-repo-cta-icon"
                type="submit"
                onClick={onClick}
                disabled={disabled || fetcher.state !== 'idle'}
                style={{
                  width: '219px',
                  padding: '0px',
                }}
              >
                {children}
              </Link>
            </>
          )}
        </CartForm>
      </div>
      <div className="seprrator">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="600"
          height="2"
          viewBox="0 0 600 2"
          fill="none"
        >
          <path d="M0 1H600" stroke="#E6E6E6" />
        </svg>
      </div>
    </>
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
        collections(first: 1) {
          edges {
            node {
              id
              title
            }
          }
        }
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
        handle
        availableForSale
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
        compareAtPriceRange {
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

const META_OBJECT_QUERY = `#graphql
query MetaObject($country: CountryCode, $language: LanguageCode, $first: Int, $after: String)
@inContext(country: $country, language: $language) {
  metaobjects(first: $first, after: $after, type: "product_detail_page") {
      edges {
        node {
          id
          fields {
            key
            value
            reference {
              ... on Product {
                id
                title
              }
            }
          }
        }
        cursor
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
}` as const;

const HEADING_QUERY = `#graphql
query MetaObject($country: CountryCode, $language: LanguageCode)
@inContext(country: $country, language: $language) {
  metaobjects(first: 100, type: "product_page_contents") {
    nodes {
      fields {
        key
        type
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
}` as const;
