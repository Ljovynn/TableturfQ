import express from 'express';
import { Match } from '../public/constants/matchData.js';
import { FindMatch } from '../matchManager.js';

import { GetChatMessages, GetMatch, GetMatchGames, GetPlayerChatData, GetPlayerData, GetStageStrikes } from '../database.js';
import { ConvertDBMatchToMatch } from '../utils/matchUtils.js';

//req: match id
//res: match object, players, your player pos, other users in chat

//TODO: chat info
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

            var chatMessages = await GetChatMessages(matchId);

            match = ConvertDBMatchToMatch(matchData, gameData, strikeData, chatMessages);
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

        var othersInChatIds = [];

        for (let i = 0; i < match.chat.length; i++){
            if (!othersInChatIds.includes(match.chat[i].ownerId)) othersInChatIds.push(match.chat[i].ownerId);
        }

        for (let i = othersInChatIds.length - 1; i >= 0; i--){
            if (othersInChatIds[i] == players[0].id || othersInChatIds[i] == players[1].id) othersInChatIds.splice(i, 1);
        }

        var othersInChat = await GetPlayerChatData(othersInChatIds);

        var data = [match, players, playerPos, othersInChat];
    
        res.status(200).send(data);
    } catch (err){
        res.sendStatus(599);
    }
};