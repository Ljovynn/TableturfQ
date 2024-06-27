import { Router } from 'express';
import { GetGlobalMatchHistory } from '../matchHistoryManager.js';
import { GetMultipleUserDatas } from '../database.js';

const router = Router();

//posts

//req: userId (anyone, leave blank for yourself), pageNumber
//res: matchHistory (DB matches, not match objects), users (DB users)
router.post("/GetUserMatchHistory", async (req, res) => {
    try{
        var userId = req.body.userId;
        var pageNumber = req.pageNumber;

        if (typeof(userId) !== 'number'){
            userId = req.session.user;
            if (!CheckUserDefined(req)) return SetResponse(res, definitionErrors.userNotDefined);
        } 

        if (typeof(pageNumber) !== 'number' || pageNumber < 0){
            pageNumber = 1;
        }

        var matchHistory = await GetUserMatchHistory(userId, matchHistoryHitsPerPage, pageNumber);

        const users = await GetUsers(matchHistory);

        res.status(200).send({recentMatches, users});
    } catch(error){
        console.error(error);
        res.sendStatus(400);
    }
});

//requests

//res: matchHistory (DB matches, not match objects), users (DB users)
router.get("/GetRecentMatches", async (req, res) => {
    try{
        const recentMatches = GetGlobalMatchHistory();

        const users = await GetUsers(recentMatches);

        res.status(200).send({recentMatches, users});
    } catch(error){
        res.sendStatus(400);
    }
});

async function GetUsers(matches){
    var userIdList = [];
        for (let i = 0; i < matches.length; i++){
            if (!userIdList.some((player) => player.id === matches[i].player1_id)) userIdList.push(matches[i].player1_id);
            if (!userIdList.some((player) => player.id === matches[i].player2_id)) userIdList.push(matches[i].player2_id);
        }

    return await GetMultipleUserDatas(userIdList);
}

export default router;