import { AddPlayerToQue, RemovePlayerFromQue, PlayerSentReady } from "../queManager";
import { GetUserData } from "../database";

import { CheckIfRealMatchMode, CheckUserDefined, CheckVariableDefined } from "../utils/checkDefined";

//Posts

//matchmode
export async function PostEnterQue(req, res){
    try {
        const userId = req.session.user;
        const matchMode = req.body.matchMode;

        if (!CheckUserDefined(req, res)) return;
        if (!CheckIfRealMatchMode(matchMode)) return;

        var user = await GetUserData(userId);

        if (!CheckVariableDefined(user)) return;

        if (user.banned){
            res.sendStatus(403);
            return;
        }

        if (AddPlayerToQue(userId, matchMode)){
            res.sendStatus(201);
            return;
        }
        res.sendStatus(403);
    } catch (err){
        res.sendStatus(500);
    }
};

//matchMode
export function PostLeaveQue(req, res){
    try {
        const userId = req.session.user;
        const matchMode = req.body.matchMode;

        if (!CheckUserDefined(req, res)) return;
        if (!CheckIfRealMatchMode(matchMode)) return;

        if (RemovePlayerFromQue(userId, matchMode)){
            res.sendStatus(201);
            return;
        }
        res.sendStatus(403);
    } catch (err){
        res.sendStatus(500);
    }
};

export function PostPlayerReady(req, res){
    try {
        const userId = req.session.user;

        if (!CheckUserDefined(req, res)) return;

        if (PlayerSentReady(userId)){
            res.sendStatus(201);
            return;
        }
        res.sendStatus(403);
    } catch (err){
        res.sendStatus(500);
    }
};

//Requests