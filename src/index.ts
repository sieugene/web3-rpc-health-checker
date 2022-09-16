import { healthCheckRpcs } from './getRpcData';

(async () => {
	try {
		console.log('start fetch');
		const result = await healthCheckRpcs([
			'https://data-seed-prebsc-2-s1.binance.org:8545',
			'https://data-seed-prebsc-2-s3.binance.org:8545',
			'wss://bsc-mainnet.nodereal.io/ws/v1/64a9df0874fb4a93b9d0a3849de012d3'
		]);
		console.log('Result:', result);
	} catch (error) {
		console.log(error);
	} finally {
		console.log('end fetch');
	}
})();
