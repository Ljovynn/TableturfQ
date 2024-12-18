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

import { definitionErrors, nullErrors, userErrors } from '../responses/requestErrors.js';
import { ResponseSucceeded, SetErrorResponse } from '../responses/ResponseData.js';
import { chatLoadLimit, ChatMessage, disputeResolveOptions, matchModes } from '../public/constants/matchData.js';
import { CheckUserBanned } from '../utils/userUtils.js';

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

        if (!CheckUserDefined(req)) return SetErrorResponse(res, userErrors.notLoggedIn);
        if (!CheckIfArray(stages, res) || stages.length == 0) return SetErrorResponse(res, definitionErrors.stagesUndefined);

        let responseData = PlayerSentStageStrikes(userId, stages);
        if (!ResponseSucceeded(responseData.code)) return SetErrorResponse(res, responseData);

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

        if (!CheckUserDefined(req)) return SetErrorResponse(res, userErrors.notLoggedIn);
        if (typeof(stage) !== 'number') return SetErrorResponse(res, definitionErrors.stageUndefined);

        let responseData = PlayerSentStagePick(userId, stage);
        if (!ResponseSucceeded(responseData.code)) return SetErrorResponse(res, responseData);

        res.status(responseData.code).send({});
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

        if (!CheckUserDefined(req)) return SetErrorResponse(res, userErrors.notLoggedIn);
        if (typeof(winnerId) !== 'string') return SetErrorResponse(res, definitionErrors.winnerUndefined);

        let responseData = await PlayerSentGameWin(userId, winnerId);
        if (!ResponseSucceeded(responseData.code)) return SetErrorResponse(res, responseData);

        let matchData = responseData.data;
        SendSocketMessage('match' + matchData.matchId, "playerConfirmedWin", {playerId: userId, winnerId: winnerId});
        if (matchData.dispute){
            SendEmptySocketMessage('match' + matchData.matchId, "dispute");
        } else if (matchData.matchWin){
            let data = {winnerId: winnerId, newPlayerRatings: matchData.newPlayerRatings}
            SendSocketMessage('match' + matchData.matchId, "matchWin", data);
        } else if (matchData.confirmed){
            SendSocketMessage('match' + matchData.matchId, "gameWin", winnerId);
        }
        res.status(responseData.code).send({});
    } catch (err){
        console.error(err);
        res.sendStatus(500);
    }
});

router.post("/CasualMatchEnd", async (req, res) => {
    try {
        let userId = req.body.userId;

        if (!CheckUserDefined(req)) return SetErrorResponse(res, userErrors.notLoggedIn);

        let responseData = await PlayerSentCasualMatchEnd(userId);
        if (!ResponseSucceeded(responseData.code)) return SetErrorResponse(res, responseData);

        res.status(responseData.code).send({});
        SendEmptySocketMessage('match' + responseData.data, "matchEnd");
    } catch (err){
        console.error(err);
        res.sendStatus(500);
    }
});

router.post("/ForfeitMatch", async (req, res) => {
    try {
        let userId = req.body.userId;

        if (!CheckUserDefined(req)) return SetErrorResponse(res, userErrors.notLoggedIn);

        let responseData = await PlayerSentForfeit(userId);
        if (!ResponseSucceeded(responseData.code)) return SetErrorResponse(res, responseData);

        let matchId = responseData.data.matchId;

        let data = {
            forfeitId: userId,
            newPlayerRatings: responseData.data.newPlayerRatings,
        }

        res.status(responseData.code).send({});
        SendSocketMessage('match' + matchId, "forfeit", data);
    } catch (err){
        console.error(err);
        res.sendStatus(500);
    }
});

router.post("/Dispute", async (req, res) => {
    try {
        let userId = req.body.userId;

        if (!CheckUserDefined(req)) return SetErrorResponse(res, userErrors.notLoggedIn);

        let responseData = PlayerSentMatchDispute(userId);
        if (!ResponseSucceeded(responseData.code)) return SetErrorResponse(res, responseData);

        res.status(responseData.code).send({});
        SendEmptySocketMessage('match' + responseData.data, "dispute");
    } catch (err){
        console.error(err);
        res.sendStatus(500);
    }
});

