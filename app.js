import createError from 'http-errors';
import express, { json, urlencoded, static as Static } from 'express';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import indexRouter from './routes/index.js';
import gameRouter from './routes/game.js';
import config from './config.js';
import Api from './tmapi/api.js';

const app = express();
const credentials = Buffer.from(config.user+":"+config.pass).toString('base64');
const api = new Api(credentials);

// view engine setup
app.set('views', './views');
app.set('view engine', 'twig');
app.use(logger('dev'));
app.use(json());
app.use(urlencoded({ extended: false }));
app.use(cookieParser());
app.use(Static('./public'));

app.use('/', indexRouter(api));
app.use('/game', gameRouter(api));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

export default app;
