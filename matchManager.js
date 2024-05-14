import {stages, matchStatuses, matchModes, Game, Match, ChatMessage} from "./public/constants/matchData.js";
import { ApplyMatchEloResults } from "./glicko2Manager.js";
import { CreateMatch, SetMatchResult } from "./database.js";
import { FindPlayerPosInMatch } from "./utils/matchUtils.js";
import { AddRecentlyMatchedPlayers } from "./matchmakingManager.js";
import { json } from "express";

var matches = [];

//tick for match timers
export async function MatchTick(){

}

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

//TODO: make it so multiple strikes are sent together
export function PlayerSentStageStrike(playerId, stage){
    var match = FindMatchWithPlayer(playerId);
    if (!match) return false;

    var playerPos = FindPlayerPosInMatch(match, playerId);

    if (match.status != matchStatuses.stageSelection) return false;

    if (match.gamesArr.length == 1){
        return StarterStrikeLogic(match, playerPos, stage);
    } else{
        return CounterpickLogic(match, playerId, playerPos, stage);
    }
}

//TODO: make it array of stages
function StarterStrikeLogic(match, playerPos, stage){
    const stageList = match.mode.rulesetData.starterStagesArr;
    var game = match.gamesArr[0];

    if (!stageList.includes(stage)) return false;

    if (game.strikes.includes(stage)) return false;

    if (game.strikes.length >= stageList.length - 1) return false;

    if ((game.strikes.length + 1) % 4 < 2){
        if (playerPos == 2) return false;
    } else{
        if (playerPos == 1) return false;
    }

    game.strikes.push(stage);
    if (CheckStarterStrikesFinished(game, stageList)) match.status = matchStatuses.ingame;
    return true;
}

function CheckStarterStrikesFinished(game, stageList){
    if (game.strikes.length == stageList.length - 1){
        for (let i = 0; i < stageList.length; i++){
            if (!game.strikes.includes(stageList[i])){
                game.stage = stageList[i];
                return true;
            }
        }
    }
    return false;
}

function CounterpickLogic(match, playerId, playerPos, stage){
    const stageList = match.mode.rulesetData.counterPickStagesArr;
    var game = match.gamesArr[match.gamesArr.length - 1];

    if (match.gamesArr[match.gamesArr.length - 2].winnerId != playerId) return false;

    if (!stageList.includes(stage)) return false;

    if (match.players[playerPos - 1].unpickableStagesArr.includes(stage)) return false;

    if (game.strikes.includes(stage)) return false;

    if (game.strikes.length >= match.mode.rulesetData.counterPickBans) return false;

    if (match.players[playerPos % 2].unpickableStagesArr.includes(stage)) return false;

    game.strikes.push(stage);
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

export function PlayerSentGameWin(playerId, winnerId){
    var match = FindMatchWithPlayer(playerId);
    if (!match) return false;
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

    game.winnerId = winnerId;
    match.status = matchStatuses.stageSelection;
    CheckMatchWin(match, winnerId);
    return true;
}

function CheckMatchWin(match, winnerId){
    var winCount = 0;
    for (let i = 0; i < match.gamesArr.length; i++){
        if (match.gamesArr[i].winnerId != winnerId){
            continue;
        }
        winCount++;
        if (winCount >= match.setLength){
            match.status = matchStatuses.verifyingResults;
            match.winnerId = winnerId;
            return true;
        }
    }
    match.gamesArr.push(new Game());
    return false;
}

export async function PlayerSentMatchVerification(playerId){
    var match = FindMatchWithPlayer(playerId);
    if (!match) return false;

    var playerPos = FindPlayerPosInMatch(match, playerId);

    if (match.mode == matchModes.casual) return false;
    if (match.status != matchStatuses.verifyingResults) return false;

    match.players[playerPos - 1].hasVerifiedResult = true;

    await CheckAllPlayersVerified(match);

    return true;
}

async function CheckAllPlayersVerified(match){
    if (match.players[0].hasVerifiedResult == false || match.players[1].hasVerifiedResult == false) return false;

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

export function PlayerSentChatMessage(content, playerId){
    var match = FindMatchWithPlayer(playerId);
    if (!match) return false;

    var chatMessage = new ChatMessage(content, playerId)
    match.chat.push(chatMessage);
}

export function PlayerSentMatchDispute(){

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