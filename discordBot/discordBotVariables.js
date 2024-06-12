var DisputeLogChannelId;

export function SetDisputeLogChannel(channelId){
    DisputeLogChannelId = channelId.toString();
}

export function GetDisputeLogChannel(){
    return DisputeLogChannelId;
}