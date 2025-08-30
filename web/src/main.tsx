import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initWebVitals } from './lib/telemetry'

createRoot(document.getElementById("root")!).render(<App />);

initWebVitals()
