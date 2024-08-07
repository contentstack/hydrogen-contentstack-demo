# Hydrogen Contentstack Demo - An example storefront powered by Contentstack + Hydrogen

This demo is compatible with `@shopify/hydrogen >= 2024.01` built on Remix.

<img src="https://cdn.shopify.com/oxygen-v2/29150/15868/32733/347547/build/_assets/banner-ZAZUZJHV.svg" width="1000" />

[Demo][hydrogen-contentstack-demo] 

# About

Hydrogen Contentstack Demo is our customized [Hydrogen][hydrogen-github] starter that presents a real-world example of how Contentstack and Structured Content can elevate your custom Shopify storefronts.

It's designed to be used, which syncs products and collections from your Shopify storefront to your Stack in Contentstack.

This starter showcases a few patterns you can adopt when creating your own custom storefronts. Use Contentstack and Hydrogen to delight customers with rich, shoppable editorial experiences that best tell your story.

# Features

**[View the feature gallery][about]**

This TypeScript demo adopts many of Hydrogen's [framework conventions and third-party libraries][hydrogen-framework]. If you've used Hydrogen then you should hopefully feel at home here.

# Fetching Contentstack data

Using Contentstack App in Shopify, you can connect your Contentstack stack to your Shopify store. This app will sync all your Contentstack cms data to Shopify metaobjects.
In this demo all the inventory data is fetched from Shopify's Storefront API(from metaobjects). 
If you want to fetch marketing data like pages, footer or other assets using Contentstack SDK function, you can use the `getEntry` method from our official [`contentstack-sdk`][contentstack-sdk] library. We have already implemented in app/utils.ts file where you can use the `getEntry` method for achieving this. 

```tsx
import {getEntry} from '~/utils.ts';

const fetchData = async () => {
    try {
      const result = await getEntry({
        contentTypeUid: `${your_contenttypeUID}`,
        envConfig,
      });
      return result;
    } catch (error) {
      console.error('ERROR', error);
    }
  };
```

# Viewpoint

We've taken the following viewpoint on how we've approached this demo.

<details>
<summary><strong>Shopify is the source of truth for non-editorial content</strong></summary>

- For products, this includes titles, handles, product options and metaFields.
- For collections, this includes titles, products associated to it and collection images.

</details>

<details>
<summary><strong>Shopify data stored in our Contentstack is used to improve the editor experience</strong></summary>

- This allows us to display things like product status, prices and even inventory levels.
- Our application always fetches from Shopify's Storefront API at runtime to ensure we have the freshest data possible, especially important when dealing with fast-moving inventory.

</details>

<details>
<summary><strong>Collections are also managed by Shopify and Contentstack</strong></summary>

- Shopify is used to handle collection rules and sort orders.
- In Contentstack also, you can create Collection entries and which will get created inside Shopify using webhooks.

</details>

<details>
<summary><strong>Product options are customized in Contentstack</strong></summary>

- Data added to specific product options is done in Contentstack entries.
- For the extra fields inside Contentstack gets updated in Shopify in MetaField.

</details>

<details>
<summary><strong>Non-product pages i.e About are managed entirely by Contentstack</strong></summary>

- Shopify pages and blog posts (associated with the Online Store) channel aren't used in this demo. A dedicated `page` content type in Contentstack has been created for this purpose.

</details>

# Getting started
Contentstack for Shopify is a Shopify Plus-certified app.

## Requirements:

- Node.js version 18.05.0 or higher
- `npm` (or your package manager of choice, such as `yarn` or `pnpm`)

## Getting Started

1.  Create a `.env` file, based on the `.env.template` file and add the values from the Storefront settings of Hydrogen App.

2.  Install dependencies and start the development server

    ```bash
    npm i
    npm run dev
    ```

3.  Visit the development environment running at http://localhost:3000.

4. Integrate content from Contentstack into Shopify metaobjects and iterate through the JSON to render the user interface.

5. For menus in header, navigate to the Online Store --> Navigation --> Main menu and add the contentstack page entries as menu items.

For information on running production builds and deployment, see the [Hydrogen documentation][hydrogen-framework].

# License

This repository is published under the [MIT][license] license.

[about]: https://hydrogen.contentstackdemos.com/about
[hydrogen-contentstack-demo]: https://hydrogen.contentstackdemos.com/
[hydrogen-github]: https://github.com/contentstack/hydrogen-contentstack-demo
[hydrogen-framework]: https://shopify.dev/docs/custom-storefronts/hydrogen
[license]: https://github.com/sanity-io/sanity/blob/next/LICENSE
[contentstack-connect]: https://www.contentstack.com/docs
[contentstack-sdk]: https://www.contentstack.com/docs/developers/sdks/content-delivery-sdk/javascript-browser/reference
