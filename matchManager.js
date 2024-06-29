import {matchStatuses, matchModes, Game, Match, ChatMessage, disputeResolveOptions} from "./public/constants/matchData.js";
import { GenerateNanoId } from "./nanoIdManager.js";
import { stages } from "./public/constants/stageData.js";
import { ApplyMatchEloResults, placementMatchCount } from "./glicko2Manager.js";
import { AddChatMessage, GetMatch, GetUserRankedMatchCount, SetMatchResult, SetUserHideRank } from "./database.js";
import { FindPlayerPosInMatch } from "./utils/matchUtils.js";
import { AddRecentlyMatchedPlayers } from "./queManager.js";
import { SendDisputeMessage, SendNewSuspiciousAction, SuspiciousAction } from "./discordBot/discordBotManager.js";
import { ResponseData } from "./Responses/ResponseData.js";
import { casualMatchEndErrors, chatMessageErrors, disputeErrors, gameWinErrors, databaseErrors, resolveErrors, stagePickErrors, stageStrikeErrors, nullErrors, forfeitErrors } from "./Responses/matchErrors.js";
import { HasBadWords } from "./utils/string.js";
import { DetailMinute } from "./utils/date.js";

var matches = [];

// zeb testing
//matches.push( new Match(12, 10, 3, matchModes.ranked) );
//matches.push( new Match(7, 10, 3, matchModes.casual) );
/*var m1 = new Match(7, 3, 4, matchModes.ranked);
m1.status = matchStatuses.dispute;
matches.push(m1);

var m2 = new Match(8, 1, 2, matchModes.ranked);
matches.push(m2);*/

//Ljovynn testing

/*var m1 = await MakeNewMatch(1, 2, matchModes.ranked);
await PlayerSentForfeit(2);*/

export async function CancelOldMatches(cutoffTime){
    var result = [];
    var cutoffDate = Date.now() - cutoffTime;
    for (let i = matches.length - 1; i >= 0; i--){
        if (matches[i].createdAt > cutoffDate) continue;

        matches[i].status = matchStatuses.noWinner;
        if (await FinishMatch(matches[i]), true) result.push(matches[i].id);
    }
    return result;
}

export function MakeNewMatch(player1Id, player2Id, matchMode){

    //randomize player positions

    var tempId;
    let r = Math.floor(Math.random() * 2);
    if (r == 1){
        let tempId = player1Id;
        player1Id = player2Id;
        player2Id = tempId;
    }

    var isRanked = false;
    if (matchMode == matchModes.ranked){
        isRanked = true;
    }

    const matchId = GenerateNanoId();

    var match = new Match(matchId, player1Id, player2Id, matchMode);
    matches.push(match);
    return match;
}

export function PlayerSentStageStrikes(playerId, stages){
    var match = FindMatchWithPlayer(playerId);
    if (!match) return nullErrors.noMatch;

    var playerPos = FindPlayerPosInMatch(match, playerId);

    if (match.status != matchStatuses.stageSelection) return stageStrikeErrors.wrongStatus;

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

    if (stages.length != correctStagesLength) return stageStrikeErrors.stageAmountIncorrect;

    //Check if current player
    if ((game.strikes.length + 1) % 4 < 2){
        if (playerPos == 2) return stageStrikeErrors.wrongPlayer;
    } else{
        if (playerPos == 1) return stageStrikeErrors.wrongPlayer;
    }

    //check each stage
    var alreadySentStages = [];
    for (let i = 0; i < stages.length; i++){
        if (!stageList.includes(stages[i])) return stageStrikeErrors.stageNotInStagelist;

        if (alreadySentStages.includes(stages[i])) return stageStrikeErrors.stageAlreadyStriked;
        alreadySentStages.push(stages[i]);

        if (game.strikes.includes(stages[i])) return stageStrikeErrors.stageAlreadyStriked;
    }

    for (let i = 0; i < stages.length; i++){
        game.strikes.push(stages[i]);
    }
    
    if (CheckStarterStrikesFinished(game, stageList)){
        match.status = matchStatuses.ingame;
    }
    return new ResponseData(201, match.id);
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

    if (stages.length != match.mode.rulesetData.counterPickBans) return stageStrikeErrors.stageAmountIncorrect;

    if (match.gamesArr[match.gamesArr.length - 2].winnerId != playerId) return stageStrikeErrors.wrongPlayer;

    var alreadySentStages = [];
    //for each stage
    for (let i = 0; i < stages.length; i++){
        if (!stageList.includes(stages[i])) return stageStrikeErrors.stageNotInStagelist;

        if (alreadySentStages.includes(stages[i])) return stageStrikeErrors.stageAlreadyStriked;
        alreadySentStages.push(stages[i]);

        if (match.players[playerPos % 2].unpickableStagesArr.includes(stages[i])) return stageStrikeErrors.DSRunpickable;

        if (game.strikes.includes(stages[i])) return stageStrikeErrors.stageAlreadyStriked;
    }

    for (let i = 0; i < stages.length; i++){
        game.strikes.push(stages[i]);
    }
    return new ResponseData(201, match.id);
}

