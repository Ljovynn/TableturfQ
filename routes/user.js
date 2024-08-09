//TODO: //get match history

import { Router } from 'express';

import { CheckIfArray, CheckUserDefined } from '../utils/checkDefined.js';
import { GetCurrentUser } from '../utils/userUtils.js';

import { FindIfPlayerInQue, FindIfPlayerWaitingForReady } from '../queManager.js';
import { FindMatchWithPlayer } from '../matchManager.js';
import { GetMultipleUserDatas, GetUserBanState, GetUserRankData, GetUserRankedMatchCount, GetUserRatingHistory, SearchUser,
    SetUserCountry, SetUserDiscordTokens, SetUsername } from '../database.js';
import { definitionErrors, userErrors } from '../responses/requestErrors.js';
import { SetErrorResponse } from '../responses/ResponseData.js';
import { usernameMaxLength, usernameMinLength } from '../public/constants/userData.js';
import { HasBadWords, SanitizeFulltextSearch } from '../utils/string.js';
import { ratingHistoryOptions } from '../public/constants/ratingData.js';

const router = Router();


//posts

//username (max 32 letters)
router.post("/SetUsername", async (req, res) => {
    try{
        const userId = req.session.user;
        const username = req.body.username;

        if (!CheckUserDefined(req)) return SetErrorResponse(res, userErrors.notLoggedIn);
        
        if (typeof(username) !== 'string') return SetErrorResponse(res, definitionErrors.usernameUndefined);
        if (username.length < usernameMinLength || username.length > usernameMaxLength) return SetErrorResponse(res, definitionErrors.usernameWrongFormat);
        if (HasBadWords(username)) return SetErrorResponse(res, definitionErrors.usernameContainsBadWord);

        await SetUsername(userId, username);
        res.status(201).send({});
    } catch(error){
        console.error(error);
        res.sendStatus(400);
    }
});

//country (2 letters. send 'none' for removal)
router.post("/SetUserCountry", async (req, res) => {
    try{
        const userId = req.session.user;
        var country = req.body.country;

        if (!CheckUserDefined(req)) return SetErrorResponse(res, userErrors.notLoggedIn);
        if (typeof(country) !== 'string') return SetErrorResponse(res, definitionErrors.countryUndefined);

        country = country.toLowerCase();
        if (country == 'none'){
            await SetUserCountry(userId, null);
            res.status(201).send({});
            return;
        }
        if (country.length != 2) return SetErrorResponse(res, definitionErrors.countryWrongFormat);

        await SetUserCountry(userId, country);
        res.status(201).send({});
    } catch(error){
        console.error(error);
        res.sendStatus(400);
    }
});

router.post("/DeleteUserLoginData", async (req, res) => {
    try{
        const userId = req.session.user;
        if (!CheckUserDefined(req)) return SetErrorResponse(res, userErrors.notLoggedIn);

        //await DeleteAllUserSessions(userId);
        req.session.destroy();
        await SetUserDiscordTokens(userId, null, null);
        //req.session.user = undefined;
        res.sendStatus(201);
    } catch(error){
        console.log(error);
        res.sendStatus(400);
    }
});

//req: userIdList
//res: users
//user: id, username, role, g2_rating, discord_id, discord_username, discord_avatar_hash, country, created_at, banned
router.post("/GetUsers", async (req, res) => {
    try{
        const userIdList = req.body.userIdList;
        if (!CheckIfArray(userIdList) || userIdList.length == 0) return SetErrorResponse(res, definitionErrors.userNotDefined);
        if (!userIdList.every((element) => typeof(element) === 'string')) return SetErrorResponse(res, definitionErrors.userNotDefined);

        const users = await GetMultipleUserDatas(userIdList);

        res.status(200).send(users);
    } catch(error){
        console.log(error);
        res.sendStatus(400);
    }
});

