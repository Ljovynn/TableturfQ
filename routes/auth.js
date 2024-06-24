import { Router } from 'express';
import cookieParser from "cookie-parser";
import { DeserializeSession } from '../utils/session.js';
import { SerializeSession } from '../utils/session.js';

import axios from 'axios';
import url from 'url';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import path from 'path';

import { GetUserByDiscordId, CreateUserWithDiscord, SetUserDiscord, CreateUser, GetUserData, VerifyAccount } from '../database.js';
import { CheckUserDefined } from '../utils/checkDefined.js';
import { authErrors, databaseErrors } from '../Responses/authErrors.js';
import { SetResponse } from '../Responses/ResponseData.js';
import { userRoles } from '../public/constants/userData.js';

const apiRouteOauth2Token = "https://discord.com/api/v10/oauth2/token";
const apiRouteUserInfo = "https://discord.com/api/v10/users/@me";

dotenv.config();

const websiteURL = process.env.URL;
const port = process.env.PORT;
const sessionSecret = process.env.SESSION_SECRET;
const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const router = Router();

router.use(cookieParser(sessionSecret));
router.use(DeserializeSession);

//req: username
router.get("/unverified/login", async (req, res) => {
    if (CheckUserDefined(req)) return SetResponse(res, authErrors.userLoggedIn);

    var userId = await CreateUser(req.username);
    if (!userId) return SetResponse(databaseErrors.unverifiedCreateError);

    await SerializeSession(req, userId);

    res.location("/");
    res.end();
});

router.get("/discord/redirect", async (req, res) => {
    const { code } = req.query;

    const userId = req.session.user;

    if (!code){
        res.sendFile(path.join(__dirname, '..', "public/index.html"));
        return;
    }

    try{
        const formData = new url.URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: "authorization_code",
            code: code.toString(),
            redirect_uri: `${websiteURL}/api/auth/discord/redirect`,//'http://localhost:8080/api/auth/discord/redirect'
        });
    
        const response = await axios.post(apiRouteOauth2Token,
            formData, {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            }
        );
        const {access_token, refresh_token} = response.data;
    
        if (response.data) {

            const newUserId = await StoreUserData(access_token, refresh_token, userId);

            if (!newUserId) return SetResponse(databaseErrors.verifiedCreateError);
            await SerializeSession(req, newUserId);
    
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

async function StoreUserData(accessToken, refreshToken, userId){
    const response = await axios.get(apiRouteUserInfo, {
        headers: {
            "Authorization": `Bearer ${accessToken}`,
        },
    });

    //If logged in to account, update that account
    if (userId){
        var user = await GetUserData(userId);
        if (user && user.role == userRoles.unverified){
            await VerifyAccount(userId, response.data.id, accessToken, refreshToken, response.data.avatar, response.data.locale);
            return userId;
        }
    }

    var newUser = await GetUserByDiscordId(response.data.id);
    var newUserId;
    if (!newUser){
        newUserId = await CreateUserWithDiscord(response.data.username, response.data.id, accessToken, refreshToken, response.data.avatar, response.data.locale);
    } else {
        newUserId = newUser.id;
        await SetUserDiscord(newUserId, response.data.id, accessToken, refreshToken, response.data.avatar, response.data.locale); 
    }
    return newUserId;
}