const Promise = require('bluebird');
const Commands = require('./commands');

const formatIncomingMessage = message => Object.assign({}, message, {
  text: message.text.split(' ').slice(1).join(' '),
});

const formatOutgoingMessage = message => `*${message.description}*\nPoll ID: ${message.id}\nCreated at: ${message.created_at}\nActive: ${Boolean(message.active)}\n` +
Object.keys(message.options).map(e => `>Option ${e}\t=>\t` + message.options[e].text + '\t=>\t' + message.options[e].votes + ' votes').join('\n\n');

const formatOutgoingMessages = messages => (Array.isArray(messages)
  ? messages.reduce((prev, cur) => `${prev}\n\n` + formatOutgoingMessage(cur), '')
  : messages);

const formatOutgoingMessageRaw = message => `\`\`\`${JSON.stringify(message, 0, 2)}\`\`\``;

module.exports = ({ rtm, channels, users, ims, id }) => (message) => {
  const cmds = Commands({ channels, users, ims });
  if (!message || !message.text) return null;
  if (message.user === id) return null;
  if (message.subtype === 'bot_message') return null;


  const command = message.text.split(' ', 1);
  const raw = command[0].slice(command[0].length - 3).toLowerCase() === 'raw';
  if (raw) command[0] = command[0].slice(0, command[0].length - 3);

  return (!!~Object.keys(cmds).indexOf(command[0])
      ? cmds[command[0]](formatIncomingMessage(message))
      : Promise.resolve(null))
    .then(r => (r
      ? rtm.sendMessage(raw ? formatOutgoingMessageRaw(r) : formatOutgoingMessages(r), ims[message.user])
      : null));
};
