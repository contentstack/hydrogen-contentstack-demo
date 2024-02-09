/* eslint-disable prettier/prettier */
import {json, type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {useLoaderData, type MetaFunction} from '@remix-run/react';
import { getEntry, getEntryByUid } from '../components/contentstack-sdk'
import contact_us from '../public/contact_us.svg';

export const meta: MetaFunction<typeof loader> = ({data}) => {
  return [{title: `Hydrogen | ${data?.page.title ?? ''}`}];
};

export async function loader({params, context}: LoaderFunctionArgs) {
  const envConfig = context.env;
  if (!params.handle) {
    throw new Error('Missing page handle');
  }
    const fetchData = async () => {
      try {
        const result = await getEntryByUid({
          contentTypeUid: 'pages_shopify',
          entryUid: 'bltb5740faf62d6dde3',
          envConfig,
        });
        
        console.log('Result:*************', result);  // Log the result
        return result;
      } catch (error) {
        console.error("ERROR", error);
      }
    };

  const {page} = await context.storefront.query(PAGE_QUERY, {
    variables: {
      handle: params.handle,
    },
  });

  if (!page) {
    throw new Response('Not Found', {status: 404});
  }

  return {
    env: envConfig,
    page,
    fetchData: await fetchData(),
  };
  // return json({page, envConfig, fetchData});
  
}

export default function Page() {
  const {page, env, fetchData} = useLoaderData<typeof loader>();

  return (
    <div className="page" style={{backgroundColor: '#e5e5e5', border: '1px solid #e5e5e5'}}>
      <header>
        {/* <h1>{page?.title}</h1> */}
        <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          flexDirection: 'column',
          alignItems: 'center',
          marginBottom: '30px',
        }}
        >
          <h1 style={{fontSize: '3.875rem', lineHeight: 1, letterSpacing: '-.03em'}}>{fetchData?.heading}</h1>
          <p  style={{
            fontWeight: 500,
            fontSize: '16px',
            lineHeight: 1.1,
            letterSpacing: '-.03em',
            padding: '16px',
            borderRadius: '9999px',
            overflow: 'hidden',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}>{fetchData?.description}</p>
        </div>
       
      </header>
      {/* <main dangerouslySetInnerHTML={{__html: page.body}} /> */}
    </div>
  );
}

const PAGE_QUERY = `#graphql
  query Page(
    $language: LanguageCode,
    $country: CountryCode,
    $handle: String!
  )
  @inContext(language: $language, country: $country) {
    page(handle: $handle) {
      id
      title
      body
      seo {
        description
        title
      }
    }
  }
` as const;
