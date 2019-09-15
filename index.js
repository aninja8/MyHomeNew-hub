const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const passport = require('passport');
const OAuthServer = require('express-oauth-server');
const morgan = require('morgan');

const routes = require('./routes');
const DB = require('./libs/db');
const OAuthModel = require('./models/oAuth');
const PORT = process.env.PORT || 8090;
const { proxyRequestsSetup } = require('./controllers/proxy');

const _get = require('lodash/get');
const config = require('./config/config.json');

const app = express();
app.oAuth = new OAuthServer({
    debug: true,
    model: OAuthModel
});

if(process.env.mode === 'development') {
  const webpack = require('webpack');
  const middleware = require('webpack-dev-middleware');
  const config = require('./webpack.config');
  config.devtool = 'cheap-eval-source-map';
  const compiler = webpack(config);
  app.use(middleware(compiler, { index: false, lazy: true, publicPath: '/js/' }))
}

app.use(express.static('./dist'));
app.use(express.static('./public'));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(morgan('tiny'));

app.use(session({ 
    secret: 'keyboard cat',
    saveUninitialized: true,
    resave: true,
    cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 }, // 1 week
    store: new SQLiteStore
}));

app.use(passport.initialize());
app.use(passport.session());

if(config.external_server) {
  const server = config.external_server;
  const id = _get(config, 'hub_credentials.id');
  const secret = _get(config, 'hub_credentials.secret');
  const email = _get(config, 'hub_credentials.hub_user_email');
  if(id && secret && email) {
    app.use(proxyRequestsSetup({ server, id, secret, email }));
  }
}

routes.setupRoutes(app);

DB.connect();

app.listen(PORT);
