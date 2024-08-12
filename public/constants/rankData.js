function Rank(name, ratingThreshold, imageURL, emoji){
    this.name = name;
    this.ratingThreshold = ratingThreshold;
    this.imageURL = imageURL;
    this.emoji = emoji;
}

export const unranked = Object.freeze(new Rank('Unranked', 0, 'https://leanny.github.io/splat3/images/badge/Badge_NawaBattlerRank_Lv00.png', ':30:1030204177961455656'));

export const ranks = Object.freeze([
    new Rank('Bronze 1', 0, 'https://leanny.github.io/splat3/images/badge/Badge_NawaBattlerRank_Lv03.png', '<:Bronze1:1272545431431413800>'),
    new Rank('Bronze 2', 1200, 'https://leanny.github.io/splat3/images/badge/Badge_NawaBattlerRank_Lv04.png', '<:Bronze2:1272545488012443749>'),
    new Rank('Bronze 3', 1300, 'https://leanny.github.io/splat3/images/badge/Badge_NawaBattlerRank_Lv05.png', '<:Bronze3:1272545520111452271>'),
    new Rank('Silver 1', 1400, 'https://leanny.github.io/splat3/images/badge/Badge_NawaBattlerRank_Lv06.png', '<:Silver1:1272545527317397504>'),
    new Rank('Silver 2', 1500, 'https://leanny.github.io/splat3/images/badge/Badge_NawaBattlerRank_Lv07.png', '<:Silver2:1272545536087687250>'),
    new Rank('Silver 3', 1600, 'https://leanny.github.io/splat3/images/badge/Badge_NawaBattlerRank_Lv08.png', '<:Silver3:1272545545713618964>'),
    new Rank('Gold 1', 1700, 'https://leanny.github.io/splat3/images/badge/Badge_NawaBattlerRank_Lv09.png', '<:Gold1:1272545553213034506>'),
    new Rank('Gold 2', 1800, 'https://leanny.github.io/splat3/images/badge/Badge_NawaBattlerRank_Lv10.png', '<:Gold2:1272545560204677181>'),
    new Rank('Gold 3', 1900, 'https://leanny.github.io/splat3/images/badge/Badge_NawaBattlerRank_Lv11.png', '<:Gold3:1272545567595036786>'),
    new Rank('Fresh', 2000, 'https://leanny.github.io/splat3/images/badge/Badge_NawaBattlerRank_Lv12.png', '<:Fresh:1272545574943719588>'),
]);

export function GetRank(rating){
    if (!rating) return unranked;
    for (let i = ranks.length - 1; i >= 0; i--){
        if (rating >= ranks[i].ratingThreshold) return ranks[i];  
    }
}