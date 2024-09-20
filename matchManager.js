import {matchStatuses, rulesets, Game, Match, ChatMessage, disputeResolveOptions, matchModes, systemId} from "./public/constants/matchData.js";
import { GenerateNanoId } from "./nanoIdManager.js";
import { stages } from "./public/constants/stageData.js";
import { ApplyMatchEloResults, placementMatchCount } from "./glicko2Manager.js";
import { AddChatMessage, GetMatch, GetUserSeasonRankedMatchCount, SetMatchResult, SetUserHideRank } from "./database.js";
import { FindPlayerPosInMatch } from "./utils/matchUtils.js";
import { AddRecentlyMatchedPlayers } from "./queManager.js";
import { SendDisputeMessage, SendNewSuspiciousAction, SuspiciousAction } from "./discordBot/discordBotManager.js";
import { ResponseData, ResponseSucceeded } from "./responses/ResponseData.js";
import { casualMatchEndErrors, chatMessageErrors, disputeErrors, gameWinErrors, databaseErrors, resolveErrors, stagePickErrors, stageStrikeErrors, nullErrors, forfeitErrors } from "./responses/matchErrors.js";
import { HasBadWords, SanitizeDiscordLog } from "./utils/string.js";
import { CasualMatchEndChatMessage, ChooseStageChatMessage, DisputeChatMessage, ForfeitChatMessage, GamePlayerConfirmMessage, GameWinChatMessage, MatchStartChatMessage, MatchWinChatMessage, ResolveDisputeChatMessage, StrikeStagesChatMessage } from "./public/scripts/utils/systemChatMessages.js";
import { CheckChatLimitReached, NewMessage } from "./rateLimitManager.js";
import { UpdateRecentMatches } from "./cache/matchHistoryManager.js";
import { currentSeason } from "./public/constants/seasonData.js";

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

/*export async function TESTMATCH(){
    let m1 = await MakeNewMatch('8wUa0c7ksw5e8y1p', 'wZOf--ev5yq6NrAj', matchModes.ranked);
    PlayerSentStageStrikes('8wUa0c7ksw5e8y1p', [stages.mainStreet]);
    PlayerSentStageStrikes('wZOf--ev5yq6NrAj', [stages.thunderPoint, stages.riverDrift]);
    PlayerSentStageStrikes('8wUa0c7ksw5e8y1p', [stages.girderForBattle]);
    await PlayerSentGameWin('8wUa0c7ksw5e8y1p', '8wUa0c7ksw5e8y1p');
    await PlayerSentGameWin('wZOf--ev5yq6NrAj', '8wUa0c7ksw5e8y1p');
    console.log(JSON.stringify(m1));
}*/

export async function CancelOldMatches(cutoffTime){
    let result = [];
    let cutoffDate = Date.now() - cutoffTime;
    for (let i = matches.length - 1; i >= 0; i--){
        let match = matches[i];
        if (match.createdAt > cutoffDate) continue;

        match.status = matchStatuses.noWinner;
        try {
            if (match.mode == matchModes.ranked){
            const suspiciousAction = new SuspiciousAction(matches[i].players[0].id, `Ranked match cancelled for taking too long, against player ID ${SanitizeDiscordLog(matches[i].players[1].id)}`, Date.now());
            await SendNewSuspiciousAction(suspiciousAction);
        }
            if (await FinishMatch(match, true)) result.push(match.id);
        }
        catch(error){
            console.log(error);
        }
    }
    return result;
}

//assumes that players arent in match already
export function MakeNewMatch(player1Id, player2Id, matchMode, privateBattle = false, setLength = null){

    //randomize player positions
    let r = Math.floor(Math.random() * 2);
    if (r == 1){
        let tempId = player1Id;
        player1Id = player2Id;
        player2Id = tempId;
    }

    const matchId = GenerateNanoId();

    let match = new Match(matchId, player1Id, player2Id, matchMode, privateBattle, setLength);
    match.chat.push(new ChatMessage(MatchStartChatMessage(), systemId));
    matches.push(match);
    return match;
}

