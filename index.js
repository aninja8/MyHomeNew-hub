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

const app = express();
app.oAuth = new OAuthServer({
    debug: true,
    model: OAuthModel
});

app.use(express.static('./dist'));
app.use(express.static('./public'));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(morgan('tiny'));

app.post('/dialog', (req, res) => {
  // api password: *J-)hea^C>;EE7<M
  console.log('got req');
  console.log(JSON.stringify(req.body, null, 2));
  console.log(JSON.stringify(req.headers, null, 2));
  res.json({});
});

app.use(session({ 
    secret: 'keyboard cat',
    saveUninitialized: true,
    resave: true,
    cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 }, // 1 week
    store: new SQLiteStore
}));

app.use(passport.initialize());
app.use(passport.session());

routes.setupRoutes(app);

DB.connect();

app.listen(PORT);
