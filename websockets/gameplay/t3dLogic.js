const GAME_STATUS = { WIN: 3, DRAW: 1, LOSE: 0 };
const { updateRecords } = require("../../controllers/users");
const { saveGame } = require("../../controllers/games");

const initiate = (gameType, scoreless) => {
    const dimension = gameType; //temp
    // create an empy dimen*dimen*dimen table
    //algorythm: ex for dimension = 4:
    //table = [ [null*4]*4 ] * 4
    const indexes = [];
    for (let i = 0; i < dimension; i++) indexes.push(i);
    const table = indexes.map(() => indexes.map(() => indexes.map(() => null)));

    //return game data
    return {
        dimension,
        scoreless,
        playerX: { id: null, socket: null, score: 0 },
        playerO: { id: null, socket: null, score: 0 },
        lastMove: null,
        emptyCells: dimension * dimension * dimension,
        table,
        turn: 0,
        gameID: null,
        forceCloseTime: -1, //time when game closes by force, if this is not set means games not started
        timer: { start: -1, id: null, t0: -1, timeouts: [0, 0] } //turn timer | t0 --> time new setTimeout called: meaning time player turn starts |
        // timeouts[X,O]: number of repeated timeouts
    };
};

const getCellCoordinates = (cellID, dimen) => {
    const cellFloor = Math.floor(cellID / (dimen * dimen));
    const onFloorId = cellID % (dimen * dimen);
    const cellRow = Math.floor(onFloorId / dimen);
    const cellColumn = onFloorId % dimen;
    // just test a random id to see how above formula works!
    return { floor: cellFloor, row: cellRow, column: cellColumn };
};

const inspectAreaAroundTheCell = async(game, cell) => {
    const { floor, row, column } = cell;
    const { playerX, playerO, dimension, table } = game;
    const playerInTheCell = table[floor][row][column];
    let rowCount = 0,
        columnCount = 0,
        floorMainDiagCount = 0,
        floorSideDiagCount = 0,
        tableMainDiagCount = 0,
        tableSideDiagCount = 0,
        tableAltitudeCount = 0,
        tableRowFloorMainDiagCount = 0,
        tableRowFloorSideDiagCount = 0,
        tableColumnFloorMainDiagCount = 0,
        tableColumnFloorSideDiagCount = 0;

    for (let i = 0; i < dimension; i++) {
        if (table[floor][row][i] === playerInTheCell) rowCount++; // inspect in a row
        if (table[floor][i][column] === playerInTheCell) columnCount++; // inspect in a column
        if (table[i][row][column] === playerInTheCell) tableAltitudeCount++; // inspect in a altitude line
        if (row === column) {
            if (table[floor][i][i] === playerInTheCell) floorMainDiagCount++; // inspect in a 2D main diagonal line through the cell's floor
            if (row === floor && table[i][i][i] === playerInTheCell)
                tableMainDiagCount++; // inspect in a 3D main diagonal line through the whole table
        }
        if (row + column + 1 === dimension) {
            if (table[floor][i][dimension - i - 1] === playerInTheCell)
                floorSideDiagCount++; // inpect in a 2D side Diagonal line through the cell's floor
            if (row === floor && table[i][i][dimension - i - 1] === playerInTheCell)
                tableSideDiagCount++; // inspect in a 3D side diagonal line through the whole table
        }
        if (floor === column && table[i][row][i] === playerInTheCell)
            tableRowFloorMainDiagCount++;
        if (floor + column + 1 === dimension && table[i][row][dimension - i - 1] === playerInTheCell)
            tableRowFloorSideDiagCount++;
        if (floor === row && table[i][i][column] === playerInTheCell)
            tableColumnFloorMainDiagCount++;
        if (floor + row + 1 === dimension && table[i][dimension - i - 1][column] === playerInTheCell)
            tableColumnFloorSideDiagCount++;
    }

    let totalScore = 0;
    [rowCount, columnCount, floorMainDiagCount, floorSideDiagCount, tableMainDiagCount, tableSideDiagCount, tableAltitudeCount,
        tableRowFloorMainDiagCount, tableRowFloorSideDiagCount, tableColumnFloorMainDiagCount, tableColumnFloorSideDiagCount
    ].forEach((count) => {
        if (count === dimension) totalScore++;
    });

    if (playerInTheCell === 1) playerX.score += totalScore;
    else playerO.score += totalScore;

    try {
        if (totalScore > 0)
            await saveGame(
                game.gameID,
                game.playerX.id,
                game.playerO.id,
                game.playerX.score,
                game.playerO.score,
                true
            );
    } catch (err) {
        console.log(err);
    }
};

const evaluateAndEndGame = async(game) => {
    try {
        const { playerX, playerO } = game;

        // first update each player's records
        let xAchievement = undefined,
            oAchievement = undefined;
        if (playerX.score > playerO.score) {
            xAchievement = GAME_STATUS.WIN;
            oAchievement = GAME_STATUS.LOSE;
        } else if (playerX.score < playerO.score) {
            xAchievement = GAME_STATUS.LOSE;
            oAchievement = GAME_STATUS.WIN;
        } else xAchievement = oAchievement = GAME_STATUS.DRAW;

        updateRecords(playerX.id, xAchievement);
        updateRecords(playerO.id, oAchievement);

        // now save game result in games collection:

        await saveGame(
            game.gameID,
            game.playerX.id,
            game.playerO.id,
            game.playerX.score,
            game.playerO.score,
            false
        );
    } catch (err) {
        console.log(err);
        //check ...
    }
};

module.exports = {
    initiate,
    getCellCoordinates,
    inspectAreaAroundTheCell,
    evaluateAndEndGame,
};
