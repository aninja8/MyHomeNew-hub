'use strict';
const _get = require('lodash/get');
const _omit = require('lodash/omit');
const _pickBy = require('lodash/pickBy');

const dnssd = require('../libs/dnssd');
const DeviceModel = require('../models/devices');
const { getRequestToDevice, series } = require('../libs/helpers');
const schemaTransformer = require('../libs/helpers').schemaTransformer.bind(null, null);

module.exports.getAvailableDevices = (req, res) => {
  const allDevices = dnssd.getKnownDevices();
  Promise.all(
    Object.keys(allDevices).map(dev => 
      DeviceModel.findOne({name: dev})
        .then(added => ({dev, added: !!added}))
        .catch(() => ({dev, added: false}))
    )
  )
    .then(deviceInfo => 
      res.json(
        _omit(allDevices, deviceInfo
          .filter(i => i.added === true)
          .map(i => i.dev)
        )
      )
    )
    .catch(err => {
      console.error('check device free failed', err.stack || err);
      res.json({});
    });
};

module.exports.saveNewDeviceForUser = (req, res) => {
  if(dnssd.getKnownDevices()[_get(req, 'body.name')] === undefined) {
    return res.json({
      success: false,
      err: 'Device not online'
    });
  }

  return DeviceModel.create({
    user: req.user.email,
    ...req.body
  })
  .then(() => res.json({
    success: true
  }))
  .catch(err => res.status(400).json({
    success: false, 
    err: err.message
  }));
};

function mapBrightness(devConfig, lead) {
  return {
    ...lead,
    brightness: devConfig[`lead${lead.devId}`] || 0,
  }
}

const RETRY_ERR_CODES = ['EHOSTUNREACH', 'ENOTFOUND'];
;
module.exports.getDevState = async (device, retries = 2) => {
  return getRequestToDevice(device.name, device.port || '80', '/v1/config')
    .then(resp => ({
      ...device,
      isActive: true,
      leads: device.leads.map(schemaTransformer).map(mapBrightness.bind(null, resp))
    }))
    .catch(err => {
      retries--;
      if(RETRY_ERR_CODES.includes(err.code) && // Err requires retry
        retries !== 0 && // We have more retries left
        dnssd.getKnownDevices()[device.name]) // And the device said it is online
      {
        console.warn('retrying bcz of', err.code);
        return module.exports.getDevState(device, retries);
      }

      console.error('getDevState failed', err);
      return {
        ...device,
        isActive: false
      };
    });
}

module.exports.getAllDevicesForUser = (req, res) => {
  // Get list of devices for current user
  return DeviceModel.find({user: req.user.email}).lean()
    .then(devices => series(devices.map(schemaTransformer), module.exports.getDevState))
    .then(devices => res.json(devices))
    .catch(err => res.json({
      sucess: false, 
      err: err.message || err
    }));
};

module.exports.switchDeviceState = (req, res) => {
    const devName = req.params.name;
    const { switchId, newState } = req.body;

    DeviceModel.findOne({ name: devName})
        .then(device => {
            if(!device) {
                throw new Error('UNAUTHORIZED');
            }
            return getRequestToDevice(device.name, device.port || '80', `/v1/ops?dev=${switchId}&brightness=${newState}`)
        })
        .then(() => res.json({
                success: true
        }))
        .catch(err => {
            console.log(err);
            res.status(400).json({ success: false, err });
        });
};

module.exports.getDeviceConfig = (req, res) => {
    return getRequestToDevice(req.params.name, '80', '/v1/config')
        .then(resp => res.json(_pickBy(resp, (val, key) => key.indexOf('lead') === 0)))
        .catch(err => {
            res.status(400).json({
                success: false,
                err: err.message || err
            });
        });
};
