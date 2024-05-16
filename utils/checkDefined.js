import { matchModes } from "../public/constants/matchData";

export function CheckUserDefined(req, res){
    if (!req.session || !req.session.user){
        res.sendStatus(401);
        return false;
    }
    return true;
}

export function CheckVariableDefined(variable, res){
    if (!variable){
        res.sendStatus(400);
        return false;
    }
    return true;
}

export function CheckIfArray(arr, res){
    if (!Array.isArray(arr)){
        res.sendStatus(400);
        return false;
    }
    return true;
}

export function CheckIfString(str, res){
    if (typeof(str) != "string"){
        res.sendStatus(400);
        return false;
    }
    return true;
}

export function CheckIfRealMatchMode(matchMode, res){
    if (!matchModes.contains(matchMode)){
        res.sendStatus(400);
        return false;
    }
    return true;
}