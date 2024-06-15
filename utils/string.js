//lowercase, remove special characters
export function SanitizeString(string){
    let result;
    result = string.toLowerCase();
    result = result.replace(/\s|-|\'|\.|#/g, '');
    return result;
}

const badWords = Object.freeze([
    'nigger',
    'fucktard',
    'retard',
    'whore',
]);

export function HasBadWords(string){
    var lowerCaseString = string.toLowerCase();
    if (badWords.some(substring=>lowerCaseString.includes(substring))) return true;
    return false;
}