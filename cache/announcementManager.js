import { CreateAnnouncement, DeleteAnnouncement, GetFutureAnnouncements } from "../database.js";

const announcementLifeAfterDate = 3 * 60 * 60 * 1000;

const upcomingAnnouncementCutoff = 7 * 24 * 60 * 60 * 1000;

function Announcement(id, title, description, iconSrc, date, isEvent){
    this.id = id;
    this.title = title;
    this.description = description;
    this.iconSrc = iconSrc;
    this.date = date;
    this.isEvent = isEvent;
}

var announcements = [];

export async function AnnouncementManagerSetup(){
    try {
        let data = await GetFutureAnnouncements();
        if (!data) return;
        for (let i = 0; i < data.length; i++){
            announcements.push(new Announcement(data[i].id, data[i].title, data[i].description, data[i].icon_src, data[i].unix_date, data[i].is_event));
        }
    } catch (error){
        console.log(error);
    }
}

export function DeletePastAnnouncements(){
    let cutoffDate = (Date.now() - announcementLifeAfterDate) / 1000;
    for (let i = announcements.length - 1; i >= 0; i--){
        if (announcements[i].date >= cutoffDate) continue;

        announcements.splice(0, i + 1);
        break;
    }
}

export function GetNextAnnouncementInfo(){
    return announcements[0];
}

export function GetUpcomingAnnouncementInfos(){
    let cutoffDate = (Date.now() + upcomingAnnouncementCutoff) / 1000;
    let result = [];
    for (let i = 0; i < announcements.length; i++){
        if (announcements[i].date >= cutoffDate) break;

        result.push(announcements[i]);
    }
    return result;
}

export async function SetNewAnnouncement(title, description, iconSrc, date, isEvent){
    try {
        let announcementId = await CreateAnnouncement(title, description, iconSrc, date, isEvent);

        let announcement = new Announcement(announcementId, title, description, iconSrc, date, isEvent);
        announcements.push(announcement);
        announcements.sort((a, b) => a.date - b.date);

        return announcementId;
    } catch(error){
        return error.message;
    }
}

export function CheckIfAnnouncementExistsById(announcementId){
    return announcements.some((x) => x.id == announcementId);
}

export async function DeleteAnnouncementById(announcementId){
    try{
        for (let i = 0; i < announcements.length; i++){
            if (announcements[i].id != announcementId) continue;
            await DeleteAnnouncement(announcementId);
            announcements.splice(i, 1);
            return true;
        }
        return false;
    }catch(error){
        return error.message;
    }
}