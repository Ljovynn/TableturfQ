import { PublicQueDatas } from "../public/constants/queData.js";

function QueData(readyTimer, eloGrowthPerSecond, baseEloRange, maxEloRange, minEloStart, maxEloStart){
    this.readyTimer = readyTimer;
    this.eloGrowthPerSecond = eloGrowthPerSecond;
    this.baseEloRange = baseEloRange;
    this.maxEloRange = maxEloRange;
    this.minEloStart = minEloStart;
    this.maxEloStart = maxEloStart;
}

const casualQueData = new QueData(PublicQueDatas['casual'].readyTimer, 7, 300, 2000, 800, 2300);

const rankedQueData = new QueData(PublicQueDatas['ranked'].readyTimer, 0.5, 40, 300, 800, 2300);

export const queDatas = Object.freeze({ 
    'casual': casualQueData, 
    'ranked': rankedQueData
});