import axios from 'axios';
import { Latency, ModifiedAxiosInstance } from './types';

export const rpcBody = JSON.stringify({
	jsonrpc: '2.0',
	method: 'eth_getBlockByNumber',
	params: ['latest', false],
	id: 1
});

interface RpcResponse {
	result: {
		number?: number;
	};
}

type FetchChainResponse = (RpcResponse & Latency) | Event;

const fetchChain = async (baseURL: string) => {
	if (baseURL.includes('API_KEY')) return null;
	try {
		const API = axios.create({
			baseURL,
			headers: {
				'Content-Type': 'application/json'
			}
		}) as any as ModifiedAxiosInstance;

		API.interceptors.request.use(request => {
			request.requestStart = Date.now();
			return request;
		});

		API.interceptors.response.use(
			response => {
				response.latency = Date.now() - response.config.requestStart;
				return response;
			},
			error => {
				if (error.response) {
					error.response.latency = null;
				}

				return Promise.reject(error);
			}
		);

		const { data, latency } = await API.post<RpcResponse>('', rpcBody);
		const response: FetchChainResponse = {
			...data,
			latency
		};
		return formatData(baseURL, response);
	} catch (error) {
		return null;
	}
};

type MutatePromise<T> = Promise<T> & {
	resolve?: (value: T) => void;
	reject?: (reason?: T) => void;
};

function createPromise<R>() {
	let resolve: (value: R) => void;
	let reject: (reason?: R) => void;

	const promise: MutatePromise<R> = new Promise<any>((_resolve, _reject) => {
		resolve = _resolve;
		reject = _reject;
	});

	// @ts-ignore
	promise.resolve = resolve;
	// @ts-ignore
	promise.reject = reject;

	return promise;
}

const fetchWssChain = async (baseURL: string) => {
	try {
		// small hack to wait until socket connection opens to show loading indicator on table row
		const queryFn = createPromise<FetchChainResponse>();

		const socket = new WebSocket(baseURL);
		let requestStart: number;

		socket.onopen = function () {
			socket.send(rpcBody);
			requestStart = Date.now();
		};

		socket.onmessage = function (event) {
			const data = JSON.parse(event.data);

			const latency = Date.now() - requestStart;
			queryFn?.resolve?.({ ...data, latency });
		};

		socket.onerror = function (e) {
			queryFn?.reject?.(e);
		};

		const response = await queryFn;
		return formatData(baseURL, response);
	} catch (error) {
		return null;
	}
};

const useRPCData = (urls: string[]) => {
	const queries = urls.map(url =>
		url.includes('wss://') ? fetchWssChain(url) : fetchChain(url)
	);
	return Promise.all(queries.map(request => request));
};

const formatData = (url: string, data: FetchChainResponse) => {
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

export default useRPCData;
