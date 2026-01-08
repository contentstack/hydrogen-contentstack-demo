import {defer, type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import parse from 'html-react-parser';
import {useLoaderData, type MetaFunction} from '@remix-run/react';
import '../styles/pages.css';

export const meta: MetaFunction = () => {
  return [{title: 'Hydrogen | About Us'}];
};

export async function loader({context}: LoaderFunctionArgs) {
  const {storefront} = context;
  const metaObject = await storefront?.query(META_OBJECT_QUERY);
  return defer({
    metaObject,
  });
}

export default function Homepage() {
  const data = useLoaderData<typeof loader>();
  return (
    <div className="home flex pg-bt">
      <RecommendedProducts metaObject={data?.metaObject} />
    </div>
  );
}

function RecommendedProducts({metaObject}: {metaObject: any}) {
  const fields = metaObject?.metaobjects?.nodes?.[0]?.fields;

  return (
    <div>
      {Array.isArray(fields) && (
        <>
          {fields.map((field: any) => {
            if (field.key === 'title') {
              return (
                <div key={field.key} className="about-page-banner">
                  <h1 className="bodyCss about-heading">{field.value}</h1>
                </div>
              );
            }
            return null;
          })}
          {fields.map((field: any) => {
            if (field.key === 'description') {
              return (
                <div key={field.key} className="container">
                  <p className="about-description">{parse(field.value)}</p>
                </div>
              );
            }
            return null;
          })}
        </>
      )}
    </div>
  );
}

const META_OBJECT_QUERY = `#graphql
query MetaObject($country: CountryCode, $language: LanguageCode)
@inContext(country: $country, language: $language) {
  metaobjects(first: 100, type: "about_us") {
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
