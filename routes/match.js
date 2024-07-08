import { Router } from 'express';

import { PlayerSentStageStrikes, PlayerSentStagePick, PlayerSentGameWin, PlayerSentCasualMatchEnd, 
    UserSentChatMessage, PlayerSentMatchDispute, PlayerSentResolveDispute,
    PlayerSentForfeit} from '../matchManager.js';

import { FindMatch } from '../matchManager.js';

import { GetChatMessages, GetMatch, GetMatchGames, GetUserChatData, GetUserData, GetStageStrikes, GetUserRole } from '../database.js';
import { ConvertDBMatchToMatch } from '../utils/matchUtils.js';
import { userRoles } from '../public/constants/userData.js';

import { CheckIfArray, CheckUserDefined } from '../utils/checkDefined.js';

import { SendSocketMessage, SendEmptySocketMessage } from '../socketManager.js';

import { definitionErrors, nullErrors, userErrors } from '../Responses/requestErrors.js';
import { ResponseSucceeded, SetResponse } from '../Responses/ResponseData.js';
import { chatLoadLimit, ChatMessage, disputeResolveOptions, matchModes, systemId } from '../public/constants/matchData.js';
import { ApplyHideRank, CheckUserBanned } from '../utils/userUtils.js';

const router = Router();

/*import { SendDisputeMessage } from '../discordBot/discordBotManager.js';
import { GetDisputedMatchesList } from '../matchManager.js';
router.get("/Test", async (req, res) => {
    try {
        SendDisputeMessage(GetDisputedMatchesList(), true);
        res.sendStatus(200);
    } catch (err){
        res.status(500).send(err.message);
    }
});*/

//Posts

//stages
router.post("/StrikeStages", async (req, res) => {
    try {
        const userId = req.session.user;
        const stages = req.body.stages;

        if (!CheckUserDefined(req)) return SetResponse(res, userErrors.notLoggedIn);
        if (!CheckIfArray(stages, res) || stages.length == 0) return SetResponse(res, definitionErrors.stagesUndefined);

        var responseData = PlayerSentStageStrikes(userId, stages);
        if (!ResponseSucceeded(responseData.code)) return SetResponse(res, responseData);

        res. sendStatus(responseData.code);
        SendSocketMessage('match' + responseData.data, "stageStrikes", stages);
    } catch (err){
        console.error(err);
        res.sendStatus(500);
    }
});

//stage
router.post("/PickStage", async (req, res) => {
    try {
        const userId = req.session.user;
        const stage = req.body.stage;

        if (!CheckUserDefined(req)) return SetResponse(res, userErrors.notLoggedIn);
        if (typeof(stage) !== 'number') return SetResponse(res, definitionErrors.stageUndefined);

        var responseData = PlayerSentStagePick(userId, stage);
        if (!ResponseSucceeded(responseData.code)) return SetResponse(res, responseData);

        res.sendStatus(responseData.code);
        SendSocketMessage('match' + responseData.data, "stagePick", stage);
    } catch (err){
        res.sendStatus(500);
    }
});

//winnerId
router.post("/WinGame", async (req, res) => {
    try {
        const userId = req.session.user;
        const winnerId = req.body.winnerId;

        if (!CheckUserDefined(req)) return SetResponse(res, userErrors.notLoggedIn);
        if (typeof(winnerId) !== 'string') return SetResponse(res, definitionErrors.winnerUndefined);

        var responseData = await PlayerSentGameWin(userId, winnerId);
        if (!ResponseSucceeded(responseData.code)) return SetResponse(res, responseData);

        res.sendStatus(responseData.code);
        var matchData = responseData.data;
        if (matchData.dispute){
            SendEmptySocketMessage('match' + matchData.matchId, "dispute");
        } else if (matchData.matchWin){
            var data = [winnerId, matchData.newPlayerRatings]
            SendSocketMessage('match' + matchData.matchId, "matchWin", data);
        } else if (matchData.confirmed){
            SendSocketMessage('match' + matchData.matchId, "gameWin", winnerId);
        } else{
            SendSocketMessage('match' + matchData.matchId, "playerConfirmedWin", winnerId);
        }
    } catch (err){
        console.error(err);
        res.sendStatus(500);
    }
});

