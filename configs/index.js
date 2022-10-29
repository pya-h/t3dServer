const T3D = require('./game');
const serverRoutes = require('./server-routes');
const PayloadRequirements = require('./requirements');
const WebSocketConfig = require('./wsconfigs');
const StatusCodes = require('./status');

module.exports = {
    Routes: serverRoutes,
    GameRules: { T3D },
    PayloadRequirements,
    WebSocketConfig,
    StatusCodes
}