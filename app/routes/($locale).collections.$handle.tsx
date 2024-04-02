import {json, redirect, type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {useLoaderData, Link, type MetaFunction} from '@remix-run/react';
import {
  Pagination,
  getPaginationVariables,
  Image,
  Money,
} from '@shopify/hydrogen';
import type {ProductItemFragment} from 'storefrontapi.generated';
import {useVariantUrl} from '~/utils';
import '../styles/pages.css';

export const meta: MetaFunction<typeof loader> = ({data}) => {
  return [{title: `Hydrogen | ${data?.collection.title ?? ''} Collection`}];
};

export async function loader({request, params, context}: LoaderFunctionArgs) {
  const {handle} = params;
  const {storefront} = context;
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 8,
  });

  if (!handle) {
    return redirect('/collections');
  }

  const {collection} = await storefront.query(COLLECTION_QUERY, {
    variables: {handle, ...paginationVariables},
  });

  if (!collection) {
    throw new Response(`Collection ${handle} not found`, {
      status: 404,
    });
  }
  return json({collection});
}

export default function Collection() {
  const {collection} = useLoaderData<typeof loader>();
  return (
    <>
      <div className="breadcrumbs" style={{minWidth: '1600px'}}>
        <ul>
          <li>
            <a href="/">Home</a>
          </li>
          <li>
            <a href="/collections">Collections</a>
          </li>
          <li>
            <a>{collection.title}</a>
          </li>
        </ul>
      </div>
      <div className="collection container">
        <h1>{collection?.title}</h1>
        <p className="collection-description">{collection?.description}</p>
        <Pagination connection={collection?.products}>
          {({nodes, isLoading, PreviousLink, NextLink}) => (
            <>
              <PreviousLink>
                {isLoading ? 'Loading...' : <span>↑ Load previous</span>}
              </PreviousLink>
              <ProductsGrid products={nodes} />
              <br />
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
            </>
          )}
        </Pagination>
      </div>
    </>
  );
}

function ProductsGrid({products}: {products: ProductItemFragment[]}) {
  return (
    <div className="products-grid">
      {products.map((product, index) => {
        return (
          <ProductItem
            key={product?.id}
            product={product}
            loading={index < 8 ? 'eager' : undefined}
          />
        );
      })}
    </div>
  );
}

function ProductItem({
  product,
  loading,
}: {
  product: ProductItemFragment;
  loading?: 'eager' | 'lazy';
}) {
  const variant = product?.variants?.nodes[0];
  const variantUrl = useVariantUrl(product?.handle, variant?.selectedOptions);
  const originalPrice = parseFloat(
    product?.compareAtPriceRange?.minVariantPrice?.amount,
  );
  const discountedPrice = parseFloat(
    product?.priceRange?.minVariantPrice?.amount,
  );
  let priceOff;

  if (originalPrice && discountedPrice && discountedPrice < originalPrice) {
    priceOff = originalPrice - discountedPrice;
  }
  return (
    <Link
      className="product-item"
      key={product?.id}
      prefetch="intent"
      to={variantUrl}
      state={{previousTabUrl: '/variantUrl'}}
    >
      {product?.featuredImage && (
        <Image
          alt={product?.featuredImage?.altText ?? product?.title}
          aspectRatio="1/1"
          data={product?.featuredImage}
          loading={loading}
          sizes="(min-width: 45em) 400px, 100vw"
        />
      )}
      <h4>{product?.title}</h4>
      <small>
        <div className="product-price-on-sale">
          {product?.priceRange ? (
            <Money
              className="price"
              data={product?.priceRange?.minVariantPrice}
            />
          ) : null}
          <s>
            <Money
              className="comparePrice"
              data={product?.compareAtPriceRange?.minVariantPrice}
            />
          </s>
          {priceOff ? (
            <p className="comparePrice">(${priceOff.toFixed(2)} OFF)</p>
          ) : (
            ''
          )}
        </div>
      </small>
    </Link>
  );
}

const PRODUCT_ITEM_FRAGMENT = `#graphql
  fragment MoneyProductItem on MoneyV2 {
    amount
    currencyCode
  }
  fragment ProductItem on Product {
    id
    handle
    title
    featuredImage {
      id
      altText
      url
      width
      height
    }
    priceRange {
      minVariantPrice {
        ...MoneyProductItem
      }
      maxVariantPrice {
        ...MoneyProductItem
      }
    }
    compareAtPriceRange {
      minVariantPrice {
        amount
        currencyCode
      }
      
    }
    variants(first: 1) {
      nodes {
        selectedOptions {
          name
          value
        }
      }
    }
  }
` as const;

const COLLECTION_QUERY = `#graphql
  ${PRODUCT_ITEM_FRAGMENT}
  query Collection(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      id
      handle
      title
      description
      products(
        first: $first,
        last: $last,
        before: $startCursor,
        after: $endCursor
      ) {
        nodes {
          ...ProductItem
        }
        pageInfo {
          hasPreviousPage
          hasNextPage
          endCursor
          startCursor
        }
      }
    }
  }
` as const;
