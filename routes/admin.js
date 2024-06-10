import { Router } from 'express';
import cookieParser from "cookie-parser";
import { DeserializeSession } from '../utils/session.js';

import { CheckIfString, CheckUserDefined } from '../utils/checkDefined.js';
import { BanUser, GetUserBanAndRole, GetUserRole, SuspendUser } from '../database.js';
import { userRoles } from '../public/constants/userData.js';

import { SendSocketMessage } from '../socketManager.js';
import { RemovePlayerFromAnyQue } from '../queManager.js';
import { HandleBannedPlayerInMatch } from '../matchManager.js';

const router = Router();

dotenv.config();

const sessionSecret = process.env.SESSION_SECRET;

router.use(cookieParser(sessionSecret));
router.use(DeserializeSession);

//Todo: Ban player, resolve dispute, get disputed match list

//posts

//bannedUserId, expiresAt (optional)
router.post("/BanUser", async (req, res) => {
    try {
        const userId = req.session.user;
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

        res.sendStatus(201);
        return;
        
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

function CheckIfAdmin(userId){
    var role = GetUserRole(userId);
    if (role == userRoles.mod){
        return true;
    }
    return false;
}

export default router;