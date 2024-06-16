import { Router } from 'express';
import { GetNextEventInfo, GetUpcomingEventInfos } from '../eventInfoManager.js';

const router = Router();

//requests

router.get('/GetNextEvent', async (req, res) => {
    try {
        var data = GetNextEventInfo();

        res.status(200).send(data);
    } catch (err){
        res.sendStatus(500);
    }
});

router.get('/GetUpcomingEvents', async (req, res) => {
    try {
        var data = GetUpcomingEventInfos();

        res.status(200).send(data);
    } catch (err){
        res.sendStatus(500);
    }
});

export default router;