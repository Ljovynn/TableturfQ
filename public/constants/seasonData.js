function Season(id, startDate, endDate){
    this.id = id;
    this.startDate = startDate;
    this.endDate = endDate;
}

//milliseconds included
export const seasons = Object.freeze([
    new Season(0, 1721488200000, 1724454000000),
    new Season(1, 1726354800000, 1726844400000),
]);

export const currentSeason = seasons[seasons.length - 1];