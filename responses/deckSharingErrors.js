import { ResponseData } from "./ResponseData.js";

export const deckSharingErrors = Object.freeze({ 
    deckWrongFormat: new ResponseData(403, 'Deck submitted incorrectly'),
    notOwnerOfDeck: new ResponseData(403, 'User is not the deck\'s owner'),
    cardAmount: new ResponseData(403, 'Card amount is not 15'),
    noSearchOptions: new ResponseData(403, 'No search options'),
    inputWrongFormat: new ResponseData(403, 'Input submitted incorrectly'),
    stagesWrongFormat: new ResponseData(403, 'Stages submitted incorrectly'),
    usersWrongFormat: new ResponseData(403, 'Users submitted incorrectly'),
    cardsWrongFormat: new ResponseData(403, 'Cards submitted incorrectly'),
    rankWrongFormat: new ResponseData(403, 'Rank submitted incorrectly'),
    startDateWrongFormat: new ResponseData(403, 'Start date submitted incorrectly'),
    endDateWrongFormat: new ResponseData(403, 'End date submitted incorrectly'),
    deckIdWrongFormat: new ResponseData(403, 'Deck ID submitted incorrectly'),
});