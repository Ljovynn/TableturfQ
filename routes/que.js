import { AddPlayerToQue, RemovePlayerFromQue, PlayerSentReady, FindIfPlayerInQue } from "../queManager.js";
import { GetUserData } from "../database.js";

import { CheckIfRealMatchMode, CheckUserDefined, CheckVariableDefined } from "../utils/checkDefined.js";

import { GetCurrentUser } from "../utils/userUtils.js";

//Posts

//matchmode
export async function PostEnterQue(req, res){
    try {
        const userId = req.session.user;
        console.log(userId);
        const matchMode = req.body.matchMode;

        if (!CheckUserDefined(req, res)) return;
        if (!CheckIfRealMatchMode(matchMode, res)) return;

        var user = await GetUserData(userId);

        if (!CheckVariableDefined(user, res)) return;

        if (user.banned){
            res.sendStatus(403);
            return;
        }

        if (await AddPlayerToQue(userId, matchMode)){
            res.sendStatus(201);
            return;
        }
        res.sendStatus(403);
    } catch (err){
        console.log(err);
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

export async function PostPlayerReady(req, res){
    try {
        const userId = req.session.user;

        if (!CheckUserDefined(req, res)) return;

        var match = await PlayerSentReady(userId);

        if (match){
            res.sendStatus(201);
            return match;
        }
        res.sendStatus(403);
        return undefined;
    } catch (err){
        res.sendStatus(500);
        return undefined;
    }
};

//Requests

//res: user, quedata
//quedata: matchmode, time when que started
export function GetUserQueData(req, res){
    try {
        var user = GetCurrentUser(req);
        if (!user){
            res.sendStatus(401);
            return;
        }

        var queData = FindIfPlayerInQue(user.id);

        var data = {
            user: user,
            queData: queData
        }

        res.status(200).send(data);
    } catch (err){
        res.sendStatus(500);
    }
}