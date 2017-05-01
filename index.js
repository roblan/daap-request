const http = require('http');
const parser = require('daap-parser');

const isErrorStatusCode = status => status < 200 || status > 299;
const mapParams = params => Object.keys(params || {}).map(key => [key, params[key]].join('=')).join('&');

module.exports = function (options = {}) {
	options = Object.assign({}, options, {
		protocol: "http:",
		path: options.path ? options.path + (options.path.includes('?') ? '&' : '?') + mapParams(options.query) : '/'
	});
	delete options.query;

	return new Promise((resolve, reject) => {
		let rawData = [];

		http.get(options, res => {
			res.on('data', chunk => rawData.push(chunk));
			res.on('end', () => {
				let error = isErrorStatusCode(res.statusCode);
					key = res.headers['content-type'] || '';
					body = Buffer.concat(rawData);

				if(!key.startsWith('image/')) {
					body = parser.parse(body);
					key = Object.keys(body)[0];
					body = body[key] || {};
					error = error || isErrorStatusCode(body.mstt);
				}

				(error ? reject : resolve)([body, key]);
			});
			res.on('error', e => reject([e]));
		}).on('error', e => reject([e]));
	});
};
