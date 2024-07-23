import {defer, type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {Await, useLoaderData, Link, type MetaFunction} from '@remix-run/react';
import type {ReactNode} from 'react';
import {Fragment, Suspense, useEffect} from 'react';
import {
  getPaginationVariables,
  Image,
  Money,
  Pagination,
} from '@shopify/hydrogen';
import '../styles/pages.css';
import NoImg from '../../public/NoImg.svg';

export const meta: MetaFunction = () => {
  return [{title: 'Hydrogen | Products'}];
};

export async function loader({context, request}: LoaderFunctionArgs) {
  const {storefront} = context;
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 8,
  });
  const recommendedProducts = await storefront.query(
    RECOMMENDED_PRODUCTS_QUERY,
    {
      variables: paginationVariables,
    },
  );
  const headingQuery = await storefront?.query(HEADING_QUERY);

  return defer({
    recommendedProducts,
    headingQuery,
  });
}

export default function Productpage() {
  const data = useLoaderData<typeof loader>();
  return (
    <div className="home flex pg-bt">
      <Pagination connection={data?.recommendedProducts?.products}>
        {({nodes, isLoading, PreviousLink, NextLink}) => (
          <div>
            <RecommendedProducts
              products={nodes}
              metaObject={data?.headingQuery}
            />
            <NextLink className="load-more">
              {isLoading ? (
                'Loading...'
              ) : (
                <div className="center">
                  <span className="view-all-products load-more">
                    Load more ↓
                  </span>
                </div>
              )}
            </NextLink>
          </div>
        )}
      </Pagination>
    </div>
  );
}

function RecommendedProducts({
  products,
  metaObject,
}: {
  products: any;
  metaObject: any;
}) {
  const fields = metaObject?.metaobjects?.nodes?.[0]?.fields;
  return (
    <>
      <div className="breadcrumbs container">
        <ul>
          <li className="safari-only">
            <a href="/">Home</a>
          </li>
          <li className="safari-only">
            <span>Featured Products</span>
          </li>
        </ul>
      </div>
      <div></div>

      <Suspense fallback={<div>Loading...</div>}>
        <div className="featured-wrapper container">
          <div className="featured-content">
            {Array.isArray(fields) &&
              fields.map((field: any) => {
                return (
                  <>
                    {field?.key === 'product_page_heading' && (
                      <h2 className="product-css">{field?.value}</h2>
                    )}
                  </>
                );
              })}
          </div>
          <div className="feature-products-grid">
            {products?.map((product: any) => {
              const originalPrice = parseFloat(
                product?.compareAtPriceRange?.minVariantPrice?.amount,
              );
              const discountedPrice = parseFloat(
                product?.priceRange?.minVariantPrice?.amount,
              );
              let priceOff;
              if (
                originalPrice &&
                discountedPrice &&
                discountedPrice < originalPrice
              ) {
                priceOff = originalPrice - discountedPrice;
              }
              return (
                <Fragment key={product?.id}>
                  <Link
                    className="feature-product"
                    to={`/products/${product?.handle}`}
                    onClick={(e) => {
                      e.preventDefault();
                      window.location.href = `/products/${product?.handle}`;
                    }}
                  >
                    {product?.images?.nodes[0] ? (
                      <Image
                        data={product?.images?.nodes[0]}
                        aspectRatio="1/2"
                        // sizes="(min-width: 45em) 20vw, 50vw"
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
                    <small>
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
                                product?.compareAtPriceRange?.minVariantPrice
                              }
                            />
                          </s>
                        ) : (
                          ''
                        )}
                        {priceOff && priceOff > 0 ? (
                          <p className="comparePrice">
                            (${priceOff.toFixed(2)} OFF)
                          </p>
                        ) : (
                          ''
                        )}
                      </div>
                    </small>
                  </Link>
                </Fragment>
              );
            })}
          </div>
        </div>
      </Suspense>
    </>
  );
}

const RECOMMENDED_PRODUCTS_QUERY = `#graphql
  fragment Product on Product {
    id
    title
    handle
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
      
    }
    images(first: 1) {
      nodes {
        id
        url
        altText
        width
        height
      }
    }
  }
  query RecommendedProducts ( $country: CountryCode
    $endCursor: String
    $first: Int
    $language: LanguageCode
    $last: Int
    $startCursor: String
  ) @inContext(country: $country, language: $language) {
    products(first: $first,
        last: $last,
        before: $startCursor,
        after: $endCursor,
        sortKey: CREATED_AT
        reverse: true
        ) {
        nodes {
            ...Product
        }
        pageInfo {
            hasNextPage
            hasPreviousPage
            startCursor
            endCursor
        }
    }
  }
` as const;

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
