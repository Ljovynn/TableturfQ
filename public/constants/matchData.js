import { stages } from "./stageData.js";

export const poolCode = Object.freeze('TTBQ');
export const turnsBeforeDCLoss = Object.freeze(6);

export const matchStatuses = Object.freeze({ 
    stageSelection: 0,
    ingame: 1,
    dispute: 2,
    player1Win: 3, 
    player2Win: 4,
    noWinner: 5
});

//value = number of wins required
export const setLengths = Object.freeze({ 
    unlimited: 0, 
    bo1: 1,
    bo3: 2,
    bo5: 3,
    bo7: 4
});

export const turnTimer = Object.freeze({
    unlimited: 0,
    s10: 1,
    s20: 2,
    s30: 3,
    s40: 4,
    s50: 5,
    s60: 6,
    s70: 7,
    s80: 8,
    s90: 9,
    s100: 10,
    s110: 11,
    s120: 12
});

export const disputeResolveOptions = Object.freeze({ 
    noChanges: 0, 
    resetCurrentGame: 1,
    restartMatch: 2,
    cancelMatch: 3,
    gameWinPlayer1: 4,
    gameWinPlayer2: 5,
    matchWinPlayer1: 6,
    matchWinPlayer2: 7
});

function Ruleset(setLength, turnTimer, starterStagesArr, counterPickStagesArr, counterPickBans, DSR){
    this.setLength = setLength;
    this.turnTimer = turnTimer;
    this.starterStagesArr = starterStagesArr;
    this.counterPickStagesArr = counterPickStagesArr;
    this.counterPickBans = counterPickBans;
    this.dsr = DSR;
}

const currentRankedStarters = [
    stages.mainStreet, 
    stages.thunderPoint, 
    stages.squareSquared, 
    stages.girderForBattle, 
    stages.riverDrift
];

const currentRankedCounterpicks = [
    stages.mainStreet, 
    stages.thunderPoint,
    stages.xMarksTheGarden,
    stages.squareSquared, 
    stages.lakefrontProperty, 
    stages.doubleGemini,
    stages.riverDrift,
    stages.boxSeats,
    stages.girderForBattle,
    stages.maskMansion,
    stages.stickyThicket,
    stages.crackerSnap,
    stages.pedalToTheMedal,
    stages.overTheLine
];

const rankedRuleset = new Ruleset(setLengths.bo5, turnTimer.s50, currentRankedStarters, currentRankedCounterpicks, 2, true)

const casualRuleset = new Ruleset(setLengths.unlimited, turnTimer.unlimited, [], [], 0, false)

export const rulesets = Object.freeze({ 
    'casual': casualRuleset, 
    'ranked': rankedRuleset
});

export const matchModes = Object.freeze({ 
    casual: 'casual',
    ranked: 'ranked'
});

export function ChatMessage(content, ownerId){
    this.content = content;
    this.ownerId = ownerId;
}

export function Game(){
    this.stage = stages.unpicked;
    this.strikes = [];
    this.winnerId = null;
}

export function Player(id){
    this.id = id;
    this.unpickableStagesArr = [];
    this.gameConfirmed = false;
    this.disputeResolveSent = false;
}

export function Match(id, player1Id, player2Id, matchMode, privateBattle = false, setLength = null)
{
    this.id = id;
    this.status = (rulesets[matchMode].setLength == setLengths.unlimited || setLength == 0) ? matchStatuses.ingame : matchStatuses.stageSelection;

    var player1 = new Player(player1Id);
    var player2 = new Player(player2Id);
    this.players = [player1, player2];

    this.mode = matchMode;
    this.setLength = (setLength) ? setLength : rulesets[matchMode].setLength;

    this.gamesArr = [new Game()];
    this.privateBattle = privateBattle;
    this.createdAt = Date.now();
    this.chat = [];
}