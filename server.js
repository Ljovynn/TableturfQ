const express = require("express");
const axios = require("axios");
const dotenv = require("dotenv");
const url = require("url");
const { request } = require("http");

dotenv.config();

const website_url = process.env.URL;
const app = express();
const port = process.env.PORT;

app.listen(port, () => {
    console.log(`TableturfQ is up at port ${port}`);
});

app.use(express.static('public',{extensions:['html']}));
app.use(express.urlencoded({extended: true}));
app.use(express.json());

app.get("/login", async (req, res) => {
    //check log in
    //res.sendFile(join(__dirname, "index.html"));
});

app.get("/ljovynnspestingpage", async (req, res) => {
    res.sendFile(join(__dirname, "LjovynnsTestingPage.html"));
});

app.post("/GetMatchInfo", async (req, res) =>{
    try {
        //todo: if match is already in local matches array in code, get data from there intstead of DB?

        const matchId = req.body.matchId;

        var match = await GetMatch(matchId);
        if (match == null){
            res.sendStatus(599);
            return;
        }
    
        var matchGames = await GetMatchGames(matchId);

        var players = []
        players[0] = await GetPlayerData(match.player1_id);
        players[1] = await GetPlayerData(match.player2_id);
    
        var strikes = []
        for (let i = 0; i < data[1].length; i++){
            strikes[i] = GetStageStrikes(matchGames[i].id);
        }

        var data = [];
        data[0] = match;
        data[1] = matchGames;
        data[2] = players;
        data[3] = strikes;
    
        res.status(200).send(data);
    } catch (err){
        res.sendStatus(599);
    }
})

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

app.get("/api/auth/discord/redirect", async (req, res) => {
    const { code } = req.query;

    if (!code){
        return;
    }

    const formData = new url.URLSearchParams({
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        grant_type: "authorization_code",
        code: code.toString(),
        redirect_uri: website_url + ":" + port + "/api/auth/discord/redirect",
    });

    const output = await axios.post("https://discord.com/api/v10/oauth2/token",
        formData, {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
    });

    if (output.data) {
        const access = output.data.access_token;

        const userInfo = await axios.get("https://discord.com/api/v10/users/@me", {
            headers: {
                "Authorization": `Bearer ${access}`,
            },
        });

        //refresh token

        const requestFormData = new url.URLSearchParams({
            client_id: process.env.CLIENT_ID,
            client_secret: process.env.CLIENT_SECRET,
            grant_type: "refresh_token",
            refresh_token: output.data.refresh_token,
        });

        const refresh = await axios.post("https://discord.com/api/v10/oauth2/token",
            requestFormData, {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
        });

        //console.log(output.data, userInfo.data, refresh.data);
    }
});