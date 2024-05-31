import {stages, matchStatuses, matchModes, Game, Match, ChatMessage} from "./public/constants/matchData.js";
import { ApplyMatchEloResults } from "./glicko2Manager.js";
import { CreateMatch, GetUserData, SetMatchResult } from "./database.js";
import { FindPlayerPosInMatch } from "./utils/matchUtils.js";
import { AddRecentlyMatchedPlayers } from "./queManager.js";
import { userRoles } from "./public/constants/userData.js";

var matches = [];

/*var match = await MakeNewMatch(1, 2, matchModes.ranked);

PlayerSentStageStrikes(1, [stages.thunderPoint]);
PlayerSentStageStrikes(2, [stages.mainStreet, stages.lakefrontProperty]);
PlayerSentStageStrikes(1, [stages.riverDrift]);

await PlayerSentGameWin(1, 1);
await PlayerSentGameWin(2, 1);

PlayerSentStageStrikes(1, [stages.mainStreet, stages.crackerSnap, stages.boxSeats]);
PlayerSentStagePick(2, stages.doubleGemini);
await PlayerSentGameWin(2, 1);
await PlayerSentGameWin(1, 1);

PlayerSentStageStrikes(1, [stages.girderForBattle, stages.crackerSnap, stages.boxSeats]);
PlayerSentStagePick(2, stages.lakefrontProperty);
await PlayerSentGameWin(2, 2);
await PlayerSentGameWin(1, 2);

PlayerSentStageStrikes(2, [stages.thunderPoint, stages.pedalToTheMedal, stages.twoLaneSplattop]);
PlayerSentStagePick(1, stages.lakefrontProperty);
await PlayerSentGameWin(2, 1);

await UserSentChatMessage(1, "Hej på dig leverpastej");
await UserSentChatMessage(2, "Smaken är som röven klöven");
await PlayerSentGameWin(1, 1);

console.log(JSON.stringify(match));*/

// zeb testing
matches.push( new Match(7, 10, 3, matchModes.ranked) );

export async function MakeNewMatch(player1Id, player2Id, matchMode){

    //randomize player positions
    //disabled for testing purposes
    /*
    var tempName;
    let r = Math.floor(Math.random() * 2);
    if (r == 1){
        let tempName = player1Id;
        player1Id = player2Id;
        player2Id = tempName;
    }*/

    var isRanked = false;
    if (matchMode == matchModes.ranked){
        isRanked = true;
    }

    const matchId = await CreateMatch(player1Id, player2Id, isRanked);
    if (!matchId) return;

    var match = new Match(matchId, player1Id, player2Id, matchMode);
    matches.push(match);
    return match;
}

export function PlayerSentStageStrikes(playerId, stages){
    var match = FindMatchWithPlayer(playerId);
    if (!match) return;

    var playerPos = FindPlayerPosInMatch(match, playerId);

    if (match.status != matchStatuses.stageSelection) return;

    if (match.gamesArr.length == 1){
        if (!StarterStrikeLogic(match, playerPos, stages)) return;
        return match.id;
    } else{
        if (!CounterpickStrikingLogic(match, playerId, playerPos, stages)) return;
        return match.id;
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
    //for each stage
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
    if (!match) return;

    var playerPos = FindPlayerPosInMatch(match, playerId);

    if (match.status != matchStatuses.stageSelection) return;
    if (match.gamesArr.length <= 1) return;

    if (!match.mode.rulesetData.counterPickStagesArr.includes(stage)) return;

    if (match.players[playerPos - 1].unpickableStagesArr.includes(stage)) return;

    if (match.gamesArr[match.gamesArr.length - 2].winnerId == playerId) return;

    var game = match.gamesArr[match.gamesArr.length - 1];

    if (game.strikes.length < match.mode.rulesetData.counterPickBans) return;

    game.stage = stage;
    match.status = matchStatuses.ingame;
    return match.id;
}

export async function PlayerSentGameWin(playerId, winnerId){
    var match = FindMatchWithPlayer(playerId);
    var data = {
        matchId,
        dispute: false
    }
    if (!match) return;

    data.matchId = match.id;

    var playerPos = FindPlayerPosInMatch(match, playerId);

    if (match.mode == matchModes.casual) return;
    if (match.status != matchStatuses.ingame) return;

    var winnerPos;
    if (match.players[0].id == winnerId){
        winnerPos = 1;
    } else if (match.players[1].id == winnerId){
        winnerPos = 2;
    } else{
        return;
    }

    match.players[playerPos - 1].gameConfirmed = true;

    var game = match.gamesArr[match.gamesArr.length - 1];

    if (game.winnerId == 0){
        game.winnerId = winnerId;
    } else if (game.winnerId != winnerId){
        match.players[0].gameConfirmed = false;
        match.players[1].gameConfirmed = false;

        match.status = matchStatuses.dispute;
        data.dispute = true;
    }

    //check game verified
    if (match.players[0].gameConfirmed && match.players[1].gameConfirmed){

        if (match.mode.rulesetData.dsr){
            match.players[winnerPos - 1].unpickableStagesArr.push(game.stage);
        }

        match.status = matchStatuses.stageSelection;

        if (CheckMatchWin(match, winnerId)){
            match.winnerId = winnerId;
            if (await HandleMatchWin(match)) return data;
            return false;
        } else{
            match.gamesArr.push(new Game());
            match.players[0].gameConfirmed = false;
            match.players[1].gameConfirmed = false;
        }
    }
    
    return data;
}

function CheckMatchWin(match, winnerId){
    var winCount = 0;
    for (let i = 0; i < match.gamesArr.length; i++){
        if (match.gamesArr[i].winnerId != winnerId){
            continue;
        }
        winCount++;
        if (winCount >= match.mode.rulesetData.setLength){
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

    console.log("boutta apply elo");
    await ApplyMatchEloResults(match);

    return true;
}

export async function PlayerSentCasualMatchEnd(playerId){
    var match = FindMatchWithPlayer(playerId);
    if (!match) return;

    if (!await FinishMatch(match)) return;

    return match.id;
}

export function UserSentChatMessage(playerId, content){
    var match = FindMatchWithPlayer(playerId);

    if (!match) return;

    var chatMessage = new ChatMessage(content, playerId);
    match.chat.push(chatMessage);
    return match.id;
}

export async function ModSentChatMessage(matchId, userId, content){
    var user = await GetUserData(userId);
    if (!user) return;
    
    if (user.role != userRoles.mod) return;

    var match = FindMatch(matchId);
    if (!match) return;

    var chatMessage = new ChatMessage(content, userId);
    match.chat.push(chatMessage);
    return match.id;
}

export function PlayerSentMatchDispute(playerId){
    var match = FindMatchWithPlayer(playerId);

    if (!match) return false;

    if (match.status == matchStatuses.dispute) return false;

    match.status = matchStatuses.dispute;
    return true;
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
    await SetMatchResult(match);

    const matchIndex = matches.indexOf(match);
    if (matchIndex == -1) return false;
    matches.splice(matchIndex, 1);

    AddRecentlyMatchedPlayers(match.players[0].id, match.players[1].id, match.mode);

    return true;
}