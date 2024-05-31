import { Router } from 'express';
import cookieParser from "cookie-parser";
import { DeserializeSession } from '../utils/session.js';

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
        var startPos = req.startPos;
        var hitCount = req.hitCount;
        
        if (!hitCount || !startPos){
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
        res.sendStatus(500);
    }
});

export default router;