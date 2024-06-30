import { Router } from 'express';

import { SetResponse } from '../Responses/ResponseData.js';
import { definitionErrors, nullErrors, userErrors } from '../Responses/requestErrors.js';
import { GetLeaderboardAtPos, SearchLeaderboard } from '../userListManager.js';

const router = Router();

//post

//req: startPos, hitCount
router.post('/GetLeaderboard', async (req, res) => {
    try {
        var startPos = req.body.startPos;
        var hitCount = req.body.hitCount;

        // Had to check against NaN because startPos = 0 was returning false but we can't start with startPos 1 or we get player ranked #2
        // Try different conditional check maybe? Or check startPos === false?
        
        if (!hitCount || ( !startPos && isNaN(startPos) ) ){
            res.sendStatus(400);
            return;
        }

        var data = GetLeaderboardAtPos(startPos, hitCount);

        res.status(200).send(data);
    } catch (err){
        console.error(err);
        res.sendStatus(500);
    }
});

//req: input
//res: leaderboardUsers
//leaderboardUsers: user, position
router.post('/SearchLeaderboard', async (req, res) => {
    try{
        const input = req.body.input;

        if (typeof(input) !== 'string') return SetResponse(res, definitionErrors.usernameUndefined);

        const leaderboardUsers = SearchLeaderboard(input);

        res.status(200).send(leaderboardUsers);
    } catch(error){
        console.log(error);
        res.sendStatus(400);
    }
});

export default router;