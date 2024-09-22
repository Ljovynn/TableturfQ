import express from "express";
import dotenv from "dotenv";
import { fileURLToPath } from 'url';
import { CreateSocketConnection, SendSocketMessage } from "./socketManager.js";
import path from 'path';

import { sessionMiddleware } from "./utils/session.js";

import { MatchMakingTick, CheckMatchmadePlayers, CheckRecentlyMatchedPlayers } from "./queManager.js";

import { StartDiscordBot } from "./discordBot/discordBotManager.js";
import { DeleteOldChatMessages, DeleteOldSuspensions, DeleteOldUnverifiedAccounts, DeleteUnfinishedMatches, UpdateRankDecay } from "./database.js";
import { CancelOldMatches } from "./matchManager.js";
import { AnnouncementManagerSetup, DeletePastAnnouncements } from "./cache/announcementManager.js";
import { LeaderboardSizeSetup, UpdateLeaderboardSize } from "./cache/leaderboardSize.js";
import { MatchHistoryManagerSetup } from "./cache/matchHistoryManager.js";
import { CleanupChatRateLimitList, CleanupAvatarRefreshList } from "./rateLimitManager.js";

dotenv.config();

const port = process.env.PORT;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const matchmakingTickInterval = 5 * 1000;
const checkMatchmadePlayersInterval = 2 * 60 * 1000;
const checkRecentlyMatchedPlayersInteval = 5 * 1000;//10 * 60 * 1000;
const cancelLongMatchesInterval = 3 * 60 * 1000;
const updateLeaderboardSizeInterval = 5 * 60 * 1000;
const deleteOldUnverifiedUsersInterval = 24 * 60 * 60 * 1000;
const deleteOldSuspensionsInterval = 2 * 60 * 60 * 1000;
const deleteOldAnnouncementsInterval = 3 * 60 * 60 * 1000;
const deleteOldChatMessagesInterval = 24 * 60 * 60 * 1000;
const decayRankInterval = 24 * 60 * 60 * 1000;
const cleanupChatRateLimitInterval = 30 * 1000;
const cleanupAvatarRefreshInterval = 5 * 60 * 1000;

//Todo: test if account deletion when user is in match messes anything
const unverifiedUserDeletionThreshold = 7 * 24 * 60 * 60 * 1000;
const matchDeletionThreshold = 3 * 60 * 60 * 1000;
const chatMessageDeletionThreshold = 31 * 24 * 60 * 60 * 1000;

const decayRankAmount = 10;
const rdIncrease = 1;
const decayRankThreshold = 7 * 24 * 60 * 60 * 1000;
const decayRatingLimit = 1700;

const app = express();

//import { TESTMATCH } from "./matchManager.js";
//import { Deploy } from "./discordBot/deployCommands.js";

const server = app.listen(port, () => {
    //Deploy();
    //TESTMATCH();
    console.log(`TableturfQ is up at port ${port}`);

    //que
    
    setInterval(MatchMakingTick, matchmakingTickInterval);
    setInterval(CheckMatchmadePlayers, checkMatchmadePlayersInterval);
    setInterval(CheckRecentlyMatchedPlayers, checkRecentlyMatchedPlayersInteval);

    //match
    setInterval(TickCancelOldMatches, cancelLongMatchesInterval);
    
    //chat
    setInterval(() => {
        DeleteOldChatMessages(chatMessageDeletionThreshold);
    }, deleteOldChatMessagesInterval);

    //users
    setInterval(() => {
        DeleteOldUnverifiedAccounts(unverifiedUserDeletionThreshold);
    }, deleteOldUnverifiedUsersInterval);
    setInterval(DeleteOldSuspensions, deleteOldSuspensionsInterval);

    //leaderboard
    setInterval(UpdateLeaderboardSize, updateLeaderboardSizeInterval);

    //announcements
    setInterval(DeletePastAnnouncements, deleteOldAnnouncementsInterval);

    //rank decay
    setInterval(() => {
        UpdateRankDecay(decayRankAmount, rdIncrease, decayRankThreshold, decayRatingLimit);
    }, decayRankInterval);

    //rate limits
    setInterval(CleanupChatRateLimitList, cleanupChatRateLimitInterval);
    setInterval(CleanupAvatarRefreshList, cleanupAvatarRefreshInterval);
    
    StartDiscordBot();

    DeleteUnfinishedMatches();

    AnnouncementManagerSetup();
    LeaderboardSizeSetup();
    MatchHistoryManagerSetup();
});

CreateSocketConnection(server);

async function TickCancelOldMatches(){
    let cancelledMatchIds = await CancelOldMatches(matchDeletionThreshold);
    for (let i = 0; i < cancelledMatchIds.length; i++){
        SendSocketMessage('match' + cancelledMatchIds[i], "matchCancelled");
    }
}

if (process.env.NODE_ENV === 'production') app.set('trust proxy', 2);
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
import deckSharingRouter from './routes/deckSharing.js';

app.use('/api/auth', authRouter);
app.use('/match', matchRouter);
app.use('/que', queRouter);
app.use('/leaderboard', leaderboardRouter);
app.use('/admin', adminRouter);
app.use('/user', userRouter);
app.use('/announcementInfo', announcementRouter);
app.use('/matchHistory', matchHistoryRouter);
app.use('/decks', deckSharingRouter);

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