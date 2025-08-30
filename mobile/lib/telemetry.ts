type Timed = {
	name: string;
	start: number;
	end?: number;
	ok?: boolean;
	status?: number;
	meta?: Record<string, unknown>;
};

const buffer: Timed[] = [];
let flushTimer: ReturnType<typeof setInterval> | null = null;

export function startTimer(name: string, meta?: Record<string, unknown>) {
	const t: Timed = { name, start: Date.now(), meta };
	buffer.push(t);
	return () => {
		t.end = Date.now();
		return t;
	};
}

export function record(name: string, ok: boolean, status?: number, meta?: Record<string, unknown>) {
	buffer.push({ name, start: Date.now(), end: Date.now(), ok, status, meta });
}

export function initTelemetry(flushEndpoint?: string) {
	if (flushTimer) return;
	flushTimer = setInterval(() => {
		if (buffer.length === 0) return;
		const batch = buffer.splice(0, buffer.length);
		try {
			// Best-effort: send to web metrics endpoint if provided
			if (flushEndpoint) {
				fetch(flushEndpoint, {
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify({ app: 'mobile', ts: Date.now(), items: batch }),
				}).catch(() => {});
			}
		} catch {}
	}, 5000);
}


