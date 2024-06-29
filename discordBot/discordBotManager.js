import { Client, Collection, Events, GatewayIntentBits } from 'discord.js';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'path';
import { embedColor } from './utils/constants.js';
import { BuildSimpleEmbed } from './utils/embed.js';
import { GetUserData } from '../database.js';

dotenv.config();

const token = process.env.TOKEN;
const logChannelId = process.env.DISPUTE_CHANNEL_ID
const websiteURL = process.env.URL;
const port = process.env.PORT;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

var channel;

client.commands = new Collection();

var folderPath = path.join(__dirname, 'commands');
const commandFolder = fs.readdirSync(folderPath);

var suspiciousActionsList = [];

var disputeMessageId;
var suspiciousActionsMessageId;

for (const file of commandFolder) {
    const filePath = `./commands/${file}`;
	let command = await import (filePath);
	// Set a new item in the Collection with the key as the command name and the value as the exported module
    if ('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command);
	} else {
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}

folderPath = path.join(__dirname, 'guildCommands');
const guildCommandFolder = fs.readdirSync(folderPath);

for (const file of guildCommandFolder) {
    const filePath = `./guildCommands/${file}`;
	let command = await import (filePath);
	// Set a new item in the Collection with the key as the command name and the value as the exported module
    if ('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command);
	} else {
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}

client.once(Events.ClientReady, readyClient => {
	console.log(`Discord bot logged in as ${readyClient.user.tag}`);
	SetLogChannel();
});

async function SetLogChannel(){
	try {
		channel = await client.channels.fetch(logChannelId);

		const suspiciousActionsEmbed = BuildSimpleEmbed('Suspicious actions:', 'No suspicious actions reported yet.', ' ');

		const suspiciousActionsMessage = await channel.send({ embeds: [suspiciousActionsEmbed] });
		suspiciousActionsMessageId = suspiciousActionsMessage.id;

		const disputeEmbed = {
		color: embedColor,
		title: 'Current disputes:',
		fields: [{name: 'There are currently no disputes.', value: ' '}],
		timestamp: new Date().toISOString(),
		};

		const disputeMessage = await channel.send({ embeds: [disputeEmbed] });
		disputeMessageId = disputeMessage.id;

	} catch(error){
		console.log(error);
	}
}

client.on(Events.InteractionCreate, async interaction => {
	if (interaction.isChatInputCommand()){
		const command = interaction.client.commands.get(interaction.commandName);

		if (!command) {
			console.error(`No command matching ${interaction.commandName} was found.`);
			return;
		}

		try {
			await command.execute(interaction);
		} catch (error) {
			console.error(error);
			if (interaction.replied || interaction.deferred) {
				await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
			} else {
				await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
			}
		}
	} else if (interaction.isAutocomplete()){
		const command = interaction.client.commands.get(interaction.commandName);

		if (!command) {
			console.error(`No command matching ${interaction.commandName} was found.`);
			return;
		}

		try {
			await command.autocomplete(interaction);
		} catch (error) {
			console.error(error);
		}
	}
});

export function StartDiscordBot(){
    client.login(token);
}

export async function SendDisputeMessage(matchDisputes, sendNewMessage){
	try {
		if (!channel) return;

		//build embed
		var fields = [];
		var limit = Math.min(matchDisputes.length, 25);

		for (let i = 0; i < limit; i++){
			var field = {
				name: `Match id ${matchDisputes[i].id}`,
				value: `[Link](${websiteURL}/game?matchID=${matchDisputes[i].id})`,
			}
			fields.push(field)
		}
		if (matchDisputes.length == 0) fields.push({name: 'There are currently no disputes.', value: ' '});

		const disputeEmbed = {
		color: embedColor,
		title: 'Current disputes:',
		fields: fields,
		timestamp: new Date().toISOString(),
		};

		const previousMessage = await channel.messages.fetch(disputeMessageId);
		if (previousMessage) await previousMessage.edit({ embeds: [disputeEmbed] });

		if (sendNewMessage){
			const tempMessage = await channel.send('ping');
			await tempMessage.delete();
		}
	} catch (error){
		console.log(error);
	}
}

export function SuspiciousAction(userId, description, timestamp){
    this.userId = userId;
    this.description = description;
    this.timestamp = timestamp;
}

export async function SendNewSuspiciousAction(suspiciousAction){
	suspiciousActionsList.push(suspiciousAction);

	if (suspiciousActionsList > 25) suspiciousActionsList.shift();

	try {
		if (!channel) return;

		//build embed
		var fields = [];

		for (let i = 0; i < suspiciousActionsList.length; i++){
			var user = await GetUserData(suspiciousActionsList[i].userId);
			if (!user) continue;

			var field = {
				name: `User ${user.username}, ID ${user.id} at ${suspiciousActionsList[i].timestamp}:`,
				value: suspiciousActionsList[i].description,
			}
			fields.push(field)
		}

		const suspiciousActionsEmbed = {
		color: embedColor,
		title: 'Suspicious actions:',
		fields: fields,
		};

		const previousMessage = await channel.messages.fetch(suspiciousActionsMessageId);
		if (previousMessage) await previousMessage.edit({ embeds: [suspiciousActionsEmbed] });
	} catch (error){
		console.log(error);
	}
}