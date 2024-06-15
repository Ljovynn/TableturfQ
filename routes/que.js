import { Router } from 'express';
import cookieParser from "cookie-parser";
import { DeserializeSession } from '../utils/session.js';
import { AddPlayerToQue, RemovePlayerFromQue, PlayerSentReady } from "../queManager.js";
import { CheckUserDefined } from "../utils/checkDefined.js";
import { SendSocketMessage } from "../socketManager.js";
import { definitionErrors } from '../public/Responses/requestErrors.js';
import { matchModes } from '../public/constants/matchData.js';
import { ResponseSucceeded } from '../public/Responses/ResponseData.js';

import dotenv from 'dotenv';

const router = Router();

dotenv.config();

const sessionSecret = process.env.SESSION_SECRET;

router.use(cookieParser(sessionSecret));
router.use(DeserializeSession);

//Posts

//matchmode
router.post("/PlayerEnterQue", async (req, res) => {
    try {
        const userId = req.session.user;
        console.log(userId);
        const matchMode = req.body.matchMode;

        if (!CheckUserDefined(req)) return res.status(401).send(userErrors.notLoggedIn);
        if (!Object.hasOwn(matchModes, matchMode)) return res.status(401).send(definitionErrors.matchModeUndefined);

        var responseData = await AddPlayerToQue();
        if (!ResponseSucceeded(responseData.responseCode)) return res.status(responseData.responseCode).send(responseData.data);

        console.log('added to queue');
        res.sendStatus(responseData.responseCode);
    } catch (err){
        console.log(err);
        res.sendStatus(500);
    }
});

//matchMode
router.post("/PlayerLeaveQue", async (req, res) => {
    try {
        const userId = req.session.user;
        const matchMode = req.body.matchMode;

        if (!CheckUserDefined(req)) return res.status(401).send(userErrors.notLoggedIn);
        if (!Object.hasOwn(matchModes, matchMode)) return res.status(401).send(definitionErrors.matchModeUndefined);

        if (RemovePlayerFromQue(userId, matchMode)){
            res.sendStatus(201);
            return;
        }
        res.status(403).send('Player already not in que');
    } catch (err){
        res.sendStatus(500);
    }
});

router.post("/PlayerReady", async (req, res) => {
    //if match created send socket
    try {
        const userId = req.session.user;
        console.log('Post Player Ready function');


        if (!CheckUserDefined(req)) return res.status(401).send(userErrors.notLoggedIn);

        var responseData = await PlayerSentReady(userId);
        if (!ResponseSucceeded(responseData.responseCode)) return res.status(responseData.responseCode).send(responseData.data);
        res.sendStatus(responseData.responseCode);

        var match = responseData.data;

        var matchedPlayersData = {
            matchId: match.id,
            player1Id: match.players[0].id,
            player2Id: match.players[1].id
        }
        SendSocketMessage("queRoom", "matchReady", matchedPlayersData);
    } catch (err){
        console.error(err);
        res.sendStatus(500);
    }
});

export default router;