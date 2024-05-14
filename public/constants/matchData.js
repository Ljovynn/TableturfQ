export const stages = Object.freeze({ 
    unpicked: 0,
    mainStreet: 1, 
    thunderPoint: 2, 
    xMarksTheGarden: 3, 
    squareSquared: 4, 
    lakefrontProperty: 5, 
    doubleGemini: 6, 
    riverDrift: 7,
    boxSeats: 8, 
    girderForBattle: 9, 
    maskMansion: 10, 
    stickyThicket: 11, 
    crackerSnap: 12,
    twoLaneSplattop: 13, 
    pedalToTheMedal: 14,
    overTheLine: 15
});

export const matchStatuses = Object.freeze({ 
    stageSelection: 0,
    ingame: 1,
    player1Win: 2, 
    player2Win: 3, 
    verifyingResults: 4,
    dispute: 5
});

export const matchResults = Object.freeze({ 
    noWinner: 0,
    player1Win: 1,
    player2Win: 2,
});

//value = number of wins required
export const setLengths = Object.freeze({ 
    unlimited: 0, 
    bo1: 1,
    bo3: 2,
    bo5: 3,
    bo7: 4
});

export const disputeResolveOptions = Object.freeze({ 
    noChanges: 0, 
    revertLastChange: 1,
    restartMatch: 2,
    cancelMatch: 3,
    player1Win: 4,
    player2Win: 5
});

export function MatchMode(rulesetData, queData){
    this.rulesetData = rulesetData;
    this.queData = queData;
}

//add que variables here
export function QueData(readyTimer){
    this.readyTimer = readyTimer;
}

export function RulesetData(timer, timeAddOnPick, setLength, starterStagesArr, counterPickStagesArr, counterPickBans, DSR, verificationTimer){
    this.timer = timer;
    this.timeAddOnPick = timeAddOnPick;
    this.setLength = setLength;
    this.starterStagesArr = starterStagesArr;
    this.counterPickStagesArr = counterPickStagesArr;
    this.counterPickBans = counterPickBans;
    this.dsr = DSR;
    this.verificationTimer = verificationTimer;
}

const currentRankedStarters = [
    stages.mainStreet, 
    stages.thunderPoint, 
    stages.squareSquared, 
    stages.lakefrontProperty, 
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
    stages.twoLaneSplattop,
    stages.pedalToTheMedal,
    stages.overTheLine
];

const rankedQueData = new QueData(20);
const rankedRulesetData = new RulesetData(300, 15, setLengths.bo5, currentRankedStarters, currentRankedCounterpicks, 3, true, 60)
const rankedMatchMode = new MatchMode(rankedRulesetData, rankedQueData);

const casualQueData = new QueData(0);
const casualRulesetData = new RulesetData(0, 0, setLengths.unlimited, [], [], 0, false, 0)
const casualMatchMode = new MatchMode(casualRulesetData, casualQueData);

export const matchModes = Object.freeze({ 
    casual: casualMatchMode, 
    ranked: rankedMatchMode
});

export function ChatMessage(content, ownerId){
    this.content = content;
    this.ownerId = ownerId;
}

export function Game(){
    this.stage = stages.unpicked;
    this.strikes = [];
    this.winnerId = 0;
}

export function Player(id){
    this.id = id;
    this.hasVerifiedResult = false;
    this.unpickableStagesArr = [];
}

export function Match(id, player1Id, player2Id, matchMode)
{
    this.id = id;
    var startingStatus = matchStatuses.stageSelection;
    if (matchMode.rulesetData.setLength == setLengths.unlimited){
        startingStatus = matchStatuses.ingame;
    }
    this.status = matchStatuses.startingStatus;

    var player1 = new Player(player1Id);
    var player2 = new Player(player2Id);
    this.players = [player1, player2];

    this.mode = matchMode;
    this.gamesArr = [new Game()];
    this.createdAt = Date.now();
    this.chat = [];
}