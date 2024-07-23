import { GetLeaderboardCount } from "../database.js";

var leaderboardSize;

export async function LeaderboardSizeSetup(){
    await UpdateLeaderboardSize();
}

export function GetLeaderboardSize(){
    return leaderboardSize;
}

export async function UpdateLeaderboardSize(){
    try{
        leaderboardSize = await GetLeaderboardCount();
    }catch (error){
        console.log(error);
    }
}