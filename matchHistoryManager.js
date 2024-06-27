import { GetRecentMatches } from "./database.js";

const matchHistoryLength = 10;

var matchHistory = await GetRecentMatches(matchHistoryLength);

export function GetGlobalMatchHistory(){
    return matchHistory;
}

export async function UpdateRecentMatches(){
    matchHistory = await GetRecentMatches(matchHistoryLength);
}