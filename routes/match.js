import { Router } from 'express';
import cookieParser from "cookie-parser";
import { DeserializeSession } from '../utils/session.js';

import { PlayerSentStageStrikes, PlayerSentStagePick, PlayerSentGameWin, PlayerSentCasualMatchEnd, 
    UserSentChatMessage, PlayerSentMatchDispute } from '../matchManager.js';

import { FindMatch } from '../matchManager.js';

import { GetChatMessages, GetMatch, GetMatchGames, GetUserChatData, GetUserData, GetStageStrikes } from '../database.js';
import { ConvertDBMatchToMatch } from '../utils/matchUtils.js';
import { userRoles } from '../public/constants/userData.js';

import { CheckIfArray, CheckIfString, CheckUserDefined, CheckVariableDefined } from '../utils/checkDefined.js';

import { GetCurrentUser } from '../utils/userUtils.js';

import { SendSocketMessage, SendEmptySocketMessage } from '../socketManager.js';

import dotenv from 'dotenv';

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

        if (!CheckUserDefined(req, res)) return;
        if (!CheckIfArray(stages, res)) return;

        var responseData = PlayerSentStageStrikes(userId, stages);

        if (responseData.isSuccess){
            res. sendStatus(201);
            SendSocketMessage('match' + responseData.data, "stageStrikes", stages);
            return;
        }
        res.status(403).send(responseData.data);
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

        if (!CheckUserDefined(req, res)) return;
        if (!CheckVariableDefined(stage, res)) return;

        var responseData = PlayerSentStagePick(userId, stage);

        if (responseData.isSuccess){
            res.sendStatus(201);
            SendSocketMessage('match' + responseData.data, "stagePick", stage);
            return;
        }
        res.status(403).send(responseData.data);
    } catch (err){
        res.sendStatus(500);
    }
});

//winnerId
router.post("/WinGame", async (req, res) => {
    try {
        const userId = req.session.user;
        const winnerId = req.body.winnerId;

        if (!CheckUserDefined(req, res)) return;
        if (!CheckVariableDefined(winnerId, res)) return;

        var responseData = await PlayerSentGameWin(userId, winnerId);

        if (responseData.isSuccess){
            res.sendStatus(201);
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
            return;
        }
        res.status(403).send(responseData.data);
    } catch (err){
        console.error(err);
        res.sendStatus(500);
    }
});

router.post("/CasualMatchEnd", async (req, res) => {
    try {
        if (!CheckUserDefined(req, res)) return;

        var responseData = await PlayerSentCasualMatchEnd(userId);

        if (responseData.isSuccess){
            res.sendStatus(201);
            SendEmptySocketMessage('match' + responseData.data, "matchEnd");
            return;
        }
        res.status(403).send(responseData.data);
    } catch (err){
        res.sendStatus(500);
    }
});

router.post("/Dispute", async (req, res) => {
    try {
        if (!CheckUserDefined(req, res)) return;

        var responseData = PlayerSentMatchDispute(userId);

        if (responseData.isSuccess){
            res.sendStatus(201);
            SendEmptySocketMessage('match' + responseData.data, "dispute");
            return;
        }
        res.status(403).send(responseData.data);
    } catch (err){
        res.sendStatus(500);
    }
});

//message
router.post("/SendChatMessage", async (req, res) => {
    try {
        const userId = req.session.user;
        const message = req.body.message;

        if (!CheckUserDefined(req, res)) return;
        if (!CheckIfString(message, res)) return;

        var responseData = UserSentChatMessage(userId, message);

        if (responseData.isSuccess){
            res.sendStatus(201);
            var socketMessage = [userId, message];
            SendSocketMessage('match' + responseData.data, "chatMessage", socketMessage);
            return;
        }
        res.status(403).send(responseData.data);
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

        var user = await GetCurrentUser(req);
        if (!user) {
            res.sendStatus(403);
            return;
        }

        if (!matchId){
            res.sendStatus(400); 
            return;
        }

        var matchHidden = true;

        var match = FindMatch(matchId);
        if (!match){
            matchHidden = false;

            var matchData = await GetMatch(matchId);
            if (!matchData){
                res.sendStatus(400); 
                return;
            }
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
            if (!user){
                res.sendStatus(401);
                return;
            }
            if (user.id != players[0].id && user.id != players[1].id){
                if (user.role != userRoles.mod){
                    res.sendStatus(403);
                    return;
                }
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
    
        //res.status(200).send(data);
        res.send(data);
    } catch (err){
        console.error(err);
        res.sendStatus(500);
    }
    
});

export default router;