export function PlayerSentStagePick(playerId, stage){
    var match = FindMatchWithPlayer(playerId);
    if (!match) return nullErrors.noMatch;

    var playerPos = FindPlayerPosInMatch(match, playerId);

    if (match.status != matchStatuses.stageSelection) return stagePickErrors.wrongStatus;

    if (!match.mode.rulesetData.counterPickStagesArr.includes(stage)) return stagePickErrors.stageNotInStagelist;

    if (match.players[playerPos - 1].unpickableStagesArr.includes(stage)) return stagePickErrors.DSRunpickable;

    if (match.gamesArr[match.gamesArr.length - 2].winnerId == playerId) return stagePickErrors.wrongPlayer;

    var game = match.gamesArr[match.gamesArr.length - 1];

    if (game.strikes.length < match.mode.rulesetData.counterPickBans) return stagePickErrors.notEnoughStrikes;

    if (game.strikes.includes(stage)) return stagePickErrors.stageStriked;

    game.stage = stage;
    match.status = matchStatuses.ingame;
    return new ResponseData(201, match.id);
}

export async function PlayerSentGameWin(playerId, winnerId){
    var match = await FindMatchWithPlayer(playerId);
    var data = {
        matchId: undefined,
        dispute: false,
        confirmed: false,
        matchWin: false,
        newPlayerRatings: undefined
    }
    if (!match) return nullErrors.noMatch;

    data.matchId = match.id;

    var playerPos = FindPlayerPosInMatch(match, playerId);

    if (match.mode == matchModes.casual) return gameWinErrors.casual;
    if (match.status != matchStatuses.ingame) return gameWinErrors.wrongStatus;

    var winnerPos;
    if (match.players[0].id == winnerId){
        winnerPos = 1;
    } else{
        winnerPos = 2;
    }

    match.players[playerPos - 1].gameConfirmed = true;

    var game = match.gamesArr[match.gamesArr.length - 1];

    if (game.winnerId == null){
        game.winnerId = winnerId;
    } else if (game.winnerId != winnerId){
        game.winnerId = null;

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
            if (match.createdAt < Date.now() + (5 * 60 * 1000)){
                const suspiciousAction = new SuspiciousAction(winnerId.toString(), `User won a ranked match against user ID ${match.players[winnerPos % 2].id} in less than 5 minutes`, `${DetailMinute(new Date(Date.now()))} UTC`);
                SendNewSuspiciousAction(suspiciousAction);
            }

            match.winnerId = winnerId;
            data.matchWin = true;
            data.newPlayerRatings = await HandleRankedMatchWin(match);
            if (data.newPlayerRatings) return new ResponseData(201, data);
            return databaseErrors.matchFinishError;
        } else{
            match.gamesArr.push(new Game());
            match.players[0].gameConfirmed = false;
            match.players[1].gameConfirmed = false;
        }

        data.confirmed = true;
    }
    
    return new ResponseData(201, data);
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

async function HandleRankedMatchWin(match){
    if (match.players[0].id == match.winnerId){
        match.status = matchStatuses.player1Win;
    } else {
        match.status = matchStatuses.player2Win;
    }

    if (!await FinishMatch(match)) return false;

    CheckPlacements(match.players[0].id);
    CheckPlacements(match.players[1].id);

    return await ApplyMatchEloResults(match);
}

export async function PlayerSentForfeit(playerId){
    var match = FindMatchWithPlayer(playerId);
    if (!match) return nullErrors.noMatch;

    if (match.mode == matchModes.casual) return forfeitErrors.casual;

    var playerPos = FindPlayerPosInMatch(match, playerId);

    match.winnerId = match.players[playerPos % 2].id;

    var result = {
        matchId: match.id,
        newPlayerRatings: undefined,
    }
    
    result.newPlayerRatings = await HandleRankedMatchWin(match);
    if (!result.newPlayerRatings) return databaseErrors.matchFinishError;

    const suspiciousAction = new SuspiciousAction(playerId.toString(), `User forfeited a ranked match against user ID ${match.players[playerPos % 2].id}`, `${DetailMinute(new Date(Date.now()))} UTC`);
    SendNewSuspiciousAction(suspiciousAction);

    return new ResponseData(201, result);
}

