/* eslint-disable react/no-array-index-key */
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
import {getEntry} from '~/components/contentstack-sdk';
import OffersImage from './../../public/offers.svg';

export const meta: MetaFunction = () => {
  return [{title: 'Hydrogen | Home'}];
};

export async function loader({context, request}: LoaderFunctionArgs) {
  const {storefront} = context;
  const recommendedProducts = storefront?.query(RECOMMENDED_PRODUCTS_QUERY);
  const newarrivalproducts = await storefront?.query(NEW_ARRIVALS_QUERY);
  const bestseller = await storefront?.query(BEST_SELLER_QUERY);
  const topcategories = await storefront?.query(TOP_CATEGORIES_QUERY);

  const envConfig = context?.env;
  const fetchData = async () => {
    try {
      const result = await getEntry({
        contentTypeUid: 'shopify_home',
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

export default function Homepage() {
  const data = useLoaderData<typeof loader>();
  return (
    <div className="home flex">
      <RecommendedProducts
        newarrivalproducts={data?.newarrivalproducts}
        products={data?.recommendedProducts}
        cmsData={data?.fetchedData}
        collections={data?.collections.nodes}
        topCategory={data?.topcategories}
        bestSeller={data?.bestseller}
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
          className="collection-image"
        />
      )}
      <div className="collection-info">
        <p>
          <small className="collection-small-text">{collection?.title}</small>
        </p>
        <p className="collection-description">{collection?.description}</p>
        <p className="collection-product-count">{`${collection?.products?.edges?.length} Products`}</p>
      </div>
    </Link>
  );
}

function BestSellerCta({node, cmsData}: {node: any; cmsData: any}) {
  return (
    <div className="best-sell-cta">
      <p className="best-sell-cta-heading">{node?.title}</p>
      <Link
        to={`/products/${node.handle}`}
        key={node?.id}
        prefetch="intent"
        className="best-sell-cta1 view-all-products"
      >
        {cmsData?.best_seller?.shop_cta?.cta_title?.title}
      </Link>
    </div>
  );
}

function RecommendedProducts({
  products,
  cmsData,
  collections,
  newarrivalproducts,
  topCategory,
  bestSeller,
}: {
  readonly products: Promise<RecommendedProductsQuery>;
  readonly cmsData: Awaited<ReturnType<typeof getEntry>>;
  readonly collections: readonly CollectionFragment[];
  readonly newarrivalproducts: any;
  readonly bestSeller: any;
  readonly topCategory: any;
}) {
  return (
    <div>
      <div className="home-page-banner">
        <div className="container">
          <h5 className="page-banner-heading">
            {cmsData?.banner?.banner_heading}
          </h5>
          <h1 className="page-banner-content bodyCss">
            {cmsData?.banner?.banner_title}
          </h1>
          {cmsData?.banner?.banner_description ? (
            <div
              className="banner-description"
              dangerouslySetInnerHTML={{
                __html: cmsData?.banner?.banner_description,
              }}
            />
          ) : (
            ''
          )}
          <div className="flex">
            {cmsData?.banner?.button?.repo.map((button: any, index: any) => {
              return button?.cta_title?.title ? (
                <a
                  key={index}
                  href={button?.cta_title?.href}
                  rel="noreferrer"
                  target={button?.open_in_new_tab ? '_blank' : '_self'}
                  className="banner-repo-cta"
                  style={{
                    margin: '10px',
                  }}
                >
                  {button?.cta_title?.title}
                </a>
              ) : (
                ''
              );
            })}
          </div>
        </div>
      </div>
      <Suspense fallback={<div>Loading...</div>}>
        <Await resolve={products}>
          {({products}) => {
            return (
              <div>
                {/* Feature Product section */}
                <div className="featured-wrapper container">
                  <div className="featured-content">
                    <h2 className="bodyCss feature-heading">
                      {cmsData?.feature_title}
                    </h2>
                    <div className="center">
                      <Link
                        to={cmsData?.view_all_product?.cta_title?.href}
                        rel="noreferrer"
                        target={
                          cmsData?.view_all_product?.open_in_new_tab
                            ? '_blank'
                            : '_self'
                        }
                        className="view-all-products"
                      >
                        {cmsData?.view_all_product?.cta_title?.title}
                      </Link>
                    </div>
                  </div>
                  {/* Feature Product section */}
                  <div className="recommended-products-grid">
                    {products?.nodes.map((product) => {
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
                          {!product?.images?.nodes[0] ||
                            (product?.images?.nodes[0] != null && (
                              <Link
                                className="recommended-product"
                                to={`/products/${product?.handle}`}
                              >
                                {product?.images?.nodes[0] && (
                                  <Image
                                    data={product?.images?.nodes[0]}
                                    aspectRatio="1/1.2"
                                    sizes="(min-width: 45em) 20vw, 50vw"
                                  />
                                )}
                                <h4 className="product-cta">
                                  {product?.title}
                                </h4>
                                <div className="product-price-on-sale">
                                  {product?.priceRange ? (
                                    <Money
                                      className="price"
                                      data={
                                        product?.priceRange?.minVariantPrice
                                      }
                                    />
                                  ) : null}
                                  <s>
                                    <Money
                                      className="comparePrice"
                                      data={
                                        product?.compareAtPriceRange
                                          ?.minVariantPrice
                                      }
                                    />
                                  </s>
                                  {priceOff ? (
                                    <p className="comparePrice">
                                      (${priceOff.toFixed(2)} OFF)
                                    </p>
                                  ) : (
                                    ''
                                  )}
                                </div>
                              </Link>
                            ))}
                        </Fragment>
                      );
                    })}
                  </div>
                </div>
                {/* New Arrival section */}
                <div className="new-arrival-wrap">
                  <div className="featured-wrapper container">
                    <div className="row explore-sec-row">
                      <div className="newArrival-col-small">
                        <h2 className="bodyCss feature-heading uppercase">
                          {cmsData?.new_arrival_title}
                        </h2>
                        <div className="best-sell-img">
                          <Image
                            // alt={collection?.image?.altText || collection?.title}
                            aspectRatio="1/1"
                            data={
                              newarrivalproducts?.collection?.products?.nodes[2]
                                ?.images?.nodes[0]
                            }
                          />
                          <Link
                            to={`/products/${newarrivalproducts?.collection?.products?.nodes[2].handle}`}
                            key={
                              newarrivalproducts?.collection?.products?.nodes[2]
                                ?.id
                            }
                            prefetch="intent"
                            className="new-arrival-cta view-all-products"
                          >
                            {cmsData?.best_seller?.shop_cta?.cta_title?.title}
                          </Link>
                        </div>
                      </div>
                      <div className="newArrival-col-large">
                        <div className="row">
                          <div className="best-sell-img">
                            <Image
                              aspectRatio="1/1"
                              data={
                                newarrivalproducts?.collection?.products
                                  ?.nodes[1]?.images?.nodes[0]
                              }
                              className=" first_img"
                            />
                            <Link
                              to={`/products/${newarrivalproducts?.collection?.products?.nodes[1].handle}`}
                              key={
                                newarrivalproducts?.collection?.products
                                  ?.nodes[1]?.id
                              }
                              prefetch="intent"
                              className="new-arrival-cta view-all-products"
                            >
                              {cmsData?.best_seller?.shop_cta?.cta_title?.title}
                            </Link>
                          </div>
                          <div className="best-sell-img">
                            <Image
                              // alt={collection?.image?.altText || collection?.title}
                              aspectRatio="1/1"
                              data={
                                newarrivalproducts?.collection?.products
                                  ?.nodes[0]?.images?.nodes[0]
                              }
                              className=""
                            />
                            <Link
                              to={`/products/${newarrivalproducts?.collection?.products?.nodes[0].handle}`}
                              key={
                                newarrivalproducts?.collection?.products
                                  ?.nodes[0]?.id
                              }
                              prefetch="intent"
                              className="new-arrival-cta view-all-products"
                            >
                              {cmsData?.best_seller?.shop_cta?.cta_title?.title}
                            </Link>
                          </div>
                        </div>
                        <h2
                          className="new-arrival-heading"
                          dangerouslySetInnerHTML={{
                            __html: cmsData?.new_arrival_description,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                {/* top category section */}
                <div className="featured-wrapper container">
                  <h2 className="bodyCss feature-heading">
                    {cmsData?.top_category_title}
                  </h2>
                  <div className="row ">
                    <div className="col-left-top-cat">
                      {/* women fashion */}
                      <Link
                        className={` flex best-sell-img `}
                        key={topCategory?.collections?.edges[7].node?.id}
                        to={`/collections/${topCategory?.collections?.edges[7].node?.handle}`}
                        prefetch="intent"
                      >
                        <Image
                          // alt={collection?.image?.altText || collection?.title}
                          aspectRatio="1/1"
                          data={topCategory?.collections?.edges[7].node?.image}
                          className="top-cat-img flex "
                        />
                        <div className="pt-abs">
                          <h3>
                            {topCategory?.collections?.edges[7].node?.title}
                          </h3>
                        </div>
                      </Link>
                      {/* men fashion */}
                      <Link
                        className={`flex  best-sell-img`}
                        key={topCategory?.collections?.edges[2].node?.id}
                        to={`/collections/${topCategory?.collections?.edges[2].node?.handle}`}
                        prefetch="intent"
                      >
                        <Image
                          // alt={collection?.image?.altText || collection?.title}
                          aspectRatio="2/1"
                          data={topCategory?.collections?.edges[2].node?.image}
                          className=" top-cat-img flex"
                        />
                        <div className="pt-abs">
                          <h3>
                            {topCategory?.collections?.edges[2].node?.title}
                          </h3>
                        </div>
                      </Link>
                    </div>
                    <div className="col-left-top-cat">
                      <div className="row top-cat-row1-sec">
                        {/* sun glasses */}
                        <Link
                          className={` flex col-left-top-cat best-sell-img`}
                          key={topCategory?.collections?.edges[6].node?.id}
                          to={`/collections/${topCategory?.collections?.edges[6].node?.handle}`}
                          prefetch="intent"
                        >
                          <Image
                            // alt={collection?.image?.altText || collection?.title}
                            aspectRatio="1/1"
                            data={
                              topCategory?.collections?.edges[6].node?.image
                            }
                            className="mg-lt top-cat-img flex"
                          />
                          <div className="pt-abs top-row">
                            <h3>
                              {topCategory?.collections?.edges[6].node?.title}
                            </h3>
                          </div>
                        </Link>
                        {/* hats */}
                        <Link
                          className={` flex col-left-top-cat best-sell-img`}
                          key={topCategory?.collections?.edges[5].node?.id}
                          to={`/collections/${topCategory?.collections?.edges[6].node?.handle}`}
                          prefetch="intent"
                        >
                          <Image
                            // alt={collection?.image?.altText || collection?.title}
                            aspectRatio="1/1"
                            data={
                              topCategory?.collections?.edges[5].node?.image
                            }
                            className="mg-lt top-cat-img flex"
                          />
                          <div className="pt-abs top-row">
                            <h3>
                              {topCategory?.collections?.edges[5].node?.title}
                            </h3>
                          </div>
                        </Link>
                        {/* </div> */}
                      </div>
                      <div className="row top-cat-row2-sec best-sell-img ">
                        {/* handbags */}
                        <Link
                          className={`flex col-left-top-cat`}
                          key={topCategory?.collections?.edges[4].node?.id}
                          to={`/collections/${topCategory?.collections?.edges[4].node?.handle}`}
                          prefetch="intent"
                        >
                          <Image
                            // alt={collection?.image?.altText || collection?.title}
                            aspectRatio="1/1"
                            data={
                              topCategory?.collections?.edges[4].node?.image
                            }
                            // loading={index < 3 ? 'eager' : undefined}
                            className=" mg-lt  top-cat-img flex"
                          />
                          <div className="pt-abs bottom-row ">
                            <h3>
                              {topCategory?.collections?.edges[4].node?.title}
                            </h3>
                          </div>
                        </Link>
                        {/* bagpacks */}
                        <Link
                          className={` flex col-left-top-cat  best-sell-img`}
                          key={topCategory?.collections?.edges[3].node?.id}
                          to={`/collections/${topCategory?.collections?.edges[3].node?.handle}`}
                          prefetch="intent"
                        >
                          <Image
                            // alt={collection?.image?.altText || collection?.title}
                            aspectRatio="1/1"
                            data={
                              topCategory?.collections?.edges[3].node?.image
                            }
                            className=" mg-lt  top-cat-img flex"
                          />
                          <div className="pt-abs top-row">
                            <h3>
                              {topCategory?.collections?.edges[3].node?.title}
                            </h3>
                          </div>
                        </Link>
                        {/* </div> */}
                      </div>
                      {/* footwear */}
                      <Link
                        className={` flex   best-sell-img mg-footwear`}
                        key={topCategory?.collections?.edges[1].node?.id}
                        to={`/collections/${topCategory?.collections?.edges[1].node?.handle}`}
                        prefetch="intent"
                      >
                        <Image
                          // alt={collection?.image?.altText || collection?.title}
                          aspectRatio="2/1"
                          data={topCategory?.collections?.edges[1].node?.image}
                          className="mg-lt top-cat-img flex"
                        />
                        <div className="pt-abs footwear-row">
                          <h3>
                            {topCategory?.collections?.edges[1].node?.title}
                          </h3>
                        </div>
                      </Link>
                    </div>
                  </div>
                </div>
                {/* New Collection section  */}
                <div className="collection-wrapper featured-wrapper">
                  <div className="container">
                    <div className="row explore-sec-row">
                      <div className="col-left explore_section_left">
                        <CollectionItem
                          collection={collections[0]}
                          index={0}
                          className="mg-b32 small-img"
                        />
                        <CollectionItem
                          collection={collections[1]}
                          index={0}
                          className="small-img"
                        />
                      </div>
                      <div className="col-right">
                        <h2 className="bodyCss collection-heading">
                          {cmsData?.collection_heading}
                        </h2>
                        <CollectionItem
                          collection={collections[2]}
                          index={0}
                          className="collection-img-large"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                {/* Offer setion */}
                <div className="container">
                  <div className="row offers-row">
                    <div className="offers-col-img">
                      <img
                        src={OffersImage}
                        alt={cmsData?.offer_section?.image?.filename}
                        className="offers-image"
                      ></img>
                    </div>
                    <div className="offers-col-dark">
                      <p className="offers-title">
                        {cmsData?.offer_section?.offer_title}
                      </p>
                      <h2 className="offers-sub-title">
                        {cmsData?.offer_section?.offer_subtitle}
                      </h2>
                      <Link
                        to={cmsData?.offer_section?.cta?.cta_title?.href}
                        rel="noreferrer"
                        className="offers-cta"
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
                {/* Best seller section */}
                <div className="featured-wrapper container">
                  <div className="featured-content">
                    <div>
                      <h2 className="bodyCss feature-heading">
                        {cmsData?.best_seller?.title}
                      </h2>
                      <p>{cmsData?.best_seller?.description}</p>
                    </div>

                    <div className="center">
                      <Link
                        to={cmsData?.best_seller?.view_product?.cta_title?.href}
                        rel="noreferrer"
                        target={
                          cmsData?.best_seller?.view_product?.open_in_new_tab
                            ? '_blank'
                            : '_self'
                        }
                        className="view-all-products"
                      >
                        {cmsData?.best_seller?.view_product?.cta_title?.title}
                      </Link>
                    </div>
                  </div>

                  <div className="row  pg-t">
                    <div className="col-left-best-seller">
                      <div className="best-sell-img">
                        <Image
                          // alt={collection?.image?.altText || collection?.title}
                          aspectRatio="2/1"
                          data={
                            bestSeller?.collection?.products?.nodes[0]?.images
                              ?.nodes[0]
                          }
                          className="top-cat-img flex "
                        />
                        <BestSellerCta
                          node={bestSeller?.collection?.products?.nodes[0]}
                          cmsData={cmsData}
                        />
                      </div>
                      <div className="best-sell-img">
                        <Image
                          // alt={collection?.image?.altText || collection?.title}
                          aspectRatio="1/0.734"
                          data={
                            bestSeller?.collection?.products?.nodes[1]?.images
                              ?.nodes[0]
                          }
                          // loading={index < 3 ? 'eager' : undefined}
                          className="peral-foot flex "
                        />
                        <BestSellerCta
                          node={bestSeller?.collection?.products?.nodes[1]}
                          cmsData={cmsData}
                        />
                      </div>
                    </div>
                    <div className="col-right-best-seller">
                      <div className="best-sell-img">
                        <Image
                          // alt={collection?.image?.altText || collection?.title}
                          aspectRatio="1/1"
                          data={
                            bestSeller?.collection?.products?.nodes[2]?.images
                              ?.nodes[0]
                          }
                          className="mg-lt top-cat-img flex "
                        />
                        <BestSellerCta
                          node={bestSeller?.collection?.products?.nodes[2]}
                          cmsData={cmsData}
                        />
                      </div>
                      <div className="best-sell-img">
                        <Image
                          // alt={collection?.image?.altText || collection?.title}
                          aspectRatio="1/1"
                          data={
                            bestSeller?.collection?.products?.nodes[3]?.images
                              ?.nodes[0]
                          }
                          className="mg-lt top-cat-img flex "
                        />
                        <BestSellerCta
                          node={bestSeller?.collection?.products?.nodes[3]}
                          cmsData={cmsData}
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
    </div>
  );
}

const RECOMMENDED_PRODUCTS_QUERY = `#graphql
  fragment RecommendedProduct on Product {
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
  query RecommendedProducts ($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    products(first: 3, sortKey: CREATED_AT, reverse: true) {
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
        handle
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

const TOP_CATEGORIES_QUERY = `#graphql
  query FeaturedCollection($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
      collections(first:8, reverse:true) {
        edges {
          node {
            title
            handle
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

const BEST_SELLER_QUERY = `#graphql
query FeaturedCollection($country: CountryCode, $language: LanguageCode)
@inContext(country: $country, language: $language) {
  collection(handle: "womens-fashion") {
    handle
    products(first: 4) {
      nodes{
        id
        title
        handle
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
