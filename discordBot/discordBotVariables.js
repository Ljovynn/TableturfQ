var DisputeLogChannelId = '793658605541916683';
var DiscordAdminRollId = '929479584087420999';

export function SetDisputeLogChannel(channelId){
    DisputeLogChannelId = channelId.toString();
}

export function GetDisputeLogChannel(){
    return DisputeLogChannelId;
}

export function GetDiscordAdminRollId(){
    return DiscordAdminRollId;
}