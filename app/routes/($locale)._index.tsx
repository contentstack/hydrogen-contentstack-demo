import {defer, type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {Await, useLoaderData, Link, type MetaFunction} from '@remix-run/react';
import {Fragment, Suspense} from 'react';
import {
  getPaginationVariables,
  Image,
  Money,
  MediaFile,
} from '@shopify/hydrogen';
import type {
  CollectionFragment,
  RecommendedProductsQuery,
} from 'storefrontapi.generated';
import '../styles/pages.css';
import {getEntryByUid} from '~/components/contentstack-sdk';
import OffersImage from './../../public/offers.svg';

export const meta: MetaFunction = () => {
  return [{title: 'Hydrogen | Home'}];
};

export async function loader({context, request}: LoaderFunctionArgs) {
  const {storefront} = context;
  const recommendedProducts = storefront.query(RECOMMENDED_PRODUCTS_QUERY);
  const newarrivalproducts = await storefront.query(NEW_ARRIVALS_QUERY);
  const bestseller = await storefront.query(FEATURED_COLLECTION_QUERY);
  const topcategories = await storefront.query(TOP_CATEGORIES_QUERY);

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
    topcategories,
    bestseller,
    recommendedProducts,
    newarrivalproducts,
    fetchedData: await fetchData(),
    collections,
  });
}

function filterCategoriesWithBestSellers(data) {
  const categoriesWithBestSellers = [];

  data.edges.forEach((collection) => {
    const products = collection.node.products.edges;
    const hasBestSeller = products.some(
      (product) => product.node.productType === 'Best Seller',
    );

    if (hasBestSeller) {
      categoriesWithBestSellers.push({
        id: collection.node.id,
        products: products.filter(
          (product) => product.node.productType === 'Best Seller',
        ),
        title: collection.node.title,
        image: collection.node.image.url,
      });
    }
  });
  return categoriesWithBestSellers;
}

export default function Homepage() {
  const data = useLoaderData<typeof loader>();
  const categoriesWithBestSellers = filterCategoriesWithBestSellers(
    data?.topcategories?.collections,
  );

  return (
    <div className="home flex pg_bt">
      <RecommendedProducts
        newarrivalproducts={data.newarrivalproducts}
        products={data.recommendedProducts}
        cmsData={data.fetchedData}
        collections={data.collections.nodes}
        categoriesWithBestSellers={categoriesWithBestSellers}
      />
    </div>
  );
}

function CollectionItem({
  collection,
  index,
  className,
}: {
  collection: CollectionFragment;
  index: number;
  className: string;
}) {
  return (
    <Link
      className={`recommended-product flex ${className}`}
      key={collection?.id}
      to={`/collections/${collection?.handle}`}
      prefetch="intent"
    >
      {collection?.image && (
        <Image
          alt={collection?.image?.altText || collection?.title}
          aspectRatio="1/1"
          data={collection?.image}
          loading={index < 3 ? 'eager' : undefined}
          className="collection_image"
        />
      )}
      <div className="collection_info">
        <p>
          <small className="collection_small_text">{collection?.title}</small>
        </p>
        <p className="collection_description">{collection?.description}</p>
        <p className="collection_product_count">{`${collection?.products?.edges?.length} Products`}</p>
      </div>
    </Link>
  );
}

