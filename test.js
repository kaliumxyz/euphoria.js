import test from 'ava';
// import { setInterval } from 'timers';
import { Bot } from './';

const time = new Date();

const config = {
	nick: `${random_nick()} ${time.toUTCString()}`,
	room: 'test'
};

function random_nick() {
	return ['agent Smith', 'Simon', 'Nero', 'Rich Man', 'Lucky', 'Neo', '<><', '><>'][Math.floor(Math.random() * 7)] ;
}

test('can create bot', t => {
	setTimeout(() => t.reject('timed out'), 10000);
	const test = {};
	test.bot = new Bot(config.nick, config.room);
	t.true(test.bot instanceof Bot);
	delete test.bot;
});

//broken
test.skip('can create over 11 connections without memory leak error', async t => {
	setTimeout(() => t.reject('timed out'), 10000);
	const test = [];
	for(let i = 0; i < 12; i++){
		test[i] = new Bot(config.nick, config.room);
	}
	const last = test.pop();
	await new Promise(res => {
		last.once('open', () => {
			res(last)
			t.true(last instanceof Bot);
		});
	});
});

test('can change nick', async t => {
	setTimeout(() => t.reject('timed out'), 10000);
	const test = {};
	test.bot = new Bot(config.nick, config.room);
	const nick = await new Promise(res => {
		test.bot.once('open', () => {
			test.bot.nick = 'nick';
			res(test.bot.nick);
		});
	});
	t.is(nick, 'nick');
	delete test.bot;
});

test('can change room', async t => {
	setTimeout(() => t.reject('timed out'), 10000);
	const bot = new Bot(config.nick, config.room);
	const room = await new Promise(res => {
		bot.once('open', () => {
			bot.once('nick-set', () => {
				res(bot.room);
			});
			bot.room = 'blue';
		});
	});
	t.is(room, 'blue');

});

test('can send', async t => {
	setTimeout(() => t.reject('timed out'), 10000);
	const bot = new Bot(config.nick, config.room);
	await new Promise(res => {
		bot.once('open', () => {
			bot.post('post');
			bot.connection.once('send-reply', () => res());
		});
	});
	t.pass();
});

test('can reply to latest post', async t => {
	setTimeout(() => t.reject('timed out'), 10000);
	const bot = new Bot(config.nick, config.room);
	await new Promise(res => {
		bot.once('open', () => {
			bot.post('post');
			bot.once('send-reply', () => {
				bot.reply('reply');
				res();
			});
		});
	});
	t.pass();
});

test('can get latest posts', async t => {
	setTimeout(() => t.reject('timed out'), 10000);
	const bot = new Bot(config.nick, config.room);
	const log = await new Promise(res => {
		bot.once('ready', () => {
			bot
				.on('posting', () => {
					if (bot.log.pop() === 'post') {
						res(bot.log);
					}
				})
				.post('post');
		});
	});
	t.is(log.pop().content, 'post');
});

test('can get listing', async t => {
	setTimeout(() => t.reject('timed out'), 10000);
	const bot = new Bot('lister', config.room);
	await new Promise(res => {
		bot.once('ready', () => {
			setTimeout( () => {
				res();
			}, 400);
		});
	});
	t.truthy(bot.listing.find(x => x.id === bot.identity));
});

test('can update listing', async t => {
	setTimeout(() => t.reject('timed out'), 10000);
	const bot = new Bot('can update listing', config.room);
	let   target;
	await new Promise(res => {
		bot.once('ready', () => {
			target = new Bot(random_nick(), config.room);
			target.once('ready', () => {
				setTimeout( () => {
					res();
				}, 100);
			});
		});
	});
	t.truthy(bot.listing.find(x => x.id === target.identity));
	await new Promise(res => {
		target.connection.close();
		setTimeout( () => {
			res();
		}, 400);
	});
	t.true(bot.listing.find(x => x.id === target.identity) === void 0);
});

test('can update others nick in listing', async t => {
	setTimeout(() => t.fail('timed out'), 10000);
	const name = '' + Date.now();
	const bot = new Bot('can update listing others nick', config.room);
	let   target;
	await new Promise(res => {
		bot.once('ready', () => {
			target = new Bot('target', config.room);
			target.once('nick-set', () => {
				setTimeout( () => {
					target.once('nick-set', () => {
						setTimeout( () => {
							res();
						}, 100);
					});
					target.nick = name;
				}, 100);
			});
		});
	});
	t.truthy(bot.listing.find(x => x.id === target.identity && x.name === name));
});

test('can update own nick in listing', async t => {
	setTimeout(() => t.fail('timed out'), 10000);
	const name = '' + Date.now();
	const bot = new Bot('can update listing own nick', config.room);
	let   target;
	await new Promise(res => {
		bot.once('nick-set', () => {
			setTimeout( () => {
				bot.once('nick-set', () => {
					res();
				});
				bot.nick = name;
			}, 100);
		});
	});
	t.truthy(bot.listing.find(x => x.id === bot.identity && x.name === name));
});

// bot rules
test.todo('can print long format help');
test.todo('will react to !ping');
test.todo('will react to !ping @name');

test.skip('can print default help', async t => {
	setTimeout(() => t.reject('timed out'), 10000);
	const help = new Bot('short help', config.room);
	await new Promise(res => {
		help.once('open', () => {
			res();
		});
	});
	const helper = new Bot('short help poster', config.room);
	await new Promise(res => {
		helper.once('open', () => {
			helper.connection.once('send-event', () => {
				res();
			});
			help.post('!help');			
		});
	});
	t.pass();
});

test('can be killed', async t => {
	setTimeout(() => t.reject('timed out'), 10000);
	const murderer = new Bot('murderer', config.room);
	await new Promise(res => {
		murderer.once('open', () => {
			res();
		});
	});
	const murderee = new Bot('murderee', config.room);
	await new Promise(res => {
		murderee.once('open', () => {
			murderee.connection.once('close', () => {
				res();
			});
			murderer.post('!kill @murderee');			
		});
	});
	t.pass();
});

test.todo('can reply to multiple posts');
