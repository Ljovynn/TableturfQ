import { disputeResolveOptions } from "../public/constants/matchData";
import { stages } from "../public/constants/stageData";

//lowercase, remove special characters
export function SanitizeString(string){
    let result;
    result = string.toLowerCase();
    result = result.replace(/\s|-|\'|\.|#/g, '');
    return result;
}

export function SanitizeDiscordLog(string){
    let result = string.replace(/-/g, '\\-').replace(/_/g, '\\_');
    return result;
}

const badWords = Object.freeze([
    'nigger',
    'fucktard',
    'retard',
    'whore',
]);

export function HasBadWords(string){
    var lowerCaseString = string.toLowerCase();
    if (badWords.some(substring=>lowerCaseString.includes(substring))) return true;
    return false;
}

export function MatchStartChatMessage(){
    var result = 'Match started.';
    return result;
}

//takes stages number id, not actual stage names
export function StrikeStagesChatMessage(username, stagesArray){
    var result = `${username} striked `;
    for (let i = 0; i < stagesArray.length; i++){
        result += stages[stagesArray[i]];
        let addStr = (i == stagesArray.length - 1) ? '.' : ', ';
        result += addStr;
    }
    return result;
}

//also takes stage id
export function ChooseStageChatMessage(username, stage){
    var result = `${username} chose to play on ${stages[stage]}.`;
    return result;
}

export function GameWinChatMessage(winUsername){
    var result = `${winUsername} won the game.`;
    return result;
}

export function MatchWinChatMessage(winUsername){
    var result = `${winUsername} won the match.`;
    return result;
}

export function DisputeChatMessage(){
    var result = 'Match is in dispute.';
    return result;
}

export function ResolveDisputeChatMessage(player1Username, player2Username, resolveOption){
    var result = 'Dispute has been resolved. Resolve option: ';
    switch (resolveOption){
        case disputeResolveOptions.noChanges:
            result += 'no changes.'
            break;
        case disputeResolveOptions.resetCurrentGame:
            result += 'reset current game.'
            break;
        case disputeResolveOptions.restartMatch:
            result += 'restart match.'
            break;
        case disputeResolveOptions.cancelMatch:
            result += 'cancel match.'
            break;
        case disputeResolveOptions.gameWinPlayer1:
            result += `${player1Username} wins the game.`
            break;
        case disputeResolveOptions.gameWinPlayer2:
            result += `${player2Username} wins the game.`
            break;
        case disputeResolveOptions.matchWinPlayer1:
            result += `${player1Username} wins the match.`
            break;
        case disputeResolveOptions.matchWinPlayer2:
            result += `${player2Username} wins the match.`
            break;
        default:
            result += 'no resolve option found (error).'
            break;
    }
    return result;
}