router.post("/CasualMatchEnd", async (req, res) => {
    try {
        var userId = req.body.userId;

        if (!CheckUserDefined(req)) return SetResponse(res, userErrors.notLoggedIn);

        var responseData = await PlayerSentCasualMatchEnd(userId);
        if (!ResponseSucceeded(responseData.code)) return SetResponse(res, responseData);

        res.sendStatus(responseData.code);
        SendEmptySocketMessage('match' + responseData.data, "matchEnd");
    } catch (err){
        console.error(err);
        res.sendStatus(500);
    }
});

router.post("/ForfeitMatch", async (req, res) => {
    try {
        var userId = req.body.userId;

        if (!CheckUserDefined(req)) return SetResponse(res, userErrors.notLoggedIn);

        var responseData = await PlayerSentForfeit(userId);
        if (!ResponseSucceeded(responseData.code)) return SetResponse(res, responseData);

        var matchId = responseData.data.matchId;

        var data = {
            forfeitId: userId,
            newPlayerRatings: responseData.newPlayerRatings,
        }

        res.sendStatus(responseData.code);
        SendSocketMessage('match' + matchId, "forfeit", data);
    } catch (err){
        console.error(err);
        res.sendStatus(500);
    }
});

router.post("/Dispute", async (req, res) => {
    try {
        var userId = req.body.userId;

        if (!CheckUserDefined(req)) return SetResponse(res, userErrors.notLoggedIn);

        var responseData = PlayerSentMatchDispute(userId);
        if (!ResponseSucceeded(responseData.code)) return SetResponse(res, responseData);

        res.sendStatus(responseData.code);
        SendEmptySocketMessage('match' + responseData.data, "dispute");
    } catch (err){
        console.error(err);
        res.sendStatus(500);
    }
});

router.post("/ResolveDispute", async (req, res) => {
    try {
        const userId = req.session.user;
        if (!CheckUserDefined(req)) return SetResponse(res, userErrors.notLoggedIn);

        var responseData = await PlayerSentResolveDispute(userId);
        if (!ResponseSucceeded(responseData.code)) return SetResponse(res, responseData);

        if (responseData.data === matchModes.casual){
            res.sendStatus(responseData.code);
            SendSocketMessage('match' + matchId, "resolveDispute", disputeResolveOptions.noChanges);
            return;
        }
        
        if (!responseData.data){
            return res.sendStatus(responseData.code);
        }
        
        SendSocketMessage('match' + responseData.data, "resolveDispute", disputeResolveOptions.noChanges);
        res.sendStatus(responseData.code);
    } catch (err){
        console.error(err);
        res.sendStatus(500);
    }
});

//matchId, message
router.post("/SendChatMessage", async (req, res) => {
    try {
        const userId = req.session.user;
        const matchId = req.body.matchId;
        const message = req.body.message;

        if (!CheckUserDefined(req)) return SetResponse(res, userErrors.notLoggedIn);
        if (await CheckUserBanned(userId)) return SetResponse(res, userErrors.banned);
        if (typeof(matchId) !== 'string') return SetResponse(res, definitionErrors.matchUndefined);
        if (typeof(message) !== 'string') return SetResponse(res, definitionErrors.chatMessageUndefined);

        var responseData = await UserSentChatMessage(matchId, userId, message);
        if (!ResponseSucceeded(responseData.code)) return SetResponse(res, responseData);

        res.sendStatus(responseData.code);
        var socketMessage = {ownerId: userId, content: message, date: Date.now()};
        SendSocketMessage('match' + matchId, "chatMessage", socketMessage);
    } catch (err){
        res.sendStatus(500);
    }
});

