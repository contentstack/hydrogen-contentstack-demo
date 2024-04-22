import {defer, type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import parse from 'html-react-parser';
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
    <div className="home flex pg-bt">
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
      <div className="about-page-banner">
        <h1 className=" bodyCss about-heading">{cmsData?.heading}</h1>
      </div>
      <div className="container">
        <p className="about-description">{parse(cmsData?.description)}</p>
      </div>
    </div>
  );
}