export function PlayerSentStageStrikes(playerId, stages){
    let match = FindMatchWithPlayer(playerId);
    if (!match) return nullErrors.noMatch;

    let playerPos = FindPlayerPosInMatch(match, playerId);

    if (match.status != matchStatuses.stageSelection) return stageStrikeErrors.wrongStatus;

    let strikeResponse;
    if (match.gamesArr.length == 1){
        strikeResponse = StarterStrikeLogic(match, playerPos, stages);
    } else{
        strikeResponse = CounterpickStrikingLogic(match, playerId, playerPos, stages);
    }
    if (ResponseSucceeded(strikeResponse.code)) match.chat.push(new ChatMessage(StrikeStagesChatMessage(playerId, stages), systemId));
    return strikeResponse;
}

function StarterStrikeLogic(match, playerPos, stages){
    const stageList = rulesets[match.mode].starterStagesArr;
    let game = match.gamesArr[0];

    let correctStagesLength = 2;
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
    let alreadySentStages = [];
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
    const stageList = rulesets[match.mode].counterPickStagesArr;
    let game = match.gamesArr[match.gamesArr.length - 1];

    if (stages.length != rulesets[match.mode].counterPickBans) return stageStrikeErrors.stageAmountIncorrect;

    if (match.gamesArr[match.gamesArr.length - 2].winnerId != playerId) return stageStrikeErrors.wrongPlayer;

    let alreadySentStages = [];
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
    let match = FindMatchWithPlayer(playerId);
    if (!match) return nullErrors.noMatch;

    let playerPos = FindPlayerPosInMatch(match, playerId);

    if (match.status != matchStatuses.stageSelection) return stagePickErrors.wrongStatus;

    if (!rulesets[match.mode].counterPickStagesArr.includes(stage)) return stagePickErrors.stageNotInStagelist;

    if (match.players[playerPos - 1].unpickableStagesArr.includes(stage)) return stagePickErrors.DSRunpickable;

    if (match.gamesArr[match.gamesArr.length - 2].winnerId == playerId) return stagePickErrors.wrongPlayer;

    let game = match.gamesArr[match.gamesArr.length - 1];

    if (game.strikes.length < rulesets[match.mode].counterPickBans) return stagePickErrors.notEnoughStrikes;

    if (game.strikes.includes(stage)) return stagePickErrors.stageStriked;

    game.stage = stage;
    match.status = matchStatuses.ingame;
    match.chat.push(new ChatMessage(ChooseStageChatMessage(playerId, stage), systemId));
    return new ResponseData(201, match.id);
}

export async function PlayerSentGameWin(playerId, winnerId){
    let match = await FindMatchWithPlayer(playerId);
    let data = {
        matchId: undefined,
        dispute: false,
        confirmed: false,
        matchWin: false,
        newPlayerRatings: undefined
    }
    if (!match) return nullErrors.noMatch;

    data.matchId = match.id;

    let playerPos = FindPlayerPosInMatch(match, playerId);
    let otherPos = (playerPos % 2) + 1;

    if (match.mode == matchModes.casual) return gameWinErrors.casual;
    if (match.status != matchStatuses.ingame) return gameWinErrors.wrongStatus;
    if (match.players[playerPos - 1].markedWinner != 0) return gameWinErrors.alreadySent;

    const winnerPos = (match.players[0].id == winnerId) ? 1 : 2;

    match.players[playerPos - 1].markedWinner = winnerPos;

    let game = match.gamesArr[match.gamesArr.length - 1];

    match.chat.push(new ChatMessage(GamePlayerConfirmMessage(playerId, winnerId), systemId));

    //check game verified
    if (match.players[otherPos - 1].markedWinner != 0){
        if (match.players[0].markedWinner != match.players[1].markedWinner){
            StartMatchDispute(match);
            data.dispute = true;
            return new ResponseData(201, data);
        }

        game.winnerId = winnerId;
        match.status = matchStatuses.stageSelection;
        if (rulesets[match.mode].dsr && !match.players[winnerPos - 1].unpickableStagesArr.includes(game.stage)){
            match.players[winnerPos - 1].unpickableStagesArr.push(game.stage);
        }

        if (CheckMatchWin(match, winnerId)){
            if (match.createdAt > Date.now() - (5 * 60 * 1000)){
                const suspiciousAction = new SuspiciousAction(winnerId, `Won a ranked match against user ID ${SanitizeDiscordLog(match.players[winnerPos % 2].id)} in less than 5 minutes`, Date.now());
                SendNewSuspiciousAction(suspiciousAction);
            }

            match.winnerId = winnerId;
            data.matchWin = true;
            match.chat.push(new ChatMessage(MatchWinChatMessage(winnerId), systemId));
            data.newPlayerRatings = await HandleRankedMatchWin(match);
            if (data.newPlayerRatings) return new ResponseData(201, data);
            return databaseErrors.matchFinishError;
        } else{
            match.chat.push(new ChatMessage(GameWinChatMessage(winnerId, match.gamesArr.length), systemId));
            match.gamesArr.push(new Game());
            match.players[0].markedWinner = 0;
            match.players[1].markedWinner = 0;
        }

        data.confirmed = true;
    }
    
    return new ResponseData(201, data);
}

