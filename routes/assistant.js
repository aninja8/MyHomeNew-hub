'use strict';
const _get = require('lodash/get');
const {
  syncDevices, queryStatus, execute
} = require('../controllers/assistant');
const {
  revokeToken
} = require('../models/oAuth');

module.exports =  app => {
  app.post('/assistant/fullfill', app.oAuth.authenticate(), (req, res) => {
    console.log('Assistant req', JSON.stringify(req.body, null, 2));
    console.log('user', _get(res, 'locals.oauth.token.user.email'));
    
    const type = _get(req.body, 'inputs[0].intent');

    if(type === 'action.devices.SYNC') {
      return syncDevices(req, res);
    }

    if(type === 'action.devices.QUERY') {
      return queryStatus(req, res);
    }

    if(type === 'action.devices.EXECUTE') {
      return execute(req, res);
    }

    if(type === 'action.devices.DISCONNECT') {
      return revokeToken(_get(res, 'locals.oauth.token.refreshToken'))
        .catch(err => {console.error('could not revoke refresh token', err)})
        .then(() => res.send({}));
    }

    // Invalid request
    return res.status(400).json({});
  });
}
