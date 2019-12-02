#!/usr/bin/env node
'use strict';
const { Bot } = require('..');

const bot = new Bot('everyone', 'music');

bot.commands['!help'] = bot._make_reaction(`I'm ${bot.self} created using https://github.com/kaliumxyz/euphoria.js`);
bot.commands[`!help ${bot.self}`] = bot._make_reaction(`I'm ${bot.self} created using https://github.com/kaliumxyz/euphoria.js, unlike normal bots I also respond to a select set of .commands`);
bot.on('post', (data) => {
	console.log(data.bot.parsed);
	if(data.bot.parsed.startsWith('.reply')) {
		let match = data.bot.parsed.match(/\d{1,2}/);
		if(match) {
			const log = bot.tail(match[0]);
			const ids = log.map(x => x.id);
			bot.post('reply', ids);
		}
	} else
	if(data.bot.parsed.match(bot.self)) {
		let everyone = '';
		if(!data.bot.reaction) {
			bot.listing.forEach(session => {
				const regex = new RegExp(/\s/,'g');
				if (session.name)
					everyone += `@${session.name.replace(regex, '')} `;
			});
			bot.post(everyone, data.id);
		}
	}
});