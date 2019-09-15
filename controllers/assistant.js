'use strict';
const _get = require('lodash/get');
const deviceModel = require('../models/devices');
const { getRequestToDevice } = require('../libs/helpers');
const { getDevState } = require('./devices');

function syncDevices(req, res) {
  const userEmail = _get(res, 'locals.oauth.token.user.email', _get(req, 'user.email'));
  const agentUserId = _get(res, 'locals.oauth.token.user._id', _get(req, 'user._id'));
  
  deviceModel.find({user: userEmail})
    .then(devices => {
      res.send({
        requestId: req.body.requestId,
        payload: {
          agentUserId,
          devices: devices.map(deviceMapper).reduce((a, t) => [...a, ...t])
        }
      });
    });
}

function getDeviceType(dbType) {
  if(dbType === 'light' || 
    dbType === 'fan') {
    return dbType.toUpperCase();
  }
  if(dbType === 'ac') {
    return 'AC_UNIT';
  }
  return 'SWITCH';
}

function deviceMapper(device) {
  return (device.leads || [])
    .map(lead => ({
      id: `${device._id}-${lead.devId}`,
      type: `action.devices.types.${getDeviceType(lead.type)}`,
      traits: [ 'action.devices.traits.OnOff' ],
      name: {
        defaultNames: [`${device.name}-${lead.devId}`],
        name: lead.label,
        nicknames:[ `${device.room}-${lead.label}` ]
      },
      willReportState: false,
      roomHint: device.room,
      deviceInfo: {
        manufacturer: 'Shashi',
        model: 'v0.0.1',
        hwVersion: '0.0.1',
        swVersion: '0.0.1'
      }
    }));
}

function reduceDevsToQueryResp(allDeviceStates) {
  return (resp, [id, devId = 0]) => {
    const thisDev = allDeviceStates.find(dev => dev._id.toString() === id);
    const thisLead = thisDev.leads.find(lead => lead.devId === Number(devId)) || {};
    
    return Object.assign(resp || {}, {
      [id]: {
        on: thisLead.brightness === 100,
        online: thisDev.isActive
      }
    });
  };
}

function queryStatus(req, res) {
  const devicesToQuery = _get(req.body, 'inputs[0].payload.devices', []);
  Promise.all(devicesToQuery.map(dev => {
    const [ id ] = dev.id.split('-');
    return deviceModel.findById(id).lean()
      .then(dbDev => getDevState(dbDev));
  }))
    .then(allDeviceStates => {
      res.json({
        requestId: req.body.requestId,
        payload: {
          devices: devicesToQuery.map(({id}) => id.split('-')).reduce(reduceDevsToQueryResp(allDeviceStates), {})
        }
      });
    })
}

function execute(req, res) {
  const commands = _get(req.body, 'inputs[0].payload.commands', []);

  Promise.all(commands.map(command => {
    const devices = _get(command, 'devices', []);
    const applicableCmd = _get(command, 'execution', [])
      .find(exec => exec.command === 'action.devices.commands.OnOff');
    const isOn = _get(applicableCmd, 'params.on');

    return Promise.all(devices.map(dev => {
      const [id, devId] = dev.id.split('-');

      return deviceModel.findById(id).lean()
        .then(device => getRequestToDevice(
          device.name,
          device.port || '80',
          `/v1/ops?dev=${devId || 0}&brightness=${isOn? 100 : 0}`
        ))
        .then(() => ({ id: dev.id, status: 'SUCCESS', isOn }))
        .catch(err => {
          console.log('device state update failed', err.stack || err);
          return { id: dev.id, status: 'ERROR' };
        })
    }))
  }))
    .then(allResponses => {
      allResponses = allResponses.reduce((all, resp) => [...all, ...resp], []);
      const onSuccessIds = allResponses.filter(r => r.status === 'SUCCESS' && 
        r.isOn === true).map(r => r.id);
      const offSuccessIds = allResponses.filter(r => r.status === 'SUCCESS' && 
        r.isOn === false).map(r => r.id);
      const errorIds = allResponses.filter(r => r.status === 'ERROR').map(r => r.id);
      res.json({
        requestId: req.body.requestId,
        payload: {
          commands: [
            onSuccessIds.length && {
              ids: onSuccessIds,
              status: 'SUCCESS',
              states: {
                on: true,
                online: true
              }
            },
            offSuccessIds.length && {
              ids: offSuccessIds,
              status: 'SUCCESS',
              states: {
                on: false,
                online: true
              }
            },
            errorIds.length && {
              ids: errorIds,
              status: 'ERROR'
            }
          ].filter(Boolean)
        }
      });
    })
    .catch(err => {
      console.log('caught unexpected error', err.stack || err);
      res.status(400).json({});
    });
}

module.exports = {
  syncDevices,
  queryStatus,
  execute
};
