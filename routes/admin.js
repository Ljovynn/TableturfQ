import { Router } from 'express';
import cookieParser from "cookie-parser";
import { DeserializeSession } from '../utils/session.js';

import { CheckIfString, CheckUserDefined } from '../utils/checkDefined.js';
import { BanUser, GetUserBanAndRole, GetUserRole, SuspendUser, UnbanUser } from '../database.js';
import { userRoles } from '../public/constants/userData.js';

import dotenv from 'dotenv';

import { SendEmptySocketMessage, SendSocketMessage } from '../socketManager.js';
import { RemovePlayerFromAnyQue } from '../queManager.js';
import { FindMatch, HandleBannedPlayerInMatch, ResolveMatchDispute } from '../matchManager.js';
import { disputeResolveOptions, matchModes } from '../public/constants/matchData.js';

const router = Router();

dotenv.config();

const sessionSecret = process.env.SESSION_SECRET;

router.use(cookieParser(sessionSecret));
router.use(DeserializeSession);

//Todo: resolve dispute, get disputed match list

//posts

//matchId, resolveOption
router.post("/ResolveDispute", async (req, res) => {
    try {
        const matchId = req.session.matchId;
        const resolveOption = req.session.resolveOption;

        if (!CheckUserDefined(req, res)) return;
        if (!await CheckIfAdmin(req, res)) return;

        var matchResolveData = await ResolveMatchDispute(matchId, resolveOption);
        if (matchResolveData == false){
            res.sendStatus(403);
            return;
        } else if (matchResolveData == 'casual'){
            res.sendStatus(201);
            SendSocketMessage('match' + matchId, "resolveDispute", disputeResolveOptions.noChanges);
            return;
        }

        switch (resolveOption){
            case disputeResolveOptions.gameWinPlayer1:
            case disputeResolveOptions.gameWinPlayer2:
                if (matchResolveData.matchFinished){
                    res.sendStatus(201);
                    SendSocketMessage('match' + matchId, "matchWin", matchData.winnerId);
                } else{
                    res.sendStatus(201);
                    SendSocketMessage('match' + matchId, "gameWIn", matchData.winnerId);
                }
                break;
            case disputeResolveOptions.matchWinPlayer1:
            case disputeResolveOptions.matchWinPlayer2:
                res.sendStatus(201);
                SendSocketMessage('match' + matchId, "matchWin", matchData.winnerId);
                break;
            case disputeResolveOptions.noChanges:
            case disputeResolveOptions.resetCurrentGame:
            case disputeResolveOptions.restartMatch:
            case disputeResolveOptions.cancelMatch:
                res.sendStatus(201);
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

        if (!CheckUserDefined(req, res)) return;
        if (!await CheckIfAdmin(req, res)) return;

        var bannedUser = await GetUserBanAndRole(bannedUserId);

        if (!bannedUser){
            res.sendStatus(400);
            return;
        }

        if (bannedUser.role == userRoles.mod){
            res.sendStatus(403);
            return;
        }

        if (!expiresAt){
            BanUser(bannedUserId);
        } else{
            SuspendUser(bannedUserId, expiresAt);
        }
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

        if (!CheckUserDefined(req, res)) return;
        if (!await CheckIfAdmin(req, res)) return;

        await UnbanUser(unbannedUserId);

        res.sendStatus(200);
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

        if (!CheckUserDefined(req, res)) return;
        if (!CheckIfAdmin(userId)) return;
        if (!CheckIfString(message, res)) return;

        if (UserSentChatMessage(matchId, userId, message)){
            res.sendStatus(201);
            var socketMessage = [userId, message];
            SendSocketMessage('match' + data.matchId, "chatMessage", socketMessage);
            return;
        }

        res.sendStatus(403);
    } catch (err){
        res.sendStatus(500);
    }
});

async function CheckIfAdmin(req, res){
    var role = await GetUserRole(req.session.user);
    if (role == userRoles.mod){
        return true;
    }

    res.sendStatus(403);
    return false;
}

export default router;