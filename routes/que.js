import { Router } from 'express';
import cookieParser from "cookie-parser";
import { DeserializeSession } from '../utils/session.js';

import { AddPlayerToQue, RemovePlayerFromQue, PlayerSentReady } from "../queManager.js";
import { GetUserData } from "../database.js";

import { CheckIfRealMatchMode, CheckUserDefined, CheckVariableDefined } from "../utils/checkDefined.js";

import { SendSocketMessage } from "../socketManager.js";

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

        if (!CheckUserDefined(req, res)) return;
        if (!CheckIfRealMatchMode(matchMode, res)) return;

        var user = await GetUserData(userId);
        console.log('user: ' + JSON.stringify(user));

        if (!CheckVariableDefined(user, res)) return;

        if (user.banned == 1){
            res.sendStatus(403);
            return;
        }

        if (await AddPlayerToQue(userId, matchMode)){
            console.log('added to queue');
            res.sendStatus(201);
            return;
        }

        console.log('could not add, error');
        res.sendStatus(403);
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
});

router.post("/PlayerReady", async (req, res) => {
    //if match created send socket
    try {
        const userId = req.session.user;
        console.log('Post Player Ready function');


        if (!CheckUserDefined(req, res)) return;

        var match = await PlayerSentReady(userId);

        if (match){
            res.sendStatus(201);

            var matchedPlayersData = {
                matchId: match.id,
                player1Id: match.players[0].id,
                player2Id: match.players[1].id
            }
            SendSocketMessage("queRoom", "matchReady", matchedPlayersData);
            return;
        }
        res.sendStatus(403);
    } catch (err){
        console.error(err);
        res.sendStatus(500);
    }
});

export default router;