import express from 'express';
//import path from 'path';

import {GetMatch, GetMatchGames, GetPlayerData, GetStageStrikes} from '../database.js';

export async function GetMatchInfo(req, res){
    try {
        //todo: if match is already in local matches array in code, get data from there intstead of DB?

        const matchId = req.body.matchId;

        var match = await GetMatch(matchId);
        if (match == null){
            res.sendStatus(599);
            return;
        }
    
        var matchGames = await GetMatchGames(matchId);

        var players = []
        players[0] = await GetPlayerData(match.player1_id);
        players[1] = await GetPlayerData(match.player2_id);
    
        var strikes = []
        for (let i = 0; i < data[1].length; i++){
            strikes[i] = await GetStageStrikes(matchGames[i].id);
        }

        var data = [];
        data[0] = match;
        data[1] = matchGames;
        data[2] = players;
        data[3] = strikes;
    
        res.status(200).send(data);
    } catch (err){
        res.sendStatus(599);
    }
};