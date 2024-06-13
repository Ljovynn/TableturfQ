import fs from 'node:fs';
import { SanitizeString } from '../utils/string.js';

export const uniqueCards = 266;

//sorted alphabetically for autocomplete purposes
var cards = [];

export async function SetupCards(){
    fs.readFile('cards/cardData.json', 'utf-8', function (err, data) {
        if (err) throw err;
    
        var sortedCards = JSON.parse(data);

        sortedCards.sort((a, b) => a.name.localeCompare(b.name));

        for (let i = 0; i < sortedCards.length; i++){
            cards.push({
                id: sortedCards[i].id,
                name: sortedCards[i].name,
                sanitizedName: SanitizeString(sortedCards[i].name)
            })
        }
    });
}

export function GetCardByName(inputName){
    for (let i = 0; i < cards.length; i++){
        if (SanitizeString(cards[i].name) == SanitizeString(inputName)){
            return cards[i];
        }
    }
}

export function GetCardById(inputId){
    for (let i = 0; i < cards.length; i++){
        if (cards[i].id == inputId){
            return cards[i];
        }
    }
}

export function GetCards(){
    return cards;
}