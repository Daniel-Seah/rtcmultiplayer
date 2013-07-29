var crypto = require('crypto');

var SignedRequest = function(secret) {
		var _secret = secret;
		
		var _base64decode = function(data) {
			while (data.length % 4 !== 0) {
				data += '=';
			}
			data = data.replace(/-/g, '+').replace(/_/g, '/');
			return new Buffer(data, 'base64').toString('utf-8');
		};
		
		this.decode = function(request) {
			var parts = request.split('.');
			var encodedSignature = parts[0];
			var encoded = parts[1];
			var signature = _base64decode(encodedSignature);
			var decoded = _base64decode(encoded);
			var data = JSON.parse(decoded);
			
			if (data.algorithm !== 'HMAC-SHA256') {
				return null;
			}
			var hmac = crypto.createHmac('SHA256', _secret);
			hmac.update(encoded);
			var result = hmac.digest('base64').replace(/\//g, '_').replace(/\+/g, '-').replace(/\=/g, '');
			if(result === encodedSignature) {
				return data;
			}
			return null;
		};
};

module.exports = SignedRequest; 