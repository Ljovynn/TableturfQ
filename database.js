const mysql = require("mysql2");

const dotenv = require("dotenv");

dotenv.config();

const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
}).promise()

async function GetMatch(matchId){
    const [rows] = await pool.query(`SELECT *, SUBSTRING(DATE_FORMAT(\`created_at\`, '%Y-%m-%d %T.%f'),1,21) as formatted_created_at FROM matches WHERE id = ?`, [matchId]);
    return rows[0];
}

async function GetPlayer(playerId){
    const [rows] = await pool.query(`SELECT * FROM players WHERE id = ?`, [playerId]);
    return rows[0];
}

async function GetPlayerMatchHistory(playerId)
{
    const [rows] = await pool.query(`SELECT * FROM matches WHERE player1_id = ? OR player2_id = ? ORDER BY id DESC`, [playerId, playerId]);
    return rows;
}

async function GetPlayerMatchCount(playerId)
{
    const [count] = await pool.query(`SELECT COUNT(*) AS matchCount FROM matches WHERE player1_id = ? OR player2_id = ?`, [playerId, playerId]);
    return count[0].matchCount;
}

async function GetMatchGames(matchId){
    const [rows] = await pool.query(`SELECT * FROM games WHERE match_id = ? ORDER BY game_number`, [matchId])
    return rows;
}

async function GetStageStrikes(gameId){
    const [rows] = await pool.query(`SELECT * FROM stage_strikes WHERE game_id = ?`, [gameId])
    return rows;
}

async function GetRulesetStages(rulesetId){
    const [rows] = await pool.query(`SELECT * FROM ruleset_stages WHERE ruleset_id = ?`, [rulesetId])
    return rows;
}

async function GetRulesetStarterStages(rulesetId){
    const [rows] = await pool.query(`SELECT * FROM ruleset_stages WHERE ruleset_id = ? AND starter = true`, [rulesetId])
    return rows;
}

async function GetChatMessages(matchId){
    const [rows] = await pool.query(`SELECT * FROM chat_messages WHERE match_id = ? ORDER BY message_number`, [matchId])
    return rows;
}

async function CreateMatch(player1Id, player2Id, matchType, rulesetId)
{
    const result = await pool.query(`INSERT INTO matches (player1_id, player2_id, match_type, ruleset_id) VALUES (?, ?, ?, ?)`, [player1Id, player2Id, matchType, rulesetId])
    return JSON.stringify(result[0].insertId);
}

async function CreatePlayer(username)
{
    await pool.query(`INSERT INTO players (username) VALUES (?)`, [username]);
}

async function CreateGame(matchId, gameNumber, stage)
{
    await pool.query(`INSERT INTO games (match_id, game_number, stage) VALUES (?, ?, ?)`, [matchId, gameNumber, stage]);
    return JSON.stringify(result[0].insertId);
}

async function CreateStageStrike(gameId, stage, strikeOwner)
{
    await pool.query(`INSERT INTO games (game_id, stage, strike_owner) VALUES (?, ?, ?)`, [gameId, stage, strikeOwner]);
}

async function CreateChatMessage(matchId, messageNumber, messageOwner, content)
{
    await pool.query(`INSERT INTO games (match_id, message_number, message_owner, content) VALUES (?, ?, ?, ?)`, [matchId, messageNumber, messageOwner, content]);
}