import { Router } from 'express';
import { GetNextAnnouncementInfo, GetUpcomingAnnouncementInfos } from '../cache/announcementManager.js';

const router = Router();

//requests

router.get('/GetNextAnnouncement', async (req, res) => {
    try {
        var data = GetNextAnnouncementInfo();

        res.status(200).send(data);
    } catch (err){
        res.sendStatus(500);
    }
});

router.get('/GetUpcomingAnnouncements', async (req, res) => {
    try {
        var data = GetUpcomingAnnouncementInfos();

        res.status(200).send(data);
    } catch (err){
        res.sendStatus(500);
    }
});

export default router;