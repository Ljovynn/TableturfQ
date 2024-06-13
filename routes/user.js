//TODO: //get match history

import { Router } from 'express';
import cookieParser from "cookie-parser";
import { DeserializeSession } from '../utils/session.js';

import { CheckUserDefined, CheckVariableDefined } from '../utils/checkDefined.js';
import { GetCurrentUser } from '../utils/userUtils.js';

import dotenv from 'dotenv';
import { FindIfPlayerInQue } from '../queManager.js';
import { FindIfPlayerInMatch } from '../matchManager.js';
import { GetUserMatchHistory, SetUserDiscordTokens, DeleteAllUserSessions } from '../database.js';

const router = Router();

const matchHistoryHitsPerPage = 10;

dotenv.config();

const sessionSecret = process.env.SESSION_SECRET;

router.use(cookieParser(sessionSecret));
router.use(DeserializeSession);

//posts

//req: userId (anyone), pageNumber
//res: matchHistory (DB matches, not match objects)
router.post("/GetUserMatchHistory", async (req, res) => {
    try{
        const userId = req.session.user;
        var pageNumber = req.pageNumber;

        if (!CheckVariableDefined(userId, res)) return;
        if (typeof(pageNumber) !== 'number' || pageNumber < 0){
            pageNumber = 1;
        }

        var matchHistory = await GetUserMatchHistory(userId, matchHistoryHitsPerPage, pageNumber);

        res.status(200).send(matchHistory);
    } catch(error){
        console.error(error);
        res.sendStatus(400);
    }
});

router.post("/Logout", async (req, res) => {
    try{
        const userId = req.session.user;
        if (!CheckUserDefined(req, res)) return;

        await DeleteAllUserSessions(userId);
        await SetUserDiscordTokens(userId, null, null);
        res.sendStatus(201);
    } catch(error){
        console.error(error);
        res.sendStatus(400);
    }
});

//requests

//res: user, queData, matchId
//user: id, username, role, g2_rating, discord_id, discord_avatar_hash, created_at, banned
//quedata: matchmode, timestamp when que started
//matchId: just the id of match player is in
router.get("/GetUserInfo", async (req, res) => {
    try{

        var user = await GetCurrentUser(req);
        if (!user) {
            res.sendStatus(403);
            return;
        }

        var queData = FindIfPlayerInQue(user.id);
        var matchId = FindIfPlayerInMatch(user.id);

        var data = {user, queData, matchId};

        res.status(200).send(data);
    } catch(error){
        res.sendStatus(400);
    }
});

export default router;