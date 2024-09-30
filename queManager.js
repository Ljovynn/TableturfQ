import { queDatas } from "./constants/queData.js";
import { FindIfPlayerInMatch, MakeNewMatch } from "./matchManager.js";
import { GetUserRankData } from "./database.js";
import { userRoles } from "./public/constants/userData.js";
import { SendEmptySocketMessage, SendSocketMessage } from "./socketManager.js";
import { ResponseData } from "./responses/ResponseData.js";
import { enterQueErrors, readyUpErrors } from "./responses/queErrors.js";
import { matchModes } from "./public/constants/matchData.js";

const readyTimerGracePeriod = 1000 * 3;
const alreadyMatchedPlayersTime = 1000 * 60 * 60 * 4;

function Que(matchMode){
    this.players = [];
    this.matchMode = matchMode;
}

function PlayerInQue(id, baseSearchElo){
    this.id = id;
    this.baseSearchElo = baseSearchElo;
    this.startedQue = Date.now();
    this.eloSearchRange = 0;
}

function MatchmadePlayer(id){
    this.id = id;
    this.ready = false;
}

function MatchedPlayers(player1Id, player2Id, matchMode){
    this.players = [new MatchmadePlayer(player1Id), new MatchmadePlayer(player2Id)];
    this.matchMode = matchMode;
    this.createdAt = Date.now();
}

function RecentlyMatchedPlayers(playerId, opponentId){
    this.playerId = playerId;
    this.opponentId = opponentId;
    this.createdAt = Date.now();
}

var ques = [
    new Que(matchModes.casual),
    new Que(matchModes.ranked)
]

var matchingPlayersList = [];

var queAvailible = (process.env.NODE_ENV === 'production') ? false : true;

export function GetQueAvailible(){return queAvailible}
export function SetQueAvailible(availible){
    queAvailible = availible;
    for (let i = 0; i < ques.length; i++){
        ques[i].players = [];
    }
}

//also uses MathedPlayers function
var recentlyMatchedPlayersList = [];

//ban check is in post
export async function AddPlayerToQue(playerId, matchMode){
    if (!queAvailible) return enterQueErrors.queUnavailible;

    let que = GetQueFromMatchmode(matchMode);
    if (!que) return enterQueErrors.illegalMatchMode;
    
    if (FindIfPlayerInQue(playerId)) return enterQueErrors.inQue;
    if (FindIfPlayerInMatch(playerId)) return enterQueErrors.inMatch; 

    let user = await GetUserRankData(playerId);
    if (!user) return enterQueErrors.noUser;
    if (que.matchMode == matchModes.ranked){
        if (user.role == userRoles.unverified) return enterQueErrors.unverified;
    }

    let matchingPlayers = matchingPlayersList.find(x => x.players[0].id === playerId || x.players[1].id === playerId);
    if (matchingPlayers) return enterQueErrors.inQue;

    let baseSearchElo = Math.max(user.g2_rating, queDatas[que.matchMode].minEloStart);
    baseSearchElo = Math.min(user.g2_rating, queDatas[que.matchMode].maxEloStart);

    que.players.push(new PlayerInQue(playerId, baseSearchElo));
    return new ResponseData(201);
}

