import { SlashCommandBuilder } from "discord.js";
import { BuildCardEmbed } from "../embedBuilder.js";
import { GetCardById, GetCardByName, GetCardListByLanguage } from "../../cards/cardManager.js";
import { SanitizeString } from "../../utils/string.js";
import { uniqueCards } from "../../cards/cardManager.js";

export const data = new SlashCommandBuilder()
    .setName('jpcard')
    .setDescription('Get any japanese tableturf card')
    .addSubcommand(subCommand => 
        subCommand
            .setName('by_name')
            .setDescription('名前でカードを取得する')
            .addStringOption(option =>
                option.setName('name')
                .setDescription('カード')
                .setRequired(true)
                .setAutocomplete(true)))
    .addSubcommand(subCommand => 
        subCommand
            .setName('by_id')
            .setDescription('IDでカードを手に入れる')
            .addIntegerOption(option =>
                option.setName('id')
                .setDescription('ID')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(uniqueCards)))
export async function autocomplete(interaction){
    const focusedValue = interaction.options.getFocused();
	const choices = GetCardListByLanguage('ja');
    var filteredChoices = [];
    for (let i = 0; i < choices.length; i++){
        if (choices[i].sanitizedName.search(SanitizeString(focusedValue)) != -1) filteredChoices.push(choices[i].name);
    }
    if (filteredChoices.length > 25){
        filteredChoices = filteredChoices.splice(0, 25);
    }
	await interaction.respond(
		filteredChoices.map(choice => ({ name: choice, value: choice })),
	);
}

export async function execute(interaction) { 
    const inputName = interaction.options.getString('name');
    const inputId = interaction.options.getInteger('id');

    var card;
    if (inputName){
        card = GetCardByName(inputName, 'ja');
    } else{
        card = GetCardById(inputId, 'ja');
    }

    await interaction.reply({ embeds: [BuildCardEmbed(card, 4)] });
}