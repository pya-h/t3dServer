const WebSocket = require("ws");
const T3DLogic = require("./t3dLogic");
const { createGame } = require("../../controllers/games");
const { GameRules } = require('../../configs');
const authenticate = require("../../middlewares/authenticate");
const sizeof = require('object-sizeof');
const { closeThisRoom } = require("../global/wsGlobal");

var rooms = [];
const createSocketCommand = (cmd, msg) =>
    JSON.stringify({ cmd, msg });

const updateClientConnection = (currentRoom, client, newSocket, myTurn) => {
    client.socket = newSocket;
    //always make sure myTurn is set correctly
    const { dimension, playerX, playerO, gameID } = currentRoom;
    const startCommand = (myTurn) => createSocketCommand("REMEMBER", {
        myTurn,
        dimension,
        gameID,
        IDs: [playerX.id, playerO.id],
    });

    [playerX, playerO].forEach((each, index) => {
        if (each.id) {
            each.socket.send(startCommand(index));
        }
    });
};

const sendNextMoveTo = async(rname, madeBy, nextMove, nextTurn) => {
    const { table, dimension, playerX, playerO, turn, scoreless } = rooms[rname];
    const cell = ({ floor, row, column } = T3DLogic.getCellCoordinates(nextMove, dimension));
    console.log(`GAMEPLAY:\tmove made by player:${madeBy} now is sending to opponent`);
    try {
        //if cell is empty
        if (!table[floor][row][column]) {
            rooms[rname].emptyCells--;

            //update table and scores
            table[floor][row][column] = turn + 1;
            rooms[rname].timer.timeouts[turn] = 0; //reset timeouts: suppose player has missed two moves and now made his moves -> 4 timeouts must be frequent to cause losing
            T3DLogic.inspectAreaAroundTheCell(rooms[rname], cell);
            if (rooms[rname].scoreless && (playerX.score !== playerO.score)) { //if game is scoreless => playr has scored then there is no need to continue
                // declare the wiiner and close the game
                endThisGame(rname);
                return;
            }
            //what happens if try crashes some where near here???
            rooms[rname].turn = nextTurn; //update turn in game object
            //send scores and updated table back to targets
            // ...
            rooms[rname].lastMove = {
                cellIndex: nextMove,
                // cell,
                // table, //send les data each time to improve game speed a little(mili secs)
                xScore: playerX.score,
                oScore: playerO.score,
                turn: nextTurn, //updated turn will be send to target to prevent any wronge occasions
                madeBy
            };

            rooms[rname].timer.t0 = Date.now(); //current move start time in ms

            [playerX, playerO].forEach(eachPlayer => {
                eachPlayer.socket.send(createSocketCommand("UPDATE", { newMove: rooms[rname].lastMove, t0: rooms[rname].timer.t0 }));
            })

            if (!rooms[rname].gameID) {
                const { gameID } = await createGame(playerX.id, playerO.id, dimension, scoreless);
                rooms[rname].gameID = gameID.toString();

                [playerX, playerO].forEach(eachPlayer => {
                    eachPlayer.socket.send(createSocketCommand("REGISTER_GAME", { gameID: gameID.toString() }));
                })
            }
        } else //cell's not empty
            throw new Error('wronge_move: selected table cell is not empty');
    } catch (err) {
        //complete this
        //suppose some one sening a move but in the middle of try some error happens
        console.log(err);
    }

};

const passTurn = rname => {
    const { turn, playerX, playerO } = rooms[rname];
    rooms[rname].turn = (turn + 1) % 2; //pass the turn to other player
    rooms[rname].timer.t0 = Date.now(); //current move start time in ms
    [playerX, playerO].forEach(each => {
        each.socket.send(createSocketCommand("MOVE_MISSED", { turn: rooms[rname].turn, t0: rooms[rname].timer.t0 }))
    });
}
const endThisGame = (rname) => {
    rooms[rname].emptyCells = -1; //means that ending precedure has started already to prevent it from running multiple times
    // ...
    //end game
    const { turn, playerX, playerO, timer, gameID } = rooms[rname];
    // check if game record has been created --> if not: this means no move has been made at all --> both players are offline from the beginning
    if (gameID) {
        const lastCommand = createSocketCommand("END", {
            turn,
            xScore: playerX.score,
            oScore: playerO.score
        }); //replace msg param with winner's turn

        //determine who is the winner
        T3DLogic.evaluateAndEndGame(rooms[rname]);
        // ... now delete the room
        // temp:***********temp

        [playerX, playerO].forEach(each => {
            each.socket.send(lastCommand);
        });
        closeThisRoom(rname); //inform wsglobal to sync
        delete rooms[rname];
    } else {
        // if no game record created --> consider the game never started --> summary: SHOTOR DIDI NADIDI
        closeThisRoom(rname, true); //inform wsglobal to sync
        delete rooms[rname];
    }

    clearTimeout(timer.id);
}

