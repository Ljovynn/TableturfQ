import { PlayerSentStageStrikes, PlayerSentStagePick, PlayerSentGameWin, PlayerSentCasualMatchEnd, 
    UserSentChatMessage, PlayerSentMatchDispute, ResolveMatchDispute } from '../matchManager.js';

import { FindMatch } from '../matchManager.js';

import { GetChatMessages, GetMatch, GetMatchGames, GetUserChatData, GetUserData, GetStageStrikes } from '../database.js';
import { ConvertDBMatchToMatch } from '../utils/matchUtils.js';
import { userRoles } from '../public/constants/userData.js';

import { CheckIfArray, CheckIfString, CheckUserDefined, CheckVariableDefined } from '../utils/checkDefined.js';

import { GetCurrentUser } from '../utils/userUtils.js';

//Posts

//stages
export function PostStageStrikes(req, res){
    try {
        const userId = req.session.user;
        const stages = req.body.stages;

        if (!CheckUserDefined(req, res)) return;
        if (!CheckIfArray(stages, res)) return;

        var matchId = PlayerSentStageStrikes(userId, stages);

        if (matchId){
            res.sendStatus(201);
            var data = {
                matchId: matchId,
                stages: stages
            }
            return data;
        }
        res.sendStatus(403);
    } catch (err){
        res.sendStatus(500);
    }
};

//stage
export function PostStagePick(req, res){
    try {
        const userId = req.session.user;
        const stage = req.body.stage;

        if (!CheckUserDefined(req, res)) return;
        if (!CheckVariableDefined(stage, res)) return;

        var matchId = PlayerSentStagePick(userId, stage);

        if (matchId){
            res.sendStatus(201);
            var data = {
                matchId: matchId,
                stage: stage
            }
            return data;
        }
        res.sendStatus(403);
    } catch (err){
        res.sendStatus(500);
    }
}

//winnerId
export async function PostGameWin(req, res){
    try {
        const userId = req.session.user;
        const winnerId = req.body.winnerId;

        if (!CheckUserDefined(req, res)) return;
        if (!CheckVariableDefined(winnerId, res)) return;

        var matchId = PlayerSentGameWin(userId, winnerId);

        if (matchId){
            res.sendStatus(201);
            var data = {
                matchId: matchId,
                winnerId: winnerId
            }
            return data;
        }
        res.sendStatus(403);
    } catch (err){
        res.sendStatus(500);
    }
}

export async function PostCasualMatchEnd(req, res){
    try {
        if (!CheckUserDefined(req, res)) return;

        var matchId = PlayerSentCasualMatchEnd(userId);

        if (matchId){
            res.sendStatus(201);
            return matchId;
        }
        res.sendStatus(403);
    } catch (err){
        res.sendStatus(500);
    }
}

//message
export function PostChatMessage(req, res){
    try {
        const userId = req.session.user;
        const message = req.body.message;

        if (!CheckUserDefined(req, res)) return;
        if (!CheckIfString(message, res)) return;

        var matchId = UserSentChatMessage(userId, message);
        console.log('Match ID: ' + matchId);

        if (matchId){
            res.sendStatus(201);
            var data = {
                matchId: matchId,
                userId: userId,
                message: message
            }
            return data;
        }
        res.sendStatus(403);
    } catch (err){
        res.sendStatus(500);
    }
}

//requests

//req: match id
//res: user, match object, players, other users in chat

export async function GetMatchInfo(req, res){
    try {
        const matchId = req.body.matchId;

        var user = GetCurrentUser(req);

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
        players[0] = await GetUserData(match.player1_id);
        players[1] = await GetUserData(match.player2_id);

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
    
        res.status(200).send(data);
    } catch (err){
        res.sendStatus(500);
    }
};