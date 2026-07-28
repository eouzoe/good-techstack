import { RouterProvider } from '@tanstack/react-router';

import { getRouter } from '../router';

const router = getRouter();

export const App = () => <RouterProvider router={router} />;
