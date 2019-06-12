import test from 'ava';
// import { setInterval } from 'timers';
import { Bot } from './';

const time = new Date();

const config = {
	nick: `${random_nick()} ${time.toUTCString()}`,
	room: 'test'
};

function random_nick() {
	return ['agent Smith', 'Simon', 'Rich Man', 'Lucky', 'Neo', '<><', '><>'][Math.floor(Math.random() * 7)] ; 
}

test('can create bot', t => {
  const test = {};
  test.bot = new Bot(config.nick, config.room);
	t.true(test.bot instanceof Bot);
  delete test.bot;
});

test.only('can create over 11 connections without memory leak error', t => {
  const test = [];
  for(let i = 0; i < 12; i++){
    test[i] = new Bot(config.nick, config.room);
  }
  const last = test.pop();
		last.once('open', () => {
      t.true(last instanceof Bot);
    });
});

test('can change nick', async t => {
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
			bot.post('post');
			bot.connection.once('send-reply', () => res());
		});
	});
	t.pass();
});

test('can reply', async t => {
	const bot = new Bot(config.nick, config.room);
	await new Promise(res => {
		bot.once('open', () => {
			bot.post('post');
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

// bot rules
test.todo('can print long format help');
test.todo('will react to !ping');
test.todo('will react to !ping @name');

test('can print default help', async t => {
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
