import session from 'express-session';
import dotenv from "dotenv";
import { sessionStore } from '../database.js';

dotenv.config();
const sessionSecret = process.env.SESSION_SECRET;
const SSL = (process.env.SSL === 'true') ? true : false;



export const sessionMiddleware = session({
    secret: sessionSecret,
    name: 'DISCORD_OAUTH2_SESSION_ID',
    resave: false,
    saveUninitialized: false,
    cookie: {
        sameSite: 'strict',
        secure: false,
        //partitioned: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
    },
    store: sessionStore,
})

export async function SerializeSession(req, userId){
    req.session.user = userId;
    req.session.touch();
}