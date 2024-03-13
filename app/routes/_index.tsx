import {defer, type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {Await, useLoaderData, Link, type MetaFunction} from '@remix-run/react';
import {Fragment, Suspense} from 'react';
import {getPaginationVariables, Image, Money} from '@shopify/hydrogen';
import type {
  CollectionFragment,
  RecommendedProductsQuery,
} from 'storefrontapi.generated';
import '../styles/pages.css';
import {getEntryByUid} from '~/components/contentstack-sdk';

export const meta: MetaFunction = () => {
  return [{title: 'Hydrogen | Home'}];
};

export async function loader({context, request}: LoaderFunctionArgs) {
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
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 6,
  });

  const {collections} = await context.storefront.query(COLLECTIONS_QUERY, {
    variables: paginationVariables,
  });

  return defer({
    recommendedProducts,
    fetchedData: await fetchData(),
    collections,
  });
}

export default function Homepage() {
  const data = useLoaderData<typeof loader>();
  return (
    <div className="home flex pg_bt">
      <RecommendedProducts
        products={data.recommendedProducts}
        cmsData={data.fetchedData}
        collections={data.collections.nodes}
      />
    </div>
  );
}

function CollectionItem({
  collection,
  index,
}: {
  collection: CollectionFragment;
  index: number;
}) {
  return (
    <Link
      className="recommended-product flex"
      key={collection.id}
      to={`/collections/${collection.handle}`}
      prefetch="intent"
    >
      {collection?.image && (
        <Image
          alt={collection.image.altText || collection.title}
          aspectRatio="1/1"
          data={collection.image}
          loading={index < 3 ? 'eager' : undefined}
          className="collection_image"
        />
      )}
      <p className="product_cta collection_content">{collection.title}</p>
    </Link>
  );
}

function RecommendedProducts({
  products,
  cmsData,
  collections,
}: {
  products: Promise<RecommendedProductsQuery>;
  cmsData: Awaited<ReturnType<typeof getEntryByUid>>;
  collections: CollectionFragment[];
}) {
  return (
    <div>
      <div className="home_page_banner">
        <h1 className="page_banner_content bodyCss">{cmsData?.banner_title}</h1>
        <div className="flex gap">
          <a
            href={cmsData?.button?.repo?.cta_title?.href}
            rel="noreferrer"
            target={cmsData.button.repo.open_in_new_tab ? '_blank' : '_self'}
            className="banner_repo_cta"
          >
            {cmsData.button.repo.cta_title.title}
          </a>
          <a
            href={cmsData.button.products.cta_title.href}
            rel="noreferrer"
            target={
              cmsData.button.products.open_in_new_tab ? '_blank' : '_self'
            }
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
              <div>
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
                                    aspectRatio="1/1.2"
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
                <div className="collection_wrapper featured_wrapper">
                  <div className="container">
                    {/* <div className="featuredContent"> */}
                    <h2 className="bodyCss collection_heading">
                      {cmsData.collection_heading}
                    </h2>
                    {/* </div> */}
                    <div className="recommended-products-grid container mg_0">
                      {collections.map((collection, index) => (
                        <CollectionItem
                          key={collection.id}
                          collection={collection}
                          index={index}
                        />
                      ))}
                    </div>
                  </div>
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
    products(first: 3, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        ...RecommendedProduct
      }
  
    }
  }
` as const;
const COLLECTIONS_QUERY = `#graphql
  fragment Collection on Collection {
    id
    title
    handle
    description
    image {
      id
      url
      altText
      width
      height
    }
  }
  query StoreCollections(
    $country: CountryCode
    $endCursor: String
    # $first: Int
    $language: LanguageCode
    $last: Int
    $startCursor: String
  ) @inContext(country: $country, language: $language) {
    collections(
      first: 3,
      last: $last,
      before: $startCursor,
      after: $endCursor
    ) {
      nodes {
        ...Collection
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
