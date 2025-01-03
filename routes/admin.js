import { Router } from 'express';

import { CheckUserDefined } from '../utils/checkDefined.js';
import { BanUser, GetUserBanAndRole, GetUserRole, SuspendUser, UnbanUser, GetUserBanState } from '../database.js';
import { userRoles } from '../public/constants/userData.js';

import { SendSocketMessage } from '../socketManager.js';
import { GetDisputedMatchesList, ModSentChatMessage, ResolveMatchDispute } from '../matchManager.js';
import { disputeResolveOptions, matchModes } from '../public/constants/matchData.js';
import { ResponseSucceeded, SetErrorResponse } from '../responses/ResponseData.js';
import { definitionErrors, userErrors } from '../responses/requestErrors.js';
import { HandleBanUser } from '../utils/userUtils.js';

const router = Router();

//posts

//matchId, resolveOption
router.post("/ResolveDispute", async (req, res) => {
    try {
        const matchId = req.body.matchId;
        const resolveOption = req.body.resolveOption;

        if (typeof(matchId) !== 'string') return SetErrorResponse(res, definitionErrors.matchUndefined);
        if (typeof(resolveOption) !== 'number') return SetErrorResponse(res, definitionErrors.resolveOptionUndefined);

        let userError = await CheckIfNotAdmin(req);
        if (userError) return SetErrorResponse(res, userError);

        let responseData = await ResolveMatchDispute(matchId, resolveOption);
        if (!ResponseSucceeded(responseData.code)) return SetErrorResponse(res, responseData);
        let matchData = responseData.data;

        if (responseData.data === matchModes.casual){
            res.status(responseData.code).send({});
            SendSocketMessage('match' + matchId, "resolveDispute", disputeResolveOptions.noChanges);
            return;
        }

        switch (resolveOption){
            case disputeResolveOptions.gameWinPlayer1:
            case disputeResolveOptions.gameWinPlayer2:
                if (responseData.data.matchFinished){
                    res.status(responseData.code).send({});
                    let data = {winnerId: matchData.winnerId, newPlayerRatings: matchData.newPlayerRatings};
                    SendSocketMessage('match' + matchId, "matchWin", data);
                } else{
                    res.status(responseData.code).send({});
                    SendSocketMessage('match' + matchId, "gameWin", matchData.winnerId);
                }
                break;
            case disputeResolveOptions.matchWinPlayer1:
            case disputeResolveOptions.matchWinPlayer2:
                res.status(responseData.code).send({});
                let data = {winnerId: matchData.winnerId, newPlayerRatings: matchData.newPlayerRatings};
                SendSocketMessage('match' + matchId, "matchWin", data);
                break;
            case disputeResolveOptions.noChanges:
            case disputeResolveOptions.resetCurrentGame:
            case disputeResolveOptions.restartMatch:
            case disputeResolveOptions.cancelMatch:
                res.status(responseData.code).send({});
                SendSocketMessage('match' + matchId, "resolveDispute", resolveOption);
                break;
            default:
                res.sendStatus(400);
        }
        
    } catch (err){
        console.error(err);
        res.sendStatus(500);
    }
});

//bannedUserId, banLength (optional), reason (optional)
router.post("/BanUser", async (req, res) => {
    try {
        const bannedUserId = req.body.bannedUserId;
        const banLength = req.body.banLength;
        const reason = req.body.reason;

        if (typeof(bannedUserId) !== 'string') return SetErrorResponse(res, definitionErrors.bannedUserUndefined);
        if (typeof(banLength) !== 'number' && typeof(banLength) !== 'undefined') return SetErrorResponse(res, definitionErrors.banLengthWrongFormat);
        if (typeof(reason) !== 'string' && typeof(reason) !== 'undefined') return SetErrorResponse(res, definitionErrors.banReasonWrongFormat);
        if (reason.length > 128) return SetErrorResponse(res, definitionErrors.banReasonTooLong);

        let userError = await CheckIfNotAdmin(req);
        if (userError) return SetErrorResponse(res, userError);

        let bannedUser = await GetUserBanAndRole(bannedUserId);

        if (!bannedUser) return SetErrorResponse(res, definitionErrors.userNotDefined);

        if (!reason) reason = null;

        if (!banLength){
            BanUser(bannedUserId, reason);
        } else{
            SuspendUser(bannedUserId, banLength, reason);
        }
        console.log(`User ID ${bannedUserId} was banned by admin ID ${req.session.user}`);

        await HandleBanUser(bannedUserId);

        res.status(201).send({});
        return;
        
    } catch (err){
        console.error(err);
        res.sendStatus(500);
    }
});

//unbannedUserId
router.post("/UnbanUser", async (req, res) => {
    try {
        const unbannedUserId = req.body.unbannedUserId;

        if (typeof(unbannedUserId) !== 'string') return SetErrorResponse(res, definitionErrors.unbannedUserUndefined);

        let userError = await CheckIfNotAdmin(req);
        if (userError) return SetErrorResponse(res, userError);

        await UnbanUser(unbannedUserId);

        res.status(201).send({});
        return;
        
    } catch (err){
        res.sendStatus(500);
    }
});

//userId
//res: banned bool, expires_at timestamp (null if permanent ban)
router.post("/GetUserBanInfo", async (req, res) => {
    try{
        const bannedUserId = req.body.userId;

        if (typeof(bannedUserId) !== 'string') return SetErrorResponse(res, definitionErrors.unbannedUserUndefined);

        let userError = await CheckIfNotAdmin(req);
        if (userError) return SetErrorResponse(res, userError);

        let banInfo = await GetUserBanState(bannedUserId);

        let data = {
            banned: false,
        }
        if (banInfo){
            data.banned = true;
            data.banLength = banInfo.unix_expires_at;
            data.reason = banInfo.reason;
        }

        res.status(200).send(data);
    } catch(error){
        console.error(error);
        res.sendStatus(400);
    }
});

//matchId, message
router.post("/ModChatMessage", async (req, res) => {
    try {
        const userId = req.session.user;
        const matchId = req.body.matchId;
        const message = req.body.message;

        if (typeof(matchId) !== 'string') return SetErrorResponse(res, definitionErrors.matchUndefined);
        if (typeof(message) !== 'string') return SetErrorResponse(res, definitionErrors.chatMessageUndefined);
        
        let userError = await CheckIfNotAdmin(req);
        if (userError) return SetErrorResponse(res, userError);

        let responseData = await ModSentChatMessage(matchId, userId, message)
        if (!ResponseSucceeded(responseData.code)) return SetErrorResponse(res, responseData);

        res.status(responseData.code).send({});
        let socketMessage = {ownerId: userId, content: message, date: Date.now()};
        SendSocketMessage('match' + matchId, "chatMessage", socketMessage);
    } catch (err){
        console.error(err);
        res.sendStatus(500);
    }
});

//requests

router.get('/GetDisputedMatchesList', async (req, res) => {
    try {
        let userId = req.session.user;
        let userError = await CheckIfNotAdmin(req);
        if (userError) return SetErrorResponse(res, userError);

        let data = GetDisputedMatchesList(userId);

        res.status(200).send(data);
    } catch (err){
        console.error(err);
        res.sendStatus(500);
    }
});

export default router;

async function CheckIfNotAdmin(req){
    if (!CheckUserDefined(req)) return userErrors.notLoggedIn;
    let role = await GetUserRole(req.session.user);
    if (role != userRoles.mod){
        return userErrors.notAdmin;
    }
};