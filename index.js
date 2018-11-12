const http = require('http');
const parser = require('daap-parser');

const isErrorStatusCode = status => status < 200 || status > 299;
const mapParams = (params = {}) => Object.keys(params).map(key => [key, params[key]].join('=')).join('&');
const shouldBeImage = path => [
	'/ctrl-int/1/nowplayingartwork',
].reduce((memo, imageUrl) => memo || path.startsWith(imageUrl), false);

module.exports = ({ query, path, ...rest }) => {
	const options = Object.assign(rest, {
		protocol: 'http:',
		path: path ? path + (path.includes('?') ? '&' : '?') + mapParams(query) : '/',
	});

	return new Promise((resolve, reject) => {
		const rawData = [];

		http.get(options, (res) => {
			res.on('data', chunk => rawData.push(chunk));
			res.on('end', () => {
				let error = isErrorStatusCode(res.statusCode);
				let key = res.headers['content-type'] || '';
				let body = Buffer.concat(rawData);

				if (error && !body.length) {
					reject([{
						mstt: res.statusCode,
						msts: res.statusMessage,
					}, 'merr']);
					return;
				}

				if (!key.startsWith('image/')) {
					if (shouldBeImage(options.path)) {
						error = true;
					} else {
						body = parser.parse(body);
						[key, body = {}] = Object.entries(body)[0] || [];
						error = error || isErrorStatusCode(body.mstt);
					}
				}

				(error ? reject : resolve)([body, key]);
			});
			res.on('error', e => reject([e]));
		}).on('error', e => reject([e]));
	});
};
