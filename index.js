#!/bin/env node
'use strict';
const Connection = require('euphoria-connection');
const EventEmitter = require('events');
const { v4: uuid } = require('uuid');

// TODO: filters for commands.

class Bot extends EventEmitter {
	constructor(
		nick = '><>',
		room = 'test',
		settings = {
			commands: [], // extra default commands
			disconnect_on_kill: false, // disconnect intead of stopping when killed
			stateless: false, // if a bot is stateless it does not keep track of server side state, rather trusting the information it has, this also disables listing and logging
			reconnect: true, // reconnect on unexpected disconnect
			ping_interval: 5000 // ping the server every ping_interval. Set to 0 to disable.
			log_max: 0 // the maximum size of the log 0 means limitless
		},
		defaults = {
			room: room,
			human: 0,
			host: 'wss://euphoria.io',
			options: { origin: 'https://euphoria.io' },
		}) {

		super();
		this.setMaxListeners(100);
		this.connection = new Connection(defaults.room, defaults.human, defaults.host, defaults.options, json => this._handle_snapshot(json));
		this.connection.setMaxListeners(100);

		// properties
		this._room = defaults.room;
		this._human = defaults.human;
		this._host = defaults.host;
		this._connection_options = defaults.options;
		this._settings = settings;
		this._nick = nick;
		this._reconnect_delay = 5000;
		this._ping_interval = settings.ping_interval || 5000
		this._listing = [];
		this._log = [];
		this._config = {
			regex: false,
			disconnect_on_kill: settings.disconnect_on_kill || false
		};
		this._reconnect = settings.reconnect || true;
		// TODO: create an immutable way to refer to self and make this clear to any user
		this._id = uuid();
		this.self = this._id;

		this.commands = settings.commands || [];
		this.commands['!help'] = this._make_reaction('I\'m a bot created using https://github.com/kaliumxyz/euphoria.js');
		this.commands[`!help ${this._id}`] = this._make_reaction('I\'m a bot created using https://github.com/kaliumxyz/euphoria.js');
		this.commands['!ping'] = this._make_reaction('pong!');
		this.commands[`!kill ${this._id}`] = id => {
			this.post('/me is exiting', id);
			if (!this._config.disconnect_on_kill)
				process.exit(0);
			else
				this.connection.close();
		};
		this.commands[`!ping ${this._id}`] = this._make_reaction('pong!');
		this._add_listeners(this);
		this.connection.once('open', () => {
			this.nick = nick;
            setInterval(_ => this._heartbeat(this.connection), this._ping_interval)
			this.emit('open');
		});

		process.on('beforeExit', () => {
			this._reconnect = false;
			this.connection.close();
		});
	}

	_add_listeners(that) {
		that.connection.on('close', () => {
			if(that._reconnect)
				setTimeout(() => {that.reconnect()}, that._reconnect_delay)
		});

		that.connection.on('error', err => {
			if(that._reconnect)
				this.connection.close();
            else
				process.exit(1);
		});

		that.connection.on('send-reply', json => {
			that.emit('send-reply', json);
		});

		that.connection.on('send-event', json => {
			that._handle_send_event(json);
		});

		that.connection.on('nick-event', json => {
			that._handle_nick_event(json);
		});

		that.connection.on('hello-event', json => {
			that._handle_hello_event(json);
		});

		that.connection.on('join-event', json => {
			that._handle_join_event(json);
		});

		that.connection.on('part-event', json => {
			that._handle_part_event(json);
		});

		that.connection.on('ping-reply', json => {
			that.emit('ping-reply', json);
		});
	}

	/**
	 *
	 * sends public message with ${content} and optionally as a reply to ${parent}. But async
	 * @param {*} content
	 * @param {*} parent
	 */
	post_async(content, parent) {

		return new Promise((resolve, reject) => {
			const parsed = content.replace(this.self, `@${this._nick}`);
			if (Array.isArray(parent)) {
				parent.forEach(parent => {
					this.emit('posting', {content: parsed,bot: {unparsed: content}, parent: parent});
					this.connection.post(parsed, parent);
				});
			} else {
				this.emit('posting', {content: parsed,bot: {unparsed: content}, parent: parent});
				this.connection.post(parsed, parent);
			}

			this.once('send-reply', json => resolve(json.data));
		});
	}

	/**
	 *
	 * sends public message with ${content} and optionally as a reply to ${parent}
	 * @param {*} content
	 * @param {*} parent
	 */
	post(content, parent) {
		const parsed = content.replace(this.self, `@${this._nick}`);
		if (Array.isArray(parent)) {
			parent.forEach(parent => {
				this.emit('posting', {content: parsed, bot: {unparsed: content}, parent: parent});
				this.connection.post(parsed, parent);
			});
		} else {
			this.emit('posting', {content: parsed, bot: {unparsed: content}, parent: parent});
			this.connection.post(parsed, parent);
		}

		return this;
	}

	/* reply to the last post or post of id
	 *
	 */
	reply(content){
		this.post(content, this.log[ this.log.length - 1 ].id);

		return this;
	}

	_make_reaction(message) {
		return id => this.post(message, id);
	}

