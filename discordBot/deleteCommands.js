import { REST, Routes } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

const rest = new REST().setToken(token);

//rätt: 

//
//

// for guild-based commands
rest.delete(Routes.applicationGuildCommand(clientId, guildId, '1252580281626525809'))
	.then(() => console.log('Successfully deleted guild command'))
	.catch(console.error);

// for global commands
/*rest.delete(Routes.applicationCommand(clientId, 'commandId'))
	.then(() => console.log('Successfully deleted application command'))
	.catch(console.error);*/