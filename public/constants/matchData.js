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

export const disputeResolveOptions = Object.freeze({ 
    noChanges: 0, 
    revertLastChange: 1,
    restartMatch: 2,
    cancelMatch: 3,
    gameWinPlayer1: 4,
    gameWinPlayer2: 5,
    player1Win: 6,
    player2Win: 7
});

//add que variables here
export function QueData(readyTimer, eloGrowthPerSecond, baseEloRange, maxEloRange, minEloStart, maxEloStart){
    this.readyTimer = readyTimer;
    this.eloGrowthPerSecond = eloGrowthPerSecond;
    this.baseEloRange = baseEloRange;
    this.maxEloRange = maxEloRange;
    this.minEloStart = minEloStart;
    this.maxEloStart = maxEloStart;
}

export function RulesetData(setLength, starterStagesArr, counterPickStagesArr, counterPickBans, DSR){
    this.setLength = setLength;
    this.starterStagesArr = starterStagesArr;
    this.counterPickStagesArr = counterPickStagesArr;
    this.counterPickBans = counterPickBans;
    this.dsr = DSR;
}

export function MatchMode(rulesetData, queData){
    this.rulesetData = rulesetData;
    this.queData = queData;
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

const rankedQueData = new QueData(20, 1, 100, 500, 500, 2500);
const rankedRulesetData = new RulesetData(setLengths.bo5, currentRankedStarters, currentRankedCounterpicks, 3, true)
const rankedMatchMode = new MatchMode(rankedRulesetData, rankedQueData);

const casualQueData = new QueData(0, 7, 300, 2000, 500, 2500);
const casualRulesetData = new RulesetData(setLengths.unlimited, [], [], 0, false)
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
    this.unpickableStagesArr = [];
    this.gameConfirmed = false;
}

export function Match(id, player1Id, player2Id, matchMode)
{
    this.id = id;
    var startingStatus = matchStatuses.stageSelection;
    if (matchMode.rulesetData.setLength == setLengths.unlimited){
        startingStatus = matchStatuses.ingame;
    }
    this.status = startingStatus;

    var player1 = new Player(player1Id);
    var player2 = new Player(player2Id);
    this.players = [player1, player2];

    this.mode = matchMode;
    this.gamesArr = [new Game()];
    this.createdAt = Date.now();
    this.chat = [];
}