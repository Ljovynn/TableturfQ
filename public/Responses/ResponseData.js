export function ResponseData(responseCode, data = ''){
    this.responseCode = responseCode;
    this.data = data;
}

export function ResponseSucceeded(responseCode){
    if (responseCode >= 200 && responseCode < 300){
        return true;
    }
    return false;
}