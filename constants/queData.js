import { PublicQueDatas } from "../public/constants/queData.js";

function QueData(readyTimer, eloGrowthPerSecond, baseEloRange, maxEloRange, minEloStart, maxEloStart){
    this.readyTimer = readyTimer;
    this.eloGrowthPerSecond = eloGrowthPerSecond;
    this.baseEloRange = baseEloRange;
    this.maxEloRange = maxEloRange;
    this.minEloStart = minEloStart;
    this.maxEloStart = maxEloStart;
}

const casualQueData = new QueData(PublicQueDatas['casual'].readyTimer, 7, 300, 2000, 500, 2500);

const rankedQueData = new QueData(PublicQueDatas['ranked'].readyTimer, 1, 60, 350, 500, 2500);

export const queDatas = Object.freeze({ 
    'casual': casualQueData, 
    'ranked': rankedQueData
});