import { GetSession, CreateSession, DeleteSession } from '../database.js';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import dotenv from "dotenv";

dotenv.config();
const sessionSecret = process.env.SESSION_SECRET;

export const sessionMiddleware = session({
    secret: sessionSecret,
    name: 'DISCORD_OAUTH2_SESSION_ID',
    resave: false,
    saveUninitialized: false,
    cookie: {
        sameSite: 'strict',
        //secure: true,
        //partitioned: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
    },
    store: false,
})

export async function SerializeSession(req, userId){
    req.session.user = userId;
    req.session.touch();
    
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
        return next();
    }
    if (session.expires_at < Date.now()){
        req.session.user = undefined;
        await DeleteSession(sessionId);
        return next();
    }
    const data = JSON.parse(session.data);
    req.session.user = data;
    next();
}