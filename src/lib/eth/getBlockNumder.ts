export const getBlockNumderBody = JSON.stringify({
	jsonrpc: '2.0',
	method: 'eth_getBlockByNumber',
	params: ['latest', false],
	id: 1
});
