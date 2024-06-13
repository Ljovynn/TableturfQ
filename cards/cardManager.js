import fs from 'node:fs';
import { SanitizeString } from '../utils/string.js';

var cards = [];

export const uniqueCards = 266;

//for autocomplete purposes
var cardNameList = [];

export async function SetupCards(){
    fs.readFile('cards/cardData.json', 'utf-8', function (err, data) {
        if (err) throw err;
    
        cards = JSON.parse(data);

        var sortedCards = cards;
        sortedCards.sort((a, b) => a.name.localeCompare(b.name));

        for (let i = 0; i < sortedCards.length; i++){
            cardNameList.push({
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
    return cards[inputId - 1];
}

export function GetCardNames(){
    return cardNameList;
}