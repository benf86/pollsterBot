const config = require('./config');
const knex = require('knex')(config.db);

function getVote (id) {
  return knex('polls')
    .where(id.length > 0 || +id ? { id } : true)
    .orderBy('created_at', 'ASC')
    .limit(10);
}

function createVote ({ description, id_author, options, created_at }) {
  return knex('polls')
    .insert({
      created_at,
      description,
      id_author,
      options: JSON.stringify(options),
    })
    .then(r => getVote(r[0]));
}

function lockVote (id_vote) {
  return knex('polls')
    .where({ id: id_vote })
    .update({ active: false })
    .then(r => getVote(r));
}

function deleteVote (id) {
  return knex('polls')
    .where({ id })
    .del();
}

function castVote (id_poll, choice, user) {
  return getVote(id_poll)
  .then(r => {
    if (r.length === 1) return JSON.parse(r[0].options);
    throw new Error('Vote doesn\'t exist');
  })
  .tap(r => knex('votes')
    .where({ id_voter: user, id_vote: id_poll })
    .then(r => {
      if (r[0]) throw new Error('You have already voted on this issue');
    }))
  .then((options) => {
    if (!options || !options[choice]) throw new Error('That option does not exist');
    options[choice].votes = options[choice].votes + 1;
    return JSON.stringify(options);
  })
  .then(options => options
    ? knex('polls')
      .where({ id: id_poll })
      .update({ options })
    : null)
  .then(r => r
    ? knex('votes').insert({ id_vote: id_poll, id_voter: user })
    : null)
  .then(r => getVote(id_poll))
  .catch(e => e.toString());
}

module.exports = () => ({
  getVote,
  createVote,
  lockVote,
  deleteVote,
  castVote,
});
