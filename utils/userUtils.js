import { GetUserBanState, GetUserData } from "../database.js"
import { HandleBannedPlayerInMatch } from "../matchManager.js";
import { matchModes } from "../public/constants/matchData.js";
import { RemovePlayerFromAnyQue } from "../queManager.js";
import { SendEmptySocketMessage, SendSocketMessage } from "../socketManager.js";

export async function GetCurrentUser(req){
    if (req.session && req.session.user){
        const user = await GetUserData(req.session.user);
        if (user){
            return user;
        }
    }
    return undefined;
}

export async function CheckUserBanned(userId){
    if (await GetUserBanState(userId)) return true;
    return false;
}

export async function HandleBanUser(bannedUserId){
    RemovePlayerFromAnyQue(bannedUserId);
    var matchData = await HandleBannedPlayerInMatch(bannedUserId);
    if (!matchData) return;

    switch (matchData.mode){
        case matchModes.casual:
            SendEmptySocketMessage(matchData.matchId, "matchEnd");
            break;
        case matchModes.ranked:
            var data = {winnerId: matchData.winnerId, newPlayerRatings: matchData.newPlayerRatings};
            SendSocketMessage('match' + matchData.matchId, "matchWin", data);
            break;
    }
}