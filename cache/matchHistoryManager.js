import { GetRecentMatches } from "../database.js";
import { matchModes } from "../public/constants/matchData.js";

const matchHistoryLength = 10;

var matchHistory = [];

export async function MatchHistoryManagerSetup(){
    try {
        matchHistory = await GetRecentMatches(matchHistoryLength);
    } catch (error){
        console.log(error);
    }
}

export function GetGlobalMatchHistory(){
    return matchHistory;
}

export async function UpdateRecentMatches(match){
    if (matchHistory.length > matchHistoryLength) matchHistory.pop();

    var newMatch = {
        id: match.id,
        player1_id: match.players[0].id,
        player2_id: match.players[1].id,
        ranked: (match.mode == matchModes.ranked) ? true : false,
        set_length: match.setLength,
        result: match.status,
        unix_created_at: Math.round(match.createdAt / 1000)
    }
    matchHistory.unshift(newMatch);
}