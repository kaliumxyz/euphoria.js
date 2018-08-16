import test from 'ava';
// import { setInterval } from 'timers';
import { Bot } from './';

const time = new Date()

const config = {
	nick: `${random_nick()} ${time.toUTCString()}`,
	room: 'test'
};

function random_nick() {
	return ['agent smit', 'neo', '<><', '><>'][Math.floor(Math.random() * 4)] ; 
}

test('can create bot', t => {
	t.true(new Bot(config.nick, config.room) instanceof Bot);
});

test('can change nick', async t => {
	const bot = new Bot(config.nick, config.room);
	const nick = await new Promise(res => {
		bot.once('open', () => {
			bot.nick = 'nick';
			res(bot.nick);
		});
	});
	t.is(nick, 'nick');

});

test('can change room', async t => {
	const bot = new Bot(config.nick, config.room);
	const room = await new Promise(res => {
		bot.once('open', () => {
			bot.room = 'blue';
			res(bot.room);
		});
	});
	t.is(room, 'blue');

});

test('can send', async t => {
	const bot = new Bot(config.nick, config.room);
	await new Promise(res => {
		bot.once('open', () => {
			bot.send('post');
			bot.connection.once('send-reply', () => res());
		});
	});
	t.pass();
});

test('can reply', async t => {
	const bot = new Bot(config.nick, config.room);
	await new Promise(res => {
		bot.once('open', () => {
			bot.send('post');
			bot.connection.once('send-event', () => {
				bot.reply('reply');
				res();
			});
		});
	});
	t.pass();
});


test('can get latest posts', async t => {
	const bot = new Bot(config.nick, config.room);
	const log = await new Promise(res => {
		bot.once('ready', () => {
			bot.send('post');
			bot.once('send-event', () => {
				res(bot.log);
			});
		});
	});
	t.is(log.pop().content, 'post');
});

test('can get listing', async t => {
	const bot = new Bot('lister', config.room);
	await new Promise(res => {
		bot.once('join-event', () => {
			setTimeout( () => {
				res();
			}, 200);
		});
	});
	bot.listing.forEach(x => console.log(x.id, bot.identity));
	t.true(bot.listing.find(x => x.id === bot.identity));
});

test('follows bot rules', async t => {
	t.pass();
	const bot = new Bot(config.nick, config.room);
	const nick = await new Promise(res => {
		bot.once('open', () => {
			bot.nick = 'nick';
			res(bot.nick);
		});
	});
	t.is(nick, 'nick');

});
