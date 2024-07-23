function Rank(name, ratingThreshold, imageURL, emoji){
    this.name = name;
    this.ratingThreshold = ratingThreshold;
    this.imageURL = imageURL;
    this.emoji = emoji;
}

export const unranked = Object.freeze(new Rank('Unranked', 0, 'https://leanny.github.io/splat3/images/badge/Badge_NawaBattlerRank_Lv00.png', ':30:1030204177961455656'));

export const ranks = Object.freeze([
    new Rank('Bronze 1', 0, 'https://leanny.github.io/splat3/images/badge/Badge_NawaBattlerRank_Lv03.png', ':100:1113312668208595044'),
    new Rank('Bronze 2', 1200, 'https://leanny.github.io/splat3/images/badge/Badge_NawaBattlerRank_Lv04.png', ':200:1113312692229390416'),
    new Rank('Bronze 3', 1300, 'https://leanny.github.io/splat3/images/badge/Badge_NawaBattlerRank_Lv05.png', ':300:1113312714874441778'),
    new Rank('Silver 1', 1400, 'https://leanny.github.io/splat3/images/badge/Badge_NawaBattlerRank_Lv06.png', ':400:1113312763071176765'),
    new Rank('Silver 2', 1500, 'https://leanny.github.io/splat3/images/badge/Badge_NawaBattlerRank_Lv07.png', ':500:1113312784151756841'),
    new Rank('Silver 3', 1600, 'https://leanny.github.io/splat3/images/badge/Badge_NawaBattlerRank_Lv08.png', ':600:1113312831002136658'),
    new Rank('Gold 1', 1700, 'https://leanny.github.io/splat3/images/badge/Badge_NawaBattlerRank_Lv09.png', ':700:1113312864720142466'),
    new Rank('Gold 2', 1800, 'https://leanny.github.io/splat3/images/badge/Badge_NawaBattlerRank_Lv10.png', ':800:1113312886396301403'),
    new Rank('Gold 3', 1900, 'https://leanny.github.io/splat3/images/badge/Badge_NawaBattlerRank_Lv11.png', ':900:1113312908596740178'),
    new Rank('Fresh', 2000, 'https://leanny.github.io/splat3/images/badge/Badge_NawaBattlerRank_Lv12.png', ':999:1113312929136246846'),
]);

export function GetRank(rating){
    if (!rating) return unranked;
    for (let i = ranks.length - 1; i >= 0; i--){
        if (rating >= ranks[i].ratingThreshold) return ranks[i];  
    }
}