const startGame = (rname) => {
    const { playerX, playerO, timer, dimension } = rooms[rname];
    rooms[rname].forceCloseTime = Date.now() + dimension * dimension * dimension * (GameRules.T3D.TurnTimeOut + 5) * 1000; //game force ending time in milisecs
    // + 5 is for considering all time errors
    [playerX, playerO].forEach(each => {
        each.socket.send(createSocketCommand("START", timer.t0));
    })
}

const leaveRoom = (rname, playerID) => { //not used yet.. cause the data here in this socket is vital and removing it has a risk of losing the game

    //this methgod is for manual leave, for when players decide to leave the game
    //first one to leave must be set loser
    if (rooms[rname].playerX.id === playerID)
        rooms[rname].playerX = { id: null, socket: null, score: 0 };
    //log out playerX
    else if (rooms[rname].playerO.id === playerID)
        rooms[rname].playerO = { id: null, socket: null, score: 0 }; //log out playerO

    if (!rooms[rname].playerX.id && !rooms[rname].playerO.id)
    //if both players requested leaving: remove the room
        delete rooms[rname];
};


//temp method
const log_memory_usage = () => {
    console.log('---------------------------gameplay-scoket-mem-----------------------------\n');
    const online_size = +(sizeof(Object.keys(rooms)) + sizeof(Object.values(rooms))) / 1024;
    console.log('new game up and running --> allocated memory:' + online_size + 'KB');
    console.log('---------------------------gameplay-scoket-mem-----------------------------\n');
}

