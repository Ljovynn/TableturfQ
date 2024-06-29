import express from "express";
import dotenv from "dotenv";
import { fileURLToPath } from 'url';
import { CreateSocketConnection, SendSocketMessage } from "./socketManager.js";
import path from 'path';

import { sessionMiddleware } from "./utils/session.js";

import { MatchMakingTick, CheckMatchmadePlayers } from "./queManager.js";
import { UpdateLeaderboard, UpdateUserList } from "./userListManager.js";
import { UpdateRecentMatches } from "./matchHistoryManager.js";

import { StartDiscordBot } from "./discordBot/discordBotManager.js";
import { DeleteOldSuspensions, DeleteOldUnverifiedAccounts, DeleteUnfinishedMatches } from "./database.js";
import { CancelOldMatches } from "./matchManager.js";
import { DeletePastAnnouncements } from "./announcementManager.js";

dotenv.config();

const port = process.env.PORT;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const matchmakingTickInterval = 5 * 1000;
const checkMatchmadePlayersInterval = 60 * 1000;
const cancelLongMatchesInterval = 3 * 60 * 1000;
const updateLeaderboardInterval = 5 * 60 * 1000;
const updateUserListInterval = 30 * 60 * 1000;
const updateGlobalMatchHistoryInterval = 60 * 1000;
const deleteOldUnverifiedUsersInterval = 24 * 60 * 60 * 1000;
const deleteOldSuspensionsInterval = 60 * 60 * 1000;
const deleteOldAnnouncementsInterval = 2 * 60 * 60 * 1000;

//Todo: test if account deletion when user is in match messes anything
const unverifiedUserDeletionThreshold = 7 * 24 * 60 * 60 * 1000;
const matchDeletionThreshold = 2 * 60 * 60 * 1000;

const app = express();

const server = app.listen(port, () => {
    console.log(`TableturfQ is up at port ${port}`);

    //que
    
    setInterval(MatchMakingTick, matchmakingTickInterval);
    setInterval(CheckMatchmadePlayers, checkMatchmadePlayersInterval);

    //match
    setInterval(TickCancelOldMatches, cancelLongMatchesInterval);

    //user lists
    setInterval(UpdateLeaderboard, updateLeaderboardInterval);
    setInterval(UpdateUserList, updateUserListInterval);

    //match history
    setInterval(UpdateRecentMatches, updateGlobalMatchHistoryInterval);

    //accounts
    setInterval(() => {
        DeleteOldUnverifiedAccounts(unverifiedUserDeletionThreshold);
    }, deleteOldUnverifiedUsersInterval);
    setInterval(DeleteOldSuspensions, deleteOldSuspensionsInterval);

    //announcements
    setInterval(DeletePastAnnouncements, deleteOldAnnouncementsInterval);
    
    StartDiscordBot();

    //DeleteUnfinishedMatches();
});

CreateSocketConnection(server);

async function TickCancelOldMatches(){
    var cancelledMatchIds = await CancelOldMatches(matchDeletionThreshold);
    for (let i = 0; i < cancelledMatchIds.length; i++){
        SendSocketMessage('match' + cancelledMatchIds[i], "matchCancelled");
    }
}

if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1);
app.use(sessionMiddleware);
app.use(express.static('public',{extensions:['html']}));
app.use(express.urlencoded({extended: true}));
app.use(express.json());

import authRouter from './routes/auth.js';
import matchRouter from './routes/match.js';
import queRouter from './routes/que.js';
import leaderboardRouter from './routes/leaderboard.js';
import adminRouter from './routes/admin.js';
import userRouter from './routes/user.js';
import announcementRouter from './routes/announcementInfo.js';
import matchHistoryRouter from './routes/matchHistory.js';

app.use('/api/auth', authRouter);
app.use('/match', matchRouter);
app.use('/que', queRouter);
app.use('/leaderboard', leaderboardRouter);
app.use('/admin', adminRouter);
app.use('/user', userRouter);
app.use('/announcementInfo', announcementRouter);
app.use('/matchHistory', matchHistoryRouter);

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