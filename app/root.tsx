import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";

export default function App() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link rel="preconnect" href="https://cdn.shopify.com/" />
        <link
          rel="stylesheet"
          href="https://cdn.shopify.com/static/fonts/inter/v4/styles.css"
        />
        <script
          type="module"
          src="https://cdn.shopify.com/shopifycloud/app-bridge/elements/app-bridge-elements.es.js"
        />
        <script src="https://cdn.shopify.com/shopifycloud/polaris/v12.22.0/polaris.js" defer></script>
        <link rel="stylesheet" href="https://cdn.shopify.com/shopifycloud/polaris/v12.22.0/polaris.css" />
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