async function CheckPlacements(playerId){
    const rankedMatchCount = await GetUserRankedMatchCount(playerId);

    if (rankedMatchCount == placementMatchCount){
        await SetUserHideRank(playerId, false);
    }
}

export async function PlayerSentCasualMatchEnd(playerId){
    var match = FindMatchWithPlayer(playerId);
    if (!match) return nullErrors.noMatch;

    if (match.status == matchStatuses.dispute) return casualMatchEndErrors.inDispute;

    if (match.mode != matchModes.casual) return casualMatchEndErrors.notCasual;

    match.status = matchStatuses.noWinner;
    if (!await FinishMatch(match)) return databaseErrors.matchFinishError;

    if (match.createdAt < Date.now() + (30 * 1000)){
        const suspiciousAction = new SuspiciousAction(playerId.toString(), 'User ended a casual match within 30 seconds', `${DetailMinute(new Date(Date.now()))} UTC`);
        SendNewSuspiciousAction(suspiciousAction);
    }

    return new ResponseData(201, match.id);
}

export async function UserSentChatMessage(matchId, playerId, content){
    if (HasBadWords(content)) return chatMessageErrors.badWords;

    var match = FindMatchWithPlayer(playerId);
    if (!match){
        match = await GetMatch(matchId);
        if (!match) return nullErrors.matchDoesntExist;

        if (match.player1_id != playerId && match.player2_id != playerId) return chatMessageErrors.notInMatch;

        await AddChatMessage(matchId, playerId, content);
        return new ResponseData(201);
    }

    var chatMessage = new ChatMessage(content, playerId);
    match.chat.push(chatMessage);
    return new ResponseData(201);
}

//trust server that its a mod and verified user
export async function ModSentChatMessage(matchId, userId, content){
    if (HasBadWords(content)) return chatMessageErrors.badWords;
    
    var match = FindMatch(matchId);
    if (!match){
        match = await GetMatch(matchId);
        if (!match) return nullErrors.matchDoesntExist;

        await AddChatMessage(matchId, userId, content);
        return new ResponseData(201);
    }

    var chatMessage = new ChatMessage(content, userId);
    match.chat.push(chatMessage);
    return new ResponseData(201);
}

export function PlayerSentMatchDispute(playerId){
    var match = FindMatchWithPlayer(playerId);
    if (!match) return nullErrors.noMatch;

    if (match.status == matchStatuses.dispute) return disputeErrors.alreadyDispute;

    StartMatchDispute(match);
    return new ResponseData(201, match.id);
}

