//lowercase, remove special characters
export function SanitizeString(string){
    let result;
    result = string.toLowerCase();
    result = result.replace(/\s|-|\'|\.|#/g, '');
    return result;
}