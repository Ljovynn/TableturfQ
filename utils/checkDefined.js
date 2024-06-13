import { matchModes } from "../public/constants/matchData.js";

export function CheckUserDefined(req, res){
    if (!req.session || !req.session.user){
        res.sendStatus(401);
        return false;
    }
    return true;
}

export function CheckVariableDefined(variable, res){
    if (!variable){
        console.log('Sending the 400 from CheckVariableDefined');
        res.sendStatus(400);
        return false;
    }
    return true;
}

export function CheckIfArray(arr, res){
    if (!arr) {
        res.sendStatus(400);
        return;
    }
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
    if ( !Object.hasOwn(matchModes, matchMode) ){
        console.log('Sending the 400 from CheckIfRealMatchMode');
        res.sendStatus(400);
        return false;
    }
    return true;
}