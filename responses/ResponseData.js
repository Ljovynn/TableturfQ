export function ResponseData(responseCode, data = null){
    this.code = responseCode;
    this.data = data;
}

export function ResponseSucceeded(responseCode){
    if (responseCode >= 200 && responseCode < 300){
        return true;
    }
    return false;
}

export function SetResponse(res, responseData){
    return res.status(responseData.code).send(responseData.data);
}

export function SetErrorResponse(res, responseData){
    return res.status(responseData.code).send({error: responseData.data});
}