	/**
	 * add a comand, returns the index of the command
	 * TODO: add real command object that is returned, which has features to allow for mutating the command.
	 * TODO: add the ability to define commands using templates
	 * @param {*} command
	 * @param {*} reaction
	 */
	add_command(command, reaction) {
		// check if command is a string or regular expression.
		if (reaction === void(0))
			throw new Error('reaction is Undefined');
		if (typeof command === 'string' || command.test) {
			const command_index = uuid();
			switch(typeof reaction) {
			case 'string':
				this.commands[command_index] = this._make_reaction(reaction);
				break;
			case 'function':
				this.commands[command_index] = reaction;
				break;
			default:
				this.commands[command_index] = this._make_reaction(reaction.toString());
				break;
			}
			return command_index;
		}
		throw new Error('Command is not of type String or has property .test');
	}

	_handle_send_event(json) {
		const data = json.data;

		  if (!this._settings.stateless) {
          if (this._settings.log_max && this._settings.log_max !== 0 && this._settings.log_max < this._log.length) {
              this._log.pop();
          }
			    this._log.push(data);
      } else { // just keep one item in log for reply to work
          this._log.pop();
			    this._log.push(data);
      }
		// any functionality must come AFTER pushing to log, in case the log is needed

		// replace the nick with its ID in the context of the commands.
		const content = data.content.replace(`@${this._stripped_nick}`, this._id);
		const reaction = this.commands[content];
		if(reaction)
			reaction(data.id);

		// we want to allow things further up the chain to know if there already has been a reaction, and access the modified content
		const bot = {
			reaction: reaction,
			parsed: content
		};

		json.bot = bot;
		data.bot = bot;

		this.emit('send-event', json);
		this.emit('post', data);
	}

	_handle_hello_event(json) {
		const data = json.data;
		if (!this._settings.stateless)
			this._listing.push(data.session);
		this.emit('hello-event', json);
	}

	_handle_join_event(json) {
		const data = json.data;
		if (!this._settings.stateless)
			this._listing.push(data);
		this.emit('join-event', json);
	}

	_handle_part_event(json) {
		const data = json.data;
		if (!this._settings.stateless)
			this._listing.splice(this._listing.findIndex(item => item.id === data.id), 1);
		this.emit('part-event', json);
	}

	_handle_nick_event(json) {
		const data = json.data;
		if (!this._settings.stateless) {
            const index = this._listing.findIndex(item => item.session_id === data.session_id)
            if (this._listing[index]) {
				this._listing[index].name = data.nick;
            }
        }

		this.emit('nick-event', json);
	}

	_handle_snapshot(json) {
		const data = json.data;
		this._identity = data.identity;
		this._session_id = data.session_id;
		this._version = data.version;
		if (!this._settings.stateless) {
			this._listing = this._listing.concat(data.listing);
			this._log = data.log;
        }
		this.emit('ready');
	}

    _heartbeat(connection) {
        const timestamp = Date.now();
        connection.ping(timestamp, data => {
            const time = timestamp;
            if (data && data.data && data.data.time && data.data.time === time) {
                // server is still alive
            } else {
                // server died. We close the connection and start reconnecting or if
                // reconnecting is disabled, we exit.
                connection.reconnect();
            }
        });
    }



	reconnect() {
		this.emit('reconnecting');
		this.connection = new Connection(this.room, this.human, this.host, this.connection_options);
		this._add_listeners(this);
		this.connection.once('open', () => {
			this.nick = this.nick;
			this.emit('reconnected');
		});

		return this;
	}

	set nick(nick) {
		if (!nick) {
            return
		}
		this.connection.nick(nick);
		this._nick = nick;
        // priate nick without spaces to be compatible with euphoria completion / calling
		this._stripped_nick = nick?nick.split(' ').join(''):nick;
		this.connection.once('nick-reply', json => {
			const data = json.data;
			if (!this._settings.stateless) {
                nick = data.to
				this._nick = nick;
				this._stripped_nick = nick?nick.split(' ').join(''):nick;
				const index = this._listing.findIndex(item => item.session_id === data.session_id)
				if (this._listing[index]) {
					this._listing[index].name = nick;
				}
			}
				this.emit('nick-set', data.to);
		});
	}

	get nick() {
		return this._nick;
	}

	get users() {
		return this._users;
	}

	set room(room) {
		const rec = this._reconnect;
		this._reconnect = false;
		this.connection.close();
		this.connection = new Connection(room, this.human, this.host, this.connection_options);
		this._room = room;
		this.connection.once('open', () => {
			//TODO save the listeners
			this._reconnect = rec;
			this._room = room;
			this.nick = this.nick;
			this.emit('reconnected');
		});
	}

	get room() {
		return this._room;
	}

	get human() {
		return this._human;
	}

	get connection_options() {
		return this._connection_options;
	}

	get host() {
		return this._host;
	}

	/**
	 * return the first n from the log
	 * @param {Number} n
	 */
	head(n) {
		// slice creates a copy.
		return this._log.slice(0, n);
	}

	/**
	 * return the last n from the log
	 * @param {Number} n
	 */
	tail(n) {
		// slice creates a copy.
		return this._log.slice(this._log.length - n);
	}

	get log() {
		// slice creates a copy.
		return this._log.slice(0);
	}

	get version() {
		return this._version;
	}

	get listing() {
		// slice creates a copy.
		return this._listing.slice(0);
	}

	get identity() {
		return this._identity;
	}
}

/* TODO: create factories for replies (e.g., make_reply, make_reply_html_get).
 * remove the current outside of the Bot constructor to prevent it from getting too bloated.
 */

module.exports = {Bot};
