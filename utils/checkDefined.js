export function CheckUserDefined(req){
    if (!req.session || !req.session.user){
        return true;
    }
    return false;
}

export function CheckIfArray(arr, res){
    if (!arr) {
        return false;
    }
    if (!Array.isArray(arr)){
        return false;
    }
    return true;
}