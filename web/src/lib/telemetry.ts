import { onCLS, onINP, onLCP, onTTFB, type Metric } from 'web-vitals';

const endpoint = import.meta.env.VITE_TELEMETRY_ENDPOINT || '/__telemetry';

function send(metric: Metric) {
	try {
		navigator.sendBeacon?.(
			endpoint,
			JSON.stringify({
				...metric,
				app: 'web',
				timestamp: Date.now(),
			})
		);
	} catch {}
}

export function initWebVitals() {
	onCLS(send);
	onINP(send);
	onLCP(send);
	onTTFB(send);
}


