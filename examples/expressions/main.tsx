import {createRoot} from 'react-dom/client';
import ExpressionPlayground from './app';

const container = document.getElementById('app');
if (!container) {
  throw new Error('Application container not found.');
}

createRoot(container).render(<ExpressionPlayground />);
