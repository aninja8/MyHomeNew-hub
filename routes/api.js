'use strict';
const _set = require('lodash/set');
const _get = require('lodash/get');

const { isDevOnline, proxy } = require('../libs/ws-server');

const { 
  switchDeviceState,
  getAllDevicesForUser,
  queryDevice
} = require('../controllers/devices');

function applyReqUser(req, res, next) {
  const user = _get(res, 'locals.oauth.token.user');

  if(user && user.hubClientId && isDevOnline(user.hubClientId)) {
    return proxy(req, res);
  }

  _set(req, 'user', user);
  return next();
}

module.exports = app => {
  const oAuth = app.oAuth.authenticate();

  app.get('/v1/devices', oAuth, applyReqUser, getAllDevicesForUser);
  app.get('/v1/devices/:name', oAuth, applyReqUser, queryDevice);
  app.post('/v1/devices/:name/set-state', oAuth, applyReqUser, switchDeviceState);
};