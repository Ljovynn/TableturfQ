import { GetLeaderboard, GetUserList } from "./database.js";
import { ApplyHideRank } from "./utils/userUtils.js";

var userList = await UpdateLeaderboard();
var leaderboard = await UpdateUserList();

var maxSearchUserHit = 10;

export async function UpdateLeaderboard(){
    leaderboard = await GetLeaderboard();
}

export async function UpdateUserList(){
    userList = await GetUserList();

    for (let i = 0; i < userList.length; i++){
        ApplyHideRank(userList[i]);
    }
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

export function SearchUser(input){
    var result = [];
    var nameIncludesResult = [];
    
    if (input.length < 2) return result;
    input = input.toLowerCase();

    for (let i = 0; i < userList.length; i++){
        var lowerCaseUsername = userList[i].username.toLowerCase();

        if (lowerCaseUsername === input) {
            result.push(userList[i]);
            continue;
        }

        if (lowerCaseUsername.includes(input)) nameIncludesResult.push(userList[i]);
    }

    for (let i = 0; i < nameIncludesResult.length; i++){
        result.push(nameIncludesResult[i]);
    }

    if (result.length > maxSearchUserHit){
        result = result.splice(0, maxSearchUserHit);
    }
    return result;
}

export function GetPlayerLeaderboardPosition(userId){
    for (let i = 0; i < leaderboard.length; i++){
        if (leaderboard[i].id == userId) return i + 1;
    }
    return 0;
}