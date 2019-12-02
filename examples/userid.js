#!/usr/bin/env node
'use strict';
const {Bot} = require('..');

const bot = new Bot('yes', 'xkcd');

bot.on('send-event', json => {
	if(json.data.sender.name === 'Doctor Number Four')
		bot.post('perhaps one might think its not for the best but it really is for the best', json.data.id);
});

