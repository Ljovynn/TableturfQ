import {stages, matchStatuses, matchModes, Game, Match, ChatMessage} from "./public/constants/matchData.js";
import { ApplyMatchEloResults } from "./glicko2Manager.js";
import { CreateMatch, SetMatchResult } from "./database.js";
import { FindPlayerPosInMatch } from "./utils/matchUtils.js";
import { AddRecentlyMatchedPlayers } from "./matchmakingManager.js";

var matches = [];

/*var match = await MakeNewMatch(1, 1, 2, matchModes.ranked);

PlayerSentStageStrike(1, stages.thunderPoint);
PlayerSentStageStrike(2, stages.mainStreet);
PlayerSentStageStrike(2, stages.lakefrontProperty);
PlayerSentStageStrike(1, stages.riverDrift);
PlayerSentGameWin(1, 1);
PlayerSentStageStrike(1, stages.thunderPoint);
PlayerSentStageStrike(1, stages.boxSeats);
PlayerSentStageStrike(1, stages.crackerSnap);
PlayerSentStagePick(2, stages.doubleGemini);
PlayerSentGameWin(2, 1);

console.log(JSON.stringify(match));*/

export async function MakeNewMatch(player1Id, player2Id, matchMode){
    //TODO: random player pos

    var isRanked = false;
    if (matchMode == matchModes.ranked){
        isRanked = true;
    }

    const matchId = await CreateMatch(player1Id, player2Id, isRanked);
    if (!matchId) return false;

    var match = new Match(matchId, player1Id, player2Id, matchMode);
    matches.push(match);
    return match;
}

export function PlayerSentStageStrikes(playerId, stages){
    var match = FindMatchWithPlayer(playerId);
    if (!match) return false;

    var playerPos = FindPlayerPosInMatch(match, playerId);

    if (match.status != matchStatuses.stageSelection) return false;

    if (match.gamesArr.length == 1){
        return StarterStrikeLogic(match, playerPos, stages);
    } else{
        return CounterpickStrikingLogic(match, playerId, playerPos, stages);
    }
}

function StarterStrikeLogic(match, playerPos, stages){
    const stageList = match.mode.rulesetData.starterStagesArr;
    var game = match.gamesArr[0];

    var correctStagesLength = 2;
    if (game.strikes.length == 0 || game.strikes.length >= stageList.length - 2){
        correctStagesLength = 1;
    }

    if (stages.length != correctStagesLength) return false;

    //Check if current player
    if ((game.strikes.length + 1) % 4 < 2){
        if (playerPos == 2) return false;
    } else{
        if (playerPos == 1) return false;
    }

    //check each stage
    var alreadySentStages = [];
    for (let i = 0; i < stages.length; i++){
        if (!stageList.includes(stages[i])) return false;

        if (alreadySentStages.includes(stages[i])) return false;
        alreadySentStages.push(stages[i]);

        if (game.strikes.includes(stages[i])) return false;
    }

    for (let i = 0; i < stages.length; i++){
        game.strikes.push(stages[i]);
    }
    
    if (CheckStarterStrikesFinished(game, stageList)){
        match.status = matchStatuses.ingame;
    }
    return true;
}

function CheckStarterStrikesFinished(game, stageList){
    if (game.strikes.length < stageList.length - 1) return false;
    for (let i = 0; i < stageList.length; i++){
        if (!game.strikes.includes(stageList[i])){
            game.stage = stageList[i];
            return true;
        }
    }
    return false;
}

function CounterpickStrikingLogic(match, playerId, playerPos, stages){
    const stageList = match.mode.rulesetData.counterPickStagesArr;
    var game = match.gamesArr[match.gamesArr.length - 1];

    if (stages.length != match.mode.rulesetData.counterPickBans) return false;

    if (match.gamesArr[match.gamesArr.length - 2].winnerId != playerId) return false;

    var alreadySentStages = [];
    for (let i = 0; i < stages.length; i++){
        if (!stageList.includes(stages[i])) return false;

        if (alreadySentStages.includes(stages[i])) return false;
        alreadySentStages.push(stages[i]);

        if (match.players[playerPos % 2].unpickableStagesArr.includes(stages[i])) return false;

        if (game.strikes.includes(stages[i])) return false;
    }

    for (let i = 0; i < stages.length; i++){
        game.strikes.push(stages[i]);
    }
    return true;
}

