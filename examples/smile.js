#!/usr/bin/env node
'use strict';
const {Bot} = require('..');

const bot = new Bot(':D', 'test');

let lock = false;

bot.on('send-event', json => {
	if(!json.data.sender.id.includes('bot'))
		if(json.data.content.includes(':D') && !lock) {
			bot.post(':D', json.data.id);
			lock = true;
			setTimeout( () => { lock = false; }, 300);
		} 
});

