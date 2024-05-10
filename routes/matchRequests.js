import express from 'express';
import { Match } from '../public/constants/matchData.js';
import { FindMatch } from '../matchManager.js';

import {GetMatch, GetMatchGames, GetPlayerData, GetStageStrikes} from '../database.js';
import { ConvertDBMatchToMatch } from '../utils/matchUtils.js';

//req: match id
//res: match object, players, your player pos
export async function GetMatchInfo(req, res){
    try {
        const matchId = req.body.matchId;

        var match = FindMatch(matchId);

        if (!match){
            var matchData = await GetMatch(matchId);
            if (!matchData){
                res.sendStatus(599); 
                return;
            }
            var gameData = await GetMatchGames(matchId);
            var strikeData = [];
            for (let i = 0; i < gameData.length; i++){
                strikeData[i] = await GetStageStrikes(gameData[i].id);
            }
            match = ConvertDBMatchToMatch(matchData, gameData, strikeData);
        }

        var players = []
        players[0] = await GetPlayerData(match.player1_id);
        players[1] = await GetPlayerData(match.player2_id);

        var playerPos = 0;
        //assumes req.session.user is userid, not discordid
        if (req.session.user){
            if (req.session.user == players[0].id){
                playerPos = 1;
            } else if (req.session.user == players[1].id){
                playerPos = 2;
            }
        }

        var data = [match, players, playerPos];
    
        res.status(200).send(data);
    } catch (err){
        res.sendStatus(599);
    }
};