//main matchmaking algorithm. once every n seconds
export async function MatchMakingTick(){
    //CheckRecentlyMatchedPlayers();
    
    let newlyMatchedPlayers = [];
    for (let i = 0; i < ques.length; i++){
        let matchedPlayers = await QueTick(ques[i]);
        if (matchedPlayers) newlyMatchedPlayers.push(matchedPlayers);
    }

    //console.log("Matchmaking tick: " + JSON.stringify(ques[0].players));
    //console.log("matched players tick: " + JSON.stringify(matchingPlayersList));
    //console.log("recently matched players tick: " + JSON.stringify(recentlyMatchedPlayersList));

    //set up match
    for (let i = 0; i < newlyMatchedPlayers.length; i++){
        let que = GetQueFromMatchmode(newlyMatchedPlayers[i].matchMode);
        if (queDatas[newlyMatchedPlayers[i].matchMode].readyTimer == 0){
            RemovePlayersFromQue(que.players, newlyMatchedPlayers[i].players[0], newlyMatchedPlayers[i].players[1]);
            let match = MakeNewMatch(newlyMatchedPlayers[i].players[0], newlyMatchedPlayers[i].players[1], newlyMatchedPlayers[i].matchMode);

            let player1Room = "userRoom" + match.players[0].id.toString();
            let player2Room = "userRoom" + match.players[1].id.toString();
            SendSocketMessage(player1Room, "matchReady", match.id);
            SendSocketMessage(player2Room, "matchReady", match.id);
        } else{
            RemovePlayersFromQue(que.players, newlyMatchedPlayers[i].players[0], newlyMatchedPlayers[i].players[1]);
            matchingPlayersList.push(new MatchedPlayers(newlyMatchedPlayers[i].players[0], newlyMatchedPlayers[i].players[1], newlyMatchedPlayers[i].matchMode));

            let player1Room = "userRoom" + newlyMatchedPlayers[i].players[0].toString();
            let player2Room = "userRoom" + newlyMatchedPlayers[i].players[1].toString();
            SendEmptySocketMessage(player1Room, "matchFound");
            SendEmptySocketMessage(player2Room, "matchFound");
        }
    }
}

//algorithm for any singular que
//Finds only one match per tick per que rn
async function QueTick(que){
    //set all players search range
    for (let i = 0; i < que.players.length; i++){
        let secondsPlayerWaited = (Date.now() - que.players[i].startedQue) / 1000;
        que.players[i].eloSearchRange = Math.min(queDatas[que.matchMode].baseEloRange + (secondsPlayerWaited * queDatas[que.matchMode].eloGrowthPerSecond), queDatas[que.matchMode].maxEloRange);
    }

    return FindPlayersToMatch(que);
}

function FindPlayersToMatch(que){
    for (let i = 0; i < que.players.length - 1; i++){
        for (let j = i + 1; j < que.players.length; j++){

            //check if elo search ranges overlap
            if (que.players[i].baseSearchElo - que.players[i].eloSearchRange > que.players[j].baseSearchElo + que.players[j].eloSearchRange) continue;
            if (que.players[j].baseSearchElo - que.players[j].eloSearchRange > que.players[i].baseSearchElo + que.players[i].eloSearchRange) continue;

            //check if players didn't match recently
            let recentlyMatched = recentlyMatchedPlayersList.find(x => x.playerId === que.players[i].id);
            if (recentlyMatched){
                if (recentlyMatched.opponentId == que.players[j].id) continue;
            }
            recentlyMatched = recentlyMatchedPlayersList.find(x => x.playerId === que.players[j].id);
            if (recentlyMatched){
                if (recentlyMatched.opponentId == que.players[i].id) continue;
            }

            let data = {
                players: [que.players[i].id, que.players[j].id],
                matchMode: que.matchMode,
            }
            return data;
        }
    }
    return undefined;
}

//checks if timer has run out for any matchmade players
export function CheckMatchmadePlayers(){
    for (let i = matchingPlayersList.length - 1; i >= 0; i--){
        if (Date.now() - matchingPlayersList[i].createdAt > (queDatas[matchingPlayersList[i].matchMode].readyTimer * 1000) + readyTimerGracePeriod){
            matchingPlayersList.splice(i, 1);
        }
    }
}

//Checks if timer has run out for recently matched players
export function CheckRecentlyMatchedPlayers(){
    if (recentlyMatchedPlayersList[0] && recentlyMatchedPlayersList[0].createdAt <= alreadyMatchedPlayersTime) return;
    for (let i = 1; i < recentlyMatchedPlayersList.length; i++){
        if (Date.now() - recentlyMatchedPlayersList[i].createdAt <= alreadyMatchedPlayersTime){
            recentlyMatchedPlayersList.splice(0, i);
            break;
        } 
    }
}

export function FindIfPlayerInQue(playerId){
    for (let i = 0; i < ques.length; i++){
        for (let j = 0; j < ques[i].players.length; j++){
            if (ques[i].players[j].id == playerId){
                let data = {
                    matchMode: ques[i].matchMode, 
                    timeQueStarted: ques[i].players[j].startedQue
                };
                return data;
            }
        }
    }
    return undefined;
}

