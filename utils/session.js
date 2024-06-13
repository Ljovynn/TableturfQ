import { GetSession, CreateSession, DeleteSession, GetUserBanAndRole} from '../database.js';
import cookieParser from 'cookie-parser';
import dotenv from "dotenv";

dotenv.config();
const sessionSecret = process.env.SESSION_SECRET;

export async function SerializeSession(req, userId){
    req.session.user = userId;
    req.session.touch();

    console.log("serialising session");
    await CreateSession(req.sessionID, req.session.cookie.expires, JSON.stringify(userId));
}

export async function DeserializeSession(req, res, next){
    const { DISCORD_OAUTH2_SESSION_ID } = req.signedCookies;

    if (!DISCORD_OAUTH2_SESSION_ID){
        req.session.user = undefined;
        return next();
    }
    const sessionId = cookieParser.signedCookie(DISCORD_OAUTH2_SESSION_ID, sessionSecret).toString();

    const session = await GetSession(sessionId)
    if (!session){
        req.session.user = undefined;
        console.log("cant find session");
        return next();
    }
    if (session.expires_at < Date.now()){
        req.session.user = undefined;
        console.log("session expired");
        await DeleteSession(sessionId);
        req.session.user = undefined;
        console.log("session deleted");
        return next();
    }
    const data = JSON.parse(session.data);
    req.session.user = data;
    next();
}