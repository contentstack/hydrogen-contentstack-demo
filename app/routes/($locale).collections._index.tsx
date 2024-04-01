import {useLoaderData, Link, MetaFunction} from '@remix-run/react';
import {json, type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {Pagination, getPaginationVariables, Image} from '@shopify/hydrogen';
import type {CollectionFragment} from 'storefrontapi.generated';
import '../styles/pages.css';

export const meta: MetaFunction = () => {
  return [{title: 'Hydrogen | Collections'}];
};

export async function loader({context, request}: LoaderFunctionArgs) {
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 8,
  });

  const {collections} = await context.storefront.query(COLLECTIONS_QUERY, {
    variables: paginationVariables,
  });

  return json({collections});
}

export default function Collections() {
  const {collections} = useLoaderData<typeof loader>();
  return (
    <div className="collections container pg_bt">
      <h1>Collections</h1>
      <Pagination connection={collections}>
        {({nodes, isLoading, PreviousLink, NextLink}) => (
          <div>
            <CollectionsGrid collections={nodes} />
            <NextLink className="load_more">
              {isLoading ? (
                'Loading...'
              ) : (
                <div className="center">
                  <span className="view_allproducts load_more">
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

function CollectionsGrid({collections}: {collections: CollectionFragment[]}) {
  return (
    <div className="collections-grid">
      {collections?.map((collection, index) => (
        <CollectionItem
          key={collection?.id}
          collection={collection}
          index={index}
        />
      ))}
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
      className="collection-item"
      key={collection?.id}
      to={`/collections/${collection?.handle}`}
      prefetch="intent"
    >
      {collection?.image && (
        <Image
          alt={collection?.image?.altText ?? collection?.title}
          aspectRatio="1/1"
          data={collection?.image}
          loading={index < 3 ? 'eager' : undefined}
        />
      )}
      <p className="collection_cta ">{collection?.title}</p>
    </Link>
  );
}

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
    $first: Int
    $language: LanguageCode
    $last: Int
    $startCursor: String
  ) @inContext(country: $country, language: $language) {
    collections(
      first: $first,
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
