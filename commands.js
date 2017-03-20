const db = require('./db')();

const parseOption = vote => Object.assign({}, vote, {
  options: JSON.parse(vote.options),
});

const parseVotes = votes => (Array.isArray(votes)
  ? votes.map(parseOption)
  : votes);

const fail = silent => Promise.resolve(silent ? null : 'Invalid command or not allowed to perform command');

module.exports = ({ channels, users, ims }) => {
  const create = message => !~message.text.indexOf(' || ') || !~message.text.indexOf(' :: ')
  ? fail(true)
  : db.createVote({
    description: message.text.split(' || ', 2)[0],
    created_at: new Date().toUTCString(),
    options: message.text.split(' || ', 2)[1].split(' :: ')
      .reduce((prev, cur, i) => Object.assign(prev, { [i]: { text: cur, votes: 0 } }), {}),
    id_author: message.user,
  })
    .then(r => parseVotes(r));

  const get = message => db.getVote(message.text)
  .then(r => (r.length > 0
    ? parseVotes(r)
    : 'Get poll? What poll? There is no poll! The poll is a lie...'));

  const lock = message => db.getVote(message.text)
  .then(r => (r[0].id_author === message.user
    ? db.lockVote(message.text)
    : fail()));

  const remove = message => db.getVote(message.text)
  .then(r => (r[0].id_author === message.user
    ? db.deleteVote(message.text).return('Poll deleted')
    : fail()));

  const vote = message => db.castVote(message.text.split(' ')[0], message.text.split(' ')[1], message.user)
    .then(r => parseVotes(r));

  const publish = message => {
    return db.getVote(message.text.split(' ', 1)[0])
    .then(r => {
      if (!r.length) return Promise.resolve('The poll you wanted to publish does not exist');

      const channel = !~message.text.indexOf('#')
        ? channels[message.text.split(' ')[1]]
        : message.text.split(' ')[1].split('|')[0].slice(2);

      return Promise.all([r, channel]);
    });
  };

  const help = message => Promise.resolve(`*Pollster Help*
create poll:
\`/msg @pollster create <Poll question> || Option 1 :: Option 2 :: Option 3...\`

get last 10 poll info:
\`/msg @pollster get\`

get specific poll info:
\`/msg @pollster get <pollId>\`

remove your own poll:
\`/msg @pollster remove <pollId>\`

publish a poll to a channel *the bot is in* (don't type the #):
\`/msg @pollster publish <pollId> <channelName>\`
`);

  return {
    create,
    get,
    lock,
    remove,
    vote,
    publish,
    help,
  };
};

