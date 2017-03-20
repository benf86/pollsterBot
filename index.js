'use strict';

const config = require('./config');

const RtmClient = require('@slack/client').RtmClient;
const CLIENT_EVENTS = require('@slack/client').CLIENT_EVENTS;
const RTM_EVENTS = require('@slack/client').RTM_EVENTS;
const MsgHandler = require('./msgHandler');

const botToken = process.env.SLACK_BOT_TOKEN || config.authentication.bot_token;

const rtm = new RtmClient(botToken);


rtm.on(CLIENT_EVENTS.RTM.AUTHENTICATED, function (rtmStartData) {
  rtm.removeAllListeners(RTM_EVENTS.MESSAGE);

  const channels = rtmStartData.channels.concat(rtmStartData.groups).reduce((prev, cur) =>
    Object.assign(prev, { [cur.name]: cur.id, [cur.id]: cur.name }), {});

  const users = rtmStartData.users.reduce((prev, cur) =>
    Object.assign(prev, { [cur.name]: cur.id, [cur.id]: cur.name }), {});

  const ims = rtmStartData.ims.reduce((prev, cur) =>
    Object.assign(prev, { [cur.id]: cur.user, [cur.user]: cur.id }), {});

  const id = rtmStartData.self.id;

  const msgHandler = MsgHandler({ rtm, channels, users, ims, id });

  rtm.on(RTM_EVENTS.MESSAGE, msgHandler);
});

process.on('SIGINT', function () {
  rtm.disconnect();
  process.exit();
});


rtm.start();
