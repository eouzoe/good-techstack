import { HeadContent, Outlet, Scripts, createRootRoute } from '@tanstack/react-router';
import { type ReactNode } from 'react';

import globalsCss from '../styles/globals.css?url';

const RootDocument = ({ children }: { children: ReactNode }) => (
  <html lang="en">
    <head>
      <HeadContent />
    </head>
    <body>
      <div id="root">{children}</div>
      <Scripts />
    </body>
  </html>
);

const RootLayout = () => (
  <RootDocument>
    <main className="mx-auto max-w-4xl px-4 py-16">
      <Outlet />
    </main>
  </RootDocument>
);

export const Route = createRootRoute({
  component: RootLayout,
  head: () => ({
    links: [{ href: globalsCss, rel: 'stylesheet' }],
    meta: [
      { charSet: 'utf8' },
      { content: 'width=device-width, initial-scale=1', name: 'viewport' },
      { title: 'gstack' },
    ],
  }),
});
