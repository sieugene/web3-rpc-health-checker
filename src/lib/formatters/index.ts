import { FetchChainResponse } from 'src/types';

export const formatChainResponse = (url: string, data: FetchChainResponse) => {
	if (data instanceof Event) return null;
	let height = data?.result?.number ?? null;
	let latency: number | null = data?.latency ?? null;
	if (height) {
		const hexString = height.toString(16);
		height = parseInt(hexString, 16);
	} else {
		latency = null;
	}
	const seconds = `${latency ? (latency / 1000).toFixed(3) + 's' : null}`;
	return { url, height, latency, seconds };
};
