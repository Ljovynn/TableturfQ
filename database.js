import mysql from 'mysql2';
import dotenv from 'dotenv';
import session from 'express-session';
import expressMySqlSession from 'express-mysql-session';
import { userRoles } from './public/constants/userData.js';
import { FindPlayerPosInMatch } from './utils/matchUtils.js';
import { settings } from './glicko2Manager.js';
import { chatLoadLimit, matchModes, systemId } from './public/constants/matchData.js';
import { HandleBanUser } from './utils/userUtils.js';
import { leaderboardLimit, userSearchLimit } from './public/constants/searchData.js';

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

//only do this at server startup
export async function GetRecentMatches(cutoff){
    const [rows] = await pool.query(`SELECT id, player1_id, player2_id, ranked, set_length, result, UNIX_TIMESTAMP(created_at) AS unix_created_at FROM matches
        WHERE created_at > SUBDATE(CURRENT_TIMESTAMP, INTERVAL 1 MONTH) AND private_battle = FALSE
	    ORDER BY created_at DESC LIMIT ?`, [cutoff]);
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
    const [rows] = await pool.execute(`SELECT id, username, role, IF(hide_rank, NULL, g2_rating) g2_rating, CAST(discord_id AS CHAR) discord_id,
        discord_username, discord_avatar_hash, country, UNIX_TIMESTAMP(created_at) AS unix_created_at,
        (SELECT COUNT(*) FROM ban_list WHERE user_id = u.id) AS banned FROM users u WHERE id = ?`,
    [userId]);
    return rows[0];
}

