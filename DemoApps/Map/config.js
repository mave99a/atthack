/*
 * TODO: change this to gm.caravan.Config
 */
var Config = {};

/*
 * dev=true   use localhost
 * dev=false  use triad-caravan.appspot.com
 */
Config.dev = false;

Config.protocol = "http:";

Config.getBaseUrl = function () {
	return Config.protocol + "//" + Config.host + ":" + Config.port + "/";
};

if (Config.dev) {
	Config.host = "localhost";
	Config.port = "8888";
	Config.channelApi = Config.getBaseUrl() + "myjsapi.js";
}
else {
	Config.host = "triad-caravan.appspot.com";
	Config.port = "80";
	Config.channelApi = Config.getBaseUrl() + "_ah/channel/jsapi";
}

// Temporary development flag - when false will trigger dummy audio.
Config.doAudioMessageTheRealWay = false;