export function PlayerSentStagePick(playerId, stage){
    var match = FindMatchWithPlayer(playerId);
    if (!match) return false;

    var playerPos = FindPlayerPosInMatch(match, playerId);

    if (match.status != matchStatuses.stageSelection) return false;
    if (match.gamesArr.length <= 1) return false;

    if (!match.mode.rulesetData.counterPickStagesArr.includes(stage)) return false;

    if (match.players[playerPos - 1].unpickableStagesArr.includes(stage)) return false;

    if (match.gamesArr[match.gamesArr.length - 2].winnerId == playerId) return false;

    var game = match.gamesArr[match.gamesArr.length - 1];

    if (game.strikes.length < match.mode.rulesetData.counterPickBans) return false;

    game.stage = stage;
    match.status = matchStatuses.ingame;
    return true;
}

export async function PlayerSentGameWin(playerId, winnerId){
    var match = FindMatchWithPlayer(playerId);
    if (!match) return false;

    var playerPos = FindPlayerPosInMatch(match, playerId);

    if (match.mode == matchModes.casual) return false;
    if (match.status != matchStatuses.ingame) return false;

    var winnerPos;
    if (match.players[0].id == winnerId){
        winnerPos = 1;
    } else if (match.players[1].id == winnerId){
        winnerPos = 2;
    } else{
        return false;
    }

    var game = match.gamesArr[match.gamesArr.length - 1];

    if (match.mode.rulesetData.dsr){
        match.players[winnerPos - 1].unpickableStagesArr.push(game.stage);
    }

    if (playerPos == 1){
            game.player1Confirmed = true;
        } else{
            game.player2Confirmed = true;
        }

    if (game.winnerId == 0){
        game.winnerId = winnerId;
    } else if (game.winnerId != winnerId){
        game.player1Confirmed = false;
        game.player2Confirmed = false;

        //TODO: dispute
    }

    //check game verified
    if (game.player1Confirmed && game.player2Confirmed){
        match.status = matchStatuses.stageSelection;

        if (await CheckMatchWin(match, winnerId)){
            match.winnerId = winnerId;
            if (HandleMatchWin(match)) return true;
            return false;
        } else{
            match.gamesArr.push(new Game());
        }
    }
    return true;
}

async function CheckMatchWin(match, winnerId){
    var winCount = 0;
    for (let i = 0; i < match.gamesArr.length; i++){
        if (match.gamesArr[i].winnerId != winnerId){
            continue;
        }
        winCount++;
        if (winCount >= match.setLength){
            return true;
        }
    }
    return false;
}

async function HandleMatchWin(match){
    if (match.players[0].id == match.winnerId){
        match.status = matchStatuses.player1Win;
    } else {
        match.status = matchStatuses.player2Win;
    }

    if (!await FinishMatch(match)) return false;

    if (!ApplyMatchEloResults(match)) return false;

    return true;
}

export async function PlayerSentCasualMatchEnd(playerId){
    var match = FindMatchWithPlayer(playerId);
    if (!match) return false;

    if (!await FinishMatch(match)) return false;

    return true;
}

export function PlayerSentChatMessage(playerId, content){
    var match = FindMatchWithPlayer(playerId);
    if (!match) return false;

    var chatMessage = new ChatMessage(content, playerId)
    match.chat.push(chatMessage);
}

export function PlayerSentMatchDispute(playerId){

}

export function ResolveMatchDispute(matchId, resolveOption){

}

export function FindMatch(matchId){
    for (let i = 0; i < matches.length; i++){
        if (matches[i].id == matchId){
            return matches[i];
        }
    }
}

export function FindIfPlayerInMatch(playerId){
    for (let i = 0; i < matches.length; i++){
        if (matches[i].players[0].id == playerId || matches[i].players[1].id == playerId){
            return true;
        }
    }
    return false;
}

export function FindMatchWithPlayer(playerId){
    for (let i = 0; i < matches.length; i++){
        if (matches[i].players[0].id == playerId || matches[i].players[1].id == playerId){
            return matches[i];
        }
    }
}

async function FinishMatch(match){
    const result = await SetMatchResult(match);

    const matchIndex = matches.indexOf(match);
    if (matchIndex == -1) return false;
    matches.splice(matchIndex, 1);

    AddRecentlyMatchedPlayers(match.players[0].id, match.players[1].id, match.mode);

    return result;
}