export async function GetMultipleUserDatas(userIdlist){
    const [rows] = await pool.query(`SELECT id, username, role, g2_rating, IF(hide_rank, NULL, g2_rating) g2_rating, CAST(discord_id AS CHAR) discord_id,
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

export async function GetUserChatData(userIdlist){
    const [rows] = await pool.query(`SELECT id, username, role, CAST(discord_id AS CHAR) discord_id, discord_username FROM users WHERE id IN (?)`, [userIdlist]);
    return rows;
}

export async function GetUserMatchHistory(userId, hitsPerPage, pageNumber)
{
    var offset = (pageNumber - 1) * hitsPerPage;
    const [rows] = await pool.execute(`SELECT id, player1_id, player2_id, ranked, set_length, result, private_battle, UNIX_TIMESTAMP(created_at) AS unix_created_at FROM matches
        WHERE player1_id = ? AND created_at > SUBDATE(CURRENT_TIMESTAMP, INTERVAL 3 MONTH) AND private_battle = FALSE 
        UNION SELECT id, player1_id, player2_id, ranked, set_length, result, private_battle, UNIX_TIMESTAMP(created_at) AS unix_created_at FROM matches
        WHERE player2_id = ? AND created_at > SUBDATE(CURRENT_TIMESTAMP, INTERVAL 3 MONTH) AND private_battle = FALSE
        ORDER BY unix_created_at DESC LIMIT ? OFFSET ?`, [userId, userId, hitsPerPage.toString(), offset.toString()]);
    return rows;
}

export async function GetUserMatchCount(userId)
{
    const [count] = await pool.execute(`SELECT SUM(total) AS total FROM (SELECT COUNT(*) AS total FROM matches WHERE player1_id = ? AND private_battle = FALSE
        UNION SELECT COUNT(*) AS total FROM matches WHERE player2_id = ? AND private_battle = FALSE) x`, [userId, userId]);
    if (count[0]) return count[0].total;
}

export async function GetUserRankedMatchCount(userId)
{
    const [count] = await pool.execute(`SELECT SUM(total) AS total FROM (SELECT COUNT(*) AS total FROM matches WHERE player1_id = ? AND ranked = TRUE
        UNION SELECT COUNT(*) AS total FROM matches WHERE player2_id = ? AND ranked = TRUE) x`, [userId, userId]);
    if (count[0]) return count[0].total;
}

export async function GetUserRatingHistory(userId, cutoffDate, endCutoffDate = Date.now())
{
    const [rows] = await pool.execute(`SELECT match_ratings.match_id,
        match_ratings.player1_old_rating AS old_rating, match_ratings.player1_new_rating AS new_rating,
        UNIX_TIMESTAMP(matches.created_at) AS unix_date
        FROM match_ratings INNER JOIN matches ON match_ratings.match_id=matches.id
        WHERE matches.player1_id = ? AND matches.created_at > FROM_UNIXTIME(?) AND matches.created_at <=FROM_UNIXTIME(?)
        UNION SELECT match_ratings.match_id,
        match_ratings.player2_old_rating AS old_rating, match_ratings.player2_new_rating AS new_rating,
        UNIX_TIMESTAMP(matches.created_at) AS unix_date
        FROM match_ratings INNER JOIN matches ON match_ratings.match_id=matches.id
		WHERE matches.player2_id = ? AND matches.created_at > FROM_UNIXTIME(?) AND matches.created_at <= FROM_UNIXTIME(?)
        ORDER BY unix_date ASC`,
    [userId, Math.round(cutoffDate / 1000), Math.round(endCutoffDate / 1000), userId, Math.round(cutoffDate / 1000), Math.round(endCutoffDate / 1000)]);
    return rows;
}

export async function GetUserLeaderboardPosition(userId)
{
    const [count] = await pool.execute(`SELECT (SELECT 1 + COUNT(*) AS position FROM users c WHERE c.g2_rating >
        u.g2_rating AND c.hide_rank = FALSE) AS position
        FROM users u WHERE id = ?`, [userId]);
    if (count[0]) return count[0].position;
}

export async function GetMatchGames(matchId){
    const [rows] = await pool.execute(`SELECT id, stage, result FROM games WHERE match_id = ? ORDER BY id`, [matchId]);
    return rows;
}

export async function GetStageStrikes(gameId){
    const [rows] = await pool.execute(`SELECT stage, strike_owner FROM stage_strikes WHERE game_id = ?`, [gameId]);
    return rows;
}

export async function GetChatMessages(matchId, loadedMessagesAmount = 0){
    const [rows] = await pool.execute(`SELECT owner_id, content, UNIX_TIMESTAMP(date) AS unix_date FROM chat_messages WHERE match_id = ? ORDER BY id DESC LIMIT ? OFFSET ?`,
    [matchId, chatLoadLimit.toString(), loadedMessagesAmount.toString()]);
    return rows;
}

export async function GetSession(sessionId){
    const [rows] = await pool.execute(`SELECT * FROM sessions WHERE session_id = ?`, [sessionId]);
    return rows[0];
}

//case insensitive
export async function SearchUser(sanitizedName){
    const [rows] = await pool.execute (`SELECT id, username, IF(hide_rank, NULL, g2_rating) g2_rating, CAST(discord_id AS CHAR) discord_id, discord_username, discord_avatar_hash, country FROM users
        WHERE MATCH (discord_username, username) AGAINST (? IN BOOLEAN MODE) LIMIT ?`, [sanitizedName, userSearchLimit.toString()]);
    return rows;
}

export async function GetLeaderboard(startPosition, limit = leaderboardLimit){
    if (limit > leaderboardLimit) limit = leaderboardLimit;
    const [rows] = await pool.execute (`SELECT id, username, g2_rating, CAST(discord_id AS CHAR) discord_id, discord_username, discord_avatar_hash, country
        FROM users u LEFT JOIN ban_list b ON b.user_id = u.id WHERE hide_rank = FALSE AND b.user_id IS NULL
        ORDER BY g2_rating DESC LIMIT ? OFFSET ?`, [limit.toString(), startPosition.toString()]);
    return rows;
}

export async function GetLeaderboardCount(){
    const [count] = await pool.execute (`SELECT COUNT(*) AS count from users u
        LEFT JOIN ban_list b ON b.user_id = u.id
        WHERE b.user_id IS NULL AND hide_rank = false`);
    if (count[0]) return count[0].count;
}

//todo optimize
export async function GetFutureAnnouncements(){
    const [rows] = await pool.execute(`SELECT title, description, icon_src, UNIX_TIMESTAMP(date) AS unix_date, is_event FROM announcements WHERE date > current_timestamp ORDER BY date ASC`);
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
            chatData[i] = [match.id, ownerId, match.chat[i].content, Math.round(match.chat[i].date / 1000)];
        }

        if (chatData.length == 0) return true;

        const chunkSize = 500;
        for (let i = 0; i < (chatData.length / chunkSize); i++){
            const startingPoint = i * chunkSize;
            const chunkData = chatData.slice(startingPoint, startingPoint + chunkSize);

            const values = Array(chunkData.length).fill('(?, ?, ?, FROM_UNIXTIME(?))').join(', ');
            await pool.query(`INSERT INTO chat_messages (match_id, owner_id, content, date) VALUES ${values}`, chunkData.flatMap(msg => [msg[0], msg[1], msg[2], msg[3]]));
        }
        return true;
    }catch(error){
        console.log(error);
        return false;
    }
}

async function CreateFirstGameStrikes(match){
    var game = match.gamesArr[0];
    var strikePos = FindPlayerPosInMatch(match, game.winnerId);
    const result = await pool.execute(`INSERT INTO games (match_id, stage, result) VALUES (?, ?, ?)`, [match.id, game.stage, strikePos]);

    const gameId = result[0].insertId;

    var data = [];
    for (let i = 0; i < game.strikes.length; i++){
        const strikePos = ((i + 1) % 4 < 2) ? 1 : 2;
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

export async function CreateAnnouncement(title, description, iconSrc, date, isEvent){
    var announcement = await pool.execute(`INSERT INTO announcements (title, description, icon_src, date, is_event) VALUES (?, ?, ?, FROM_UNIXTIME(?), ?)`,
    [title, description, iconSrc, date, isEvent]);
    return announcement[0].insertId;
}

export async function SuspendUser(userId, banLength, reason){
    const unbanDate = Date.now() + banLength;
    await pool.execute(`INSERT INTO ban_list (user_id, expires_at, reason) VALUES (?, FROM_UNIXTIME(?), ?)`, [userId, Math.round(unbanDate / 1000), reason]);
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

export async function UpdateRankDecay(ratingDecay, rdIncrease, timeThreshold, ratingLimit){
    const cutoffDate = Math.round((Date.now() - timeThreshold) / 1000);
    try {
        await pool.execute(`UPDATE users u SET g2_rating = u.g2_rating - ?, g2_rd = u.g2_rd + ? WHERE NOT EXISTS (SELECT id FROM matches m
			WHERE (m.player1_id = u.id) AND m.created_at > FROM_UNIXTIME(?)
            UNION SELECT * FROM matches m
            WHERE (m.player2_id = u.id) AND m.created_at > FROM_UNIXTIME(?))
            AND u.g2_rating > ? AND hide_rank = FALSE`,
        [ratingDecay, rdIncrease, cutoffDate, cutoffDate, ratingLimit]);
    }
    catch(error){
        console.log(error);
    }
}

//delete

export async function DeleteUnfinishedMatches(){
    await pool.query(`DELETE FROM matches WHERE result = 0`);
}

export async function DeleteOldUnverifiedAccounts(ageThreshold){
    const cutoffDate = Date.now() - ageThreshold;
    let convertedDate = Math.round(cutoffDate / 1000);
    try {
        const [rows] = await pool.execute(`SELECT id FROM users WHERE role = ? AND created_at < FROM_UNIXTIME(?)`,
        [userRoles.unverified, convertedDate]);
        for (let i = 0; i < rows.length; i++){
            HandleBanUser(rows[i].id);
        }
        await pool.execute(`DELETE FROM users WHERE role = ? AND created_at < FROM_UNIXTIME(?)`, [userRoles.unverified, convertedDate]);
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
    try {
        await pool.execute(`DELETE FROM ban_list WHERE expires_at < current_timestamp`);
    }
    catch(error){
        console.log(error);
    }
}