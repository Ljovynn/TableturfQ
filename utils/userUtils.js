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