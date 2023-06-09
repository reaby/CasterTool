const version = "0.1.1";
const createError = require('http-errors');
const http = require('http');
const express = require('express');
const { json, urlencoded } = require('express');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const indexRouter = require('./routes/index.js');
const gameRouter = require('./routes/game.js');
const compRouter = require('./routes/competition.js');
const { Api } = require('./tmapi/api.js');
const { Server } = require('socket.io');
const { XmlRPC } = require('./tmapi/xmlrpc.js');
const cli = require('./utils/cli.js');
const ApiCache = require('./modules/apiCache.js');
const { Websocket } = require('./routes/websocket.js');
const { Events } = require('./modules/events.js');
const fs = require('fs');
const path = require('path');

cli(`CasterTool ${version}`, "app")
const app = express();
const configfile = fs.readFileSync("./config.json");
const config = JSON.parse(configfile);
if (!config.user || !config.pass) {
  process.exit("Config Missing.");
}
const credentials = Buffer.from(config.user + ":" + config.pass).toString('base64');
const tmApi = new Api(credentials);
const server = http.createServer(app);
const io = new Server(server);
const events = new Events();

const cache = new ApiCache(tmApi);
const gbx = new XmlRPC(cache, events);
const webSocket = new Websocket(gbx, cache, io, events);

// view engine setup
app.set('views', './views');
app.set('view engine', 'twig');
//app.use(logger('dev'));
app.use(json());
app.use(urlencoded({ extended: false }));
app.use(cookieParser());
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/', indexRouter(tmApi));
app.use('/game', gameRouter(tmApi, gbx));
app.use('/comp', compRouter(tmApi));


// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

const port = normalizePort(process.env.PORT || '8000');
app.set('port', port);
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);


function normalizePort(val) {
  const port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  const addr = server.address();
  const bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  cli("Application available now at: http://localhost:8000/", "app");
}