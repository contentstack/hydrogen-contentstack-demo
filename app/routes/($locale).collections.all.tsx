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
import {getEntryByUid} from '~/components/contentstack-sdk';
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

  const envConfig = context.env;
  const fetchData = async () => {
    try {
      const result = await getEntryByUid({
        contentTypeUid: 'shopify_home',
        entryUid: 'blt9743f5cf3740e66a',
        envConfig,
      });
      return result;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('ERROR', error);
    }
  };
  return defer({
    recommendedProducts,
    fetchedData: await fetchData(),
  });
}

export default function Productpage() {
  const data = useLoaderData<typeof loader>();
  return (
    <div className="home flex container pg_bt">
      <Pagination connection={data?.recommendedProducts?.products}>
        {({nodes, isLoading, PreviousLink, NextLink}) => (
          <div>
            {/* <PreviousLink className="load_more">
                {isLoading ? (
                  'Loading...'
                ) : (
                  <span className="load_more">↑ Load previous</span>
                )}
              </PreviousLink> */}
            <RecommendedProducts products={nodes} cmsData={data.fetchedData} />
            <NextLink className="load_more">
              {isLoading ? (
                'Loading...'
              ) : (
                <span className="load_more">Load more ↓</span>
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
  cmsData,
}: {
  products: any;
  cmsData: any;
}) {
  return (
    <div>
      <Suspense fallback={<div>Loading...</div>}>
        <div className="featured_wrapper container">
          <div className="featuredContent">
            <h2 className="product_css">{cmsData.product_title}</h2>
          </div>
          <div className="feature-products-grid">
            {products?.map((product: any) => {
              return (
                <Fragment key={product.id}>
                  <Link
                    className="feature-product"
                    to={`/products/${product.handle}`}
                  >
                    {product.images.nodes[0] ? (
                      <Image
                        data={product.images.nodes[0]}
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
                    <p className="product_cta">{product.title}</p>
                    <small>
                      <Money
                        className="product_price"
                        data={product.priceRange.minVariantPrice}
                      />
                    </small>
                  </Link>
                </Fragment>
              );
            })}
          </div>
        </div>
      </Suspense>

      <br />
    </div>
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
        sortKey: UPDATED_AT
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