module.exports.Server = (path) => {
    let gamePlayWebSocketServer = new WebSocket.Server({ noServer: true, path });
    //custom method
    gamePlayWebSocketServer.collectGarbage = () => {
        console.log('GAMEPLAY:\tgarbage called in ' + (new Date()).toString());
        // removes trashes: games that are ended but still remain on the server, unwanted stuff, etc
        Object.keys(rooms).forEach(game => {
            if (rooms[game].forceCloseTime <= Date.now()) { //means current time has passed the forceclosetime
                // delete game
                endThisGame(game);

                delete rooms[game];
                closeThisRoom(rname); //inform wsglobal to sync
                //... inform players
                //... save results or cancel the game
                console.log(`GAMEPLAY:\t*ATTENTION: Room ${game} forcey closed.`);
            }
        })
    }

    gamePlayWebSocketServer.on("connection", (socket) => {
        socket.on("message", (data) => {
            try {
                //rname --> roomname
                const { request, rname, token, msg } = JSON.parse(data);
                const playerID = authenticate.tokenForWS(token); // if anything about token was wrong -> request doesnt process

                console.log("GAMEPLAY:\treq:", request, "\troom:", rname, "\tplayer:", playerID, "\tparams:", msg);

                if (rooms[rname] && rooms[rname].emptyCells === 0) {
                    endThisGame(rname);
                    return;
                }
                // if game's not ended yet:
                if (request === "join") {
                    try {
                        // console.log(rname);
                        // if there is no room with this name, then create one
                        const { gameType, scoreless, gameID, leagueID } = msg; //*****change this make client send the type of game */
                        if (!rooms[rname]) {
                            rooms[rname] = T3DLogic.initiate(+gameType, Boolean(scoreless));
                        }

                        //initiatilize room and players
                        if (!rooms[rname].playerX.id && playerID !== rooms[rname].playerO.id) {
                            rooms[rname].playerX = { id: playerID, socket, score: 0 };
                        } else if (!rooms[rname].playerO.id && playerID !== rooms[rname].playerX.id) {
                            rooms[rname].playerO = { id: playerID, socket, score: 0 };
                        }
                        if (!rooms[rname].gameID && gameID)
                            rooms[rname].gameID = gameID;

                        if (!rooms[rname].leagueID && leagueID)
                            rooms[rname].leagueID = leagueID;

                        const { playerX, playerO, lastMove } = rooms[rname];
                        // update connections
                        [playerX, playerO].forEach((each, index) => {
                            if (each.id === playerID) {
                                updateClientConnection(rooms[rname], each, socket, index);
                                return;
                            }
                        })

                        //else {
                        // this a third client in the room!
                        // u can set this client in a watcher array if you want to implement live watch
                        //}

                        //resend the move to make sure moves are recieved on disconnect/connecting
                        if (lastMove && lastMove.madeBy !== playerID) {
                            socket.send(
                                createSocketCommand("UPDATE", { newMove: lastMove, t0: rooms[rname].timer.t0 }));
                        }
                    } catch (err) {
                        console.log(err);
                    }
                } else if (request === "move") {
                    try {
                        const { playerX, playerO, turn } = rooms[rname];
                        if ((turn === 0 && playerID !== playerX.id) || (turn === 1 && playerID !== playerO.id))
                            throw new Error(`wronge_move: not player:${playerID} 's turn!!'`);

                        const nextTurn = (turn + 1) % 2;
                        sendNextMoveTo(rname, playerID, msg, nextTurn);
                        //update senders score and so
                        //before this i used requesting load again
                        //but i think its not needed, and considering large bytes that .table has, its not so wise to request load every time
                        //i used rooms[rname] again to directly access very recent values
                        socket.send(createSocketCommand("SCORES", {
                            turn: rooms[rname].turn,
                            xScore: rooms[rname].playerX.score,
                            oScore: rooms[rname].playerO.score
                        }));

                    } catch (err) {
                        console.log(err);
                    }
                } else if (request === "move_recieved") {
                    //for caution only: after client declares recieving its timeout starts
                    // here: msg === recieved status
                    const recieved = msg;
                    if (rooms[rname].lastMove.madeBy !== playerID && recieved)
                        rooms[rname].lastMove = null;

                } else if (request === "ban_move") {
                    const { playerX, playerO, turn } = rooms[rname];
                    // clients send bam_move request to inform server from turn timeout
                    try {
                        if (Date.now() - rooms[rname].timer.t0 >= GameRules.T3D.TurnTimeOut) { //this checks that the turn is actually missed or not
                            // purpose of this condition check is to ensure that ban_move request is sent truely not by mistake or cheating
                            rooms[rname].timer.timeouts[turn]++; //increment the number of repeated time outs fro this player
                            if (rooms[rname].timer.timeouts[turn] < GameRules.T3D.AllowedFrequestMissedMoves) {
                                passTurn(rname);
                            } else { //player has not been responding for last 4 turns of his: he may left the game or whatever
                                //anyway he/she deserves to lose 3(+) - 0
                                // t0 -> its now the end time
                                console.log(`GAMEPLAY:\t${GameRules.T3D.AllowedFrequestMissedMoves} turns missed by player${turn}`);
                                [playerX, playerO].forEach((each, index) => {
                                    if (index === turn) each.score = 0; //loser: the one who is not responding
                                    else each.score = each.score <= 3 ? 3 : each.score;
                                });
                                endThisGame(rname);
                            }
                        }
                    } catch (err) {
                        console.log(err);
                    }
                } else if (request === "load") {
                    const { table, playerX, playerO, turn, timer, forceCloseTime } = rooms[rname];

                    if (!playerO.id) return; //wait untill both players online
                    if (timer.t0 === -1 || !timer.id)
                        rooms[rname].timer.t0 = Date.now(); //current move start time in ms


                    //forceCloseTime is set according to game start time, so if not set -> game not started yet
                    if (forceCloseTime === -1) startGame(rname); //this time is used for garbage collection, to detect a game that is on the server for a long time and hasnt been deleted

                    if (Date.now() - rooms[rname].timer.t0 >= GameRules.T3D.TurnTimeOut) //this checks that the turn is actually missed or not
                        passTurn(rname); //if both players were out => this condition checks an runs

                    [playerX, playerO].forEach(eachPlayer => { //just send it if the one who has the turn requested
                        eachPlayer.socket.send(createSocketCommand("LOAD", {
                            table,
                            turn,
                            xScore: playerX.score,
                            oScore: playerO.score,
                            t0: timer.t0
                        }));
                    });

                } else if (request === "surrender") {
                    if (msg) { // msg === R_U_Sure?
                        [rooms[rname].playerX, rooms[rname].playerO].forEach((p) => {
                            if (playerID === p.id)
                                p.score = 0;
                            else
                                p.score = p.score <= 3 ? 3 : p.score;
                        });
                        endThisGame(rname);
                    }
                } else if (request === "leave") {
                    leaveRoom(rname);
                    console.log(`GAMEPLAY:\t${playerID} left`); //comment this
                }
            } catch (err) {
                console.log(err);
                // wonge token: token expired | token compromised | token generated by sb else | token been stolen
                //if token is decoded but is wronge somehow ==> BLOCK CLIENT?
                if (err.statusCode) {
                    socket.send(createSocketCommand("NOT_AUTHORIZED", err.statusCode)); // force client to sign in page in client
                    delete onlines[clientID];
                } // set player state to offline}
                switch (err.statusCode) {
                    case 465:
                        // .. wrong token
                        break;
                    case 466:
                        // ... token compromised or edited
                        break;
                    case 467:
                        //... not token's owner ! thief
                        break;
                    default:
                        // ...bad request
                        break;
                }
            }
        });
        socket.on("close", (data) => {
            //create a new request informing other player that his opponent disconnected

        });
    });
    return gamePlayWebSocketServer;
};