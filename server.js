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
    queTickInterval = setInterval(() => {
        MatchMakingTick(matchmakingTickInterval);
    }, matchmakingTickInterval);
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

import { AuthDiscordRedirect } from './routes/auth.js';
import { GetMatchInfo } from './routes/match.js';
import { MatchMakingTick } from "./queManager.js";
import { PostEnterQue, PostLeaveQue, PostPlayerReady, GetUserQueData } from "./routes/que.js";

//auth
app.get('/api/auth/discord/redirect', AuthDiscordRedirect);

//match
app.get("/GetMatchInfo", GetMatchInfo);

//que
app.post("/PlayerEnterQue", PostEnterQue);
app.post("PlayerLeaveQue", PostLeaveQue);

app.post("/PlayerReady", async (req, res) => {
    //if match created send socket
    var match = await PostPlayerReady(req, res);
    if (match){
        var matchedPlayersData = {
            "matchId": match.id,
            "player1Id": match.players[0].id,
            "player2Id": match.players[1].id
        }
        io.to("queRoom").emit("matchReady", matchedPlayersData);
    }
});

app.get("/GetQueData", GetUserQueData);


app.get("/", async (req, res) => {
    res.end();
    console.log(req.session.user);
});

app.get("/testing", async (req, res) => {
    res.end();
    console.log(req.session.user);
});

app.get("/login", async (req, res) => {
    //check log in
    //res.sendFile(join(__dirname, "index.html"));
});