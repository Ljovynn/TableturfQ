import { Match, Game, matchModes, ChatMessage } from "../public/constants/matchData.js";

export function FindPlayerPosInMatch(match, playerId){
    if (match.players[0].id == playerId){
        return 1;
    } else if (match.players[1].id == playerId){
        return 2;
    }
    return 0;
}

export function ConvertDBMatchToMatch(matchData, gamesData, strikeData, chatMessages){
    var matchMode = matchModes.casual;
    if (matchData.ranked == true) {
        matchMode = matchModes.ranked;

    }

    if (matchData.player1_id == null) matchData.player1_id = 0;
    if (matchData.player2_id == null) matchData.player2_id = 0;

    var match = new Match(matchData.id, matchData.player1_id, matchData.player2_id, matchMode);
    match.status = matchData.result;
    match.createdAt = matchData.created_at;

    match.gamesArr = [];
    for (let i = 0; i < gamesData.length; i++){
        match.gamesArr.push(new Game());

        match.gamesArr[i].stage = gamesData[i].stage;
        if (gamesData[i].result != 0){
            match.gamesArr[i].winnerId = match.players[gamesData[i].result - 1].id;
        }

        for (let j = 0; j < strikeData[i].length; j++){
            match.gamesArr[i].strikes.push(strikeData[i][j].stage);
        }
    }

    for (let i = 0; i < chatMessages.length; i++){
        var chatMessage = new ChatMessage(chatMessages[i].content, chatMessages[i].owner_id);
        match.chat.push(chatMessage);
    }

    return match;
}