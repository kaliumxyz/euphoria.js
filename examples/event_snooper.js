#!/usr/bin/env node
'use strict';
const {Bot} = require('..');

const bot = new Bot('snooper', process.argv[2]);

// log any and all events
bot.connection.on('message', json => {
	console.log(json);
});

