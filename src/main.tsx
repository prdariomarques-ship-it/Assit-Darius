import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initPwaServiceWorker } from './pwa/registerServiceWorker';

initPwaServiceWorker();

createRoot(document.getElementById('root')!).render(<App />);
