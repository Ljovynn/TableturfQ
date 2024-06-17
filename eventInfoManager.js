import { CreateEvent, DeleteEvent, GetFutureEvents } from "./database.js";

const eventLifeAfterDate = 3 * 60 * 60 * 1000;

const upcomingEventCutoff = 7 * 24 * 60 * 60 * 1000;

function Event(id, name, description, iconSrc, date){
    this.id = id;
    this.name = name;
    this.description = description;
    this.iconSrc = iconSrc;
    this.date = date;
}

var events = [];

EventManagerSetup();

async function EventManagerSetup(){
    var futureEventData = await GetFutureEvents();
    for (let i = 0; i < futureEventData.length; i++){
        events.push(new Event(futureEventData[i].id, futureEventData[i].name, futureEventData[i].description, futureEventData[i].icon_src, futureEventData[i].date));
    }
}

export function DeletePastEvents(){
    var cutoffDate = Date.now() + eventLifeAfterDate;
    for (let i = events.length - 1; i >= 0; i--){
        if (events[i].date >= cutoffDate) continue;

        events.splice(0, i + 1);
        break;
    }
}

export function GetNextEventInfo(){
    return events[0];
}

export function GetUpcomingEventInfos(){
    var cutoffDate = Date.now() + upcomingEventCutoff;
    var result = [];
    for (let i = 0; i < events.length; i++){
        if (events[i].date >= cutoffDate) break;

        result.push(events[i]);
    }
    return result;
}

export async function SetNewEvent(name, description, iconSrc, date){
    try {
        var eventId = await CreateEvent(name, description, iconSrc, date);

        var event = new Event(eventId, name, description, iconSrc, date);
        events.push(event);
        events.sort((a, b) => a.date - b.date);

        return eventId;
    } catch(error){
        return error.message;
    }
}

export function CheckIfEventExistsById(eventId){
    return events.some((x) => x.id == eventId);
}

export async function DeleteEventById(eventId){
    for (let i = 0; i < events.length; i++){
        if (events[i].id != eventId) continue;

        await DeleteEvent(eventId);
        events.splice(i, 1);
        return true;
    }
    return false;
}