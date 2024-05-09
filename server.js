import express from "express";
import session from "express-session";
import dotenv from "dotenv";
import url from "url";
import cookieParser from "cookie-parser";
import { fileURLToPath } from 'url';
import path from 'path';

import { DeserializeSession } from "./utils/session.js";

//const { request } = require("http");

dotenv.config();

const website_url = process.env.URL;
const app = express();
const port = process.env.PORT;
const sessionSecret = process.env.SESSION_SECRET;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.listen(port, () => {
    console.log(`TableturfQ is up at port ${port}`);
});

app.use(
    session({
        secret: sessionSecret,
        name: 'DISCORD_OAUTH2_SESSION_ID',
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 3600000 * 24,
        },
    })
);
app.use(cookieParser(sessionSecret));
app.use(DeserializeSession);
app.use(express.static('public',{extensions:['html']}));
app.use(express.urlencoded({extended: true}));
app.use(express.json());

import {AuthDiscordRedirect} from './routes/auth.js';
import {GetMatchInfo} from './routes/matchRequests.js';

//auth
app.get('/api/auth/discord/redirect', AuthDiscordRedirect);

//match requests
app.post("/MatchRequests/GetMatchInfo", GetMatchInfo);


app.get("/testing", async (req, res) => {
    res.sendFile(path.join(__dirname, "public/Testing/LjovynnsTestingPage.html"));
    console.log(req.sessionID);
});

app.get("/login", async (req, res) => {
    //check log in
    //res.sendFile(join(__dirname, "index.html"));
});

app.post("/PlayerReportStageStrike", async (req, res) => {
    try {
        const data = req.body;
        const player = await GetPlayer(data.playerId);

        //todo: check if player in match
        const matchId = 0;
        if (!true){
            res.sendStatus(599);
            return;
        }
        //todo: update match data and database
        res.sendStatus(201);
    } catch (err){
        res.sendStatus(599);
    }
})