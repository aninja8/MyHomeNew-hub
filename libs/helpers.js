'use strict';
const _omit = require('lodash/omit');
const _get = require('lodash/get');
const Bluebird = require('bluebird');
const request = Bluebird.promisify(require('request'));
const dnssd = require('./dnssd');

const IGNORED_KEYS = ['_id', '__v'];
const schemaTransformer = module.exports.schemaTransformer = (doc, ret) => {
    return _omit(ret, IGNORED_KEYS);
};

module.exports.trasformer = {
    toObject: {
        transform: schemaTransformer
    },
    toJSON: {
        transform: schemaTransformer
    }
};

module.exports.getRequestToDevice = (devName, devPort, url) => {
    return dnssd.resolve(devName)
        .then(ip => request(`http://${ip}:${devPort}${url}`))
        .then(resp => {
            if(resp.statusCode > 299) {
                throw new Error('API call failed!');
            }
            try {
                return JSON.parse(resp.body);
            } catch(e) {
                return "";
            }
        });
};

module.exports.series = (arr, mapper, others = []) => {
  const firstElem = arr.shift();
  if(!firstElem) {
    return Promise.resolve([]);
  }

  const elemP = mapper(firstElem);
  return elemP.then((thisResp) => {
    const allResps = [...others, thisResp];
    if(arr.length > 0) {
      return module.exports.series(arr, mapper, allResps)
    }
    return allResps;
  });
};
