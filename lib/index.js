const WebSocket = require('ws');
const handleConnect = require('./handleConnect');

const { Server } = WebSocket;
const PLUGINS_HEADERS = [];
const HEADER_RE = /^x-whistle-/;
const SERVER_INFO = {
  'X-Server': 'whistel.custom-ws',
};

const verifyClient = ({ req }, cb) => {
  const { url, headers } = req.originalReq;
  const protocols = [headers['sec-websocket-protocol'] || ''];
  delete headers['sec-websocket-key'];
  const client = new WebSocket(url, protocols, {
    headers,
    rejectUnauthorized: false,
  });
  let done;
  const checkContinue = (err) => {
    if (done) {
      return;
    }
    done = true;
    if (err) {
      cb(false, 502, err.message, SERVER_INFO);
    } else {
      cb(true);
    }
  };
  client.on('error', checkContinue);
  client.on('open', () => {
    req.wsClient = client;
    checkContinue();
  });
};

exports.server = (server, options) => {
  Object.keys(options).forEach((name) => {
    name = options[name];
    if (HEADER_RE.test(name)) {
      PLUGINS_HEADERS.push(name);
    }
  });
  const wss = new Server({ server, verifyClient });
  wss.on('connection', handleConnect);
};

// exports.uiServer = (server, options) => {};
