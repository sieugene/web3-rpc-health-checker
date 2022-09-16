type MutatePromise<T> = Promise<T> & {
	resolve?: (value: T) => void;
	reject?: (reason?: T) => void;
};

export function createPromise<R>() {
	let resolve: MutatePromise<R>['resolve'];
	let reject: MutatePromise<R>['reject'];

	const promise: MutatePromise<R> = new Promise<R>((_resolve, _reject) => {
		resolve = _resolve;
		reject = _reject;
	});

	promise.resolve = resolve;
	promise.reject = reject;

	return promise;
}
