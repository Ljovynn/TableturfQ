import express from "express";
import session from "express-session";
import dotenv from "dotenv";
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { CreateSocketConnection, SendSocketMessage } from "./socketManager.js";
import path from 'path';

import { MatchMakingTick, CheckMatchmadePlayers } from "./queManager.js";
import { UpdateLeaderboard } from "./leaderboardManager.js";

import { StartDiscordBot } from "./discordBot/discordBotManager.js";
import { DeleteOldSessions, DeleteOldSuspensions, DeleteOldUnverifiedAccounts, DeleteUnfinishedMatches } from "./database.js";
import { CancelOldMatches } from "./matchManager.js";
import { DeletePastEvents } from "./eventInfoManager.js";

dotenv.config();

const port = process.env.PORT;
const sessionSecret = process.env.SESSION_SECRET;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const matchmakingTickInterval = 5 * 1000;
const checkMatchmadePlayersInterval = 60 * 1000;
const cancelLongMatchesInterval = 3 * 60 * 1000;
const updateLeaderboardInterval = 5 * 60 * 1000;
const deleteOldUnverifiedUsersInterval = 24 * 60 * 60 * 1000;
const deleteOldSuspensionsInterval = 60 * 60 * 1000;
const deleteOldSessionsInterval = 24 * 60 * 60 * 1000;
const deleteOldEventsInterval = 2 * 60 * 60 * 1000;

//Todo: test if account deletion when user is in match messes anything
const unverifiedUserDeletionThreshold = 7 * 24 * 60 * 60 * 1000;
const matchDeletionThreshold = 2 * 60 * 60 * 1000;

const app = express();
const server = createServer(app);

CreateSocketConnection(server);

server.listen(port, () => {
    console.log(`TableturfQ is up at port ${port}`);

    //que
    setInterval(MatchMakingTick, matchmakingTickInterval);
    setInterval(CheckMatchmadePlayers, checkMatchmadePlayersInterval);

    //match
    setInterval(TickCancelOldMatches, cancelLongMatchesInterval);

    //leaderboard
    setInterval(UpdateLeaderboard, updateLeaderboardInterval);

    //accounts
    setInterval(() => {
        DeleteOldUnverifiedAccounts(unverifiedUserDeletionThreshold);
    }, deleteOldUnverifiedUsersInterval);
    setInterval(DeleteOldSuspensions, deleteOldSuspensionsInterval);

    //sessions
    setInterval(DeleteOldSessions, deleteOldSessionsInterval);

    //events
    setInterval(DeletePastEvents, deleteOldEventsInterval);

    StartDiscordBot();

    DeleteUnfinishedMatches();
});

async function TickCancelOldMatches(){
    var cancelledMatchIds = await CancelOldMatches(matchDeletionThreshold);
    for (let i = 0; i < cancelledMatchIds.length; i++){
        SendSocketMessage('match' + cancelledMatchIds[i], "matchCancelled");
    }
}

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
import adminRouter from './routes/admin.js';
import userRouter from './routes/user.js';
import eventRouter from './routes/eventInfo.js';

app.use('/api/auth', authRouter);
app.use('/match', matchRouter);
app.use('/que', queRouter);
app.use('/leaderboard', leaderboardRouter);
app.use('/admin', adminRouter);
app.use('/user', userRouter);
app.use('/eventInfo', eventRouter);

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