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
        let data = [];
    
        //get match
        data[0] = await GetMatch(matchId);
        if (data[0] == null){
            res.sendStatus(599);
            return;
        }
    
        //get match games
        data[1] = await GetMatchGames(matchId);

        //get players
        data[2][0] = await GetPlayerData(data[0][1]);
        data[2][1] = await GetPlayerData(data[0][2]);
    
        //get strikes
        for (let i = 0; i < data[1].length; i++){
            data[3][i] = GetStageStrikes(data[1][i].id);
        }
    
        res.status(200).send(data);
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