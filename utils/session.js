import express from 'express';
import { GetSession, CreateSession, DeleteSession} from '../database.js';
import cookieParser, { signedCookies } from 'cookie-parser';
import dotenv from "dotenv";

dotenv.config();
const sessionSecret = dotenv.config.SESSION_SECRET;

export async function SerializeSession(req, discordId){
    req.session.user = discordId;
    //kanske måste ändra cookien till access tokens o sånt, inte bara id?
    //TODO: skapa bara om det inte redan finns en
    console.log("serialising session");
    await CreateSession(req.sessionID, req.session.cookie.expires, JSON.stringify(discordId));
}

export async function DeserializeSession(req, res, next){
    const { DISCORD_OAUTH2_SESSION_ID } = req.signedCookies;

    if (!DISCORD_OAUTH2_SESSION_ID) return next();
    const sessionId = cookieParser.signedCookie(DISCORD_OAUTH2_SESSION_ID, sessionSecret).toString();
    console.log("session id: " + sessionId);

    const session = await GetSession(sessionId)
    if (!session){
        console.log("cant find session");
        return next();
    }
    if (session.expires_at < Date.now()){
        console.log("session expired");
        await DeleteSession(sessionId);
        console.log("session deleted");
        return next();
    }
    const data = JSON.parse(session.data);
    req.session.user = data;
    next();
}