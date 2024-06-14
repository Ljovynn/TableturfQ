import {stages, matchStatuses, matchModes, Game, Match, ChatMessage, disputeResolveOptions} from "./public/constants/matchData.js";
import { ApplyMatchEloResults } from "./glicko2Manager.js";
import { CreateMatch, SetMatchResult } from "./database.js";
import { FindPlayerPosInMatch } from "./utils/matchUtils.js";
import { AddRecentlyMatchedPlayers } from "./queManager.js";
import { SendDisputeMessage } from "./discordBot/discordBotManager.js";
import { ResponseData } from "./public/Responses/ResponseData.js";
import { casualMatchEndErrors, chatMessageErrors, disputeErrors, gameWinErrors, matchCreatingErrors, resolveErrors, stagePickErrors, stageStrikeErrors } from "./public/Responses/matchErrors.js";

var matches = [];

// zeb testing
matches.push( new Match(7, 10, 3, matchModes.ranked) );
//matches.push( new Match(7, 10, 3, matchModes.casual) );

//Ljovynn testing

/*var m1 = new Match(1, 1, 2, matchModes.ranked);
m1.status = matchStatuses.dispute;

var m2 = new Match(2, 1, 2, matchModes.ranked);

var m3 = new Match(3, 2, 3, matchModes.ranked);
m3.status = matchStatuses.dispute;

matches.push(m1);
matches.push(m2);
matches.push(m3);

console.log(JSON.stringify(m1));
console.log(matches.length);*/

//TODO
export async function CancelOldMatches(cutoffTime){
    var cutoffDate = Date.now() - cutoffTime;
    for (let i = 0; i < matches.length; i++){
        //matches array sorted chronologically, can break here
        if (matches[i].createdAt > cutoffDate) return;

        
    }
}

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
    if (!matchId) return new ResponseData(false, matchCreatingErrors.databaseError);

    var match = new Match(matchId, player1Id, player2Id, matchMode);
    matches.push(match);
    return new ResponseData(true, match);
}

export function PlayerSentStageStrikes(playerId, stages){
    var match = FindMatchWithPlayer(playerId);
    if (!match) return new ResponseData(false, stageStrikeErrors.noMatch);

    var playerPos = FindPlayerPosInMatch(match, playerId);

    if (match.status != matchStatuses.stageSelection) return new ResponseData(false, stageStrikeErrors.wrongStatus);

    var strikeResponse;
    if (match.gamesArr.length == 1){
        strikeResponse = StarterStrikeLogic(match, playerPos, stages);
    } else{
        strikeResponse = CounterpickStrikingLogic(match, playerId, playerPos, stages);
    }
    return strikeResponse;
}

function StarterStrikeLogic(match, playerPos, stages){
    const stageList = match.mode.rulesetData.starterStagesArr;
    var game = match.gamesArr[0];

    var correctStagesLength = 2;
    if (game.strikes.length == 0 || game.strikes.length >= stageList.length - 2){
        correctStagesLength = 1;
    }

    if (stages.length != correctStagesLength) return new ResponseData(false, stageStrikeErrors.stageAmountIncorrect);

    //Check if current player
    if ((game.strikes.length + 1) % 4 < 2){
        if (playerPos == 2) return new ResponseData(false, stageStrikeErrors.wrongPlayer);
    } else{
        if (playerPos == 1) return new ResponseData(false, stageStrikeErrors.wrongPlayer);
    }

    //check each stage
    var alreadySentStages = [];
    for (let i = 0; i < stages.length; i++){
        if (!stageList.includes(stages[i])) return new ResponseData(false, stageStrikeErrors.stageNotInStagelist);

        if (alreadySentStages.includes(stages[i])) return new ResponseData(false, stageStrikeErrors.stageAlreadyStriked);
        alreadySentStages.push(stages[i]);

        if (game.strikes.includes(stages[i])) return new ResponseData(false, stageStrikeErrors.stageAlreadyStriked);
    }

    for (let i = 0; i < stages.length; i++){
        game.strikes.push(stages[i]);
    }
    
    if (CheckStarterStrikesFinished(game, stageList)){
        match.status = matchStatuses.ingame;
    }
    return new ResponseData(true, match.id);
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

    if (stages.length != match.mode.rulesetData.counterPickBans) return new ResponseData(false, stageStrikeErrors.stageAmountIncorrect);

    if (match.gamesArr[match.gamesArr.length - 2].winnerId != playerId) return new ResponseData(false, wrongPlayer);

    var alreadySentStages = [];
    //for each stage
    for (let i = 0; i < stages.length; i++){
        if (!stageList.includes(stages[i])) return new ResponseData(false, stageStrikeErrors.stageNotInStagelist);

        if (alreadySentStages.includes(stages[i])) return new ResponseData(false, stageStrikeErrors.stageAlreadyStriked);
        alreadySentStages.push(stages[i]);

        if (match.players[playerPos % 2].unpickableStagesArr.includes(stages[i])) return new ResponseData(false, stageStrikeErrors.DSRunpickable);

        if (game.strikes.includes(stages[i])) return new ResponseData(false, stageStrikeErrors.stageAlreadyStriked);
    }

    for (let i = 0; i < stages.length; i++){
        game.strikes.push(stages[i]);
    }
    return new ResponseData(true, match.id);
}

