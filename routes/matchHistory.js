import { Router } from 'express';
import { GetGlobalMatchHistory } from '../matchHistoryManager.js';

const router = Router();

//requests

router.get("/GetRecentMatches", async (req, res) => {
    try{
        const recentMatches = GetGlobalMatchHistory();

        res.status(200).send(recentMatches);
    } catch(error){
        res.sendStatus(400);
    }
});

export default router;