//req: input
//res: users
//user: id, username, g2_rating, discord_avatar_hash, country,
router.post("/SearchUser", async (req, res) => {
    try{
        const input = req.body.input;

        if (typeof(input) !== 'string') return SetErrorResponse(res, definitionErrors.usernameUndefined);
        if (input.length < 1) return SetErrorResponse(res, definitionErrors.usernameUndefined);

        const sanitizedInput = SanitizeFulltextSearch(input);

        const users = await SearchUser(sanitizedInput);

        res.status(200).send(users);
    } catch(error){
        console.log(error);
        res.sendStatus(400);
    }
});

//req: userId (optional), ratingHistoryOption (from ratingData.js), seasonId(optional, not supported yet)
//res: array of {match_id, old_rating, new_rating, unix_date}
//ratings are truncated
router.post("/GetUserRatingHistory", async (req, res) => {
    try{
        var userId = req.body.userId;
        const ratingHistoryOption = req.body.ratingHistoryOption;

        if (!userId){
            if (!CheckUserDefined(req)) return SetErrorResponse(res, userErrors.notLoggedIn);
            userId = req.session.user;
        }

        if (typeof(ratingHistoryOption) !== 'number') return SetErrorResponse(res, definitionErrors.ratingHistoryOptionUndefined);
        if (!Object.values(ratingHistoryOptions).includes(ratingHistoryOption)) return SetErrorResponse(res, definitionErrors.ratingHistoryOptionWrongFormat);

        var ignoreHideRank = false;
        //todo implement season
        if (ratingHistoryOption === ratingHistoryOptions.season){
            return res.sendStatus(501);
        }

        if (!ignoreHideRank){
            var userRankData = await GetUserRankData(userId);
            if (!userRankData) return SetErrorResponse(res, definitionErrors.userNotDefined);
            if (userRankData.hide_rank) return res.status(200).send([]);
        }
        const cutoffDate = (ratingHistoryOption == 0) ? Date.now() : Date.now() - ratingHistoryOption;

        const endCutoffDate = Date.now();

        const data = await GetUserRatingHistory(userId, cutoffDate, endCutoffDate);

        res.status(200).send(data);
    } catch(error){
        console.error(error);
        res.sendStatus(400);
    }
});


//requests

//res: user, queData, readyData, matchId

//user: id, username, role, g2_rating, discord_id, discord_avatar_hash, created_at, banned

//quedata:
//matchmode = string
//timeQueStarted = timestamp when que started
//returns undefined if not in que

//readyData:
//matchMode: string
//ready = bool if you pressed ready, 
//timeWaitingStarted = timestamp since ready wait started
//returns undefined if not in ready waiting

//matchId: just the id of match player is in, undefined if not in match
router.get("/GetUserInfo", async (req, res) => {
    try{
        var user = await GetCurrentUser(req);
        if (!user) return SetErrorResponse(res, userErrors.notLoggedIn);

        var queData = FindIfPlayerInQue(user.id);
        var readyData = FindIfPlayerWaitingForReady(user.id);
        var matchId = FindMatchWithPlayer(user.id);

        var data = {user, queData, readyData, matchId};

        res.status(200).send(data);
    } catch(error){
        res.sendStatus(400);
    }
});

//res: banned bool, expires_at timestamp (null if permanent ban)
router.get("/GetUserBanInfo", async (req, res) => {
    try{
        const userId = req.session.user;
        if (!CheckUserDefined(req)) return SetErrorResponse(res, userErrors.notLoggedIn);

        var banInfo = await GetUserBanState(userId);
        var data = {
            banned: false,
        }
        if (banInfo){
            data.banned = true;
            data.banLength = banInfo.unix_expires_at;
            data.reason = banInfo.reason;
        }

        res.status(200).send(data);
    } catch(error){
        res.sendStatus(400);
    }
});

//returns how many ranked matches user has played
router.get("/GetUserPlacementInfo", async (req, res) => {
    try{
        const userId = req.session.user;
        if (!CheckUserDefined(req)) return SetErrorResponse(res, userErrors.notLoggedIn);

        var matchCount = await GetUserRankedMatchCount(userId);

        res.status(200).send(matchCount);
    } catch(error){
        res.sendStatus(400);
    }
});

export default router;