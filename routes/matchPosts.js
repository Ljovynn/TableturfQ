import { PlayerSentStageStrikes, PlayerSentStagePick, PlayerSentGameWin, PlayerSentCasualMatchEnd, 
    PlayerSentChatMessage, PlayerSentMatchDispute, ResolveMatchDispute } from '../matchManager.js';

//stages
export function PostStageStrikes(req, res){
    try {

        const playerId = req.session.user;
        const stages = req.body.stages;

        if (!playerId){
            res.sendStatus(401);
            return;
        }

        if (!Array.isArray(stages)){
            res.sendStatus(400);
            return;
        }

        if (PlayerSentStageStrikes(playerId, stages)){
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
        const playerId = req.session.user;
        const stage = req.body.stage;

        if (!CheckPlayerAndVariableDefined(playerId, stage, res)) return;

        if (PlayerSentStagePick(playerId, stage)){
            res.sendStatus(201);
            return;
        }
        res.sendStatus(403);
    } catch (err){
        res.sendStatus(500);
    }
}

//winnerId
export function PostGameWin(req, res){
    try {
        const playerId = req.session.user;
        const winnerId = req.body.winnerId;

        if (!CheckPlayerAndVariableDefined(playerId, winnerId, res)) return;

        if (PlayerSentGameWin(playerId, winnerId)){
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
        const playerId = req.session.user;

        if (!playerId){
            res.sendStatus(401);
            return;
        }

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
        const playerId = req.session.user;
        const message = req.body.message;

        if (!CheckPlayerAndVariableDefined(playerId, message, res)) return;

        if (typeof(message) != "string"){
            res.sendStatus(400);
        }

        if (PlayerSentChatMessage(playerId, message)){
            res.sendStatus(201);
            return;
        }
        res.sendStatus(403);
    } catch (err){
        res.sendStatus(500);
    }
}

function CheckPlayerAndVariableDefined(playerId, variable, res){
    if (!playerId){
        res.sendStatus(401);
        return false;
    } else if (!variable){
        res.sendStatus(400);
        return false;
    }
    return true;
}