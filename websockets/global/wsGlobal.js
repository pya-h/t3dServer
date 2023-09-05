const WebSocket = require("ws");
const { makeFriends } = require('../../controllers/users');
const LeagueModel = require("../../models/leagues");
const { createGame } = require("../../controllers/games");
const { saveMessage } = require('../../controllers/chats');
var onlines = []; //keys: clientID, values: game type and socket
// onlines['clientID'] = {gamedimension: int, room: string}
// .dimension is NOT NULL and .room is null ==> player is online
// .dimension and .room both NOT NULL => player is in game
// .oponentID this is for when client goes out of the room and when comes back to the game

var t3dRooms = []; //for uuid generate, roomid is used to make ids with less memory consumption
//this will prevent enterference in gameplay
const sizeof = require('object-sizeof');
const authenticate = require("../../middlewares/authenticate");

const createSocketCommand = (command, msg) =>
    JSON.stringify({
        command,
        msg,
    });

function findRandomIndex(max) {
    if (max === 1) return 0;
    return Math.floor(Math.random() * max);
}

//temp method
const log_memory_usage = () => {
    console.log('---------------------------global-scoket-mem-----------------------------\n');
    const online_size = +(sizeof(Object.keys(onlines)) + sizeof(Object.values(onlines))) / 1024,
        t3d_size = +(sizeof(Object.keys(t3dRooms)) + sizeof(Object.values(t3dRooms))) / 1024;
    console.log('new user came online --> allocated memory:' + online_size + 'KB');
    console.log('new game:t3d added to games room --> allocated memory:' + t3d_size + 'KB');
    console.log('total: ' + +(online_size + t3d_size) + 'KB');
    console.log('---------------------------global-scoket-mem-----------------------------\n');
}

const findEngagedGame = (clientID) => {
    Object.keys(t3dRooms).forEach((rid) => {
        const [p0, p1] = t3dRooms[rid].players;
        if (p0 === clientID) {
            onlines[clientID].room = {
                name: rid,
                dimension: t3dRooms[rid].dimension,
                scoreless: t3dRooms[rid].scoreless
            }
            onlines[clientID].opponent = p1;
        } else if (p1 === clientID) {
            onlines[clientID].room = {
                name: rid,
                dimension: t3dRooms[rid].dimension,
                scoreless: t3dRooms[rid].scoreless
            }
            onlines[clientID].opponent = p0;

        }
    });
}

const isClientFree = (cid) => !onlines[cid].room || !onlines[cid].room.name;

const roomid = (uid1, uid2) => //create a room uuid for each game
    uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;

const informRoommates = (room, command) => {
    t3dRooms[room.name].players.forEach((cid) => {
        onlines[cid].room = room;
        onlines[cid].socket.send(command);
    });
};

const roomForCorrespondingOngoingLeagueMatch = async(userID, leagueID) => {
    const league = await LeagueModel.findById(leagueID);
    if (!league) {
        const error = new Error("No league has been found");
        error.statusCode = StatusCodes.LeagueNotFound;
        throw error;
    }

    // now search if attender has game in this league
    const { matches } = league;
    const correspondingMatch = matches[matches.length - 1].find((match) =>
        match.players.find((playerID) => playerID === userID)
    );
    if (correspondingMatch) {
        if (new Date(correspondingMatch.schedule) <= new Date()) { // meaning that the game time has started
            console.log("gathering data for user");
            const { players } = correspondingMatch;
            if (!correspondingMatch.game) {
                // if this player is the first attendant
                // get a room
                const { gameID } = await createGame(players[0], players[1], league._type.dimension, true, leagueID);
                correspondingMatch.game = gameID;
                await league.save();

            } // else: just send the gameID to the requester, if the game is not expired
            else {
                // check game game not passed an hour
                // check game is still live (isLive)
                // and check other things like players in the game field to math the league data

            }
            return {
                gameID: correspondingMatch.game.toString(),
                leagueID,
                players,
                dimension: league._type.dimension,
                scoreless: league._type.scoreless
            };
        } else {
            const error = new Error("Game is not started yet!");
            error.statusCode = StatusCodes.NotStartedYet;
            throw error;
        }
    } else {
        const error = new Error(
            "No match has been found for this user in this league!"
        );
        error.statusCode = StatusCodes.MatchNotFound;
        throw error;
    }
}

module.exports.closeThisRoom = (expiredRoomName, canceled = false) => { //when wsGameplay ends a game or collects garbage it syncs its update with this method
    try {
        if (t3dRooms[expiredRoomName]) {
            t3dRooms[expiredRoomName].players.forEach(player => {
                if (onlines[player]) { //if player exists in online list:
                    if (canceled) onlines[player].socket.send(createSocketCommand("GAME_CANCELLED"));
                    onlines[player].room = null;
                    onlines[player].opponent = null;
                }
            })
            delete t3dRooms[expiredRoomName];
        }
    } catch (err) {
        console.log(err);
    }
}

