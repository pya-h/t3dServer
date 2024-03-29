const GamePlayWebSocket = require("./gameplay/wsGamePlay");
const GlobalWebSocket = require("./global/wsGlobal");
const { parse } = require('url');
const { Routes } = require("../configs");
const { schedule } = require('node-cron');

const globalWebSocketDirectRoute = `/${Routes.webSocketRoute}/${Routes.wsGlobalRoute}`,
    gamePlayWebSocketDirectRoute = `/${Routes.webSocketRoute}/${Routes.wsGamePlayRoute}`;

let wsGlobalServer = GlobalWebSocket.Server(globalWebSocketDirectRoute),
    wsGamePlayServer = GamePlayWebSocket.Server(gamePlayWebSocketDirectRoute);

schedule('0 0 */1 * * *', () => { // hourly interval for removing games that are 
    try {
        wsGamePlayServer.collectGarbage(); //just call collect garbage in wsGameplay and sync via closeThisRoom in wsGlobal?
        console.log('hourly garbage collected at ' + (new Date()).toUTCString());
    } catch (err) {
        console.log(err);
    }
});

module.exports = {

    bindSocketsToMainServer: (server) => {
        server.on("upgrade", (request, socket, head) => {
            const pathname = parse(request.url).pathname;
            if (pathname === globalWebSocketDirectRoute) {
                wsGlobalServer.handleUpgrade(request, socket, head, (websocket) => {

                    //handle token verification here?
                    wsGlobalServer.emit("connection", websocket, request);
                });
            } else if (pathname === gamePlayWebSocketDirectRoute) {
                wsGamePlayServer.handleUpgrade(request, socket, head, (websocket) => {
                    wsGamePlayServer.emit("connection", websocket, request);
                });
            }
        });
    }
}