function StartMatchDispute(match){
    match.players[0].gameConfirmed = false;
    match.players[1].gameConfirmed = false;
    match.gamesArr[match.gamesArr.length - 1].winnerId = null;
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

//only able to cancel the dispute, no other actions. has to be confirmed by both players
export async function PlayerSentResolveDispute(playerId){
    var match = FindMatchWithPlayer(playerId);
    if (!match) return nullErrors.noMatch;

    if (match.status != matchStatuses.dispute) return resolveErrors.notDisputed;

    var playerPos = FindPlayerPosInMatch(match, playerId);
    if (match.players[playerPos - 1].disputeResolveSent == true) return resolveErrors.alreadyConfirmed;
    match.players[playerPos - 1].disputeResolveSent = true;

    if (match.players[0].disputeResolveSent && match.players[1].disputeResolveSent){
        match.players[0].disputeResolveSent = false;
        match.players[1].disputeResolveSent = false;

        if (match.mode == matchModes.casual){
            match.status == matchStatuses.ingame;
            SendDisputeMessage(GetDisputedMatchesList(), false);
            return new ResponseData(201, 'casual');
        }

        var responseData = HandleNoChangesResolve(match);
        responseData.data = match.id;
        return responseData;
    }
    return new ResponseData(201);
}

export async function ResolveMatchDispute(matchId, resolveOption){
    var match = FindMatch(matchId);
    if (!match) return nullErrors.matchDoesntExist;

    if (match.status != matchStatuses.dispute) return resolveErrors.notDisputed;

    match.players[0].disputeResolveSent = false;
    match.players[1].disputeResolveSent = false;

    if (match.mode == matchModes.casual){
        match.status == matchStatuses.ingame;
        SendDisputeMessage(GetDisputedMatchesList(), false);
        return new ResponseData(201, 'casual');
    }

    switch (resolveOption){
        case disputeResolveOptions.noChanges:
            return HandleNoChangesResolve(match);
        case disputeResolveOptions.resetCurrentGame:
            match.gamesArr[match.gamesArr.length - 1] = new Game();
            match.status = matchStatuses.stageSelection;
            SendDisputeMessage(GetDisputedMatchesList(), false);
            return new ResponseData(201);
        case disputeResolveOptions.restartMatch:
            match.status = matchStatuses.stageSelection;
            match.gamesArr = [new Game()];
            match.players[0].unpickableStagesArr = [];
            match.players[1].unpickableStagesArr = [];
            SendDisputeMessage(GetDisputedMatchesList(), false);
            return new ResponseData(201);
        case disputeResolveOptions.cancelMatch:
            match.status = matchStatuses.noWinner;
            await (FinishMatch(match, true));
            SendDisputeMessage(GetDisputedMatchesList(), false);
            return new ResponseData(201);
        case disputeResolveOptions.gameWinPlayer1:
            return HandleDisputeGameWin(match, 0);
        case disputeResolveOptions.gameWinPlayer2:
            return HandleDisputeGameWin(match, 1);
        case disputeResolveOptions.matchWinPlayer1:
            match.winnerId = match.players[0].id;
            var result = { winnerId: match.winnerId }
            SendDisputeMessage(GetDisputedMatchesList(), false);
            result.newPlayerRatings = await HandleRankedMatchWin(match);
            if (result.newPlayerRatings) return new ResponseData(201, result);
            return databaseErrors.matchFinishError;
        case disputeResolveOptions.matchWinPlayer2:
            match.winnerId = match.players[1].id;
            var result = { winnerId: match.winnerId }
            SendDisputeMessage(GetDisputedMatchesList(), false);
            result.newPlayerRatings = await HandleRankedMatchWin(match);
            if (result.newPlayerRatings) return new ResponseData(201, result);
            return databaseErrors.matchFinishError;
        default:
            return resolveErrors.illegalResolveOption;
    }
}

function HandleNoChangesResolve(match){
    var currentGame = match.gamesArr[match.gamesArr.length - 1];

    if (currentGame.stage == stages.unpicked){
        match.status = matchStatuses.stageSelection;
        SendDisputeMessage(GetDisputedMatchesList(), false);
        return new ResponseData(201);
    } else{
        match.status = matchStatuses.ingame;
        SendDisputeMessage(GetDisputedMatchesList(), false);
        return new ResponseData(201);
    }
}

async function HandleDisputeGameWin(match, winnerIndex){
    var newPlayerRatings;
    var data = {
        matchFinished: false,
        winnerId: 0,
        newPlayerRatings
    }
    var currentGame = match.gamesArr[match.gamesArr.length - 1];
    var winnerPos;

    currentGame.winnerId = match.players[winnerIndex].id;

     if (match.players[0].id == currentGame.winnerId){
        winnerPos = 1;
    } else{
        winnerPos = 2;
    }

    if (match.mode.rulesetData.dsr){
        match.players[winnerPos - 1].unpickableStagesArr.push(currentGame.stage);
    }

    match.status = matchStatuses.stageSelection;

    if (CheckMatchWin(match, currentGame.winnerId)){
        match.winnerId = currentGame.winnerId;

        data.matchFinished = true;
        data.winnerId = match.winnerId;
        data.newPlayerRatings = await HandleRankedMatchWin(match);
        if (data.newPlayerRatings) return data;
        return false;
    } else{
        match.gamesArr.push(new Game());
        match.players[0].gameConfirmed = false;
        match.players[1].gameConfirmed = false;
    }

    SendDisputeMessage(GetDisputedMatchesList(), false);
    return new ResponseData(201, data);
}

//förlust på ranked, ta bort casual
export async function HandleBannedPlayerInMatch(playerId){
    var result = {
        matchId: null,
        mode: null,
        winnerId: null,
        newPlayerRatings: null,
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
        result.newPlayerRatings = await HandleRankedMatchWin(match);
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

async function FinishMatch(match, cancelled = false){
    if (!cancelled) await SetMatchResult(match);

    const matchIndex = matches.indexOf(match);
    if (matchIndex == -1) return false;
    matches.splice(matchIndex, 1);

    AddRecentlyMatchedPlayers(match.players[0].id, match.players[1].id, match.mode);

    return true;
}