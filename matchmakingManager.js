import { matchModes } from "./public/constants/matchData.js";
import { FindIfPlayerInMatch } from "./matchManager.js";

//add more variables for que stuff idk
function Que(matchMode){
    this.queArr = [];
    this.matchMode = matchMode;
}

var ques = [
    new Que(matchModes.casual),
    new Que(matchModes.ranked)
    ];

export function AddPlayerToQue(playerId, matchMode){
    for (let i = 0; i < ques.length; i++){
        if (ques[i].matchMode == matchMode) return TryAddPlayerToQue(playerId);
    }
    return false;
}

function TryAddPlayerToQue(que, playerId){
    if (que.queArr.includes(playerId)) return false;
    if (FindIfPlayerInMatch(playerId)) return false;

    que.queArr.push(playerId);
    return true;
}

//main matchmaking algorithm. once every X seconds
//X = currently undecided
export function MatchMakingTick(){
    for (let i = 0; i < ques.length; i++){
        QueTick(ques[i]);
    }
}

//algorithm for any singular que
function QueTick(queArr, matchMode){

}