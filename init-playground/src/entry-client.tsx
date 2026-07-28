import { StartClient } from '@tanstack/react-start/client';
import { hydrateRoot } from 'react-dom/client';

const root = document.querySelector('#root');
if (!root) {
  throw new Error('Root element (#root) not found');
}

hydrateRoot(root, <StartClient />);
