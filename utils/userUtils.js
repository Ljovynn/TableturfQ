import { GetUserData } from "../database.js"
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

export function ApplyHideRank(user){
    if (user.hide_rank === false) return user.g2_rating;
    return null;
}

export async function HandleBanUser(bannedUserId){
    RemovePlayerFromAnyQue(bannedUserId);
    var matchData = await HandleBannedPlayerInMatch(bannedUserId);

    switch (matchData.mode){
        case matchModes.casual:
            SendEmptySocketMessage(matchData.matchId, "matchEnd");
            break;
        case matchModes.ranked:
            var data = [matchData.winnerId, matchData.newPlayerRatings]
            SendSocketMessage('match' + matchData.matchId, "matchWin", data);
            break;
    }
}