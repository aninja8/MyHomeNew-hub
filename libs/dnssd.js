'use strict';

const _cloneDeep = require('lodash/cloneDeep');
const _get = require('lodash/get');
const dns = require('dns');
const util = require('util');
const lookup = util.promisify(dns.lookup);

function getDNSLib() {
  if(require('is-wsl')) {
    const dnssd = require('dnssd');

    dnssd.createBrowser = function(type, options) {
      return new dnssd.Browser(type, options);
    };

    const origResolve = dnssd.resolve;
    dnssd.resolve = function(name, options) {
      return origResolve.apply(dnssd, [name, 'A', options]);
    }

    return dnssd;
  }
  
  const mdns = require('mdns');
  mdns.Browser.defaultResolverSequence[1] = 'DNSServiceGetAddrInfo' in mdns.dns_sd ? 
    mdns.rst.DNSServiceGetAddrInfo() : mdns.rst.getaddrinfo({families:[4]});
  mdns.resolve = util.promisify(mdns.resolve.bind(mdns));
  return mdns;
}
const mDNSLib = getDNSLib();

const devices = {};

try {
  const browser = mDNSLib.createBrowser(mDNSLib.tcp('http'));
  browser.on('serviceUp', function(service) {
    const {
      name = '', host = '', port = 80, txt ={}, addresses = []
    } = service;
    const ip = addresses.find(address => (address || '').split('.').length === 4);

    if(name.startsWith('myhomenew') && host && ip) {
      devices[name] = { host, ip, port, type: _get(txt, 'type', _get(service, 'txtRecord.type')) };
      if(!devices[name].type) {
        devices[name].type = 'switch';
      }
      console.log('found', devices[name]);
    }
  });
  browser.on('serviceDown', function(service) {
    const { name = '' } = service;

    if(devices[name]) {
      console.log('lost', devices[name]);
      devices[name] = undefined;
    }
  });
  browser.on('error', function(err) {
    console.error(err);

    // restart browsing..
    browser.stop();
    window.setTimeout(() => browser.start(), 2000);
  });
  browser.start();
    
} catch(e) {
  console.error('could not create browser.', e.stack || e);
}

module.exports.getKnownDevices = () => _cloneDeep(devices);
module.exports.resolve = (name) => {
  if(devices[name]) {
    return Promise.resolve(devices[name].ip);
  }
  
  return mDNSLib.resolve(`${name}.local`)
    .then(result => _get(result, 'answer.address'))
    .catch(() => lookup(`${name}.local`, { family: 4 }));
};