function CheckMatchWin(match, winnerId){
    let winCount = 0;
    for (let i = 0; i < match.gamesArr.length; i++){
        if (match.gamesArr[i].winnerId != winnerId){
            continue;
        }
        winCount++;
    }
    if (winCount >= match.setLength){
        return true;
    }
    return false;
}

async function HandleRankedMatchWin(match){
    match.status = (match.players[0].id == match.winnerId) ? matchStatuses.player1Win : matchStatuses.player2Win;

    if (!await FinishMatch(match)) return false;
    if (match.privateBattle) return true;

    await CheckPlacements(match.players[0].id);
    await CheckPlacements(match.players[1].id);

    return await ApplyMatchEloResults(match);
}

export async function PlayerSentForfeit(playerId){
    let match = FindMatchWithPlayer(playerId);
    if (!match) return nullErrors.noMatch;

    if (match.mode == matchModes.casual) return forfeitErrors.casual;

    let playerPos = FindPlayerPosInMatch(match, playerId);

    match.winnerId = match.players[playerPos % 2].id;

    let result = {
        matchId: match.id,
        newPlayerRatings: undefined,
    }
    
    match.chat.push(new ChatMessage(ForfeitChatMessage(playerId), systemId));
    result.newPlayerRatings = await HandleRankedMatchWin(match);
    if (!result.newPlayerRatings) return databaseErrors.matchFinishError;

    if (!match.privateBattle){
        const suspiciousAction = new SuspiciousAction(playerId, `Forfeited a ranked match against user ID ${SanitizeDiscordLog(match.players[playerPos % 2].id)}`, Date.now());
        SendNewSuspiciousAction(suspiciousAction);
    }

    return new ResponseData(201, result);
}

async function CheckPlacements(playerId){
    const rankedMatchCount = await GetUserSeasonRankedMatchCount(playerId, currentSeason.id);

    if (rankedMatchCount == placementMatchCount){
        await SetUserHideRank(playerId, false);
    }
}

export async function PlayerSentCasualMatchEnd(playerId){
    let match = FindMatchWithPlayer(playerId);
    if (!match) return nullErrors.noMatch;

    if (match.status == matchStatuses.dispute) return casualMatchEndErrors.inDispute;

    if (match.mode != matchModes.casual) return casualMatchEndErrors.notCasual;

    match.status = matchStatuses.noWinner;

    match.chat.push(new ChatMessage(CasualMatchEndChatMessage(playerId), systemId));

    if (!await FinishMatch(match)) return databaseErrors.matchFinishError;

    if (match.createdAt > Date.now() - (30 * 1000)){
        const suspiciousAction = new SuspiciousAction(playerId, 'Ended a casual match within 30 seconds', Date.now());
        SendNewSuspiciousAction(suspiciousAction);
    }

    return new ResponseData(201, match.id);
}

