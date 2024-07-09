import mysql from 'mysql2';
import dotenv from 'dotenv';
import session from 'express-session';
import expressMySqlSession from 'express-mysql-session';
import { userRoles } from './public/constants/userData.js';
import { FindPlayerPosInMatch } from './utils/matchUtils.js';
import { settings } from './glicko2Manager.js';
import { ConvertJSDateToTimestamp } from './utils/date.js';
import { chatLoadLimit, matchModes, systemId } from './public/constants/matchData.js';
import { HandleBanUser } from './utils/userUtils.js';

dotenv.config();

const MySQLStore = expressMySqlSession(session);

const pool = mysql.createPool({
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQL_ROOT_PASSWORD,
    database: process.env.MYSQLDATABASE,
    port: process.env.MYSQLPORT,
}).promise()

const storeOptions = {
    clearExpired: true,
    checkExpirationInterval: 5 * 60 * 60 * 1000,
    expiration: 7 * 24 * 60 * 60 * 1000,
    createDatabaseTable: false,
    disableTouch: false,
}

export const sessionStore = new MySQLStore(storeOptions, pool);

//Get
export async function GetMatch(matchId){
    const [rows] = await pool.execute(`SELECT id, player1_id, player2_id, ranked, set_length, result, private_battle, UNIX_TIMESTAMP(created_at) AS unix_created_at FROM matches WHERE id = ?`,
        [matchId]);
    return rows[0];
}

export async function GetRecentMatches(cutoff){
    const [rows] = await pool.execute(`SELECT id, player1_id, player2_id, ranked, set_length, result, UNIX_TIMESTAMP(created_at) AS unix_created_at FROM matches
        WHERE private_battle = FALSE ORDER BY created_at DESC LIMIT ?`, [cutoff.toString()]);
    return rows;
}

export async function GetUserByDiscordId(discordId){
    const [rows] = await pool.execute(`SELECT id, username, role, g2_rating, hide_rank, CAST(discord_id AS CHAR) discord_id, discord_username, discord_avatar_hash, country,
        UNIX_TIMESTAMP(created_at) AS unix_created_at FROM users u WHERE discord_id = ?`, [discordId]);
    if (rows[0]){
        //console.log("insert id: " + rows[0].insertId); 
        //console.log("id: " + rows[0].id);
        return rows[0]
    } else {
        return undefined;
    }
}

export async function GetUserLoginData(userId){
    const [rows] = await pool.execute(`SELECT CAST(discord_id AS CHAR) discord_id, discord_access_token, discord_refresh_token FROM users WHERE id = ?`, [userId]);
    return rows[0];
}

export async function GetUserData(userId){
    const [rows] = await pool.execute(`SELECT id, username, role, g2_rating, hide_rank, CAST(discord_id AS CHAR) discord_id,
        discord_username, discord_avatar_hash, country, UNIX_TIMESTAMP(created_at) AS unix_created_at,
        (SELECT COUNT(*) FROM ban_list WHERE user_id = u.id) AS banned FROM users u WHERE id = ?`,
    [userId]);
    return rows[0];
}

export async function GetMultipleUserDatas(userIdlist){
    const [rows] = await pool.query(`SELECT id, username, role, g2_rating, hide_rank, CAST(discord_id AS CHAR) discord_id,
        discord_username, discord_avatar_hash, country, UNIX_TIMESTAMP(created_at) AS unix_created_at,
        (SELECT COUNT(*) FROM ban_list WHERE user_id = u.id) AS banned FROM users u WHERE id IN (?)`,
    [userIdlist]);
    return rows; 
}

export async function GetUserRankData(userId){
    const [rows] = await pool.execute(`SELECT id, g2_rating, hide_rank, g2_rd, g2_vol FROM users WHERE id = ?`, [userId]);
    return rows[0];
}

export async function GetUserRole(userId){
    const [rows] = await pool.execute(`SELECT role FROM users WHERE id = ?`, [userId]);
    if (rows[0]) return rows[0].role;
}

export async function GetUserBanState(userId){
    const [rows] = await pool.execute(`SELECT user_id, UNIX_TIMESTAMP(expires_at) AS unix_expires_at, reason FROM ban_list WHERE user_id = ?`, [userId]);
    if (rows[0]) return rows[0];
}

export async function GetUserBanAndRole(userId){
    const [rows] = await pool.execute(`SELECT role, (SELECT COUNT(*) FROM ban_list WHERE user_id = u.id) AS banned FROM users u WHERE id = ?`, [userId]);
    if (rows[0]) return rows[0];
}

export async function GetUserChatData(userIdArr){
    const rows = [];
    for (let i = 0; i < userIdArr.length; i++){
        rows[i] = await pool.execute(`SELECT id, username, role, CAST(discord_id AS CHAR) discord_id, discord_username FROM users WHERE id = ?`, [userIdArr[i]]);
    }
    return rows;
}