export function FindIfPlayerWaitingForReady(playerId){
    let data = {
    matchMode: null,
    ready: false,
    timeWaitingStarted: null,
    }

    for (let i = 0; i < matchingPlayersList.length; i++){
        if (matchingPlayersList[i].players[0].id == playerId){
            data.matchMode = matchingPlayersList[i].matchMode;
            data.ready = matchingPlayersList[i].players[0].ready;
            data.timeWaitingStarted = matchingPlayersList[i].createdAt;
            return data;
        }
        else if (matchingPlayersList[i].players[1].id == playerId){
            data.matchMode = matchingPlayersList[i].matchMode;
            data.ready = matchingPlayersList[i].players[1].ready;
            data.timeWaitingStarted = matchingPlayersList[i].createdAt;
            return data;
        }
    }
    return undefined;
}

//doesnt remove from ready list
export function RemovePlayerFromQue(playerId, matchMode){
    let que = GetQueFromMatchmode(matchMode);
    for (let i = 0; i < que.players.length; i++){
        if (que.players[i].id == playerId){
            que.players.splice(i, 1);
            return true;
        }
    }
    return false;
}

//does remove from ready list
export function RemovePlayerFromAnyQue(playerId){
    for (let i = 0; i < ques.length; i++){
        for (let j = 0; j < ques[i].players.length; j++){
            if (ques[i].players[j].id == playerId){
                ques[i].players.splice(j, 1);
                return true;
            }
        }
    }
    let index = SearchMatchedPlayersList(matchingPlayersList, playerId);
    if (index != -1) matchingPlayersList.splice(index, 1);
    return false;
}

export function AddRecentlyMatchedPlayers(player1Id, player2Id){
    //delete older data
    let index = recentlyMatchedPlayersList.findIndex(x => x.playerId === player1Id);
    if (index != -1) recentlyMatchedPlayersList.splice(index, 1);
    index = recentlyMatchedPlayersList.findIndex(x => x.playerId === player2Id);
    if (index != -1) recentlyMatchedPlayersList.splice(index, 1);

    recentlyMatchedPlayersList.push(new RecentlyMatchedPlayers(player1Id, player2Id));
    recentlyMatchedPlayersList.push(new RecentlyMatchedPlayers(player2Id, player1Id));
}

function RemovePlayersFromQue(playersArr, player1Id, player2Id){
    for (let i = playersArr.length - 1; i >= 0; i--){
        if (playersArr[i].id == player1Id || playersArr[i].id == player2Id) playersArr.splice(i, 1);
    }
}

export async function PlayerSentReady(playerId){
    let index = SearchMatchedPlayersList(matchingPlayersList, playerId);
    if (index == -1) return readyUpErrors.notMatched;
    let playerPos = FindPlayerPositionInMatchedPlayers(matchingPlayersList[index], playerId);
    matchingPlayersList[index].players[playerPos - 1].ready = true;
    let match = await CheckIfBothPlayersReady(index)
    return new ResponseData(201, match);
}

async function CheckIfBothPlayersReady(matchingPlayersListIndex){
    let matchingPlayers = matchingPlayersList[matchingPlayersListIndex];
    if (matchingPlayers.players[0].ready && matchingPlayers.players[1].ready){
        let match = MakeNewMatch(matchingPlayers.players[0].id, matchingPlayers.players[1].id, matchingPlayers.matchMode);
        matchingPlayersList.splice(matchingPlayersListIndex, 1);
        return match;
    }
    return undefined;
}

function FindPlayerPositionInMatchedPlayers(matchedPlayers, playerId){
    if (matchedPlayers.players[0].id == playerId) return 1;
    return 2;
}

function SearchMatchedPlayersList(arr, playerId){
    for (let i = 0; i < arr.length; i++){
        if (arr[i].players[0].id == playerId || arr[i].players[1].id == playerId) return i;
    }
    return -1;
}

function GetQueFromMatchmode(matchMode){
    switch (matchMode){
        case matchModes.casual:
        return ques[0];
        case matchModes.ranked:
        return ques[1];
        default:
        return null;
    }
}