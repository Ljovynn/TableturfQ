import { Router } from 'express';
import cookieParser from "cookie-parser";
import { DeserializeSession } from '../utils/session.js';

import { GetCurrentUser } from '../utils/userUtils.js';

import dotenv from 'dotenv';

import { GetLeaderboardAtPos } from '../leaderboardManager.js';

const router = Router();

dotenv.config();

const sessionSecret = process.env.SESSION_SECRET;

router.use(cookieParser(sessionSecret));
router.use(DeserializeSession);

//post

//req: startPos, hitCount
router.post('/GetLeaderboard', async (req, res) => {
    try {
        var user = GetCurrentUser(req);
        var startPos = req.body.startPos;
        var hitCount = req.body.hitCount;

        // Had to check against NaN because startPos = 0 was returning false but we can't start with startPos 1 or we get player ranked #2
        // Try different conditional check maybe? Or check startPos === false?
        
        if (!hitCount || ( !startPos && isNaN(startPos) ) ){
            res.sendStatus(400);
            return;
        }

        var leaderboardData = GetLeaderboardAtPos(startPos, hitCount);

        var data = {
            user: user,
            leaderboardData: leaderboardData
        }

        res.status(200).send(data);
    } catch (err){
        console.error(err);
        res.sendStatus(500);
    }
});

export default router;