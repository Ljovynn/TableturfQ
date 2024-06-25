//TODO: //get match history

import { Router } from 'express';
import cookieParser from "cookie-parser";
import { DeserializeSession } from '../utils/session.js';


import { CheckIfArray, CheckUserDefined } from '../utils/checkDefined.js';
import { GetCurrentUser } from '../utils/userUtils.js';

import dotenv from 'dotenv';
import { FindIfPlayerInQue } from '../queManager.js';
import { FindMatchWithPlayer } from '../matchManager.js';
import { DeleteAllUserSessions, GetMultipleUserDatas, GetUserMatchHistory, SetUserCountry, SetUserDiscordTokens } from '../database.js';
import { definitionErrors, userErrors } from '../Responses/requestErrors.js';
import { SetResponse } from '../Responses/ResponseData.js';

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

        if (typeof(userId) !== 'number') return SetResponse(res, definitionErrors.userNotDefined);
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

//country (2 letters. send 'none' for removal)
router.post("SetUserCountry", async (req, res) => {
    try{
        const userId = req.session.user;
        const country = req.body.country;

        if (!CheckUserDefined(req)) return SetResponse(res, userErrors.notLoggedIn);
        if (typeof(country) !== 'string') return SetResponse(res, definitionErrors.countryUndefined);

        if (country == 'none'){
            await SetUserCountry(userId, null);
            res.sendStatus(201);
            return;
        }
        if (country.length != 2) return SetResponse(res, definitionErrors.countryWrongFormat);

        await SetUserCountry(userId, country);
        res.sendStatus(201);
    } catch(error){
        console.error(error);
        res.sendStatus(400);
    }
});

router.post("/DeleteUserLoginData", async (req, res) => {
    try{
        const userId = req.session.user;
        if (!CheckUserDefined(req)) return SetResponse(res, userErrors.notLoggedIn);

        await DeleteAllUserSessions(userId);
        await SetUserDiscordTokens(userId, null, null);
        req.session.user = undefined;
        res.sendStatus(201);
    } catch(error){
        console.log(error);
        res.sendStatus(400);
    }
});

//req: userIdList
//res: users
//user: id, username, role, g2_rating, discord_id, discord_avatar_hash, created_at, banned
router.post("/GetUsers", async (req, res) => {
    try{
        console.log('user list');
        console.log(req.body.userIdList);
        const userIdList = req.body.userIdList;
        if (!CheckIfArray(userIdList) || userIdList.length == 0) return SetResponse(res, definitionErrors.userNotDefined);

        const users = await GetMultipleUserDatas(userIdList);

        res.status(200).send(users);
    } catch(error){
        console.log(error);
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
        if (!user) return SetResponse(res, userErrors.notLoggedIn);

        var queData = FindIfPlayerInQue(user.id);
        var matchId = FindMatchWithPlayer(user.id);

        var data = {user, queData, matchId};

        res.status(200).send(data);
    } catch(error){
        res.sendStatus(400);
    }
});

export default router;