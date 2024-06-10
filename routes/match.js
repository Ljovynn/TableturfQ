import { Router } from 'express';
import cookieParser from "cookie-parser";
import { DeserializeSession } from '../utils/session.js';

import { PlayerSentStageStrikes, PlayerSentStagePick, PlayerSentGameWin, PlayerSentCasualMatchEnd, 
    UserSentChatMessage, PlayerSentMatchDispute, ResolveMatchDispute } from '../matchManager.js';

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

//Posts

//stages
router.post("/StrikeStages", async (req, res) => {
    try {
        const userId = req.session.user;
        const stages = req.body.stages;

        if (!CheckUserDefined(req, res)) return;
        if (!CheckIfArray(stages, res)) return;

        var matchId = PlayerSentStageStrikes(userId, stages);

        if (matchId){
            res.sendStatus(201);
            SendSocketMessage('match' + matchId, "stageStrikes", stages);
            return;
        }
        res.sendStatus(403);
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

        var matchId = PlayerSentStagePick(userId, stage);

        if (matchId){
            res.sendStatus(201);
            SendSocketMessage('match' + matchId, "stagePick", stage);
            return;
        }
        res.sendStatus(403);
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

        var matchData = await PlayerSentGameWin(userId, winnerId);

        if (matchData && matchData.matchId){
            res.sendStatus(201);
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
        res.sendStatus(403);
    } catch (err){
        console.error(err);
        res.sendStatus(500);
    }
});

router.post("/CasualMatchEnd", async (req, res) => {
    try {
        if (!CheckUserDefined(req, res)) return;

        var matchId = PlayerSentCasualMatchEnd(userId);

        if (matchId){
            res.sendStatus(201);
            SendEmptySocketMessage('match' + matchId, "matchEnd");
            return;
        }
        res.sendStatus(403);
    } catch (err){
        res.sendStatus(500);
    }
});

router.post("/Dispute", async (req, res) => {
    try {
        if (!CheckUserDefined(req, res)) return;

        var matchId = PlayerSentMatchDispute(userId);

        if (matchId){
            res.sendStatus(201);
            SendEmptySocketMessage('match' + matchId, "dispute");
            return;
        }
        res.sendStatus(403);
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

        var matchId = UserSentChatMessage(userId, message);

        if (matchId){
            res.sendStatus(201);
            var socketMessage = [userId, message];
            SendSocketMessage('match' + data.matchId, "chatMessage", socketMessage);
            return;
        }
        res.sendStatus(403);
    } catch (err){
        res.sendStatus(500);
    }
});

//requests

//req: match id
//res: user, match object, players, other users in chat
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
        players[0] = await GetUserData(match.players[0].id);
        players[1] = await GetUserData(match.players[1].id);

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