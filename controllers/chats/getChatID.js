module.exports = (contributer1, contributer2) => {
    let contributerIndex = undefined,
        chatID = undefined;
    if (contributer1 < contributer2) {
        chatID = `${contributer1}_${contributer2}`;
        contributerIndex = 0;
    } else {
        chatID = `${contributer2}_${contributer1}`;
        contributerIndex = 1;
    }
    return [chatID, contributerIndex];
}