router.post("/ResolveDispute", async (req, res) => {
    try {
        const userId = req.session.user;
        if (!CheckUserDefined(req)) return SetErrorResponse(res, userErrors.notLoggedIn);

        let responseData = await PlayerSentResolveDispute(userId);
        if (!ResponseSucceeded(responseData.code)) return SetErrorResponse(res, responseData);

        if (responseData.data === matchModes.casual){
            res.status(responseData.code).send({});
            SendSocketMessage('match' + responseData.data.matchId, "resolveDispute", disputeResolveOptions.noChanges);
            return;
        }
        
        if (!responseData.data){
            return res.status(responseData.code).send({});
        }
        
        SendSocketMessage('match' + responseData.data, "resolveDispute", disputeResolveOptions.noChanges);
        res.status(responseData.code).send({});
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

        if (!CheckUserDefined(req)) return SetErrorResponse(res, userErrors.notLoggedIn);
        if (await CheckUserBanned(userId)) return SetErrorResponse(res, userErrors.banned);
        if (typeof(matchId) !== 'string') return SetErrorResponse(res, definitionErrors.matchUndefined);
        if (typeof(message) !== 'string') return SetErrorResponse(res, definitionErrors.chatMessageUndefined);

        let responseData = await UserSentChatMessage(matchId, userId, message);
        if (!ResponseSucceeded(responseData.code)) return SetErrorResponse(res, responseData);

        res.status(responseData.code).send({});
        let socketMessage = {ownerId: userId, content: message, date: Date.now()};
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

        if (typeof(matchId) !== 'string') return SetErrorResponse(res, definitionErrors.matchUndefined);
        if (typeof(loadedMessagesAmount) !== 'number') return SetErrorResponse(res, definitionErrors.chatMessageUndefined);
        if (loadedMessagesAmount < 0) return SetErrorResponse(res, definitionErrors.chatMessageUndefined);

        let userRole = userRoles.unverified;
        if (userId) userRole = await GetUserRole(userId);

        //change after here, create match search first and DB query
        let match = structuredClone(FindMatch(matchId));
        let players = [];
        let data = [];
        if (!match){
            let matchData = await GetMatch(matchId);
            if (!matchData) return SetErrorResponse(res, nullErrors.noMatch);

            let chatMessages = await GetChatMessages(matchId, loadedMessagesAmount);

            for (let i = chatMessages.length - 1; i >= 0; i--){
                let chatMessage = new ChatMessage(chatMessages[i].content, chatMessages[i].owner_id, chatMessages[i].unix_date);
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
        if (!players[0] == userId && !players[1] == userId){
            //mods cant see PBs
            if (userRole != userRoles.mod || match.privateBattle){
                return SetErrorResponse(res, userErrors.noAccess);
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

        if (typeof(matchId) !== 'string') return SetErrorResponse(res, definitionErrors.matchUndefined);

        let userRole = userRoles.unverified;
        if (userId) userRole = await GetUserRole(userId);

        let matchHidden = true;

        let match = structuredClone(FindMatch(matchId));
        if (!match){
            matchHidden = false;

            let matchData = await GetMatch(matchId);
            if (!matchData) return SetErrorResponse(res, nullErrors.noMatch);

            let gameData = await GetMatchGames(matchId);
            let strikeData = [];
            for (let i = 0; i < gameData.length; i++){
                strikeData[i] = await GetStageStrikes(gameData[i].id);
            }

            let chatMessages = await GetChatMessages(matchId);

            match = ConvertDBMatchToMatch(matchData, gameData, strikeData, chatMessages);
        }

        let players = [null, null]
        if (match.players[0].id !== null){
            players[0] = await GetUserData(match.players[0].id);
        }

        if (match.players[1].id !== null){
            players[1] = await GetUserData(match.players[1].id);
        }

        //check if user has access
        if (!CheckIfPlayerIsId(players[0], userId) && !CheckIfPlayerIsId(players[1], userId)){
            //mods cant see PBs
            if (userRole != userRoles.mod || match.privateBattle){
                if (matchHidden) return SetErrorResponse(res, userErrors.noAccess);
                match.chat = [];
            }
        }

        if (match.chat.length > chatLoadLimit){
            match.chat.splice(0, match.chat.length - chatLoadLimit);
        }

        let othersInChatIds = [null, 
        (players[0]) ? players[0].id : null,
        (players[1]) ? players[1].id : null];

        for (let i = 0; i < match.chat.length; i++){
            if (!othersInChatIds.includes(match.chat[i].ownerId)) othersInChatIds.push(match.chat[i].ownerId);
        }

        othersInChatIds.splice(0, 3);

        const othersInChat = (othersInChatIds.length > 0) ? await GetUserChatData(othersInChatIds) : [];

        let data = {
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