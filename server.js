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

dotenv.config();

const website_url = process.env.URL;
const sessionSecret = process.env.SESSION_SECRET;
const port = process.env.PORT;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const matchmakingTickInterval = 3000;

const app = express();
const server = createServer(app);
const io = new Server(server);

io.on("connection", socket => {
    //Not complete

    //join match id as room
    socket.on('join', function(room){
        socket.join(room.toString());
    });
});

server.listen(port, () => {
    console.log(`TableturfQ is up at port ${port}`);
    setInterval(RunQue, matchmakingTickInterval);
});

async function RunQue(){
    var matchedPlayersList = await MatchMakingTick();
    if (!matchedPlayersList) return;

    for (let i = 0; i < matchedPlayersList.length; i++){
        if (matchedPlayersList.matchMode == matchModes.casual){
            var matchedPlayersData = {
                matchId: matchedPlayersList[i].matchId,
                player1Id: matchedPlayersList[i].players[0].id,
                player2Id: matchedPlayersList[i].players[1].id
            }
            io.to("queRoom").emit("matchReady", matchedPlayersData);
        } else{
            io.to("queRoom").emit("matchesFound", matchedPlayersList[i]);
        }
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
app.use(cookieParser(sessionSecret));
app.use(DeserializeSession);
app.use(express.static('public',{extensions:['html']}));
app.use(express.urlencoded({extended: true}));
app.use(express.json());

import { AuthDiscordRedirect, GetDiscordUser } from './routes/auth.js';
import { GetMatchInfo, PostChatMessage, PostGameWin, PostStagePick, PostStageStrikes } from './routes/match.js';
import { MatchMakingTick } from "./queManager.js";
import { PostEnterQue, PostLeaveQue, PostPlayerReady, GetUserQueData } from "./routes/que.js";
import { match } from "assert";
import { matchModes } from "./public/constants/matchData.js";

//auth
app.get('/api/auth/discord/redirect', AuthDiscordRedirect);

//match
app.post("/StrikeStages", async (req, res) => {
    console.log('Posted strikes');
    var data = await PostStageStrikes(req, res);
    if (data){
        io.to('match' + data.matchId).emit("stageStrikes", data.stages);
    }
});

app.post("/PickStage", async (req, res) => {
    var data = PostStagePick();
    if (data){
        io.to(data.matchId).emit("stagePick", data.stage);
    }
});

//TODO: handle dispute by checking if winnerId is defined
app.post("/WinGame", async (req, res) => {
    var data = PostGameWin();
    if (data){
        io.to(data.matchId).emit("gameWin", data.winnerId);
    }
});

app.post("/CasualMatchEnd", async (req, res) => {
    var matchId = PostGameWin();
    if (matchId){
        io.to(data.matchId).emit("matchEnd");
    }
});

app.post("/SendChatMessage", async (req, res) => {
    var data = await PostChatMessage(req, res);
    if (data) {
        io.to('match' + data.matchId).emit("chatMessage", data.userId, data.message);
    }
});

//todo dispute

app.post("/GetMatchInfo", async (req, res) => {
    var data = await GetMatchInfo(req, res);
    res.send(data);
});

//que
app.post("/PlayerEnterQue", async (req, res) => {
    var data = PostEnterQue(req, res);
    return data;
});

app.post("/PlayerLeaveQue", PostLeaveQue);

app.post("/PlayerReady", async (req, res) => {
    //if match created send socket
    var match = await PostPlayerReady(req, res);
    if (match){
        var matchedPlayersData = {
            matchId: match.id,
            player1Id: match.players[0].id,
            player2Id: match.players[1].id
        }
        io.to("queRoom").emit("matchReady", matchedPlayersData);
    }
});

app.get("/GetQueData", GetUserQueData);

//mod stuff

//chat message

//resolve dispute

//user profile
//todo

app.get("/", async (req, res) => {
    res.end();
});

app.get("/testing", async (req, res) => {
    if (!req.session.user){
        res.sendStatus(401);
        return;
    }
    res.send(GetDiscordUser(req.session.user));
    //res.sendStatus(200);
});

app.get("/login", async (req, res) => {
    //check log in
    //res.sendFile(join(__dirname, "index.html"));
});