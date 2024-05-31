import express from "express";
import session from "express-session";
import dotenv from "dotenv";
import url from "url";
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { CreateSocketConnection } from "./socketManager.js";
import path from 'path';

import { MatchMakingTick } from "./queManager.js";

dotenv.config();

const port = process.env.PORT;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const matchmakingTickInterval = 3000;

const app = express();
const server = createServer(app);

CreateSocketConnection(server);

server.listen(port, () => {
    console.log(`TableturfQ is up at port ${port}`);
    setInterval(RunQue, matchmakingTickInterval);
});

//TODO: refactor socket send to Que.js
async function RunQue(){
    await MatchMakingTick();
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

app.use('/api/auth', authRouter);
app.use('/match', matchRouter);
app.use('/que', queRouter);

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