module.exports.Server = (path) => {
    let globalWebSocketServer = new WebSocket.Server({ noServer: true, path });

    //custom method
    globalWebSocketServer.authenticateRoom = () => { //************ */
        // check if roomname is generated by globalSocketServer only
        // im looking forward to add middlewares in sockets
    }

    globalWebSocketServer.on("connection", (socket) => {
        var myID = null;
        socket.on("message", (data) => {
            try {
                const { request, msg, token } = JSON.parse(data);

                const clientID = authenticate.tokenForWS(token); // if anything about token was wrong -> request doesnt process
                console.log("GLOBAL:\treq: ", request, "\tcid: ", clientID, "\tparameter: ", msg, "\troom: ",
                    (onlines[clientID] ?
                        onlines[clientID].room : "none"));
                myID = clientID;
                if (clientID) {
                    switch (request) {
                        case "online":
                            {
                                console.log('GLOBAL:\tonline request by ' + clientID);
                                if (!onlines[clientID]) {
                                    // add user to online list

                                    onlines[clientID] = {
                                        room: {
                                            name: null,
                                            dimension: null,
                                            scoreless: false
                                        },
                                        socket,
                                    };
                                    //log_memory_usage();
                                } else {
                                    myID = clientID; //update myID to make sure its always correct
                                    // really its not needed khodayi!!
                                    onlines[clientID].socket = socket; //always set the save the most recent client connection
                                }

                                findEngagedGame(clientID);
                                const { room, opponent } = onlines[clientID];

                                socket.send(
                                    createSocketCommand("ONLINE", {
                                        players: Object.keys(onlines).length,
                                        games: Object.keys(t3dRooms).length,
                                        room,
                                        opponent
                                    })
                                );
                                break;
                            }
                        case "find":
                            { //*******************if clientID isnt in the onlines -> error */
                                if (!onlines[clientID]) {
                                    //error !! how?
                                    //COMPLETE THIS
                                    return;
                                }
                                const { gameType, scoreless } = msg;

                                onlines[clientID].room = {
                                    name: null,
                                    dimension: +gameType,
                                    scoreless: Boolean(scoreless)
                                }
                                // first search in on going games: maybe user was playing game and went out for some reason
                                findEngagedGame(clientID); //edit this method
                                //find opponent
                                // const { room } = onlines[clientID];
                                if (onlines[clientID].room && onlines[clientID].room.name) {
                                    socket.send(createSocketCommand("FIND_RESULT", {
                                        room: onlines[clientID].room,
                                        opponent: onlines[clientID].opponent
                                    }));
                                } else {
                                    //if player is trying to play a new game
                                    const expectedGame = {...onlines[clientID].room };
                                    console.log(`GLOBAL:\tcid::${clientID} is looking for a game which: `, expectedGame);
                                    let readyClients = Object.keys(
                                        onlines
                                    ).filter(
                                        (cid) =>
                                        onlines[cid].room && !onlines[cid].room.name &&
                                        onlines[cid].room.scoreless === expectedGame.scoreless &&
                                        onlines[cid].room.dimension === expectedGame.dimension && //has the same game type
                                        cid !== clientID // and its not me
                                    );

                                    // search in users with no game to find one

                                    //temp: list every clients game specs to see whats the issue
                                    if (readyClients.length < 1) {
                                        console.log("GLOBAL:\tno random game found, inspecting every online client:");
                                        Object.entries(onlines).forEach(([cid, cdata]) => {
                                            console.log(`cid::${clientID}\troom_status:`, cdata.room);
                                        });
                                    }

                                    if (readyClients.length >= 1) {
                                        // console.table(readyClients);
                                        const rivalID = readyClients[findRandomIndex(readyClients.length)];
                                        const room = { name: roomid(rivalID, clientID), scoreless: expectedGame.scoreless, dimension: expectedGame.dimension };
                                        // inform both clients
                                        if (onlines[rivalID]) {
                                            t3dRooms[room.name] = { players: [clientID, rivalID], dimension: room.dimension, scoreless: room.scoreless };
                                            informRoommates(room, createSocketCommand("FIND_RESULT", {
                                                found: room,
                                                stats: {
                                                    players: Object.keys(onlines).length,
                                                    games: Object.keys(t3dRooms).length
                                                }
                                            }));
                                            //log_memory_usage();
                                        }
                                        // send a cmd to me and opponent with roomName => after both clients set their roomName equally they auto connect
                                    } else {
                                        //send new stats for every try
                                        socket.send(
                                            createSocketCommand("FIND_RESULT", {
                                                found: null,
                                                stats: {
                                                    players: Object.keys(onlines).length,
                                                    games: Object.keys(t3dRooms).length
                                                }
                                            })
                                        );
                                    }
                                }

                                break;
                            }
                        case "attend_league_game":
                            { // MAYBE WRITE THEIS WITH .then .catch
                                (async() => {
                                    const { leagueId } = msg;
                                    const room = await roomForCorrespondingOngoingLeagueMatch(clientID, leagueId);
                                    if (room) {
                                        room.name = roomid(room.players[0], room.players[1]);
                                        t3dRooms[room.name] = room;

                                        // now onform both clients
                                        informRoommates(room, createSocketCommand("ATTEND_LEAGUE_GAME", {
                                            room,
                                            stats: {
                                                players: Object.keys(onlines).length,
                                                games: Object.keys(t3dRooms).length
                                            }
                                        }));
                                    }
                                })();
                                break;

                            }
                        case "friendly_game":
                            { //request a friendlygame from a friend
                                const { askerName, targetID, gameType, scoreless } = msg;
                                findEngagedGame(clientID);
                                const { room } = onlines[clientID];
                                // onlines[clientID].dimension check this or not?
                                if (room && room.name) { //if player is in a game currenly or is searching
                                    socket.send(createSocketCommand("YOUR_BUSY"));
                                    //i think this doesnt work well because of .onclose
                                    socket.send(
                                        createSocketCommand("FIND_RESULT", room)
                                    );
                                } else if (targetID !== clientID) {
                                    if (onlines[targetID]) {
                                        if (!onlines[targetID].room || !onlines[targetID].room.name) {
                                            onlines[targetID].socket.send(createSocketCommand("FRIENDLY_GAME", { askerID: clientID, askerName, gameType, scoreless }));
                                            console.log(`GLOBAL:\tcid::${clientID} sent a friendly game request to cid::${targetID}`);

                                        } else
                                            socket.send(createSocketCommand("TARGET_BUSY"));
                                    } else {
                                        socket.send(createSocketCommand("TARGET_OFFLINE"));
                                    }
                                }
                                break;
                            }
                        case "respond_friendlygame":
                            {
                                const { answer, inviterID, gameType, scoreless } = msg;
                                findEngagedGame(clientID);
                                console.log(`GLOBAL:\tcid::${clientID} responded to a friendly game request made by cid::${inviterID}`);
                                if (answer) {
                                    // if (!onlines[inviterID])
                                    //     socket.send(createSocketCommand("TARGET_OFFLINE"));
                                    if (!onlines[inviterID])
                                        socket.send(createSocketCommand("TARGET_OFFLINE"))
                                    else if (inviterID !== clientID && isClientFree(inviterID) && isClientFree(clientID)) {
                                        const room = { name: roomid(inviterID, clientID), scoreless, dimension: gameType };
                                        t3dRooms[room.name] = { players: [inviterID, clientID], dimension: room.dimension, scoreless: room.scoreless };
                                        console.log(`GLOBAL:\tfriendly game initiated successfully in room::${room.name}`);
                                        informRoommates(room, createSocketCommand("INVITATION_ACCEPTED", room));
                                        //log_memory_usage();
                                    }
                                } else {
                                    //if asker is online -> sen negative to him as a Notify message
                                }
                                break;
                            }
                        case "friendship":
                            {
                                const { targetID, askerName } = msg;
                                //inform the target
                                if (onlines[targetID])
                                    onlines[targetID].socket.send(createSocketCommand("FRIENDSHIP_REQUEST", { askerID: clientID, askerName }));
                                else
                                    socket
                                break;
                            }
                        case "respond_friendship":
                            {
                                const { answer, targetName, askerID } = msg;
                                // target responds to the request
                                // inform the asker what the answer is
                                onlines[askerID].socket.send(createSocketCommand("FRIENDSHIP_RESPONSE", { answer, targetName }));
                                if (answer) {
                                    //if acceted then save their friendship in data base
                                    makeFriends([askerID, clientID]);
                                    // createChat(askerID, clientID);
                                }
                                break;
                            }
                        case "chat":
                            {
                                const { friendID, name, text } = msg;
                                // use chatRooms to save all messages
                                if (text) { // ignore empty texts
                                    if (!saveMessage(clientID, friendID, text)) { //when sth goes wronge in saveMessage it returns false
                                        console.log('GLOBAL:\tsomething went off while trying to save msg');

                                    }
                                    if (onlines[friendID]) //if his online send it immediatly --> o.w. friend sees new message in his chatroom while loading
                                        onlines[friendID].socket.send(createSocketCommand("CHAT", { friendID: clientID, name, text }));
                                }
                                break;
                            }
                        case "close_game":
                            {
                                // msg -> closing room
                                if (onlines[clientID]) {
                                    const { room } = onlines[clientID];
                                    if (room && room.name) { //check if client belongs to a game room
                                        if (t3dRooms[room.name]) { //delete the room in t3dRooms list if it still exists
                                            delete t3dRooms[room.name];
                                            console.log("GLOBAL:\tdeletedroom: ", room);
                                        };

                                        onlines[clientID].room = null;
                                    }
                                }
                                break;
                            }
                        default:
                            {
                                //...whatever
                                break;
                            }
                    }
                } else throw new Error("client didnt sent an ID!");
                // console.table(onlines);
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
            //check this
            //i want this: when user gets out, and turns back to game and game is still continuing, send back previous room id
            delete onlines[myID];
            console.log("GLOBAL:\t" + myID + " disconnected");
            myID = null;
            //if game ended, remove t3dRooms[rid]
            //... complete this
        });
    });
    return globalWebSocketServer;
};
