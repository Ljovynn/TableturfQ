import express from 'express';

import {GetMatch, GetMatchGames, GetPlayerData, GetStageStrikes} from '../database.js';
import { PlayerSentStageStrike, PlayerSentStagePick, PlayerSentGameWin, PlayerSentMatchVerification, 
    PlayerSentCasualMatchEnd, PlayerSentChatMessage, PlayerSentMatchDispute, ResolveMatchDispute } from '../matchManager.js';

//stage
export function PostStageStrike(req, res){
    try {

        const playerId = req.session.user;

        //todo: check if player in match
        if (!playerId){
            res.sendStatus(401);
            return;
        }

        if (!req.body.stage){
            res.sendStatus(400);
            return;
        }

        if (PlayerSentStageStrike(playerId, req.body.stage)){
            res.sendStatus(201);
            return;
        }
        res.sendStatus(403);
    } catch (err){
        res.sendStatus(500);
    }
};