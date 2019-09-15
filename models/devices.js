'use strict';

const mongoose = require('mongoose');
const { Schema } = mongoose;

const { transformer } = require('../libs/helpers');

const DeviceInteractionUnitSchema = new Schema({
    devId: Number,
    label: String,
    state: String,
    type: String,
    hasPwm: Boolean
}, transformer);

const DeviceSchema = new Schema({
    name: String,
    label: String,
    user: String,
    room: String,
    hostname: String,
    port: Number,
    leads: [DeviceInteractionUnitSchema]
}, transformer);

module.exports = mongoose.model('Devices', DeviceSchema);
