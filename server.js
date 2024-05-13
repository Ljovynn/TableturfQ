import express from "express";
import session from "express-session";
import dotenv from "dotenv";
import url from "url";
import cookieParser from "cookie-parser";
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { Server } from "socket.io";
import path from 'path';

import { DeserializeSession } from "./utils/session.js";

//const { request } = require("http");

dotenv.config();

const website_url = process.env.URL;
const sessionSecret = process.env.SESSION_SECRET;
const port = process.env.PORT;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const server = createServer(app);
const io = new Server(server);

io.on("connection", socket => {
    //join match id as room
    socket.on('join', function(room){
        socket.join(room.toString());
        console.log("user joined " + room);
    });

    //message: playerId, matchId
    socket.on('player ready', message => {
        console.log("socket sent player ready in room " + message[1]);
        socket.to(message[1].toString()).emit('player ready', message[0]);
    })
});

server.listen(port, () => {
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