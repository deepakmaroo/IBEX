import { createRoot } from 'react-dom/client';
import '@mantine/core/styles.css';
import './index.css';
import { App } from './App';

// Create a dedicated container element for the app
const container = document.createElement('div');
container.id = 'root';
document.body.appendChild(container);

// Create the root and render the app
const root = createRoot(container);
root.render(<App />);
