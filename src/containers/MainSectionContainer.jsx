import React, { Component } from 'react';
import _get from 'lodash/get';
import _uniq from 'lodash/uniq';

import * as API from '../common/api';
import NoDeviceMessageComponent from '../components/noDevicesAdded';
import DeviceList from '../components/DeviceList';
import DeviceSetupModalContainer from './setup-modal/DeviceSetupModalContainer';
import '../css/main.less';
import { Tabs, Tab } from 'react-bootstrap';

class MainSectionContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      devices: []
    };

    window.setupNewDevice = this.setupNewDevice = this.setupNewDevice.bind(this);
    this.onSwitchToggle = this.onSwitchToggle.bind(this);
  }

  componentDidMount() {
    this.loadDevicesList();
  }

  loadDevicesList() {
    API.getExistingDevices()
      .then(devices => {
        this.setState({
          loading: false,
          devices
        });
      })
      .catch(err => {
        if(err === API.UNAUTHORIZED) {
          return this.props.navigateTo('login')
        }
        this.setState({
          loading: false,
          devices: []
        });
      });
  }

  onSwitchToggle(device, switchId, event) {
    let newState;
    if(typeof event === 'number') {
      newState = event;
    } else {
      newState = event.target.checked ? 100 : 0;
    }
    
    // this.pauseAPICalls = true;
    API.updateDeviceState(device, switchId, newState)
      .then(() => {
          // this.pauseAPICalls = false
      });
    this.state.devices.find(dev => dev.name === device).leads[switchId].brightness = newState;
    this.setState({});
  }

  setupNewDevice() {
    this.setState({
      showDeviceSetupModel: true
    });
  }

  getDeviceUI() {
    if(this.state.loading){
      return (
        <div>
          <div className="loading"></div>
        </div>
      );
    }

    if(this.state.showDeviceSetupModel) {
      return <DeviceSetupModalContainer closeModal={() => {
        this.setState({ showDeviceSetupModel: false });
        this.loadDevicesList();
      }} />;
    }

    if(this.state.devices.length === 0) {
      return <NoDeviceMessageComponent setupNewDevice={this.setupNewDevice} />;
    }

    const roomsList = _uniq(this.state.devices.map(device => device.room)).sort();
    const roomTabs = roomsList.map(room => {
      const devsInThisRoom = this.state.devices.filter(dev => dev.room === room);

      return (
        <Tab eventKey={room} title={room}>
          <div style={{margin: '1rem auto'}}>{room} has following {devsInThisRoom.length} devices.</div>
          { devsInThisRoom.map(dev => <DeviceList dev={dev} onChange={ this.onSwitchToggle } />) }
        </Tab>
      );
    });

    return (
      <Tabs>
        { roomTabs }
      </Tabs>
    );
  }

  render() {
    const firstName = _get(this.props, 'user.name', '').split(' ')[0];

    return (
      <main className="col-xl-8 col-md-9 col-12 main-section">
        <h1>Hello { firstName }!</h1>
        { this.getDeviceUI() }
      </main>
    );
  }
}

export default MainSectionContainer;
