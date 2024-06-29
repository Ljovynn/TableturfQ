import { GetUserData } from "../database.js"

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