//matchId, loadedMessagesAmount: amount of messages client has already loaded
router.post("/LoadChatMessages", async (req, res) => {
    try {
        const matchId = req.body.matchId;
        const loadedMessagesAmount = req.body.loadedMessagesAmount;
        const userId = req.session.user;

        if (typeof(matchId) !== 'string') return SetResponse(res, definitionErrors.matchUndefined);
        if (typeof(loadedMessagesAmount) !== 'number') return SetResponse(res, definitionErrors.chatMessageUndefined);
        if (loadedMessagesAmount < 0) return SetResponse(res, definitionErrors.chatMessageUndefined);

        var userRole = userRoles.unverified;
        if (userId) userRole = await GetUserRole(userId);

        //change after here, create match search first and DB query
        var match = structuredClone(FindMatch(matchId));
        var players = [];
        var data = [];
        if (!match){
            let matchData = await GetMatch(matchId);
            if (!matchData) return SetResponse(res, nullErrors.noMatch);

            var chatMessages = await GetChatMessages(matchId, loadedMessagesAmount);

            for (let i = chatMessages.length - 1; i >= 0; i--){
                var chatMessage = new ChatMessage(chatMessages[i].content, chatMessages[i].owner_id, chatMessages[i].unix_date);
                data.push(chatMessage);
            }
            players = [matchData.player1_id, matchData.player2_id];
        } else{
            data = match.chat;

            let messageLimit = Math.min(data.length, loadedMessagesAmount);
            data.splice(-messageLimit);

            if (data.length > chatLoadLimit ){
                data.splice(0, data.length - chatLoadLimit);
            }
            players = [match.players[0].id, match.players[1].id];
        }

        //check if user has access
        if (!CheckIfPlayerIsId(players[0], userId) && !CheckIfPlayerIsId(players[1], userId)){
            //mods cant see PBs
            if (userRole != userRoles.mod || match.privateBattle){
                return SetResponse(res, userErrors.noAccess);
            }
        }

        res.status(200).send(data);
    } catch (err){
        console.error(err);
        res.sendStatus(500);
    }
});


//requests

//req: match id
//res: match object, players, other users in chat
//deleted accounts are undefined players
router.post("/GetMatchInfo", async (req, res) => {
    try {
        const matchId = req.body.matchId;
        const userId = req.session.user;

        if (typeof(matchId) !== 'string') return SetResponse(res, definitionErrors.matchUndefined);

        var userRole = userRoles.unverified;
        if (userId) userRole = await GetUserRole(userId);

        var matchHidden = true;

        var match = structuredClone(FindMatch(matchId));
        if (!match){
            matchHidden = false;

            let matchData = await GetMatch(matchId);
            if (!matchData) return SetResponse(res, nullErrors.noMatch);

            let gameData = await GetMatchGames(matchId);
            let strikeData = [];
            for (let i = 0; i < gameData.length; i++){
                strikeData[i] = await GetStageStrikes(gameData[i].id);
            }

            let chatMessages = await GetChatMessages(matchId);

            match = ConvertDBMatchToMatch(matchData, gameData, strikeData, chatMessages);
        }

        var players = [null, null]
        if (match.players[0].id !== null){
            players[0] = await GetUserData(match.players[0].id);
            players[0].g2_rating = ApplyHideRank(players[0]);
        }

        if (match.players[1].id !== null){
            players[1] = await GetUserData(match.players[1].id);
            players[1].g2_rating = ApplyHideRank(players[1]);
        }

        //check if user has access
        if (!CheckIfPlayerIsId(players[0], userId) && !CheckIfPlayerIsId(players[1], userId)){
            //mods cant see PBs
            if (userRole != userRoles.mod || match.privateBattle){
                if (matchHidden) return SetResponse(res, userErrors.noAccess);
                match.chat = [];
            }
        }

        if (match.chat.length > chatLoadLimit){
            match.chat.splice(0, match.chat.length - chatLoadLimit);
        }

        var othersInChatIds = [systemId];

        for (let i = 0; i < match.chat.length; i++){
            if (!othersInChatIds.includes(match.chat[i].ownerId)) othersInChatIds.push(match.chat[i].ownerId);
        }

        for (let i = othersInChatIds.length - 1; i >= 0; i--){
            if (othersInChatIds[i] == players[0].id || othersInChatIds[i] == players[1].id) othersInChatIds.splice(i, 1);
        }

        var othersInChat = [];
        for (let i = 1; i < othersInChatIds.length; i++){
            othersInChat[i] = await GetUserChatData(othersInChatIds);
        }

        var data = {
            match: match,
            players: players,
            othersInChat: othersInChat
        };
    
        res.status(200).send(data);
    } catch (err){
        console.error(err);
        res.sendStatus(500);
    }
    
});

function CheckIfPlayerIsId(player, id){
    if (!player) return false;
    if (player.id === id) return true;
    return false;
}

export default router;