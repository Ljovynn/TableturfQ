import { PlayerSentStageStrikes, PlayerSentStagePick, PlayerSentGameWin, PlayerSentCasualMatchEnd, 
    PlayerSentChatMessage, PlayerSentMatchDispute, ResolveMatchDispute } from '../matchManager.js';

//stages
export function PostStageStrikes(req, res){
    try {
        const playerId = req.session.user;
        const stages = req.body.stages;

        if (!CheckUserDefined(req, res)) return;
        if (!CheckIfArray(stages, res)) return;

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

        if (!CheckUserDefined(req, res)) return;
        if (!CheckVariableDefined(stage, res)) return;

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
export async function PostGameWin(req, res){
    try {
        const playerId = req.session.user;
        const winnerId = req.body.winnerId;

        if (!CheckUserDefined(req, res)) return;
        if (!CheckVariableDefined(winnerId, res)) return;

        if (await PlayerSentGameWin(playerId, winnerId)){
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
        const playerId = req.session.user;
        const message = req.body.message;

        if (!CheckUserDefined(req, res)) return;
        if (!CheckIfString(message, res)) return;

        if (PlayerSentChatMessage(playerId, message)){
            res.sendStatus(201);
            return;
        }
        res.sendStatus(403);
    } catch (err){
        res.sendStatus(500);
    }
}

function CheckUserDefined(req, res){
    if (!req.session || !req.session.user){
        res.sendStatus(401);
        return false;
    }
    return true;
}

function CheckVariableDefined(variable, res){
    if (!variable){
        res.sendStatus(400);
        return false;
    }
    return true;
}

function CheckIfArray(arr, res){
    if (!Array.isArray(arr)){
        res.sendStatus(400);
        return false;
    }
    return true;
}

function CheckIfString(str, res){
    if (typeof(str) != "string"){
        res.sendStatus(400);
        return false;
    }
    return true;
}