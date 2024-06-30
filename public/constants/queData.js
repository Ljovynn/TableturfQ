function PublicQueData(readyTimer){
    this.readyTimer = readyTimer;
}

const rankedQueData = new PublicQueData(20);
const casualQueData = new PublicQueData(20);

export const PublicQueDatas = Object.freeze({ 
    'casual': casualQueData, 
    'ranked': rankedQueData
});