'use strict';

export const UNAUTHORIZED = new Error('UNAUTHORIZED');
export const SERVER_ERROR = new Error('SERVER_ERROR');

export const logout = () => {
  return fetch('/logout')
    .then(resp => {
      if(!resp.ok) {
        throw new Error('logout failed!');
      }
    });
};

export const login = (username, password) => {
  return fetch('/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      username,
      password
    })
  })
  .then(resp => {
    if(resp.ok) {
      return resp.json();
    }
    throw SERVER_ERROR;
  });
};

export const getCurrentUserDetails = () => {
  return fetch('/user/@me')
    .then(resp => {
      if(resp.ok) {
        return resp.json();
      }
      throw UNAUTHORIZED;
    });
};

export const getExistingDevices = () => {
  return fetch('/devices')
    .then(resp => {
      if(resp.status === 401) {
        throw UNAUTHORIZED;
      }

      if(resp.ok) {
        return resp.json();
      }
      throw SERVER_ERROR;
    });
};

export const getKnownDeviceList = () => {
  return fetch('/devices/available')
    .then(resp => {
      if(resp.ok) {
        return resp.json();
      }
      throw SERVER_ERROR;
    });
};

export const saveDeviceForUser = (body) => {
  return fetch('/devices', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(body)
  })
    .then(resp => {
      if(resp.ok) {
        return resp.json();
      }
      throw SERVER_ERROR;
    });
};

export const updateDeviceState = (device, switchId, newState) => {
  return fetch(`/devices/${device}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      switchId,
      newState
    })
  })
    .then((resp) => {
      if(resp.ok) {
        return resp.json();
      }
      throw SERVER_ERROR;
    });
};