export async function UserSentChatMessage(matchId, playerId, content){
    if (HasBadWords(content)) return chatMessageErrors.badWords;
    if (content.length > 256 || content.length == 0) return chatMessageErrors.tooLong;
    if (CheckChatLimitReached(playerId)) return chatMessageErrors.rateLimitReached;

    let match = FindMatch(matchId);
    if (!match){
        match = await GetMatch(matchId);
        if (!match) return nullErrors.matchDoesntExist;

        if (match.player1_id != playerId && match.player2_id != playerId) return chatMessageErrors.notInMatch;

        await AddChatMessage(matchId, playerId, content);
        return new ResponseData(201);
    }

    let chatMessage = new ChatMessage(content, playerId);
    match.chat.push(chatMessage);
    NewMessage(playerId);
    return new ResponseData(201);
}

//trust server that its a mod and verified user
export async function ModSentChatMessage(matchId, userId, content){
    if (HasBadWords(content)) return chatMessageErrors.badWords;
    if (content.length > 256 || content.length == 0) return chatMessageErrors.tooLong;
    
    let match = FindMatch(matchId);
    if (!match){
        match = await GetMatch(matchId);
        if (!match) return nullErrors.matchDoesntExist;

        await AddChatMessage(matchId, userId, content);
        return new ResponseData(201);
    }

    let chatMessage = new ChatMessage(content, userId);
    match.chat.push(chatMessage);
    return new ResponseData(201);
}

export function PlayerSentMatchDispute(playerId){
    let match = FindMatchWithPlayer(playerId);
    if (!match) return nullErrors.noMatch;

    if (match.privateBattle) return disputeErrors.privateBattle;

    if (match.status == matchStatuses.dispute) return disputeErrors.alreadyDispute;

    //temp fix?
    if (match.mode == matchModes.casual) return disputeErrors.privateBattle;

    StartMatchDispute(match);
    return new ResponseData(201, match.id);
}

function StartMatchDispute(match){
    match.players[0].markedWinner = 0;
    match.players[1].markedWinner = 0;
    match.gamesArr[match.gamesArr.length - 1].winnerId = null;
    if (match.privateBattle) return;
    match.chat.push(new ChatMessage(DisputeChatMessage(), systemId));
    match.status = matchStatuses.dispute;
    SendDisputeMessage(GetDisputedMatchesList(), true);
}

export function GetDisputedMatchesList(){
    let result = [];
    for (let i = 0; i < matches.length; i++){
        if (matches[i].status == matchStatuses.dispute){
            result.push(matches[i]);
        }
    }
    return result;
}

//only able to cancel the dispute, no other actions. has to be confirmed by both players
export async function PlayerSentResolveDispute(playerId){
    let match = FindMatchWithPlayer(playerId);
    if (!match) return nullErrors.noMatch;

    if (match.status != matchStatuses.dispute) return resolveErrors.notDisputed;

    let playerPos = FindPlayerPosInMatch(match, playerId);
    if (match.players[playerPos - 1].disputeResolveSent == true) return resolveErrors.alreadyConfirmed;
    match.players[playerPos - 1].disputeResolveSent = true;

    if (match.players[0].disputeResolveSent && match.players[1].disputeResolveSent){
        match.players[0].disputeResolveSent = false;
        match.players[1].disputeResolveSent = false;
        match.chat.push(new ChatMessage(ResolveDisputeChatMessage(match.players[0].id, match.players[1].id, disputeResolveOptions.noChanges), systemId));

        if (match.mode == matchModes.casual){
            match.status = matchStatuses.ingame;
            SendDisputeMessage(GetDisputedMatchesList(), false);
            return new ResponseData(201, matchModes.casual);
        }

        let responseData = HandleNoChangesResolve(match);
        responseData.data = match.id;
        return responseData;
    }
    return new ResponseData(201);
}

