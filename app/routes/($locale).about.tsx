import {defer, type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {useLoaderData, type MetaFunction} from '@remix-run/react';
import '../styles/pages.css';
import {getEntry} from '~/components/contentstack-sdk';

export const meta: MetaFunction = () => {
  return [{title: 'Hydrogen | About Us'}];
};

export async function loader({context}: LoaderFunctionArgs) {
  const envConfig = context.env;
  const fetchData = async () => {
    try {
      const result = await getEntry({
        contentTypeUid: 'about_us',
        envConfig,
      });
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
  return (
    <div className="home flex pg_bt">
      <RecommendedProducts cmsData={data.fetchedData} />
    </div>
  );
}

function RecommendedProducts({
  cmsData,
}: {
  cmsData: Awaited<ReturnType<typeof getEntry>>;
}) {
  return (
    <div>
      <div className="about_page_banner">
        <h1 className=" bodyCss about_heading">{cmsData?.heading}</h1>
      </div>
      <div className="container">
        <p className="about_description">{cmsData?.description}</p>
      </div>
    </div>
  );
}
