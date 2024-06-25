import { GetLeaderboard } from "./database.js";

var leaderboard = await GetLeaderboard();

export async function UpdateLeaderboard(){
    leaderboard = await GetLeaderboard();
}

export function GetLeaderboardAtPos(startPos, hitCount){

    var endPos = Math.min(leaderboard.length, startPos + hitCount);

    var hits = leaderboard.slice(startPos, endPos);

    var data = {
        result: hits,
        totalPlayers: leaderboard.length
    }

    return data;
}

export function GetPlayerLeaderboardPosition(userId){
    for (i = 0; i < leaderboard.length; i++){
        if (leaderboard[i].id == userId) return i + 1;
    }
    return 0;
}