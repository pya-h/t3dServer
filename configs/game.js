module.exports = {
    TurnTimeOut: 45000, //45000, //mili-secs: 30 seconds
    AllowedFrequestMissedMoves: 3, // 3 frequent missed timeouts to declare losing
    GameSections: ["free", "league"],
    GameStatusScores: { WIN: 3, DRAW: 1, LOSE: 0 }
}
