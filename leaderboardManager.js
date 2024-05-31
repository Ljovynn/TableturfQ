import { GetLeaderboard } from "./database.js";

var leaderboard = [];

export async function UpdateLeaderboard(){
    leaderboard = await GetLeaderboard();
}

export function GetLeaderboardAtPos(minPos, hitCount){
    var hits = [];

    var endPos = Math.min(leaderboard.length, minPos + hitCount);

    for (let i = 0; i < endPos; i++){
        hits.push(leaderboard[i]);
    }

    var data = {
        result: hits,
        length: leaderboard.length
    }

    return data;
}