export async function GetUserMatchHistory(userId, hitsPerPage, pageNumber)
{
    var offset = (pageNumber - 1) * hitsPerPage;
    const [rows] = await pool.execute(`SELECT id, player1_id, player2_id, ranked, set_length, result, private_battle, UNIX_TIMESTAMP(created_at) AS unix_created_at FROM matches
        WHERE (player1_id = ? OR player2_id = ?) AND private_battle = FALSE ORDER BY created_at DESC LIMIT ? OFFSET ?`, [userId, userId, hitsPerPage.toString(), offset.toString()]);
    return rows;
}

export async function GetUserMatchCount(userId)
{
    const [count] = await pool.execute(`SELECT COUNT(*) AS matchCount FROM matches WHERE (player1_id = ? OR player2_id = ?) AND private_battle = FALSE`, [userId, userId]);
    if (count[0]) return count[0].matchCount;
}

export async function GetUserRankedMatchCount(userId)
{
    const [count] = await pool.execute(`SELECT COUNT(*) AS matchCount FROM matches WHERE ranked = TRUE AND (player1_id = ? OR player2_id = ?)`, [userId, userId]);
    if (count[0]) return count[0].matchCount;
}

export async function GetUserRatingHistory(userId, cutoffDate, endCutoffDate = Date.now())
{
    let timeStamp = ConvertJSDateToTimestamp(new Date(cutoffDate));
    let endTimeStamp = ConvertJSDateToTimestamp(new Date(endCutoffDate));
    const [rows] = await pool.execute(`SELECT match_ratings.match_id,
        IF (m.player1_id = ?, (match_ratings.player1_old_rating), match_ratings.player2_old_rating) AS old_rating,
        IF (m.player1_id = ?, (match_ratings.player1_new_rating), match_ratings.player2_new_rating) AS new_rating
        FROM match_ratings INNER JOIN matches m ON match_ratings.match_id=m.id
        WHERE (m.player1_id = ? OR m.player2_id = ?) AND m.created_at > ? AND m.created_at <= ?
        ORDER BY m.created_at ASC`,
    [userId, userId, userId, userId, timeStamp, endTimeStamp]);
    return rows;
}

export async function GetMatchGames(matchId){
    const [rows] = await pool.execute(`SELECT * FROM games WHERE match_id = ? ORDER BY id`, [matchId]);
    return rows;
}

export async function GetStageStrikes(gameId){
    const [rows] = await pool.execute(`SELECT * FROM stage_strikes WHERE game_id = ?`, [gameId]);
    return rows;
}

export async function GetChatMessages(matchId, loadedMessagesAmount = 0){
    const [rows] = await pool.execute(`SELECT owner_id, content, UNIX_TIMESTAMP(date) AS unix_date FROM chat_messages WHERE match_id = ? ORDER BY id DESC LIMIT ? OFFSET ?`,
    [matchId, chatLoadLimit, loadedMessagesAmount]);
    return rows;
}

export async function GetSession(sessionId){
    const [rows] = await pool.execute(`SELECT * FROM sessions WHERE session_id = ?`, [sessionId]);
    return rows[0];
}

export async function GetUserList(){
    const [rows] = await pool.execute (`SELECT id, username, g2_rating, hide_rank, CAST(discord_id AS CHAR) discord_id, discord_username, discord_avatar_hash, country FROM users u
        WHERE NOT EXISTS (SELECT * FROM ban_list WHERE user_id = u.id) AND role != 0`);
    return rows;
}

export async function GetLeaderboard(){
    const [rows] = await pool.execute (`SELECT id, username, g2_rating, CAST(discord_id AS CHAR) discord_id, discord_username, discord_avatar_hash, country FROM users u
        WHERE NOT EXISTS (SELECT * FROM ban_list WHERE user_id = u.id) AND hide_rank = FALSE ORDER BY g2_rating DESC`);
    return rows;
}

export async function GetFutureAnnouncements(){
    let timeStamp = ConvertJSDateToTimestamp(new Date());
    const [rows] = await pool.execute(`SELECT title, description, icon_src, UNIX_TIMESTAMP(date) AS unix_date, is_event FROM announcements WHERE date > ? ORDER BY date ASC`, [timeStamp]);
    return rows;
}

//Create

