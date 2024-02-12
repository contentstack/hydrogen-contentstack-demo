import {defer, type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {useLoaderData, type MetaFunction} from '@remix-run/react';
import '../styles/pages.css';
import {getEntryByUid} from '~/components/contentstack-sdk';

export const meta: MetaFunction = () => {
  return [{title: 'Hydrogen | Home'}];
};

export async function loader({context}: LoaderFunctionArgs) {
  const envConfig = context.env;
  const fetchData = async () => {
    try {
      const result = await getEntryByUid({
        contentTypeUid: 'about_us',
        entryUid: 'blta3850ce0d777edd0',
        envConfig,
      });
      console.info(result, 'RESULTS OF CMS DATA IN ABOUT US PAGE');
      return result;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('ERROR', error);
    }
  };
  return defer({
    fetchedData: await fetchData(),
  });
}

export default function Homepage() {
  const data = useLoaderData<typeof loader>();
  console.info('ABOUT US CMS DATA', data.fetchedData);
  return (
    <div className="home flex pg_bt">
      <RecommendedProducts cmsData={data.fetchedData} />
    </div>
  );
}

function RecommendedProducts({
  cmsData,
}: {
  cmsData: Awaited<ReturnType<typeof getEntryByUid>>;
}) {
  return (
    <div>
      <div className="container">
        <h1 className=" bodyCss">{cmsData?.heading}</h1>
        <p>{cmsData?.description}</p>
      </div>
      <br />
    </div>
  );
}
