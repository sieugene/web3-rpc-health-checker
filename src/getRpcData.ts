import axios from 'axios';
import { getBlockNumderBody } from './lib/eth/getBlockNumder';
import { formatChainResponse } from './lib/formatters';
import { createPromise } from './lib/promise';
import {
	FetchChainResponse,
	ModifiedAxiosInstance,
	RpcResponse
} from './types';

const fetchChain = async (baseURL: string) => {
	if (baseURL.includes('API_KEY')) return null;
	try {
		const API = axios.create({
			baseURL,
			headers: {
				'Content-Type': 'application/json'
			}
		}) as unknown as ModifiedAxiosInstance;

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

		const { data, latency } = await API.post<RpcResponse>(
			'',
			getBlockNumderBody
		);
		const response: FetchChainResponse = {
			...data,
			latency
		};
		return formatChainResponse(baseURL, response);
	} catch (error) {
		return null;
	}
};

const fetchWssChain = async (baseURL: string) => {
	try {
		// small hack to wait until socket connection opens to show loading indicator on table row
		const queryFn = createPromise<FetchChainResponse>();

		const socket = new WebSocket(baseURL);
		let requestStart: number;

		socket.onopen = function () {
			socket.send(getBlockNumderBody);
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
		return formatChainResponse(baseURL, response);
	} catch (error) {
		return null;
	}
};

export const healthCheckRpcs = (urls: string[]) => {
	const queries = urls.map(url =>
		url.includes('wss://') ? fetchWssChain(url) : fetchChain(url)
	);
	return Promise.all(queries.map(request => request));
};
