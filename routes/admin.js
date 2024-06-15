import { Router } from 'express';
import cookieParser from "cookie-parser";
import { DeserializeSession } from '../utils/session.js';

import { CheckUserDefined } from '../utils/checkDefined.js';
import { BanUser, GetUserBanAndRole, GetUserRole, SuspendUser, UnbanUser } from '../database.js';
import { userRoles } from '../public/constants/userData.js';

import dotenv from 'dotenv';

import { SendEmptySocketMessage, SendSocketMessage } from '../socketManager.js';
import { RemovePlayerFromAnyQue } from '../queManager.js';
import { GetDisputedMatchesList, HandleBannedPlayerInMatch, ModSentChatMessage, ResolveMatchDispute, UserSentChatMessage } from '../matchManager.js';
import { disputeResolveOptions, matchModes } from '../public/constants/matchData.js';
import { ResponseData, ResponseSucceeded } from '../public/Responses/ResponseData.js';
import { definitionErrors, userErrors } from '../public/Responses/requestErrors.js';

const router = Router();

dotenv.config();

const sessionSecret = process.env.SESSION_SECRET;

router.use(cookieParser(sessionSecret));
router.use(DeserializeSession);

//posts

//matchId, resolveOption
router.post("/ResolveDispute", async (req, res) => {
    try {
        const matchId = req.session.matchId;
        const resolveOption = req.session.resolveOption;

        if (typeof(matchId) !== 'number') return res.status(400).send(definitionErrors.matchUndefined);
        if (typeof(resolveOption) !== 'number') return res.status(400).send(definitionErrors.resolveOptionUndefined);

        var userError = await CheckIfNotAdmin(req);
        if (userError) return res.status(userError.responseCode).send(userError.data);

        var responseData = await ResolveMatchDispute(matchId, resolveOption);
        if (!ResponseSucceeded(responseData.responseCode)) return res.status(responseData.responseCode).send(responseData.data);
        if (responseData.data === 'casual'){
            res.sendStatus(responseData.responseCode);
            SendSocketMessage('match' + matchId, "resolveDispute", disputeResolveOptions.noChanges);
            return;
        }

        switch (resolveOption){
            case disputeResolveOptions.gameWinPlayer1:
            case disputeResolveOptions.gameWinPlayer2:
                if (responseData.data.matchFinished){
                    res.sendStatus(responseData.responseCode);
                    SendSocketMessage('match' + matchId, "matchWin", responseData.data.winnerId);
                } else{
                    res.sendStatus(responseData.responseCode);
                    SendSocketMessage('match' + matchId, "gameWIn", responseData.data.winnerId);
                }
                break;
            case disputeResolveOptions.matchWinPlayer1:
            case disputeResolveOptions.matchWinPlayer2:
                res.sendStatus(responseData.responseCode);
                SendSocketMessage('match' + matchId, "matchWin", responseData.data.winnerId);
                break;
            case disputeResolveOptions.noChanges:
            case disputeResolveOptions.resetCurrentGame:
            case disputeResolveOptions.restartMatch:
            case disputeResolveOptions.cancelMatch:
                res.sendStatus(responseData.responseCode);
                SendSocketMessage('match' + matchId, "resolveDispute", resolveOption);
                break;
            default:
                res.sendStatus(400);
        }
        
    } catch (err){
        res.sendStatus(500);
    }
});

//bannedUserId, expiresAt (optional)
router.post("/BanUser", async (req, res) => {
    try {
        const bannedUserId = req.session.bannedUserId;
        const expiresAt = req.body.expiresAt;

        if (typeof(bannedUserId) !== 'number') return res.status(400).send(definitionErrors.bannedUserUndefined);

        var userError = await CheckIfNotAdmin(req);
        if (userError) return res.status(userError.responseCode).send(userError.data);

        var bannedUser = await GetUserBanAndRole(bannedUserId);

        if (!bannedUser) return res.status(400).send(definitionErrors.userNotDefined);

        if (!expiresAt){
            BanUser(bannedUserId);
        } else{
            SuspendUser(bannedUserId, expiresAt);
        }
        console.log(`User ID ${bannedUserId} was banned by admin ID ${req.session.user}`);

        RemovePlayerFromAnyQue(bannedUserId);
        var matchData = await HandleBannedPlayerInMatch(bannedUserId);

        switch (matchData.mode){
            case matchModes.casual:
                SendEmptySocketMessage(matchData.matchId, "matchEnd");
                break;
            case matchModes.ranked:
                SendSocketMessage('match' + matchData.matchId, "matchWin", matchData.winnerId);
                break;
        }

        res.sendStatus(201);
        return;
        
    } catch (err){
        res.sendStatus(500);
    }
});

//unbannedUserId
router.post("/UnbanUser", async (req, res) => {
    try {
        const unbannedUserId = req.session.unbannedUserId;

        if (typeof(unbannedUserId) !== 'number') return res.status(400).send(definitionErrors.unbannedUserUndefined);

        var userError = await CheckIfNotAdmin(req);
        if (userError) return res.status(userError.responseCode).send(userError.data);

        await UnbanUser(unbannedUserId);

        res.sendStatus(201);
        return;
        
    } catch (err){
        res.sendStatus(500);
    }
});

//matchId, message
router.post("/ModChatMessage", async (req, res) => {
    try {
        const userId = req.session.user;
        const matchId = req.session.matchId;
        const message = req.body.message;

        if (typeof(matchId) !== 'number') return res.status(400).send(definitionErrors.matchUndefined);
        if (typeof(message) !== 'string') return res.status(400).send(definitionErrors.chatMessageUndefined);

        var userError = await CheckIfNotAdmin(req);
        if (userError) return res.status(userError.responseCode).send(userError.data);

        var responseData = ModSentChatMessage(matchId, userId, message)
        if (!ResponseSucceeded(responseData.responseCode)) return res.status(responseData.responseCode).send(responseData.data);

        res.sendStatus(responseData.responseCode);
        var socketMessage = [userId, message];
        SendSocketMessage('match' + data.matchId, "chatMessage", socketMessage);
    } catch (err){
        res.sendStatus(500);
    }
});

//requests

router.get('/GetDisputedMatchesList', async (req, res) => {
    try {
        var userError = await CheckIfNotAdmin(req);
        if (userError) return res.status(userError.responseCode).send(userError.data);

        var data = GetDisputedMatchesList(user.id);

        res.status(200).send(data);
    } catch (err){
        res.sendStatus(500);
    }
});

export default router;

async function CheckIfNotAdmin(req){
    if (!CheckUserDefined(req)) return new ResponseData(401, userErrors.notLoggedIn);
    var role = await GetUserRole(req.session.user);
    if (role != userRoles.mod){
        return new ResponseData(403, userErrors.notAdmin);
    }
};