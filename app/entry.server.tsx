import type {EntryContext} from '@shopify/remix-oxygen';
import {RemixServer} from '@remix-run/react';
import {isbot} from 'isbot';
import ReactDOMServer from 'react-dom/server'; // default import for CJS
import {createContentSecurityPolicy} from '@shopify/hydrogen';

const {renderToReadableStream} = ReactDOMServer; // destructure from default

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
) {
  const {nonce, header, NonceProvider} = createContentSecurityPolicy();

  // Sanitize URL (path + query only)
  const url = new URL(request.url);
  const safeUrl = new URL(`${url.pathname}${url.search}`, url.origin);

  const body = await renderToReadableStream(
    <NonceProvider>
      <RemixServer context={remixContext} url={safeUrl.toString()} />
    </NonceProvider>,
    {
      nonce,
      signal: request.signal,
      onError(error) {
        console.error(error);
        responseStatusCode = 500;
      },
    },
  );

  if (isbot(request.headers.get('user-agent'))) {
    await body.allReady;
  }

  responseHeaders.set('Content-Type', 'text/html');
  responseHeaders.set('Content-Security-Policy', header);

  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}
