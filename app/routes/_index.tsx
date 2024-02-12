import {defer, type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {Await, useLoaderData, Link, type MetaFunction} from '@remix-run/react';
import {Fragment, Suspense} from 'react';
import {Image, Money} from '@shopify/hydrogen';
import type {RecommendedProductsQuery} from 'storefrontapi.generated';
import banner from '../../public/banner.svg';
import '../styles/pages.css';
import {getEntryByUid} from '~/components/contentstack-sdk';

export const meta: MetaFunction = () => {
  return [{title: 'Hydrogen | Home'}];
};

export async function loader({context}: LoaderFunctionArgs) {
  const {storefront} = context;
  const recommendedProducts = storefront.query(RECOMMENDED_PRODUCTS_QUERY);
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

export default function Homepage() {
  const data = useLoaderData<typeof loader>();
  return (
    <div className="home flex pg_bt">
      <RecommendedProducts
        products={data.recommendedProducts}
        cmsData={data.fetchedData}
      />
    </div>
  );
}

function RecommendedProducts({
  products,
  cmsData,
}: {
  products: Promise<RecommendedProductsQuery>;
  cmsData: Awaited<ReturnType<typeof getEntryByUid>>;
}) {
  return (
    <div>
      <div className="home_page_banner">
        <h1 className="page_banner_content bodyCss">{cmsData?.banner_title}</h1>
        <div className="flex gap">
          <a
            href={cmsData.button.repo.cta_title.href}
            rel="noreferrer"
            target={cmsData.button.repo.open_in_new_tab && '_blank'}
            className="banner_repo_cta"
          >
            {cmsData.button.repo.cta_title.title}
          </a>
          <a
            href={cmsData.button.products.cta_title.href}
            rel="noreferrer"
            target={cmsData.button.products.open_in_new_tab && '_blank'}
            className="banner_repo_cta"
          >
            {cmsData.button.products.cta_title.title}
          </a>
        </div>
      </div>
      <Suspense fallback={<div>Loading...</div>}>
        <Await resolve={products}>
          {({products}) => {
            return (
              <div className="featured_wrapper container">
                <div className="featuredContent">
                  <h2 className="bodyCss">{cmsData.feature_title}</h2>
                </div>
                <div className="recommended-products-grid">
                  {products.nodes.map((product) => {
                    return (
                      <Fragment key={product.id}>
                        {!product.images.nodes[0] ||
                          (product.images.nodes[0] != null && (
                            <Link
                              className="recommended-product"
                              to={`/products/${product.handle}`}
                            >
                              {product.images.nodes[0] && (
                                <Image
                                  data={product.images.nodes[0]}
                                  aspectRatio="1/1"
                                  sizes="(min-width: 45em) 20vw, 50vw"
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
                          ))}
                      </Fragment>
                    );
                  })}
                </div>
                <div className="center">
                  <Link
                    to={cmsData.view_all_product.cta_title.href}
                    rel="noreferrer"
                    target={
                      cmsData.view_all_product.open_in_new_tab && '_blank'
                    }
                    className="view_allproducts"
                  >
                    {cmsData.view_all_product.cta_title.title}
                  </Link>
                </div>
              </div>
            );
          }}
        </Await>
      </Suspense>
      <br />
    </div>
  );
}

const FEATURED_COLLECTION_QUERY = `#graphql
  fragment FeaturedCollection on Collection {
    id
    title
    image {
      id
      url
      altText
      width
      height
    }
    handle
  }
  query FeaturedCollection($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    collections(first: 1, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        ...FeaturedCollection
      }
    }
  }
` as const;

const RECOMMENDED_PRODUCTS_QUERY = `#graphql
  fragment RecommendedProduct on Product {
    id
    title
    handle
    priceRange {
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
  query RecommendedProducts ($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    products(first: 9, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        ...RecommendedProduct
      }
  
    }
  }
` as const;
