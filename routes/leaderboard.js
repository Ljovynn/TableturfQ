import { Router } from 'express';

import { SetErrorResponse } from '../responses/ResponseData.js';
import { definitionErrors } from '../responses/requestErrors.js';
import { leaderboardLimit } from '../public/constants/searchData.js';
import { GetLeaderboard, GetUserLeaderboardPosition } from '../database.js';
import { GetLeaderboardSize } from '../cache/leaderboardSize.js';

const router = Router();

//post

//req: startPos, hitCount
router.post('/GetLeaderboard', async (req, res) => {
    try {
        var startPos = req.body.startPos;
        var hitCount = req.body.hitCount;

        if (typeof(startPos) !== 'number' && typeof(hitCount) !== 'undefined') return SetErrorResponse(res, definitionErrors.leaderboardStartPosWrongFormat);
        if (typeof(hitCount) !== 'number' && typeof(hitCount) !== 'undefined') return SetErrorResponse(res, definitionErrors.leaderboardHitCountWrongFormat);

        // Had to check against NaN because startPos = 0 was returning false but we can't start with startPos 1 or we get player ranked #2
        // Try different conditional check maybe? Or check startPos === false?
        
        if (!hitCount) hitCount = leaderboardLimit;
        if (!startPos) startPos = 0;

        const leaderboard = await GetLeaderboard(startPos, hitCount);
        const leaderboardSize = GetLeaderboardSize();
        const data ={
            result: leaderboard,
            totalPlayers: leaderboardSize
        }

        res.status(200).send(data);
    } catch (err){
        console.error(err);
        res.sendStatus(500);
    }
});

//req: userId (default to current user)
//res: position int
router.post('/GetUserLeaderboardPosition', async (req, res) => {
    try{
        const userId = req.body.userId;

        if (typeof(userId) !== 'string'){
            userId = req.session.user;
            if (!CheckUserDefined(req)) return SetErrorResponse(res, definitionErrors.userNotDefined);
        }

        const position = GetUserLeaderboardPosition(userId);

        res.status(200).send(position);
    } catch(error){
        console.log(error);
        res.sendStatus(500);
    }
});

export default router;