#!/usr/bin/env node
'use strict';
const { Bot } = require('..');

const bot = new Bot('everyone', 'test');

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
    } else {
      bot.post_async('okay', data.id).then( json => {
        bot.post_async('i', json.id).then( json => {
          bot.post_async('will', json.id).then( json => {
            bot.post_async('reply', json.id)
          })
        })
      })
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

// const bots = [];
// let i = 5;

// while (--i) {
// 	let n = i;
// 	const bot = new Bot('keeper' + n, 'xkcd', {reconnect: false});
// 	bot.connection.once('ready', function () {
// 		// console.log('ready ' + n);
// 		if (n === bots.length) {
// 			process.exit();
// 		}
// 	});
// 	bots.push(bot);
// }
// bot2.connection.once('ready', () => {
// 	console.log('ready 1');
// 	if (lock) {
// 		lock = false;
// 		return;
// 	}
// 	process.exit();
// });
// bot.on('send-event', json => {
// 	if(json.data.sender.name === 'L')
// 		bot.post('get back to work for the cause', json.data.id);
// });

