import { Router } from 'express';
import { AddPlayerToQue, RemovePlayerFromQue, PlayerSentReady, GetQueAvailible } from "../queManager.js";
import { CheckUserDefined } from "../utils/checkDefined.js";
import { SendSocketMessage } from "../socketManager.js";
import { definitionErrors, userErrors } from '../responses/requestErrors.js';
import { ResponseSucceeded, SetErrorResponse } from '../responses/ResponseData.js';
import { CheckUserBanned } from '../utils/userUtils.js';
import { leaveQueErrors } from '../responses/queErrors.js';

const router = Router();

//Posts

//matchMode = string of matchmode name
router.post("/PlayerEnterQue", async (req, res) => {
    try {
        const userId = req.session.user;
        const matchMode = req.body.matchMode;

        if (!CheckUserDefined(req)) return SetErrorResponse(res, userErrors.notLoggedIn);
        if (await CheckUserBanned(userId)) return SetErrorResponse(res, userErrors.banned);
        if (typeof(matchMode) !== 'string') return SetErrorResponse(res, definitionErrors.matchModeUndefined);

        let responseData = await AddPlayerToQue(userId, matchMode);
        if (!ResponseSucceeded(responseData.code)) return SetErrorResponse(res, responseData);

        res.status(responseData.code).send({});
    } catch (err){
        console.log(err);
        res.sendStatus(500);
    }
});

//matchMode = string of matchmode name
router.post("/PlayerLeaveQue", async (req, res) => {
    try {
        const userId = req.session.user;
        const matchMode = req.body.matchMode;

        if (!CheckUserDefined(req)) return SetErrorResponse(res, userErrors.notLoggedIn);
        if (typeof(matchMode) !== 'string') return SetErrorResponse(res, definitionErrors.matchModeUndefined);

        if (RemovePlayerFromQue(userId, matchMode)){
            res.status(201).send({});
            return;
        }
        return SetErrorResponse(res, leaveQueErrors.notInQue);
    } catch (err){
        console.error(err);
        res.sendStatus(500);
    }
});

router.post("/PlayerReady", async (req, res) => {
    //if match created send socket
    try {
        const userId = req.session.user;

        if (!CheckUserDefined(req)) return SetErrorResponse(res, userErrors.notLoggedIn);

        let responseData = await PlayerSentReady(userId);
        if (!ResponseSucceeded(responseData.code)) return SetErrorResponse(res, responseData);
        req.session.touch();
        //update irrelevant part of cookie so browser gets new expire date (express session... why...)
        req.session.now = Math.floor(Date.now() / 1000);
        res.status(responseData.code).send({});

        if (!responseData.data) return;

        let match = responseData.data;
        
        let player1Room = "userRoom" + match.players[0].id.toString();
        let player2Room = "userRoom" + match.players[1].id.toString();
        SendSocketMessage(player1Room, "matchReady", match.id.toString());
        SendSocketMessage(player2Room, "matchReady", match.id.toString());
    } catch (err){
        console.error(err);
        res.sendStatus(500);
    }
});

router.get('/GetMatchmakingStatus', async (req, res) => {
    try {
        let data = GetQueAvailible();

        res.status(200).send(data);
    } catch (err){
        res.sendStatus(500);
    }
});

export default router;