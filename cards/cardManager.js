import fs from 'node:fs';
import { SanitizeString } from '../utils/string.js';

export const uniqueCards = 266;

//sorted alphabetically for autocomplete purposes
var enCards = [];

//sorted alphabetically too
var jpCards = [];

SetupCards();

async function SetupCards(){
    fs.readFile('cards/cardData.json', 'utf-8', function (err, data) {
        if (err) throw err;
    
        console.log("setting up cards");
        var sortedCards = JSON.parse(data);

        sortedCards.sort((a, b) => a.name.localeCompare(b.name));

        for (let i = 0; i < sortedCards.length; i++){
            enCards.push({
                id: sortedCards[i].id,
                name: sortedCards[i].name,
                sanitizedName: SanitizeString(sortedCards[i].name)
            })
        }

        sortedCards.sort((a, b) => a.jpName.localeCompare(b.jpName, 'ja'));

        for (let i = 0; i < sortedCards.length; i++){
            jpCards.push({
                id: sortedCards[i].id,
                name: sortedCards[i].jpName,
                sanitizedName: SanitizeString(sortedCards[i].jpName)
            })
        }
    });
}

export function GetCardByName(inputName, language){
    var cards = GetCardListByLanguage(language);
    for (let i = 0; i < cards.length; i++){
        if (SanitizeString(cards[i].name) == SanitizeString(inputName)){
            return cards[i];
        }
    }
}

export function GetCardById(inputId, language){
    var cards = GetCardListByLanguage(language);
    for (let i = 0; i < cards.length; i++){
        if (cards[i].id == inputId){
            return cards[i];
        }
    }
}

export function GetCardListByLanguage(language){
    switch (language){
    case 'ja':
        return jpCards;
    default:
        return enCards;
    }
}