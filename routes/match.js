import { Router } from 'express';
import cookieParser from "cookie-parser";
import { DeserializeSession } from '../utils/session.js';

import { PlayerSentStageStrikes, PlayerSentStagePick, PlayerSentGameWin, PlayerSentCasualMatchEnd, 
    UserSentChatMessage, PlayerSentMatchDispute } from '../matchManager.js';

import { FindMatch } from '../matchManager.js';

import { GetChatMessages, GetMatch, GetMatchGames, GetUserChatData, GetUserData, GetStageStrikes } from '../database.js';
import { ConvertDBMatchToMatch } from '../utils/matchUtils.js';
import { userRoles } from '../public/constants/userData.js';

import { CheckIfArray, CheckUserDefined } from '../utils/checkDefined.js';

import { GetCurrentUser } from '../utils/userUtils.js';

import { SendSocketMessage, SendEmptySocketMessage } from '../socketManager.js';

import dotenv from 'dotenv';
import { definitionErrors, nullErrors, userErrors } from '../public/Responses/requestErrors.js';
import { ResponseSucceeded } from '../public/Responses/ResponseData.js';

const router = Router();

dotenv.config();

const sessionSecret = process.env.SESSION_SECRET;

router.use(cookieParser(sessionSecret));
router.use(DeserializeSession);

/*router.get("/Test", async (req, res) => {
    try {
        SendDisputeMessage(GetDisputedMatchesList(), false);
        res.sendStatus(200);
    } catch (err){
        res.sendStatus(500);
    }
});*/

//Posts

//stages
router.post("/StrikeStages", async (req, res) => {
    try {
        const userId = req.session.user;
        const stages = req.body.stages;

        if (!CheckUserDefined(req)) return res.status(401).send(userErrors.notLoggedIn);
        if (!CheckIfArray(stages, res) || stages.length == 0) return res.status(400).send(definitionErrors.stagesUndefined);

        var responseData = PlayerSentStageStrikes(userId, stages);
        if (!ResponseSucceeded(responseData.responseCode)) return res.status(responseData.responseCode).send(responseData.data);

        res. sendStatus(responseData.responseCode);
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

        if (!CheckUserDefined(req)) return res.status(401).send(userErrors.notLoggedIn);
        if (typeof(stage) !== 'number') return res.status(400).send(definitionErrors.stageUndefined);

        var responseData = PlayerSentStagePick(userId, stage);
        if (!ResponseSucceeded(responseData.responseCode)) return res.status(responseData.responseCode).send(responseData.data);

        res.sendStatus(responseData.responseCode);
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

        if (!CheckUserDefined(req)) return res.status(401).send(userErrors.notLoggedIn);
        if (typeof(winnerId) !== 'number') return res.status(400).send(definitionErrors.winnerUndefined);

        var responseData = await PlayerSentGameWin(userId, winnerId);
        if (!ResponseSucceeded(responseData.responseCode)) return res.status(responseData.responseCode).send(responseData.data);

        res.sendStatus(responseData.responseCode);
        var matchData = responseData.data;
        if (matchData.dispute){
            SendEmptySocketMessage('match' + matchData.matchId, "dispute");
        } else if (matchData.matchWin){
            SendSocketMessage('match' + matchData.matchId, "matchWin", winnerId);
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
        if (!CheckUserDefined(req)) return res.status(401).send(userErrors.notLoggedIn);

        var responseData = await PlayerSentCasualMatchEnd(userId);
        if (!ResponseSucceeded(responseData.responseCode)) return res.status(responseData.responseCode).send(responseData.data);

        res.sendStatus(responseData.responseCode);
        SendEmptySocketMessage('match' + responseData.data, "matchEnd");
    } catch (err){
        res.sendStatus(500);
    }
});

router.post("/Dispute", async (req, res) => {
    try {
        if (!CheckUserDefined(req)) return res.status(401).send(userErrors.notLoggedIn);

        var responseData = PlayerSentMatchDispute(userId);
        if (!ResponseSucceeded(responseData.responseCode)) return res.status(responseData.responseCode).send(responseData.data);

        res.sendStatus(responseData.responseCode);
        SendEmptySocketMessage('match' + responseData.data, "dispute");
    } catch (err){
        res.sendStatus(500);
    }
});

//message
router.post("/SendChatMessage", async (req, res) => {
    try {
        const userId = req.session.user;
        const message = req.body.message;

        if (!CheckUserDefined(req)) return res.status(401).send(userErrors.notLoggedIn);
        if (typeof(message) !== 'string') return res.status(400).send(definitionErrors.chatMessageUndefined);

        var responseData = UserSentChatMessage(userId, message);
        if (!ResponseSucceeded(responseData.responseCode)) return res.status(responseData.responseCode).send(responseData.data);

        res.sendStatus(responseData.responseCode);
        var socketMessage = [userId, message];
        SendSocketMessage('match' + responseData.data, "chatMessage", socketMessage);
    } catch (err){
        res.sendStatus(500);
    }
});

//requests

//req: match id
//res: user, match object, players, other users in chat
//deleted accounts are undefined players
router.post("/GetMatchInfo", async (req, res) => {
    try {
        const matchId = req.body.matchId;

        if (typeof(matchId) !== 'number') return res.status(400).send(definitionErrors.matchUndefined);

        var user = await GetCurrentUser(req);
        if (!user) return res.status(401).send(definitionErrors.notLoggedIn);

        var matchHidden = true;

        var match = FindMatch(matchId);
        if (!match){
            matchHidden = false;

            var matchData = await GetMatch(matchId);
            if (!matchData) return res.status(400).send(nullErrors.noMatch);

            var gameData = await GetMatchGames(matchId);
            var strikeData = [];
            for (let i = 0; i < gameData.length; i++){
                strikeData[i] = await GetStageStrikes(gameData[i].id);
            }

            var chatMessages = await GetChatMessages(matchId);

            match = ConvertDBMatchToMatch(matchData, gameData, strikeData, chatMessages);
        }

        var players = []
        if (match.players[0].id != 0) players[0] = await GetUserData(match.players[0].id);
        if (match.players[1].id != 0) players[1] = await GetUserData(match.players[1].id);

        //check if user has access
        if (matchHidden){
            if (!user) return res.status(401).send(userErrors.notLoggedIn);

            if (user.id != players[0].id && user.id != players[1].id){
                if (user.role != userRoles.mod) return res.status(403).send(userErrors.noAccess);
            }
        }

        var othersInChatIds = [];

        for (let i = 0; i < match.chat.length; i++){
            if (!othersInChatIds.includes(match.chat[i].ownerId)) othersInChatIds.push(match.chat[i].ownerId);
        }

        for (let i = othersInChatIds.length - 1; i >= 0; i--){
            if (othersInChatIds[i] == players[0].id || othersInChatIds[i] == players[1].id) othersInChatIds.splice(i, 1);
        }

        var othersInChat = await GetUserChatData(othersInChatIds);

        var data = {
            user: user,
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

export default router;