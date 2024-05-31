import { Router } from 'express';
import cookieParser from "cookie-parser";
import { DeserializeSession } from '../utils/session.js';

import axios from 'axios';
import url from 'url';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import path from 'path';

import { GetUserByDiscordId, CreateUserWithDiscord } from '../database.js';

const apiRouteOauth2Token = "https://discord.com/api/v10/oauth2/token";
const apiRouteUserInfo = "https://discord.com/api/v10/users/@me";

dotenv.config();

const website_url = process.env.URL;
const sessionSecret = process.env.SESSION_SECRET;
const port = process.env.PORT;
const sessionSecret = process.env.SESSION_SECRET;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const router = Router();

router.use(cookieParser(sessionSecret));
router.use(DeserializeSession);

router.get("/discord/redirect", async (req, res) => {
    const { code } = req.query;

    if (!code){
        res.sendFile(path.join(__dirname, '..', "public/index.html"));
        return;
    }

    try{
        const formData = new url.URLSearchParams({
            client_id: process.env.CLIENT_ID,
            client_secret: process.env.CLIENT_SECRET,
            grant_type: "authorization_code",
            code: code.toString(),
            redirect_uri: 'http://localhost:8080/api/auth/discord/redirect'//website_url + ":" + port + "/api/auth/discord/redirect",
        });
    
        const response = await axios.post(apiRouteOauth2Token,
            formData, {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            }
        );
        const {access_token, refresh_token} = response.data;
        console.log("Access token: " + access_token);
    
        if (response.data) {

            const userId = await StoreUserData(access_token, refresh_token);

            await SerializeSession(req, userId);
    
            //refresh token
            /*const requestFormData = new url.URLSearchParams({
                client_id: process.env.CLIENT_ID,
                client_secret: process.env.CLIENT_SECRET,
                grant_type: "refresh_token",
                refresh_token: output.data.refresh_token,
            });
    
            const refresh = await AxiosPost(requestFormData, apiRouteOauth2Token);*/
            
            res.location("/");
            res.end();
            //res.sendFile(path.join(__dirname, '..', "public/index.html"));
        }
    } catch(error){
        console.log(error);
        res.sendStatus(400);
    }
});

export default router;

async function StoreUserData(accessToken, refreshToken){
    const response = await axios.get(apiRouteUserInfo, {
        headers: {
            "Authorization": `Bearer ${accessToken}`,
        },
    });

    console.log(response.data);

    var userId = await GetUserByDiscordId(response.data.id);
    if (!userId){
        userId = await CreateUserWithDiscord(response.data.username, response.data.id, accessToken, refreshToken, response.data.avatar);
    }
    return userId;
}