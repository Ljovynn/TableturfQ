import { Match, Game, ChatMessage, matchModes, systemId } from "../public/constants/matchData.js";

export function FindPlayerPosInMatch(match, playerId){
    if (match.players[0].id === playerId){
        return 1;
    } else if (match.players[1].id === playerId){
        return 2;
    }
    return 0;
}

export function ConvertDBMatchToMatch(matchData, gamesData, strikeData, chatMessages){
    let matchMode = (matchData.ranked || matchData.private_battle) ? matchModes.ranked : matchModes.casual;

    let match = new Match(matchData.id, matchData.player1_id, matchData.player2_id, matchMode, matchData.private_battle, matchData.set_length);
    match.status = matchData.result;
    match.createdAt = matchData.unix_created_at;

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

    for (let i = chatMessages.length - 1; i >= 0; i--){
        let ownerId = (chatMessages[i].owner_id) ? chatMessages[i].owner_id : systemId;
        let chatMessage = new ChatMessage(chatMessages[i].content, ownerId, (chatMessages[i].unix_date * 1000));
        match.chat.push(chatMessage);
    }

    return match;
}