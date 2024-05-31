import express from "express";
import session from "express-session";
import dotenv from "dotenv";
import url from "url";
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { CreateSocketConnection } from "./socketManager.js";
import path from 'path';

import { MatchMakingTick } from "./queManager.js";
import { UpdateLeaderboard } from "./leaderboardManager.js";

dotenv.config();

const port = process.env.PORT;
const sessionSecret = process.env.SESSION_SECRET;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const matchmakingTickInterval = 3 * 1000;
const updateLeaderboardInterval = 5 * 60 * 1000;

const app = express();
const server = createServer(app);

CreateSocketConnection(server);

server.listen(port, () => {
    console.log(`TableturfQ is up at port ${port}`);
    setInterval(MatchMakingTick, matchmakingTickInterval);
    setInterval(UpdateLeaderboard, updateLeaderboardInterval);
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
app.use(express.static('public',{extensions:['html']}));
app.use(express.urlencoded({extended: true}));
app.use(express.json());

import authRouter from './routes/auth.js';
import matchRouter from './routes/match.js';
import queRouter from './routes/que.js';
import leaderboardRouter from './routes/leaderboard.js';

app.use('/api/auth', authRouter);
app.use('/match', matchRouter);
app.use('/que', queRouter);
app.use('/leaderboard', leaderboardRouter);

//todo: mod stuff
//resolve dispute
//user profile

app.get("/", async (req, res) => {
    res.end();
});

app.get("/testing", async (req, res) => {
    if (!req.session.user){
        res.sendStatus(401);
        return;
    }
    //res.sendStatus(200);
});

app.get("/login", async (req, res) => {
    //check log in
    //res.sendFile(join(__dirname, "index.html"));
});