function RecommendedProducts({
  products,
  cmsData,
  collections,
  newarrivalproducts,
}: {
  products: Promise<RecommendedProductsQuery>;
  cmsData: Awaited<ReturnType<typeof getEntryByUid>>;
  collections: CollectionFragment[];
  newarrivalproducts: Promise<any>;
}) {
  return (
    <div>
      <div className="home_page_banner">
        <div className="container">
          <h5 className="page_banner_heading">{cmsData?.banner_heading}</h5>
          <h1 className="page_banner_content bodyCss">
            {cmsData?.banner_title}
          </h1>
          {cmsData?.banner_description ? (
            <div
              className="banner-description"
              dangerouslySetInnerHTML={{
                __html: cmsData?.banner_description,
              }}
            />
          ) : (
            ''
          )}
          <div className="flex">
            {cmsData.button.repo.cta_title.title ? (
              <a
                href={cmsData?.button?.repo?.cta_title?.href}
                rel="noreferrer"
                target={
                  cmsData.button.repo.open_in_new_tab ? '_blank' : '_self'
                }
                className="banner_repo_cta"
              >
                {cmsData.button.repo.cta_title.title}
              </a>
            ) : (
              ''
            )}
            {cmsData.button.products.cta_title.title ? (
              <a
                href={cmsData.button.products.cta_title.href}
                rel="noreferrer"
                target={
                  cmsData.button.products.open_in_new_tab ? '_blank' : '_self'
                }
                className="banner_repo_cta"
              >
                {cmsData.button.products.cta_title.title}
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
                    d="M14.5074 6.69672L19.2803 11.4697C19.5732 11.7626 19.5732 12.2375 19.2803 12.5304L14.5074 17.3033C14.2145 17.5962 13.7396 17.5962 13.4467 17.3033C13.1538 17.0104 13.1538 16.5356 13.4467 16.2427L16.9393 12.75H5.25C4.83579 12.75 4.5 12.4142 4.5 12C4.5 11.5858 4.83579 11.25 5.25 11.25H16.9393L13.4467 7.75738C13.1538 7.46449 13.1538 6.98961 13.4467 6.69672C13.7396 6.40383 14.2145 6.40383 14.5074 6.69672Z"
                    fill="white"
                  />
                </svg>
              </a>
            ) : (
              ''
            )}
          </div>
        </div>
      </div>
      <Suspense fallback={<div>Loading...</div>}>
        <Await resolve={products}>
          {({products}) => {
            return (
              <div>
                <div className="featured_wrapper container">
                  <div className="featuredContent">
                    <h2 className="bodyCss feature_heading">
                      {cmsData.feature_title}
                    </h2>
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
                                <h4 className="product_cta">{product.title}</h4>
                                <small className="product_small_cta">
                                  {product.title}
                                </small>
                                <>
                                  <Money
                                    className="product_price"
                                    data={product.priceRange.minVariantPrice}
                                  />
                                </>
                              </Link>
                            ))}
                        </Fragment>
                      );
                    })}
                  </div>
                </div>
                <div className="new_arrival_wrap">
                  <div className="featured_wrapper container">
                    <div className="row newarrival_wrap">
                      <div className="newArrival_col_small">
                        <h2 className="bodyCss feature_heading">
                          {cmsData?.new_arrival_title}
                        </h2>
                        <Image
                          // alt={collection?.image?.altText || collection?.title}
                          aspectRatio="1/1"
                          data={
                            newarrivalproducts?.collection?.products?.nodes[0]
                              ?.images?.nodes[0]
                          }
                          // loading={index < 3 ? 'eager' : undefined}
                          className=""
                        />
                      </div>
                      <div className="newArrival_col_large">
                        <div className="row">
                          <Image
                            // alt={collection?.image?.altText || collection?.title}
                            aspectRatio="1/1"
                            data={
                              newarrivalproducts?.collection?.products?.nodes[1]
                                ?.images?.nodes[0]
                            }
                            // loading={index < 3 ? 'eager' : undefined}
                            className=" first_img"
                          />
                          <Image
                            // alt={collection?.image?.altText || collection?.title}
                            aspectRatio="1/1"
                            data={
                              newarrivalproducts?.collection?.products?.nodes[2]
                                ?.images?.nodes[0]
                            }
                            // loading={index < 3 ? 'eager' : undefined}
                            className=""
                          />
                        </div>
                        <h2
                          className="new_arrival_heading"
                          dangerouslySetInnerHTML={{
                            __html: cmsData?.new_arrival_description,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="collection_wrapper featured_wrapper">
                  <div className="container">
                    <div className="row explore_Sec_row">
                      <div className="col-left explore_section_left">
                        <CollectionItem
                          collection={collections[0]}
                          index={0}
                          className="mg_b32 small_img"
                        />
                        <CollectionItem
                          collection={collections[1]}
                          index={0}
                          className="small_img"
                        />
                      </div>
                      <div className="col-right">
                        <h2 className="bodyCss collection_heading">
                          {cmsData.collection_heading}
                        </h2>
                        <CollectionItem
                          collection={collections[2]}
                          index={0}
                          className="collection_img_large"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          }}
        </Await>
      </Suspense>
      <br />
      <div className="container">
        <div className="row offers_row">
          <div className="offers_col_img">
            <img
              src={OffersImage}
              alt={cmsData?.offer_section?.image?.filename}
              className="offers_image"
            ></img>
          </div>
          <div className="offers_col_dark">
            <p className="offers_title">
              {cmsData?.offer_section?.offer_title}
            </p>
            <h2 className="offers_subTitle">
              {cmsData?.offer_section?.offer_subtitle}
            </h2>
            <Link
              to={cmsData?.offer_section?.cta?.cta_title?.href}
              rel="noreferrer"
              className="offers_cta"
            >
              {cmsData?.offer_section?.cta?.cta_title?.title}
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
                  d="M14.5074 6.69672L19.2803 11.4697C19.5732 11.7626 19.5732 12.2375 19.2803 12.5304L14.5074 17.3033C14.2145 17.5962 13.7396 17.5962 13.4467 17.3033C13.1538 17.0104 13.1538 16.5356 13.4467 16.2427L16.9393 12.75H5.25C4.83579 12.75 4.5 12.4142 4.5 12C4.5 11.5858 4.83579 11.25 5.25 11.25H16.9393L13.4467 7.75738C13.1538 7.46449 13.1538 6.98961 13.4467 6.69672C13.7396 6.40383 14.2145 6.40383 14.5074 6.69672Z"
                  fill="white"
                />
              </svg>
            </Link>
          </div>
        </div>
      </div>
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
      first: 4,
      last: $last,
      before: $startCursor,
      after: $endCursor,
      sortKey: UPDATED_AT,
      reverse: true
    ) {
      nodes {
        ...Collection,
        products(first: 250) {
          edges {
            node {
              id
            }
          }
        }
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

const NEW_ARRIVALS_QUERY = `#graphql
query FeaturedCollection($country: CountryCode, $language: LanguageCode)
@inContext(country: $country, language: $language) {
  collection(handle: "new-arrivals") {
    handle
    products(first: 3) {
      nodes{
        id
        title
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
    }
  }
}` as const;

const BEST_SELLERS_QUERY = `#graphql
fragment BestSeller on collection {
  id
  title
  handle
  productType
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
      productType
    }
  }
}query BestSellers ($country: CountryCode, $language: LanguageCode)
@inContext(country: $country, language: $language) {
  collection(handle: "filterable-collection") {
    handle
    products(first: 10, filters: { productType: "shoes"}) {
      edges {
        node {
          handle
          productType
        }
      }
    }
  }
}` as const;

const TOP_CATEGORIES_QUERY = `#graphql
  query FeaturedCollection($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
      collections(first:5) {
        edges {
          node {
            title
            id
            image {
              id
              url
              altText
              width
              height
            }
            products(first: 250) {
              edges {
                node {
                  id
                  title
                  productType
                  
                }
              }
            }
          }
        }
      }
  }
` as const;
