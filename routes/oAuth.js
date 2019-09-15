'use strict';
const { authorize } = require('../libs/passport');

module.exports = (app) => {
  app.get('/authorize', function(req, res) {
    if(!req.isAuthenticated() || !req.user) {
      return res.redirect(`/login?redirectTo=${encodeURIComponent(req.originalUrl)}`)
    }
    
    const prefix = `<!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Authorize</title>
          <link rel="stylesheet" href="https://unpkg.com/bootstrap@4.1.0/dist/css/bootstrap.min.css" crossorigin="anonymous" />
        </head>
        <body>
          <div class="container" style="padding-top: 50px; text-align: center">
            <form action="/authorize" method="POST">
              <input type="hidden" name="grant_type" value="code" />
              <h4>Authorize Google assistant to control your devices</h4>`;
    const postfix = `
              <button class="btn btn-primary" type="submit" style="margin-top: 30px;">Authorize</button>
            </form>
          </div>
        </body>
      </html>`;
    const inputs = Object.keys(req.query).reduce((html, key) => 
      html + `<input type="hidden" name="${key}" value="${req.query[key]}" />`, '');
    res.type('html').send(prefix + inputs + postfix);
  });
  app.post('/authorize', authorize, (req, res, next) => console.log('hrer') || next(), app.oAuth.authorize({
    authenticateHandler: {
      handle: (req, res) => {
        console.log(req.user);
        return req.user;
      }
    }
  }));
  app.post('/token', app.oAuth.token());
}
