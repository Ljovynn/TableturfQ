export function Deck(id, ownerId, title, description, cards, stage, createdAt, likes = 0){
    this.id = id;
    this.ownerId = ownerId;
    this.title = title;
    this.description = description;
    this.cards = cards;
    this.stage = stage;
    this.createdAt = createdAt;
    this.likes = likes;
}

//rank = string of name
export function DeckSearchOptions(input, users, cards, stages, minRank, startDate, endDate, sortOption){
    this.input = input;
    this.users = users;
    this.cards = cards;
    this.stages = stages;
    this.minRank = minRank;
    this.startDate = startDate;
    this.endDate = endDate;
    this.sortOption = sortOption;
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
export const stagesLimit = 15;