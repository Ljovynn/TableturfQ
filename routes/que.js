import { Router } from 'express';
import { AddPlayerToQue, RemovePlayerFromQue, PlayerSentReady } from "../queManager.js";
import { CheckUserDefined } from "../utils/checkDefined.js";
import { SendSocketMessage } from "../socketManager.js";
import { definitionErrors, userErrors } from '../Responses/requestErrors.js';
import { ResponseSucceeded, SetResponse } from '../Responses/ResponseData.js';
import { CheckUserBanned } from '../utils/userUtils.js';

const router = Router();

//Posts

//matchMode = string of matchmode name
router.post("/PlayerEnterQue", async (req, res) => {
    try {
        const userId = req.session.user;
        const matchMode = req.body.matchMode;

        if (!CheckUserDefined(req)) return SetResponse(res, userErrors.notLoggedIn);
        if (await CheckUserBanned(userId)) return SetResponse(res, userErrors.banned);
        if (typeof(matchMode) !== 'string') return SetResponse(res, definitionErrors.matchModeUndefined);

        var responseData = await AddPlayerToQue(userId, matchMode);
        if (!ResponseSucceeded(responseData.code)) return SetResponse(res, responseData);

        res.sendStatus(responseData.code);
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

        if (!CheckUserDefined(req)) return SetResponse(res, userErrors.notLoggedIn);
        if (typeof(matchMode) !== 'string') return SetResponse(res, definitionErrors.matchModeUndefined);

        if (RemovePlayerFromQue(userId, matchMode)){
            res.sendStatus(201);
            return;
        }
        res.status(403).send('Player already not in que');
    } catch (err){
        console.error(err);
        res.sendStatus(500);
    }
});

router.post("/PlayerReady", async (req, res) => {
    //if match created send socket
    try {
        const userId = req.session.user;

        if (!CheckUserDefined(req)) return SetResponse(res, userErrors.notLoggedIn);

        var responseData = await PlayerSentReady(userId);
        if (!ResponseSucceeded(responseData.code)) return SetResponse(res, responseData);
        res.sendStatus(responseData.code);

        if (!responseData.data) return;

        var match = responseData.data;
        
        var player1Room = "userRoom" + match.players[0].id.toString();
        var player2Room = "userRoom" + match.players[1].id.toString();
        SendSocketMessage(player1Room, "matchReady", match.id.toString());
        SendSocketMessage(player2Room, "matchReady", match.id.toString());
    } catch (err){
        console.error(err);
        res.sendStatus(500);
    }
});

export default router;