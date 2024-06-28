import { GetRecentMatches } from "./database.js";

const matchHistoryLength = 10;

var matchHistory = [];

await UpdateRecentMatches();

export function GetGlobalMatchHistory(){
    return matchHistory;
}

export async function UpdateRecentMatches(){
    matchHistory = await GetRecentMatches(matchHistoryLength);
}