export function PlayerSentStagePick(playerId, stage){
    var match = FindMatchWithPlayer(playerId);
    if (!match) return new ResponseData(false, stagePickErrors.noMatch);

    var playerPos = FindPlayerPosInMatch(match, playerId);

    if (match.status != matchStatuses.stageSelection) return new ResponseData(false, stagePickErrors.wrongStatus);

    if (!match.mode.rulesetData.counterPickStagesArr.includes(stage)) return new ResponseData(false, stagePickErrors.stageNotInStagelist);

    if (match.players[playerPos - 1].unpickableStagesArr.includes(stage)) return new ResponseData(false, stagePickErrors.DSRunpickable);

    if (match.gamesArr[match.gamesArr.length - 2].winnerId == playerId) return new ResponseData(false, stagePickErrors.wrongPlayer);

    var game = match.gamesArr[match.gamesArr.length - 1];

    if (game.strikes.length < match.mode.rulesetData.counterPickBans) return new ResponseData(false, stagePickErrors.notEnoughStrikes);

    if (game.strikes.includes(stage)) return new ResponseData(false, stagePickErrors.stageStriked)

    game.stage = stage;
    match.status = matchStatuses.ingame;
    return new ResponseData(true, match.id);
}
export async function PlayerSentGameWin(playerId, winnerId){
    var match = await FindMatchWithPlayer(playerId);
    var matchId = 0;
    var data = {
        matchId,
        dispute: false,
        confirmed: false,
        matchWin: false
    }
    if (!match) return new ResponseData(false, gameWinErrors.noMatch);

    data.matchId = match.id;

    var playerPos = FindPlayerPosInMatch(match, playerId);

    if (match.mode == matchModes.casual) return new ResponseData(false, gameWinErrors.casual);
    if (match.status != matchStatuses.ingame) return new ResponseData(false, gameWinErrors.wrongStatus);

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
        game.winnerId = 0;

        StartMatchDispute(match);
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
            data.matchWin = true;
            if (await HandleMatchWin(match)) return new ResponseData(true, data);
            return new ResponseData(false, gameWinErrors.databaseError);
        } else{
            match.gamesArr.push(new Game());
            match.players[0].gameConfirmed = false;
            match.players[1].gameConfirmed = false;
        }

        data.confirmed = true;
    }
    
    return new ResponseData(true, data);
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
    if (!match) return new ResponseData(false, casualMatchEndErrors.noMatch);

    if (match.status == matchStatuses.dispute) return new ResponseData(false, casualMatchEndErrors.inDispute);

    if (match.mode != matchModes.casual) return new ResponseData(false, casualMatchEndErrors.notCasual);

    if (!await FinishMatch(match)) return new ResponseData(false, casualMatchEndErrors.databaseError);

    return new ResponseData(true, match.id);
}

export function UserSentChatMessage(playerId, content){
    var match = FindMatchWithPlayer(playerId);

    if (!match) return new ResponseData(false, chatMessageErrors.noMatch);

    var chatMessage = new ChatMessage(content, playerId);
    match.chat.push(chatMessage);
    return new ResponseData(true, match.id);
}

//trust server that its a mod and verified user
export async function ModSentChatMessage(matchId, userId, content){
    var match = FindMatch(matchId);
    if (!match) return new ResponseData(false, chatMessageErrors.matchDoesntExist);

    var chatMessage = new ChatMessage(content, userId);
    match.chat.push(chatMessage);
    return new ResponseData(true, '');
}

export function PlayerSentMatchDispute(playerId){
    var match = FindMatchWithPlayer(playerId);

    if (!match) return new ResponseData(false, disputeErrors.noMatch);

    if (match.status == matchStatuses.dispute) return new ResponseData(false, disputeErrors.alreadyDispute);

    StartMatchDispute(match);
    return new ResponseData(true, match.id);
}

function StartMatchDispute(match){
    match.players[0].gameConfirmed = false;
    match.players[1].gameConfirmed = false;
    match.status = matchStatuses.dispute;
    SendDisputeMessage(GetDisputedMatchesList(), true);
}

