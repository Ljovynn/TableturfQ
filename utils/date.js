export function DetailMinute(date){
    var result = date.getUTCFullYear() + '-';

    var month = date.getUTCMonth();
    if (month < 10) result += '0';
    result += month + '-';
    
    var day = date.getUTCDate();
    if (day < 10) result += '0';
    result += day + ' ';
    
    var hour = date.getUTCHours();
    if (hour < 10) result += '0';
    result += hour + ':';

    var minute = date.getUTCMinutes();
    if (minute < 10) result += '0';
    result += minute;
    
    return result;
}