function Rank(name, ratingThreshold, imageURL){
    this.name = name;
    this.ratingThreshold = ratingThreshold;
    this.imageURL = imageURL;
}

export const ranks = Object.freeze([
    new Rank('Bronze 1', 0, 'https://leanny.github.io/splat3/images/badge/Badge_NawaBattlerRank_Lv03.png'),
    new Rank('Bronze 2', 1200, 'https://leanny.github.io/splat3/images/badge/Badge_NawaBattlerRank_Lv04.png'),
    new Rank('Bronze 3', 1300, 'https://leanny.github.io/splat3/images/badge/Badge_NawaBattlerRank_Lv05.png'),
    new Rank('Silver 1', 1400, 'https://leanny.github.io/splat3/images/badge/Badge_NawaBattlerRank_Lv06.png'),
    new Rank('Silver 2', 1500, 'https://leanny.github.io/splat3/images/badge/Badge_NawaBattlerRank_Lv07.png'),
    new Rank('Silver 3', 1600, 'https://leanny.github.io/splat3/images/badge/Badge_NawaBattlerRank_Lv08.png'),
    new Rank('Gold 1', 1700, 'https://leanny.github.io/splat3/images/badge/Badge_NawaBattlerRank_Lv09.png'),
    new Rank('Gold 2', 1800, 'https://leanny.github.io/splat3/images/badge/Badge_NawaBattlerRank_Lv10.png'),
    new Rank('Gold 3', 1900, 'https://leanny.github.io/splat3/images/badge/Badge_NawaBattlerRank_Lv11.png'),
    new Rank('Fresh', 2000, 'https://leanny.github.io/splat3/images/badge/Badge_NawaBattlerRank_Lv12.png'),
]);

export function GetRank(rating){
    for (let i = ranks.length - 1; i >= 0; i--){
        if (rating >= ranks[i].ratingThreshold) return ranks[i];  
    }
}