const db = require('./db')();

const parseOption = vote => Object.assign({}, vote, {
  options: JSON.parse(vote.options),
});

const parseVotes = votes => (Array.isArray(votes)
  ? votes.map(parseOption)
  : votes);

const fail = () => Promise.resolve('Invalid command or not allowed to perform command');

module.exports = ({ channels, users, ims }) => ({
  create: message => db.createVote({
    description: message.text.split(' || ', 2)[0],
    created_at: new Date().toUTCString(),
    options: message.text.split(' || ', 2)[1].split(' :: ')
      .reduce((prev, cur, i) => Object.assign(prev, { [i]: { text: cur, votes: 0 } }), {}),
    id_author: message.user,
  })
    .then(r => parseVotes(r)),

  get: message => db.getVote(message.text)
  .then(r => (r.length > 0
    ? parseVotes(r)
    : 'Get poll? What poll? There is no poll! The poll is a lie...')),

  lock: message => db.getVote(message.text)
  .then(r => (r[0].id_author === message.user
    ? db.lockVote(message.text)
    : fail())),

  delete: message => db.getVote(message.text)
  .then(r => (r[0].id_author === message.user
    ? db.deleteVote(message.text).return('Poll deleted')
    : fail())),

  vote: message => db.castVote(message.text.split(' ')[0], message.text.split(' ')[1], message.user)
    .then(r => parseVotes(r)),
});