export async function SetMatchResult(match){
    try{
        var ranked = (match.mode == matchModes.ranked && !match.privateBattle);

        await pool.execute(`INSERT INTO matches (id, player1_id, player2_id, ranked, set_length, result, private_battle) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [match.id, match.players[0].id, match.players[1].id, ranked, match.setLength, match.status, match.privateBattle]);

        CreateFirstGameStrikes(match);

        for (let i = 1; i < match.gamesArr.length; i++){
            CreateCounterpickGameAndStrikes(match, i + 1);
        }

        var chatData = [];
        for (let i = 0; i < match.chat.length; i++){
            let ownerId = (match.chat[i].ownerId == systemId) ? null : match.chat[i].ownerId;
            chatData[i] = [match.id, ownerId, match.chat[i].content, ConvertJSDateToTimestamp(new Date(match.chat[i].date))];
        }

        if (chatData.length == 0) return;
        await pool.query(`INSERT INTO chat_messages (match_id, owner_id, content, date) VALUES ?`, 
            [chatData.map(msg => [msg[0], msg[1], msg[2], msg[3]])]);
    }catch(error){
        console.log(error);
    }
}

async function CreateFirstGameStrikes(match){
    var game = match.gamesArr[0];
    var strikePos = FindPlayerPosInMatch(match, game.winnerId);
    const result = await pool.execute(`INSERT INTO games (match_id, stage, result) VALUES (?, ?, ?)`, [match.id, game.stage, strikePos]);

    const gameId = result[0].insertId;

    var data = [];
    for (let i = 0; i < game.strikes.length; i++){
        var strikePos;
        if ((i + 1) % 4 < 2){
            strikePos = 1;
        } else{
            strikePos = 2;
        }
        data[i] = [gameId, game.strikes[i], strikePos];
    }

    if (data.length == 0) return;
    await pool.query(`INSERT INTO stage_strikes (game_id, stage, strike_owner) VALUES ?`, [data.map(strike => [strike[0], strike[1], strike[2]])]);
}

async function CreateCounterpickGameAndStrikes(match, gameNumber){
    var game = match.gamesArr[gameNumber - 1];
    var winnerPos = FindPlayerPosInMatch(match, game.winnerId);
    const result = await pool.execute(`INSERT INTO games (match_id, stage, result) VALUES (?, ?, ?)`, [match.id, game.stage, winnerPos]);

    const gameId = result[0].insertId;
    var data = [];
    for (let i = 0; i < game.strikes.length; i++){
        data[i] = [gameId, game.strikes[i], winnerPos];
    }

    if (data.length == 0) return;
    await pool.query(`INSERT INTO stage_strikes (game_id, stage, strike_owner) VALUES ?`, [data.map(strike => [strike[0], strike[1], strike[2]])]);
}

export async function AddMatchRatings(matchId, p1OldRating, p2OldRating, p1NewRating, p2NewRating)
{
    await pool.execute(`INSERT INTO match_ratings (match_id, player1_old_rating, player2_old_rating, player1_new_rating, player2_new_rating) VALUES (?, ?, ?, ?, ?)`,
    [matchId, p1OldRating, p2OldRating, p1NewRating, p2NewRating]);
}

export async function CreateUser(userId, username)
{
    await pool.execute(`INSERT INTO users (id, username, g2_rating, g2_rd, g2_vol) VALUES (?, ?, ?, ?, ?)`, [userId, username, settings.rating, settings.rd, settings.vol]);
}

export async function CreateUserWithDiscord(userId, username, discordId, discordUsername, discordAccessToken, discordRefreshToken, discordAvatarHash){
    await pool.execute(`INSERT INTO users (id, username, role, g2_rating, g2_rd, g2_vol, discord_id, discord_username, discord_access_token, discord_refresh_token, discord_avatar_hash)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [userId, username, userRoles.verified, settings.rating, settings.rd, settings.vol, discordId, discordUsername, discordAccessToken, discordRefreshToken, discordAvatarHash]);
}

/*export async function CreateSession(sessionId, expiresAt, data){
    await pool.query(`INSERT INTO sessions (id, expires_at, data) VALUES (?, ?, ?)`, [sessionId, expiresAt, data]);
}*/

export async function CreateAnnouncement(title, description, iconSrc, date, isEvent){
    let timeStamp = ConvertJSDateToTimestamp(new Date(date * 1000));
    var announcement = await pool.execute(`INSERT INTO announcements (title, description, icon_src, date, is_event) VALUES (?, ?, ?, ?, ?)`,
    [title, description, iconSrc, timeStamp, isEvent]);
    return announcement[0].insertId;
}

export async function SuspendUser(userId, banLength, reason){
    const unbanDate = Date.now() + banLength;
    let timeStamp = ConvertJSDateToTimestamp(new Date(unbanDate));
    await pool.execute(`INSERT INTO ban_list (user_id, expires_at, reason) VALUES (?, ?, ?)`, [userId, timeStamp, reason]);
}

export async function BanUser(userId, reason){
    await pool.execute(`INSERT INTO ban_list (user_id, reason) VALUES (?, ?)`, [userId, reason]);
}

export async function AddChatMessage(matchId, ownerId, content){
    await pool.execute(`INSERT INTO chat_messages (match_id, owner_id, content) VALUES (?, ?, ?)`, [matchId, ownerId, content]);
}


//Update

export async function SetUserRole(userId, role){
    await pool.execute(`UPDATE users SET role = ? WHERE id = ?`, [role, userId]);
}

export async function SetUserRating(userId, rating, rd, vol){
    await pool.execute(`UPDATE users SET g2_rating = ?, g2_rd = ?, g2_vol = ? WHERE id = ?`, [rating, rd, vol, userId]);
}

export async function SetUserHideRank(userId, shouldHide){
    await pool.execute(`UPDATE users SET hide_rank = ? WHERE id = ?`, [shouldHide, userId]);
}

export async function VerifyAccount(userId, discordId, discordUsername, discordAccessToken, discordRefreshToken, discordAvatarHash){
    await pool.execute(`UPDATE users SET discord_id = ?, discord_username = ?, role = ?, discord_access_token = ?, discord_refresh_token = ?, discord_avatar_hash = ? WHERE id = ?`, 
    [discordId, discordUsername, userRoles.verified, discordAccessToken, discordRefreshToken, discordAvatarHash, userId]);
}

export async function SetUsername(userId, username){
    await pool.execute(`UPDATE users SET username = ? WHERE id = ?`, [username, userId])
}

export async function SetUserDiscord(userId, discordId, discordUsername, discordAccessToken, discordRefreshToken, discordAvatarHash){
    await pool.execute(`UPDATE users SET discord_id = ?, discord_username = ?, discord_access_token = ?, discord_refresh_token = ?, discord_avatar_hash = ? WHERE id = ?`, 
    [discordId, discordUsername, discordAccessToken, discordRefreshToken, discordAvatarHash, userId]);
}

export async function SetUserCountry(userId, country){
    await pool.execute(`UPDATE users SET country = ? WHERE id = ?`, [country, userId]);
}

export async function SetUserDiscordTokens(userId, discordAccessToken, discordRefreshToken){
    await pool.execute(`UPDATE users SET discord_access_token = ?, discord_refresh_token = ? WHERE id = ?`, 
    [discordAccessToken, discordRefreshToken, userId]);
}

export async function UpdateRankDecay(decay, timeThreshold, ratingLimit){
    const cutoffDate = Date.now() - timeThreshold;
    let timeStamp = ConvertJSDateToTimestamp(new Date(cutoffDate));
    try {
        await pool.execute(`UPDATE users u SET g2_rating = u.g2_rating - ? WHERE NOT EXISTS (SELECT * FROM matches m
            WHERE (m.player1_id = u.id OR m.player2_id = u.id) AND m.created_at > ?) AND u.g2_rating > ?`,
        [decay, timeStamp, ratingLimit]);
    }
    catch(error){
        console.log(error);
    }
}

//delete

/*export async function DeleteChatMessage(matchId, messageNumber){
    await pool.execute(`DELETE FROM chat_messages WHERE match_id = ? AND message_number = ?`, [matchId, messageNumber]);
}*/

export async function DeleteUnfinishedMatches(){
    await pool.query(`DELETE FROM matches WHERE result = 0`);
}

export async function DeleteSession(sessionId){
    await pool.execute(`DELETE FROM sessions WHERE session_id = ?`, [sessionId]);
}

export async function DeleteAllUserSessions(userId){
    await pool.execute(`DELETE FROM sessions WHERE data LIKE ?`, [`%"user":"${userId}"%`]);
}

export async function DeleteOldUnverifiedAccounts(ageThreshold){
    const cutoffDate = Date.now() - ageThreshold;
    let timeStamp = ConvertJSDateToTimestamp(new Date(cutoffDate));
    try {
        const [rows] = await pool.execute(`SELECT id FROM users WHERE role = ? AND created_at < ?`, [userRoles.unverified, timeStamp]);
        for (let i = 0; i < rows.length; i++){
            HandleBanUser(rows[i].id);
        }
        await pool.execute(`DELETE FROM users WHERE role = ? AND created_at < ?`, [userRoles.unverified, timeStamp]);
    }
    catch(error){
        console.log(error);
    }
}

export async function DeleteAnnouncement(announcementId){
    await pool.execute(`DELETE FROM announcements WHERE id = ?`, [announcementId]);
}

export async function UnbanUser(userId){
    await pool.execute(`DELETE FROM ban_list WHERE user_id = ?`, [userId]);

    var role = await GetUserRole(userId);
    if (!role) return;
    if (role === userRoles.mod){
        await SetUserRole(userId, userRoles.verified);
    }
}

export async function DeleteOldSuspensions(){
    let timeStamp = ConvertJSDateToTimestamp(new Date());
    try {
        await pool.execute(`DELETE FROM ban_list WHERE expires_at < ?`, [timeStamp]);
    }
    catch(error){
        console.log(error);
    }
}