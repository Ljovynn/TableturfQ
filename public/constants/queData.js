function PublicQueData(readyTimer){
    this.readyTimer = readyTimer;
}

const rankedQueData = new PublicQueData(30);
const casualQueData = new PublicQueData(30);

export const PublicQueDatas = Object.freeze({ 
    'casual': casualQueData, 
    'ranked': rankedQueData
});