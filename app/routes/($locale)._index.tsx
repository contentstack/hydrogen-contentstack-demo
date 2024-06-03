/* eslint-disable react/no-array-index-key */
import {defer, type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import parse from 'html-react-parser';
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

export const meta: MetaFunction = () => {
  return [{title: 'Hydrogen | Home'}];
};

export async function loader({context, request}: LoaderFunctionArgs) {
  const {storefront} = context;
  const recommendedProducts = storefront?.query(RECOMMENDED_PRODUCTS_QUERY);
  const newarrivalproducts = await storefront?.query(NEW_ARRIVALS_QUERY);
  const bestseller = await storefront?.query(BEST_SELLER_QUERY);
  const topcategories = await storefront?.query(TOP_CATEGORIES_QUERY);
  const metaObject = await storefront?.query(META_OBJECT_QUERY);

  const envConfig = context?.env;
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
    metaObject,
    collections,
  });
}
interface LoaderData {
  products: any;
  topcategories: any;
  bestseller: any;
  recommendedProducts: Promise<any>;
  newarrivalproducts: any;
  metaObject: any;
  collections: {
    nodes: any[];
  };
}

export default function Homepage() {
  const data = useLoaderData<LoaderData>();
  return (
    <div className="home flex">
      <RecommendedProducts
        newarrivalproducts={data?.newarrivalproducts}
        products={data?.recommendedProducts}
        collections={data?.collections.nodes}
        topCategory={data?.topcategories}
        bestSeller={data?.bestseller}
        metaObject={data?.metaObject}
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
          className="collection-image filter-grayscale"
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

function BestSellerCta({node, title}: {node: any; title: any}) {
  return (
    <div className="best-sell-cta">
      <p className="best-sell-cta-heading">{node?.title}</p>
      <Link
        to={`/products/${node?.handle}`}
        key={node?.id}
        prefetch="intent"
        className="best-sell-cta1 view-all-products"
      >
        {title}
      </Link>
    </div>
  );
}

function RecommendedProducts({
  products,
  collections,
  newarrivalproducts,
  topCategory,
  bestSeller,
  metaObject,
}: {
  readonly products: any;
  readonly collections: readonly CollectionFragment[];
  readonly newarrivalproducts: any;
  readonly bestSeller: any;
  readonly topCategory: any;
  readonly metaObject: any;
}) {
  let href: any;
  const fields = metaObject?.metaobjects?.nodes?.[0]?.fields;
  let ctaTitle: any;

  fields.forEach((field: any) => {
    if (field.key === 'shop_now_title') {
      ctaTitle = field.value;
    }
  });
  return (
    <div>
      <div className="home-page-banner">
        <div className="container">
          {Array.isArray(fields) &&
            fields.map((field: any) => {
              return (
                <>
                  {field?.key === 'banner_section' &&
                    field?.reference.fields.map((bannerField: any) => {
                      return (
                        <>
                          {bannerField?.key === 'heading' && (
                            <h5 className="page-banner-heading">
                              {bannerField?.value}
                            </h5>
                          )}
                          {bannerField?.key === 'title' && (
                            <h1 className="page-banner-content bodyCss">
                              {bannerField?.value}
                            </h1>
                          )}
                        </>
                      );
                    })}
                  {field?.key === 'banner_section' &&
                    field?.reference.fields.map((bannerField: any) => {
                      return (
                        <>
                          {bannerField?.key === 'description' && (
                            <div className="banner-description">
                              {parse(bannerField?.value || '')}
                            </div>
                          )}
                        </>
                      );
                    })}
                </>
              );
            })}
          <div className="flex banner-button">
            {Array.isArray(fields) &&
              fields.map((field: any) => {
                if (field?.key === 'banner_section') {
                  return (
                    <>
                      {field?.reference.fields.map((bannerField: any) => {
                        return (
                          bannerField?.key === 'banner_cta' &&
                          bannerField?.references?.nodes.map(
                            (bannerData: any, index: any) => {
                              // Initialize variables to store the URL and title
                              let url = '';
                              let title = '';
                              let openInNewTab = false;

                              // Iterate over the fields of the bannerData
                              bannerData.fields.forEach((bannerCta: any) => {
                                if (bannerCta.key === 'url') {
                                  url = bannerCta.value;
                                }
                                if (bannerCta.key === 'title') {
                                  title = bannerCta.value;
                                }
                                if (bannerCta.key === 'open_in_new_tab') {
                                  openInNewTab = bannerCta.value === 'true';
                                }
                              });

                              // Only render the link if both url and title are available
                              if (url && title) {
                                return (
                                  <a
                                    key={index}
                                    href={url}
                                    rel="noreferrer"
                                    target={openInNewTab ? '_blank' : '_self'}
                                    className="banner-repo-cta"
                                    style={{margin: '10px'}}
                                  >
                                    {title}
                                  </a>
                                );
                              } else {
                                return null; // Return null if url or title is not available
                              }
                            },
                          )
                        );
                      })}
                    </>
                  );
                }
                return null; // Or return an empty element if needed
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
                    {Array.isArray(fields) &&
                      fields.map((field: any) => {
                        return (
                          <>
                            {field?.key === 'feature_title' && (
                              <h2 className="bodyCss feature-heading">
                                {field.value}
                              </h2>
                            )}
                          </>
                        );
                      })}
                    <div className="center">
                      {Array.isArray(fields) &&
                        fields.map((field: any) => {
                          return (
                            <>
                              {field?.key === 'view_all_product' &&
                                field?.reference.fields.map(
                                  (bannerField: any, index: number) => {
                                    if (bannerField.key === 'url') {
                                      href = bannerField.value?.trim();
                                    }

                                    if (bannerField?.key === 'title' && href) {
                                      return (
                                        <Link
                                          key={index}
                                          to={href}
                                          rel="noreferrer"
                                          target={
                                            bannerField?.key ===
                                              'open_in_new_tab' &&
                                            bannerField?.value === true
                                              ? '_blank'
                                              : '_self'
                                          }
                                          className="view-all-products"
                                        >
                                          {bannerField?.key === 'title' &&
                                            bannerField?.value}
                                        </Link>
                                      );
                                    }
                                  },
                                )}
                            </>
                          );
                        })}
                    </div>
                  </div>
                  {/* Feature Product section */}
                  <div className="recommended-products-grid">
                    {products?.nodes.map((product: any) => {
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
                                  {product?.priceRange?.minVariantPrice
                                    ?.amount <
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

                                  {priceOff && priceOff > 0 ? (
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
                        {Array.isArray(fields) &&
                          fields.map((field: any) => {
                            return (
                              <>
                                {field?.key === 'new_arrival_title' && (
                                  <h2 className="bodyCss feature-heading uppercase">
                                    {field?.value}
                                  </h2>
                                )}
                              </>
                            );
                          })}

                        <div className="pt-rl">
                          <Image
                            aspectRatio="1/1"
                            data={
                              newarrivalproducts?.collection?.products?.nodes[2]
                                ?.images?.nodes[0]
                            }
                          />
                          <Link
                            to={`/products/${newarrivalproducts?.collection?.products?.nodes?.[2]?.handle}`}
                            key={
                              newarrivalproducts?.collection?.products?.nodes[2]
                                ?.id
                            }
                            prefetch="intent"
                            className="new-arrival-cta view-all-products"
                          >
                            {ctaTitle}
                          </Link>
                        </div>
                      </div>
                      <div className="newArrival-col-large">
                        <div className="row">
                          <div className="pt-rl">
                            <Image
                              aspectRatio="1/1"
                              data={
                                newarrivalproducts?.collection?.products
                                  ?.nodes[1]?.images?.nodes[0]
                              }
                              className=" first_img safari-only"
                            />
                            <Link
                              to={`/products/${newarrivalproducts?.collection?.products?.nodes?.[1]?.handle}`}
                              key={
                                newarrivalproducts?.collection?.products
                                  ?.nodes[1]?.id
                              }
                              prefetch="intent"
                              className="new-arrival-cta view-all-products"
                            >
                              {ctaTitle}
                            </Link>
                          </div>
                          <div className="pt-rl">
                            <Image
                              aspectRatio="1/1"
                              data={
                                newarrivalproducts?.collection?.products
                                  ?.nodes[0]?.images?.nodes[0]
                              }
                              className="safari-only"
                            />
                            <Link
                              to={`/products/${newarrivalproducts?.collection?.products?.nodes?.[0]?.handle}`}
                              key={
                                newarrivalproducts?.collection?.products
                                  ?.nodes[0]?.id
                              }
                              prefetch="intent"
                              className="new-arrival-cta view-all-products"
                            >
                              {ctaTitle}
                            </Link>
                          </div>
                        </div>
                        {Array.isArray(fields) &&
                          fields.map((field: any) => {
                            return (
                              <>
                                {field?.key === 'new_arrival_description' && (
                                  <h2 className="new-arrival-heading">
                                    {parse(field.value || '')}
                                  </h2>
                                )}
                              </>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                </div>
                {/* top category section */}
                <div className="featured-wrapper container">
                  {Array.isArray(fields) &&
                    fields.map((field: any) => {
                      return (
                        <>
                          {field?.key === 'top_category_title' && (
                            <h2 className="bodyCss feature-heading">
                              {field?.value}
                            </h2>
                          )}
                        </>
                      );
                    })}

                  <div className="row ">
                    <div className="col-left-top-cat col-left-top-cat-mobile">
                      {/* women fashion */}
                      <Link
                        className={` flex pt-rl mg-b32`}
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
                        className={`flex   pt-rl mg-b32`}
                        key={topCategory?.collections?.edges[2].node?.id}
                        to={`/collections/${topCategory?.collections?.edges[2].node?.handle}`}
                        prefetch="intent"
                      >
                        <Image
                          // alt={collection?.image?.altText || collection?.title}
                          aspectRatio="2/1"
                          data={topCategory?.collections?.edges[2].node?.image}
                          className=" top-cat-img flex mg-bottom-row "
                        />
                        <div className="pt-abs">
                          <h3>
                            {topCategory?.collections?.edges[2].node?.title}
                          </h3>
                        </div>
                      </Link>
                    </div>
                    <div className="col-left-top-cat col-left-top-cat-mobile">
                      <div className="row mg-b32">
                        {/* sun glasses */}
                        <Link
                          className={` flex col-left-top-cat  pt-rl`}
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
                            className="mg-lt-17  top-cat-img flex"
                          />
                          <div className="pt-abs top-row">
                            <h3>
                              {topCategory?.collections?.edges[6].node?.title}
                            </h3>
                          </div>
                        </Link>
                        {/* hats */}
                        <Link
                          className={` flex col-left-top-cat pt-rl`}
                          key={topCategory?.collections?.edges[5].node?.id}
                          to={`/collections/${topCategory?.collections?.edges[5].node?.handle}`}
                          prefetch="intent"
                        >
                          <Image
                            // alt={collection?.image?.altText || collection?.title}
                            aspectRatio="1/1"
                            data={
                              topCategory?.collections?.edges[5].node?.image
                            }
                            className="mg-lt-17 top-cat-img flex"
                          />
                          <div className="pt-abs top-row">
                            <h3>
                              {topCategory?.collections?.edges[5].node?.title}
                            </h3>
                          </div>
                        </Link>
                        {/* </div> */}
                      </div>
                      <div className="row mg-b32">
                        {/* handbags */}
                        <Link
                          className={`flex col-left-top-cat  pt-rl`}
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
                            className=" mg-lt-17   top-cat-img flex"
                          />
                          <div className="pt-abs top-row">
                            <h3>
                              {topCategory?.collections?.edges[4].node?.title}
                            </h3>
                          </div>
                        </Link>
                        {/* bagpacks */}
                        <Link
                          className={`flex col-left-top-cat  pt-rl`}
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
                            className="mg-lt-17 top-cat-img flex"
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
                        className={`mg-lt-17 flex pt-rl `}
                        key={topCategory?.collections?.edges[1].node?.id}
                        to={`/collections/${topCategory?.collections?.edges[1].node?.handle}`}
                        prefetch="intent"
                      >
                        <Image
                          // alt={collection?.image?.altText || collection?.title}
                          aspectRatio="2/1"
                          data={topCategory?.collections?.edges[1].node?.image}
                          className="top-cat-img flex mg-bottom-row "
                        />
                        <div className="pt-abs">
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
                        {Array.isArray(fields) &&
                          fields.map((field: any) => {
                            return (
                              <>
                                {field?.key === 'collection_heading' && (
                                  <h2 className="collection-heading-mobile">
                                    {field?.value}
                                  </h2>
                                )}
                              </>
                            );
                          })}
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
                        {Array.isArray(fields) &&
                          fields.map((field: any) => {
                            return (
                              <>
                                {field?.key === 'collection_heading' && (
                                  <h2 className="bodyCss collection-heading">
                                    {field?.value}
                                  </h2>
                                )}
                              </>
                            );
                          })}
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
                    {Array.isArray(fields) &&
                      fields.map((field: any) => {
                        return (
                          <>
                            <div className="offers-col-img">
                              {field?.key === 'offer_section' &&
                                field?.reference.fields.map(
                                  (offerField: any) => {
                                    return (
                                      <>
                                        {offerField?.key === 'image' && (
                                          <img
                                            src={
                                              offerField.reference.image?.url
                                            }
                                            alt={field?.key || 'Limited offer'}
                                            className="offers-image"
                                          ></img>
                                        )}
                                      </>
                                    );
                                  },
                                )}
                            </div>

                            <div className="offers-col-dark">
                              {field?.key === 'offer_section' &&
                                field?.reference.fields.map(
                                  (bannerField: any) => {
                                    return (
                                      <>
                                        {bannerField?.key === 'offer_title' && (
                                          <p className="offers-title">
                                            {bannerField?.value}
                                          </p>
                                        )}
                                      </>
                                    );
                                  },
                                )}
                              {field?.key === 'offer_section' &&
                                field?.reference.fields.map(
                                  (bannerField: any) => {
                                    return (
                                      <>
                                        {bannerField?.key ===
                                          'offer_subtitle' && (
                                          <h2 className="offers-sub-title">
                                            {bannerField?.value}
                                          </h2>
                                        )}
                                      </>
                                    );
                                  },
                                )}
                              {field?.key === 'offer_section' &&
                                field?.reference?.fields.map(
                                  (bannerField: any) => {
                                    if (bannerField?.key === 'cta') {
                                      const ctaFields =
                                        bannerField?.reference?.fields;
                                      let url: any;
                                      let title: any;

                                      ctaFields.forEach((cta: any) => {
                                        switch (cta.key) {
                                          case 'url':
                                            url = cta.value;
                                            break;
                                          case 'title':
                                            title = cta.value;
                                            break;
                                          default:
                                            break;
                                        }
                                      });

                                      if (url && title) {
                                        return (
                                          <Link
                                            key={url}
                                            to={url}
                                            rel="noreferrer"
                                            className="offers-cta"
                                          >
                                            {title}
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
                                        );
                                      }
                                    }
                                    return null;
                                  },
                                )}
                            </div>
                          </>
                        );
                      })}
                  </div>
                </div>
                {/* Best seller section */}
                <div className="featured-wrapper container">
                  <div className="featured-content">
                    <div>
                      {Array.isArray(fields) &&
                        fields.map((field: any) => {
                          return (
                            <>
                              {field?.key === 'best_seller_section' &&
                                field?.reference?.fields.map(
                                  (bestSeller: any) => {
                                    if (bestSeller?.key === 'title') {
                                      return (
                                        <h2
                                          key={bestSeller.key}
                                          className="bodyCss feature-heading bs-mg-bt"
                                        >
                                          {bestSeller?.value}
                                        </h2>
                                      );
                                    }
                                    return null;
                                  },
                                )}
                              {field?.key === 'best_seller_section' &&
                                field?.reference?.fields.map(
                                  (bestSeller: any) => {
                                    if (bestSeller?.key === 'description') {
                                      return (
                                        <p
                                          key={bestSeller.key}
                                          className="bodyCss feature-description"
                                        >
                                          {bestSeller?.value}
                                        </p>
                                      );
                                    }
                                    return null;
                                  },
                                )}
                            </>
                          );
                        })}
                    </div>
                    <div className="center">
                      {Array.isArray(fields) &&
                        fields.map((field: any) => {
                          if (field?.key === 'best_seller_section') {
                            return field?.reference.fields.map(
                              (bannerField: any, index: number) => {
                                if (bannerField?.key === 'view_product') {
                                  let url = '';
                                  let title = '';
                                  let openInNewTab = false;

                                  bannerField?.reference.fields.forEach(
                                    (bestCTA: any) => {
                                      if (bestCTA.key === 'url') {
                                        url = bestCTA.value?.trim();
                                      }
                                      if (bestCTA.key === 'title') {
                                        title = bestCTA.value;
                                      }
                                      if (bestCTA.key === 'open_in_new_tab') {
                                        openInNewTab = bestCTA.value === true;
                                      }
                                    },
                                  );

                                  if (url && title) {
                                    return (
                                      <Link
                                        key={index}
                                        to={url}
                                        rel="noreferrer"
                                        target={
                                          openInNewTab ? '_blank' : '_self'
                                        }
                                        className="view-all-products"
                                      >
                                        {title}
                                      </Link>
                                    );
                                  }
                                }
                                return null;
                              },
                            );
                          }
                          return null;
                        })}
                    </div>
                  </div>

                  <div className="row  pg-t">
                    <div className="col-left-best-seller">
                      <div className="best-sell-img">
                        <Image
                          aspectRatio="2/1"
                          data={
                            bestSeller?.collection?.products?.nodes[0]?.images
                              ?.nodes[0]
                          }
                          className="best-sell-img flex"
                        />
                        <BestSellerCta
                          node={bestSeller?.collection?.products?.nodes[0]}
                          title={ctaTitle}
                        />
                      </div>
                      <div className="best-sell-img">
                        <Image
                          aspectRatio="1/0.734"
                          data={
                            bestSeller?.collection?.products?.nodes[1]?.images
                              ?.nodes[0]
                          }
                          className="peral-foot flex"
                        />
                        <BestSellerCta
                          node={bestSeller?.collection?.products?.nodes[1]}
                          title={ctaTitle}
                        />
                      </div>
                    </div>
                    <div className="col-right-best-seller">
                      <div className="best-sell-img">
                        <Image
                          aspectRatio="1/1"
                          data={
                            bestSeller?.collection?.products?.nodes[2]?.images
                              ?.nodes[0]
                          }
                          className="mg-lt best-sell-img flex best-sell-img-mobile"
                        />
                        <BestSellerCta
                          node={bestSeller?.collection?.products?.nodes[2]}
                          title={ctaTitle}
                        />
                      </div>
                      <div className="best-sell-img">
                        <Image
                          aspectRatio="1/1"
                          data={
                            bestSeller?.collection?.products?.nodes[3]?.images
                              ?.nodes[0]
                          }
                          className="mg-lt best-sell-img flex best-sell-img-mobile"
                        />
                        <BestSellerCta
                          node={bestSeller?.collection?.products?.nodes[3]}
                          title={ctaTitle}
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

const META_OBJECT_QUERY = `#graphql
query MetaObject($country: CountryCode, $language: LanguageCode)
@inContext(country: $country, language: $language) {
  metaobjects(first: 100, type: "home") {
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
              references(first: 10) {
                nodes {
                  ... on Metaobject {
                    id
                    fields {
                      key
                      type
                      value
                    }
                  }
                }
              }
              reference {
                ... on Metaobject {
                  id
                  
                  fields {
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
                ... on MediaImage {
                  id
                  image {
                    url
                  }
                }
              }
            }
          }
          ... on MediaImage {
            id
            image {
              url
            }
          }
        }
      }
    }
  }
}` as const;
