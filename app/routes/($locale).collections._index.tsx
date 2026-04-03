import type {MetaFunction} from '@remix-run/react';
import {useLoaderData, Link} from '@remix-run/react';
import {json, type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {Pagination, getPaginationVariables, Image} from '@shopify/hydrogen';
import type {CollectionFragment} from 'storefrontapi.generated';
import '../styles/pages.css';

export const meta: MetaFunction = () => {
  return [{title: 'Hydrogen | Collections'}];
};

export async function loader({context, request}: LoaderFunctionArgs) {
  const {storefront} = context;
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 8,
  });
  const headingQuery = await storefront?.query(HEADING_QUERY);

  const {collections} = await context.storefront.query(COLLECTIONS_QUERY, {
    variables: paginationVariables,
  });

  return json({collections, headingQuery});
}

export default function Collections() {
  const {collections, headingQuery} = useLoaderData<typeof loader>();
  const fields = headingQuery?.metaobjects?.nodes?.[0]?.fields;
  return (
    <div className="collections container pg-bt">
      {Array.isArray(fields) &&
        fields.map((field: any) => {
          return (
            <>
              {field?.key === 'collection_page_heading' && <h1>Collections</h1>}
            </>
          );
        })}

      <Pagination connection={collections}>
        {({nodes, isLoading, PreviousLink, NextLink}) => (
          <div>
            <CollectionsGrid collections={nodes} />
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
      <p className="collection-cta ">{collection?.title}</p>
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
