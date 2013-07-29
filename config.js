var config = {};
module.exports = config;

config.FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID || '';
config.FACEBOOK_APP_SECRET = process.env.FACEBOOK_SECRET || '';
config.PORT = process.env.PORT || 3000;
config.APP_DOMAIN = process.env.APP_DOMAIN || '//localhost:' + config.PORT +'/';
