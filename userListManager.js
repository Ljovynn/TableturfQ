import { GetLeaderboard, GetUserList } from "./database.js";
import { ApplyHideRank } from "./utils/userUtils.js";

var userList = [];
var leaderboard = [];

await UpdateLeaderboard();
await UpdateUserList();

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

export function SearchLeaderboard(input){
    return ListSearch(leaderboard, input, true);
}

export function SearchUser(input){
    return ListSearch(userList, input, false);
}

export function GetPlayerLeaderboardPosition(userId){
    for (let i = 0; i < leaderboard.length; i++){
        if (leaderboard[i].id == userId) return i + 1;
    }
    return 0;
}

function ListSearch(list, input, includePosition = false){
    var result = [];
    var nameIncludesResult = [];
    
    if (input.length < 2) return result;
    input = input.toLowerCase();

    for (let i = 0; i < list.length; i++){
        var lowerCaseUsername = list[i].username.toLowerCase();
        var discordName = list[i].discord_username;
        if (discordName) discordName = discordName.toLowerCase();

        if (lowerCaseUsername === input || discordName === input) {
            result.push(FormatUserData(list[i], i, includePosition));
            continue;
        }

        if (lowerCaseUsername.includes(input)){
            nameIncludesResult.push(FormatUserData(list[i], i, includePosition));
            continue;
        } 
        if (discordName){
            if (discordName.includes(input)) nameIncludesResult.push(FormatUserData(list[i], i, includePosition));
        }
    }

    for (let i = 0; i < nameIncludesResult.length; i++){
        result.push(nameIncludesResult[i]);
    }

    if (result.length > maxSearchUserHit){
        result = result.splice(0, maxSearchUserHit);
    }
    return result;
}

function FormatUserData(user, index, includePosition){
    if (includePosition) return {user: user, position: index + 1};
    return user;
}