export function CheckUserDefined(req){
    if (!req.session || !req.session.user){
        return false;
    }
    return true;
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