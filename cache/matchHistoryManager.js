import { GetRecentMatches, GetUserData } from "../database.js";
import { matchModes } from "../public/constants/matchData.js";

const matchHistoryLength = 10;

var matchHistory = [];

export async function MatchHistoryManagerSetup(){
    try {
        //get name, avatar hash
        var loadedMatches = await GetRecentMatches(matchHistoryLength);
        for (let i = 0; i < loadedMatches.length; i++){
            const player1Data = (loadedMatches[i].player1_id) ? await GetUserData(loadedMatches[i].player1_id) : {};
            const player2Data = (loadedMatches[i].player2_id) ? await GetUserData(loadedMatches[i].player2_id) : {};
            matchHistory[i] = loadedMatches[i];

            matchHistory[i].player1_username = player1Data.username;
            matchHistory[i].player1_rating = player1Data.g2_rating;
            matchHistory[i].player1_discord_id = player1Data.discord_id;
            matchHistory[i].player1_discord_avatar_hash = player1Data.discord_avatar_hash;

            matchHistory[i].player2_username = player2Data.username;
            matchHistory[i].player2_rating = player2Data.g2_rating;
            matchHistory[i].player2_discord_id = player2Data.discord_id;
            matchHistory[i].player2_discord_avatar_hash = player2Data.discord_avatar_hash;
        }
    } catch (error){
        console.log(error);
    }
}

export function GetGlobalMatchHistory(){
    return matchHistory;
}

export async function UpdateRecentMatches(match){
    const player1Data = await GetUserData (match.players[0].id);
    const player2Data = await GetUserData (match.players[1].id);

    var p1ScoreCount = 0;
    var p2ScoreCount = 0;
    for (let i = 0; i < match.gamesArr.length; i++){
        if (match.gamesArr[i].winnerId == null) continue;
        if (match.gamesArr[i].winnerId == match.players[0].id){
            p1ScoreCount++;
        } else{
            p2ScoreCount++;
        }
    }

    var newMatch = {
        id: match.id,
        player1_id: match.players[0].id,
        player1_username: player1Data.username,
        player1_score: p1ScoreCount,
        player1_rating: player1Data.g2_rating,
        player1_discord_id: player1Data.discord_id,
        player1_discord_avatar_hash: player1Data.discord_avatar_hash,
        player2_id: match.players[1].id,
        player2_username: player2Data.username,
        player2_score: p2ScoreCount,
        player2_rating: player2Data.g2_rating,
        player2_discord_id: player2Data.discord_id,
        player2_discord_avatar_hash: player2Data.discord_avatar_hash,
        ranked: (match.mode == matchModes.ranked) ? true : false,
        set_length: match.setLength,
        result: match.status,
        unix_created_at: Math.round(match.createdAt / 1000)
    }
    matchHistory.unshift(newMatch);
    matchHistory.sort((a, b) => b.unix_created_at - a.unix_created_at);
    if (matchHistory.length > matchHistoryLength) matchHistory.pop();
}