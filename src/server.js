const http = require('http');
const fs = require('fs');
const socketio = require('socket.io');

const port = process.env.PORT || process.env.NODE_PORT || 3000;

var currentValue = 0;

// read the client html file into memory
// __dirname in node is the current directory
// (in this case the same folder as the server js file)
const index = fs.readFileSync(`${__dirname}/../client/index.html`);

const onRequest = (request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/html' });
  response.write(index);
  response.end();
};

const app = http.createServer(onRequest).listen(port);

console.log(`Listening on 127.0.0.1: ${port}`);

// pass in the http server into socketio and grab the websocket server as io
const io = socketio(app);

// object to hold all of our connected users
const users = {};

const onJoined = (sock) => {
  const socket = sock;

  socket.on('join', (data) => {
    // message back to new user
    const joinMsg = {
      name: 'server',
      msg: `There are ${Object.keys(users).length} users online`,
    };

    socket.join('room1');
    console.log(`${socket.id} joined room1`);
	
	
    // send user the current value
    socket.emit('counter', { value: currentValue });
  });
};

const onMsg = (sock) => {
  const socket = sock;

  socket.on('msgToServer', (data) => {
      io.sockets.in('room1').emit('msg', { name: socket.name, msg: data.msg });
  });
};

const onIterate = (sock) => {
  const socket = sock;

  socket.on('iterateToServer', (data) => {
  
	currentValue += 10;
	
	// announce new value
	const announcement = {
		value: currentValue
	};
	  
	io.sockets.in('room1').emit('counter', announcement);
  });
};


const onDisconnect = (sock) => {
  const socket = sock;

  socket.on('disconnect', () => {
    console.log(socket.id + ' Left the chat room');
    io.sockets.in('room1').emit('msg', { name: 'server', msg: `${socket.name} has left the chat room` });
	socket.leave('room1');
    io.sockets.in('room1').emit('msg', { name: 'server', msg: `There are currently: ${Object.keys(users).length} users online` });
  });
};


io.sockets.on('connection', (socket) => {
  console.log(`${socket.id} connected`);

  users[socket.id] = { socket };

  onJoined(socket);
  onMsg(socket);
  onDisconnect(socket);
  onIterate(socket);
  
  /*var interval = setInterval(function() {
		currentValue += 10;
		socket.broadcast.to('room1').emit('iterate', announcement);
	}, 1000);*/


});

console.log('Websocket server started');

