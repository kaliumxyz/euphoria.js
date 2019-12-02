#!/usr/bin/env node
'use strict';
const {Bot} = require('..');

const bot = new Bot('monitor', 'test');

bot.connection.on('part-event', json => {
	if(json.data.name.match('words')) {
		let i = 20;
		while (--i) {
			// eslint-disable-next-line no-console
			console.log('bot down! \u0007');
		}
	}
});
