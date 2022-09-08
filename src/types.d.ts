import {
	AxiosInstance,
	AxiosInterceptorManager,
	AxiosRequestConfig,
	AxiosResponse
} from 'axios';

export interface Latency {
	latency: number;
}

export interface RequestConfig extends AxiosRequestConfig {
	requestStart: number;
	latency: number;
}

export interface ResponseConfig extends AxiosResponse {
	latency: number;
	config: AxiosResponse['config'] & {
		requestStart: number;
	};
}

export type ModifiedAxiosInstance = Omit<
	AxiosInstance,
	'interceptors' | 'post'
> & {
	interceptors: {
		request: AxiosInterceptorManager<RequestConfig>;
		response: AxiosInterceptorManager<ResponseConfig>;
	};
	post: <T = any, R = AxiosResponse<T>>(
		url: string,
		data?: any,
		config?: AxiosRequestConfig
	) => Promise<R> & Promise<Latency>;
};
