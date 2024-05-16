import { PlayerSentStageStrikes, PlayerSentStagePick, PlayerSentGameWin, PlayerSentCasualMatchEnd, 
    PlayerSentChatMessage, PlayerSentMatchDispute, ResolveMatchDispute } from '../matchManager.js';

import { FindMatch } from '../matchManager.js';

import { GetChatMessages, GetMatch, GetMatchGames, GetUserChatData, GetUserData, GetStageStrikes } from '../database.js';
import { ConvertDBMatchToMatch } from '../utils/matchUtils.js';
import { userRoles } from '../public/constants/userData.js';

import { CheckIfArray, CheckIfString, CheckUserDefined, CheckVariableDefined } from '../utils/checkDefined.js';

//Posts

//stages
export function PostStageStrikes(req, res){
    try {
        const userId = req.session.user;
        const stages = req.body.stages;

        if (!CheckUserDefined(req, res)) return;
        if (!CheckIfArray(stages, res)) return;

        if (PlayerSentStageStrikes(userId, stages)){
            res.sendStatus(201);
            return;
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

        if (PlayerSentStagePick(userId, stage)){
            res.sendStatus(201);
            return;
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

        if (await PlayerSentGameWin(userId, winnerId)){
            res.sendStatus(201);
            return;
        }
        res.sendStatus(403);
    } catch (err){
        res.sendStatus(500);
    }
}

export async function PostCasualMatchEnd(req, res){
    try {
        if (!CheckUserDefined(req, res)) return;

        if (await PlayerSentCasualMatchEnd(playerId)){
            res.sendStatus(201);
            return;
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

        if (PlayerSentChatMessage(userId, message)){
            res.sendStatus(201);
            return;
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

        var user;
        if (req.session && req.session.user){
            user = GetUserData(req.session)
        } else{
            res.sendStatus(401);
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
            "user": user,
            "match": match,
            "players": players,
            "othersInChat": othersInChat
        };
    
        res.status(200).send(data);
    } catch (err){
        res.sendStatus(500);
    }
};