# whistle.custom-ws
> 根据实际情况，也可以采用 pipe 代替，具体参见：https://github.com/whistle-plugins/examples/tree/master/whistle.test-pipe

Whistle 支持 `Network / Frames / Composer` 暴露了接口给长连接(包括websocket请求)，插件可以把每个发送或接收到数据包显示到 `Network / Frames` 里面，并可以监听到 `Network / Frames` 的状态变化 及  `Network / Frames / Composer` 发送的指定目标及数据，从而通过插件可以实现抓包调试 `protobuf`、`quic` 等协议的数据。

![custom ws parser](https://user-images.githubusercontent.com/11450939/48125227-2ad17f80-e2b9-11e8-900a-1a7ce5a20110.gif)

> 图中页面地址：[http://websocket.org/echo.html](http://websocket.org/echo.html)，配置：ws://echo.websocket.org custom-ws:// enable://customParser


### 自定义websocket抓包调试
实现插件的 `server` 服务，有关server及规则配置的内容参见：[https://wproxy.org/whistle/plugins.html](https://wproxy.org/whistle/plugins.html)

监听server的 `upgrade` 方法，建议直接借助[ws](https://github.com/websockets/ws)模块：

```
// server.js
const { Server } = require('ws');

module.exports = (server) => {
	const wss = new Server({ server });
	wss.on('connection', (ws, req) => {
		// do sth
	});
};

```
所有的API都在 `req` 对象里面，具体实现参考：[lib/handleConnect.js](https://github.com/whistle-plugins/whistle.custom-ws/blob/master/lib/handleConnect.js)

开发完成后台，加上插件的名字为 `whistle.test-custom-ws`，则需要配置如下whistle规则：
```
www.test.com/test-ws test-custom-ws:// enable://customParser
```
其中：`enable://customParser` 表示启用自定义解析器，不然的话whistle会用自带的webscoket解析器，`test-custom-ws://` 表示把请求转到插件的server里面，这样就可以在插件里面自定义对应webscoket请求的解包组包，并显示到 `Network / Frames` 里面，并接收 `Network / Frames` 的状态变化及构造的数据。

### 自定义普通长连接抓包调试
该方法适用于所有用TCP建立连接的请求，可以用来抓包调试protobuf、quic等等各种自定义协议的长连接，如何把TCP(Socket)请求代码到whistle可以参考：[轻松篡改WebSocket数据包](https://cnodejs.org/topic/5b4b7b90e374eeab6929d70c)，如果是Node服务可以直接用[socketx](https://github.com/avwo/socketx)，直接配置代理地址和端口即可。

> 有关whistle规则配置同支自定义websocket解析器。

可以在插件 `tunnelServer` 或 `server` 的 `connect` 监听到转发过来的长连接(`tunnelServer` 的优先级比较高)，具体实现参考：[lib/handleConnect.js](https://github.com/whistle-plugins/whistle.custom-parser/blob/master/lib/handleConnect.js)
