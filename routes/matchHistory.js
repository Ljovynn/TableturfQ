import { Router } from 'express';
import { GetGlobalMatchHistory } from '../cache/matchHistoryManager.js';
import { CheckUserDefined } from '../utils/checkDefined.js';
import { SetErrorResponse } from '../responses/ResponseData.js';
import { GetMultipleUserDatas, GetUserMatchHistory } from '../database.js';
import { definitionErrors } from '../responses/requestErrors.js';

const router = Router();

const matchHistoryHitsPerPage = 10;

//posts

//req: userId (anyone, leave blank for yourself), pageNumber
//res: matchHistory (DB matches, not match objects), users (DB users)
router.post("/GetUserMatchHistory", async (req, res) => {
    try{
        var userId = req.body.userId;
        var pageNumber = req.pageNumber;

        if (typeof(userId) !== 'string'){
            userId = req.session.user;
            if (!CheckUserDefined(req)) return SetErrorResponse(res, definitionErrors.userNotDefined);
        } 

        if (typeof(pageNumber) !== 'number' || pageNumber < 0){
            pageNumber = 1;
        }

        const matchHistory = await GetUserMatchHistory(userId, matchHistoryHitsPerPage, pageNumber);

        var users = null;
        if (matchHistory.length > 0) users = await GetUsers(matchHistory);

        res.status(200).send({matchHistory, users});
    } catch(error){
        console.error(error);
        res.sendStatus(500);
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
        console.log(error)
        res.status(500).send(error);
    }
});

async function GetUsers(matches){
    var userIdList = [];
    for (let i = 0; i < matches.length; i++){
        if (!userIdList.some((player) => player.id === matches[i].player1_id) && matches[i].player1_id !== null) userIdList.push(matches[i].player1_id);
        if (!userIdList.some((player) => player.id === matches[i].player2_id) && matches[i].player2_id !== null) userIdList.push(matches[i].player2_id);
    }

    if (userIdList.length == 0) return [];
    const users = await GetMultipleUserDatas(userIdList);

    return users;
}

export default router;