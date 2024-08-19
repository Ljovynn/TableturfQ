function Season(id, startDate, endDate){
    this.id = id;
    this.startDate = startDate;
    this.endDate = endDate;
}

export const seasons = Object.freeze([
    new Season(0, 1721488200000, 1735661400000),
]);

export const currentSeason = seasons[seasons.length - 1];