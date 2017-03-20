const Promise = require('bluebird');
const Commands = require('./commands');

const formatIncomingMessage = message => Object.assign({}, message, {
  text: message.text.split(' ').slice(1).join(' '),
});

const formatOutgoingMessage = message =>
  `*${message.description}*\nPoll ID: ${message.id}\nCreated at: ${message.created_at}\nActive: ${Boolean(message.active)}\n` +
  [message.options]
  .map(e => typeof e === 'string'
    ? JSON.parse(message.options)
    : message.options)
  .map(opts => Object.keys(opts)
    .map(e => `>Option ${e}\t=>\t${opts[+e].text}\t=>\t${opts[+e].votes} votes`)
    .join('\n\n'))[0];

const formatOutgoingMessages = messages => (Array.isArray(messages)
  ? messages.reduce((prev, cur) => `${prev}\n\n` + formatOutgoingMessage(cur), '')
  : messages);

const formatOutgoingMessageRaw = message => `\`\`\`${JSON.stringify(message, 0, 2)}\`\`\``;

module.exports = ({ rtm, channels, users, ims, id }) => (message) => {
  if (channels[message.channel]) return null;
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
    .then(r => (r && !Array.isArray(r[0])
      ? rtm.sendMessage(raw
        ? formatOutgoingMessageRaw(r)
        : formatOutgoingMessages(r),
        ims[message.user])
      : r && Array.isArray(r[0])
        ? rtm.sendMessage(raw
          ? formatOutgoingMessageRaw(r[0])
          : formatOutgoingMessages(r[0]),
          r[1] || ims[message.user])
        : null))
    .catch(e => {
      console.error(message.text, e);
    });
};
