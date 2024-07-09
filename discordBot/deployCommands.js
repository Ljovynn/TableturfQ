//call Deploy() at runtime to deploy commands (calling at start wont work due to circular dependancy)

import { REST, Routes } from 'discord.js';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'path';

dotenv.config();

const token = process.env.TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const commands = [];
const guildCommands = [];

export async function Deploy(){
	var folderPath = path.join(__dirname, 'commands');
	var commandFolder = fs.readdirSync(folderPath);

	for (const file of commandFolder) {
		const filePath = `./commands/${file}`;
		console.log(filePath);
		let command = await import (filePath);
		// Set a new item in the Collection with the key as the command name and the value as the exported module
		if ('data' in command && 'execute' in command) {
			commands.push(command.data.toJSON());
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
	
	folderPath = path.join(__dirname, 'guildCommands');
	commandFolder = fs.readdirSync(folderPath);
	
	
	for (const file of commandFolder) {
		const filePath = `./guildCommands/${file}`;
		console.log(filePath);
		let command = await import (filePath);
		// Set a new item in the Collection with the key as the command name and the value as the exported module
		if ('data' in command && 'execute' in command) {
			guildCommands.push(command.data.toJSON());
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
	
	const rest = new REST().setToken(token);
	
	(async () => {
		try {
			console.log(`Started refreshing ${commands.length} application (/) commands and ${guildCommands.length} application (/) guild commands.`);
	
			// The put method is used to fully refresh all commands in the guild with the current set
			const globalData = await rest.put(
				Routes.applicationCommands(clientId),
				{ body: commands },
			);
			const guildData = await rest.put(
				Routes.applicationGuildCommands(clientId, guildId),
				{ body: guildCommands },
			);
	
			console.log(`Successfully reloaded ${globalData.length} application (/) commands and ${guildData.length} application (/) guild commands.`);
		} catch (error) {
			console.error(error);
		}
	})();
}