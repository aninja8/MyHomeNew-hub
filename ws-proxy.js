'use strict';
const WSClient = require('websocket').client;
const request = require('request');

const client = new WSClient();

client.on('connectFailed', function(err) {
  console.log('err', err.stack || err);
  process.exit(1);
});

client.on('connect', function(connection) {
  connection.on('error', function(err) {
    console.log('WS Conn error', err);
  });

  connection.on('close', function() {
    setTimeout(connect, 1000); // delay reconnect by a second.
  });

  connection.on('message', message => {
    if(message.type === 'utf8') {
      try {
        const data = JSON.parse(message.utf8Data);
        handleMessage(data, resp => connection.send(JSON.stringify(resp)));
      } catch(e) { console.log('message parse failed', e) }
    }
  });
});

let options = {};
process.on('message', message => {
  options = message;
  connect();
});

function connect() {
  if(!options || !options.server || !options.id || !options.secret) {
    console.log('options not received yet from parent!');
    return;
  }
  const {
    server, id, secret
  } = options;
  client.connect(server, 'myhomenew', null, { authorization: `${id}:${secret}`});
}

function handleMessage(data, send) {
  console.log('handling', data);
  request({
    url: `${options.localhost}${data.url}`,
    method: data.method,
    headers: {
      'websocket-proxy-request': options.cpSecret
    },
    body: data.body,
    json: true
  }, function(err, resp, body){
    if(err) {
      console.error('WS Proxy request err', err);
    }
    const status = (resp && resp.statusCode) || 500;
    
    send({
      status,
      body,
      type: resp.headers['content-type'],
      reqId: data.reqId
    })
  })
}
