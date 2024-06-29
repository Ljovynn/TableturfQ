import { embedColor } from "./constants.js";

export function BuildSimpleEmbed(title, name, value){
    const embed = {
        color: embedColor,
        title: title,
        fields: [ {
            name: name,
            value: value,
        }],
    };
    return embed;
}