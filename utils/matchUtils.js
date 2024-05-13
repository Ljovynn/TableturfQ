import { matchStatuses, matchResults, Match, Game, MatchRuleset, Player, matchModes, currentCasualRuleset, currentRankedRuleset, ChatMessage} from "../public/constants/matchData";

export function ConvertMatchStatusToResult(matchStatus){
    switch (matchStatus){
        case matchStatuses.player1Win:
            return matchResults.player1Win;
        case matchStatus.player2Win:
            return matchResults.player2Win;
        default:
            return matchResults.noWinner;
    }
}

function ConvertResultToMatchStatus(matchResult){
    switch (matchResult){
        case matchResults.player1Win:
            return matchStatuses.player1Win;
        case matchResults.player2Win:
            return matchStatuses.player2Win;
        default:
            return matchStatuses.dispute;
    }
}

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
    var ruleset = currentCasualRuleset;
    if (matchData.ranked == true) {
        matchMode = matchModes.ranked;
        ruleset = currentRankedRuleset;
    }
    var match = new Match(matchData.id, matchData.player1_id, matchData.player2_id, matchMode, ruleset);
    match.status = ConvertResultToMatchStatus(matchData.result);
    match.createdAt = matchData.created_at;

    match.gamesArr = [];
    for (let i = 0; i < gamesData.length; i++){
        if (i != 0) match.gamesArr.push(new Game());

        match.gamesArr[i].stage = gamesData[i].stage;
        if (gamesData[i].result != 0){
            match.gamesArr[i].winnerId = match.players[gamesData[i].result - 1];
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