module.exports = {
  infrastructure: {
    port: 8890,
  },
  authentication: {
    bot_token: require('./authorization.json'),
  },
  db: {
    client: 'sqlite3',
    connection: {
      filename: './data/mydb.sqlite',
    },
    migrations: {
      directory: './data/migrations',
    },
    seeds: {
      directory: './data/seeds',
    },
  },
};