export function GetDisputedMatchesList(){
    var result = [];
    for (let i = 0; i < matches.length; i++){
        if (matches[i].status == matchStatuses.dispute){
            result.push(matches[i]);
        }
    }
    return result;
}

export async function ResolveMatchDispute(matchId, resolveOption){
    var match = FindMatch(matchId);
    if (!match) return new ResponseData(false, resolveErrors.matchDoesntExist);

    if (match.status != matchStatuses.dispute) return new ResponseData(false, resolveErrors.notDisputed);

    if (match.mode == matchModes.casual){
        match.status == matchStatuses.ingame;
        SendDisputeMessage(GetDisputedMatchesList(), false);
        return new ResponseData(true, 'casual');
    }

    var currentGame = match.gamesArr[match.gamesArr.length - 1];

    switch (resolveOption){
        case disputeResolveOptions.noChanges:
            //todo: check which status to revert to
            if (currentGame.stage == stages.unpicked){
                match.status = matchStatuses.stageSelection;
                SendDisputeMessage(GetDisputedMatchesList(), false);
                return new ResponseData(true, '');
            } else{
                match.status = matchStatuses.ingame;
                SendDisputeMessage(GetDisputedMatchesList(), false);
                return new ResponseData(true, '');
            }
        case disputeResolveOptions.resetCurrentGame:
            currentGame = new Game();
            match.status = matchStatuses.stageSelection;
            SendDisputeMessage(GetDisputedMatchesList(), false);
            return new ResponseData(true, '');
        case disputeResolveOptions.restartMatch:
            match.status = matchStatuses.stageSelection;
            match.gamesArr = [new Game()];
            match.players[0].unpickableStagesArr = [];
            match.players[1].unpickableStagesArr = [];
            SendDisputeMessage(GetDisputedMatchesList(), false);
            return new ResponseData(true, '');
        case disputeResolveOptions.cancelMatch:
            match.status = matchStatuses.noWinner;
            await (FinishMatch(match));
            SendDisputeMessage(GetDisputedMatchesList(), false);
            return new ResponseData(true, '');
        case disputeResolveOptions.gameWinPlayer1:
            return HandleDisputeGameWin(match, 0);
        case disputeResolveOptions.gameWinPlayer2:
            return HandleDisputeGameWin(match, 1);
        case disputeResolveOptions.matchWinPlayer1:
            match.winnerId = match.players[0].id;
            var result = { winnerId: match.winnerId }
            SendDisputeMessage(GetDisputedMatchesList(), false);
            if (await HandleMatchWin(match)) return new ResponseData(true, result);
            return new ResponseData(false, resolveErrors.databaseError);
        case disputeResolveOptions.matchWinPlayer2:
            match.winnerId = match.players[1].id;
            var result = { winnerId: match.winnerId }
            SendDisputeMessage(GetDisputedMatchesList(), false);
            if (await HandleMatchWin(match)) return new ResponseData(true, result);
            return new ResponseData(false, resolveErrors.databaseError);
        default:
            return new ResponseData(false, resolveErrors.illegalResolveOption);
    }
}

async function HandleDisputeGameWin(match, winnerIndex){
    var data = {
        matchFinished: false,
        winnerId: 0
    }
    var currentGame = match.gamesArr[match.gamesArr.length - 1];

    currentGame.winnerId = match.players[winnerIndex].id;
    if (match.mode.rulesetData.dsr){
        match.players[winnerPos - 1].unpickableStagesArr.push(currentGame.stage);
    }

    match.status = matchStatuses.stageSelection;

    if (CheckMatchWin(match, currentGame.winnerId)){
        match.winnerId = currentGame.winnerId;

        data.matchFinished = true;
        data.winnerId = match.winnerId;

        if (await HandleMatchWin(match)) return data;
        return false;
    } else{
        match.gamesArr.push(new Game());
        match.players[0].gameConfirmed = false;
        match.players[1].gameConfirmed = false;
    }

    SendDisputeMessage(GetDisputedMatchesList(), false);
    return data;
}

//förlust på ranked, ta bort casual
export async function HandleBannedPlayerInMatch(playerId){
    var result = {
        matchId: null,
        mode: null,
        winnerId: null
    }
    var match = FindMatchWithPlayer(playerId);
    if (!match) return;


    if (match.mode == matchModes.casual){
        await FinishMatch(match);
    } else{
        var playerPos = FindPlayerPosInMatch(match, playerId);
        var otherPos = (playerPos + 1) % 2;
        match.winnerId = match.players[otherPos].id;
        result.winnerId = match.winnerId;
        (await HandleMatchWin(match));
    }
    result.matchId = match.id;
    result.mode = match.mode;
    return result;
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