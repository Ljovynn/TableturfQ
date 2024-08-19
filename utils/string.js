//lowercase, remove special characters
export function SanitizeString(string){
    let result;
    result = string.toLowerCase();
    result = result.replace(/\s|-|\'|\.|#/g, '');
    return result;
}

export function SanitizeDiscordLog(string){
    let result = string.replace(/-/g, '\\-').replace(/_/g, '\\_');
    return result;
}
export function SanitizeFulltextSearch(string){
    string = string.replace(/\@|\+|\*|,|\(|\)|~|%|<|>|-|\'|\.|#/g, '');
    const words = string.split(' ');
    let result = '';
    for (let i = 0; i < words.length; i++){
        if (words[i].length > 0){
            result += ' +' + words[i];
        }
    }
    result += '*';

    //slice unused space in normal string, slice * when empty
    result = result.slice(1);
    return result;
}

const badWords = Object.freeze([
    'nigger',
    'fucktard',
    'retard',
    'whore',
]);

export function HasBadWords(string){
    let lowerCaseString = string.toLowerCase();
    if (badWords.some(substring=>lowerCaseString.includes(substring))) return true;
    return false;
}