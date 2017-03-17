exports.up = function (knex, Promise) {
  return Promise.all([
    knex.schema.createTableIfNotExists('polls', function (table) {
      table.increments('id');
      table.timestamps();
      table.string('description').notNullable();
      table.string('id_author').notNullable();
      table.json('options').default('');
      table.boolean('active').default(false);
    }),
    knex.schema.createTableIfNotExists('votes', function (table) {
      table.increments('id');
      table.timestamps();
      table.string('id_vote').notNullable();
      table.string('id_voter').notNullable();
    }),
  ]);
};

exports.down = function (knex, Promise) {
  return Promise.all([
    knex.schema.dropTable('polls'),
    knex.schema.dropTable('votes'),
  ]);
};