export async function ResolveMatchDispute(matchId, resolveOption){
    let match = FindMatch(matchId);
    if (!match) return nullErrors.matchDoesntExist;

    if (match.status != matchStatuses.dispute) return resolveErrors.notDisputed;

    match.players[0].disputeResolveSent = false;
    match.players[1].disputeResolveSent = false;

    if (match.mode == matchModes.casual){
        match.chat.push(new ChatMessage(ResolveDisputeChatMessage(match.players[0].id, match.players[1].id, disputeResolveOptions.noChanges), systemId));
        match.status = matchStatuses.ingame;
        SendDisputeMessage(GetDisputedMatchesList(), false);
        return new ResponseData(201, matchModes.casual);
    }
    match.chat.push(new ChatMessage(ResolveDisputeChatMessage(match.players[0].id, match.players[1].id, resolveOption), systemId));

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
            if (!await FinishMatch(match, true)) return databaseErrors.matchFinishError;
            SendDisputeMessage(GetDisputedMatchesList(), false);
            return new ResponseData(201);
        case disputeResolveOptions.gameWinPlayer1:
            return HandleDisputeGameWin(match, 0);
        case disputeResolveOptions.gameWinPlayer2:
            return HandleDisputeGameWin(match, 1);
        case disputeResolveOptions.matchWinPlayer1:
            match.winnerId = match.players[0].id;
            let p1WinResult = { winnerId: match.winnerId }
            SendDisputeMessage(GetDisputedMatchesList(), false);
            p1WinResult.newPlayerRatings = await HandleRankedMatchWin(match);
            if (p1WinResult.newPlayerRatings) return new ResponseData(201, p1WinResult);
            return databaseErrors.matchFinishError;
        case disputeResolveOptions.matchWinPlayer2:
            match.winnerId = match.players[1].id;
            let p2WinResult = { winnerId: match.winnerId }
            SendDisputeMessage(GetDisputedMatchesList(), false);
            p2WinResult.newPlayerRatings = await HandleRankedMatchWin(match);
            if (p2WinResult.newPlayerRatings) return new ResponseData(201, p2WinResult);
            return databaseErrors.matchFinishError;
        default:
            return resolveErrors.illegalResolveOption;
    }
}

function HandleNoChangesResolve(match){
    let currentGame = match.gamesArr[match.gamesArr.length - 1];

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
    let newPlayerRatings;
    let data = {
        matchFinished: false,
        winnerId: 0,
        newPlayerRatings
    }
    let currentGame = match.gamesArr[match.gamesArr.length - 1];
    let winnerPos;

    currentGame.winnerId = match.players[winnerIndex].id;

     if (match.players[0].id == currentGame.winnerId){
        winnerPos = 1;
    } else{
        winnerPos = 2;
    }

    if (rulesets[match.mode].dsr && currentGame.stage != stages.unpicked){
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
        match.players[0].markedWinner = 0;
        match.players[1].markedWinner = 0;
    }

    SendDisputeMessage(GetDisputedMatchesList(), false);
    return new ResponseData(201, data);
}

//förlust på ranked, ta bort casual
export async function HandleBannedPlayerInMatch(playerId){
    let result = {
        matchId: null,
        mode: null,
        winnerId: null,
        newPlayerRatings: null,
    }
    let match = FindMatchWithPlayer(playerId);
    if (!match) return;


    if (match.mode == matchModes.casual){
        if (!await FinishMatch(match)) return databaseErrors.matchFinishError;
    } else{
        let playerPos = FindPlayerPosInMatch(match, playerId);
        let otherPos = (playerPos % 2) + 1;
        match.winnerId = match.players[otherPos - 1].id;
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

export async function FinishMatch(match, cancelled = false){
    if (!cancelled) {
        if (!await SetMatchResult(match)) return false;
        if (!match.privateBattle) UpdateRecentMatches(match);
    }

    const matchIndex = matches.indexOf(match);
    if (matchIndex == -1) return false;
    matches.splice(matchIndex, 1);

    AddRecentlyMatchedPlayers(match.players[0].id, match.players[1].id, match.mode);

    return true;
}