
const noop = _ => _;

module.exports = (ws, req) => {
  const { wsClient } = req;
  ws.on('error', noop);
  ws.on('error', noop);
  // state 为 空、pause、ignore三种状态
  // 分别表示正常发送、暂停发送（接收）请求
  // 或不暂停但忽略当前请求
  req.on('sendStateChange', (/* curState, prevState */) => {
    if (req.curSendState === 'pause') {
      ws._socket.pause();
    } else {
      ws._socket.resume();
    }
  });
  req.on('receiveStateChange', (/* curState, prevState */) => {
    if (req.curReceiveState === 'pause') {
      wsClient._socket.pause();
    } else {
      wsClient._socket.resume();
    }
  });
  // 监听Network/Frames/Composer构造的发送到服务端的数据
  // data 统一为Buffer对象
  req.on('sendToServer', (data) => {
    // 这种数据不管什么状态都要发送出去
    req.emit('clientFrame', `Client: ${data}`);
    wsClient.send(data);
  });
  // 监听Network/Frames/Composer构造的发送到客户端的数据
  // data 统一为Buffer对象
  req.on('sendToClient', (data) => {
    // 这种数据不管什么状态都要发送出去
    req.emit('serverFrame', `Server: ${data}`);
    ws.send(data);
  });

  ws.on('message', (data) => {
    // 在Network/Frames显示客户端发送的数据包
    // 支持emit：buffer、字符串、数字、对象等等各种类型
    const ignore = req.curSendState === 'ignore';
    req.emit('clientFrame', `Client: ${data}`, ignore);
    if (!ignore) {
      wsClient.send(data);
    }
  });
  wsClient.on('message', (data) => {
    // 在Network/Frames显示服务端发送的数据包
    // 支持emit：buffer、字符串、数字、对象等等各种类型
    const ignore = req.curReceiveState === 'ignore';
    req.emit('serverFrame', `Server: ${data}`, ignore);
    if (!ignore) {
      ws.send(data);
    }
  });
  // 由于建立连接是异步的，可能监听不到初始化状态
  if (req.curReceiveState) {
    req.emit('receiveStateChange');
  }
  if (req.curSendState) {
    req.emit('sendStateChange');
  }
};
