//id, ownerId, createdAt, likes are not necessary to add by client when uploading deck
export function Deck(id, ownerId, title, description, cards, stage, createdAt, likes = 0){
    this.id = id;
    this.ownerId = ownerId;
    this.title = title;
    this.description = description; //optional
    this.cards = cards; //should always be 15
    this.stage = stage; //optional, generalist deck = 0
    this.createdAt = createdAt;
    this.likes = likes;
}

//rank = string of name
export function DeckSearchOptions(input, users, cards, stages, minRank, startDate, endDate, sortOption){
    this.input = input;
    this.users = users;
    this.cards = cards;
    this.stages = stages;
    this.minRank = minRank; //string name of rank
    this.startDate = startDate;
    this.endDate = endDate;
    this.sortOption = sortOption; //deckSearchSortingOption
}

export const deckSearchSortingOptions = Object.freeze({ 
    mostLiked: 0, 
    newest: 1,
    oldest: 2,
    updated: 3
});

export const deckSearchPageLimit = 15;
export const deckTitleCharLimit = 32;
export const deckDescriptionCharLimit = 256;
export const usersLimit = 10;
export const cardsLimit = 15;
export const stagesLimit = 15;