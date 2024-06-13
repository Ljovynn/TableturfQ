import { SlashCommandBuilder } from "discord.js";
import { BuildCardEmbed } from "../embedBuilder.js";
import { GetCardById, GetCardByName, GetCardNames } from "../../cards/cardManager.js";
import { SanitizeString } from "../../utils/string.js";
import { uniqueCards } from "../../cards/cardManager.js";

export const data = new SlashCommandBuilder()
    .setName('card')
    .setDescription('Get any tableturf card')
    .addSubcommand(subCommand => 
        subCommand
            .setName('by_name')
            .setDescription('Get a card by name')
            .addStringOption(option =>
                option.setName('name')
                .setDescription('The card')
                .setRequired(true)
                .setAutocomplete(true))
            .addIntegerOption(option =>
                option.setName('level')
                .setDescription('The upgrade level')
                .setMinValue(1)
                .setMaxValue(3)))
    .addSubcommand(subCommand => 
        subCommand
            .setName('by_id')
            .setDescription('Get a card by id')
            .addIntegerOption(option =>
                option.setName('id')
                .setDescription('The id')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(uniqueCards))
            .addIntegerOption(option =>
                option.setName('level')
                .setDescription('The upgrade level')
                .setMinValue(1)
                .setMaxValue(3)))
export async function autocomplete(interaction){
    const focusedValue = interaction.options.getFocused();
	const choices = GetCardNames();
    var filteredChoices = [];
    for (let i = 0; i < choices.length; i++){
        if (SanitizeString(choices[i]).search(SanitizeString(focusedValue)) != -1) filteredChoices.push(choices[i]);
        if (filteredChoices.length > 25) return;
    }
	await interaction.respond(
		filteredChoices.map(choice => ({ name: choice, value: choice })),
	);
}

export async function execute(interaction) { 
    const inputName = interaction.options.getString('name');
    const inputId = interaction.options.getInteger('id');
    const level = interaction.options.getInteger('level') ?? 1;

    var card;
    if (inputName){
        card = GetCardByName(inputName);
    } else{
        card = GetCardById(inputId);
    }

    await interaction.reply({ embeds: [BuildCardEmbed(card, level)] });
}