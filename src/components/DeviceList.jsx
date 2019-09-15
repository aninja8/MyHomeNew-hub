import React from 'react';
import { Card } from 'react-bootstrap';
// import Slider, {createSliderWithTooltip} from 'rc-slider';

import '../css/device-list.less';
import Switch from './switch';
// import 'rc-slider/assets/index.css';

const SwitchDisplay = ({leads = [], name, isActive, onChange}) => {
  return (leads || []).map((switchUnit, idx) => (
    <React.Fragment>
      <div>
          <span>{switchUnit.label || ('Switch ' + (idx + 1))}</span>
          { leads.length === 1 && 
            <span className={'acitivtyDot ' + (isActive ? 'active': '')}></span>
          }
      </div>
      <div>
        <Switch onChange={ onChange.bind(null, name, idx) } checked={ switchUnit.brightness > 0 } />
      </div>
      {/* <div xs={1}>
          <SliderWithTooltip 
              vertical 
              onChange={onChange.bind(null, dev.name, idx)} value={switchUnit.brightness || 0} 
              handleStyle={{
                  bottom: '100%',
                  'border-radius': '0',
                  width: '20px',
                  height: '10px',
                  'margin-left': '-8px'
              }}
          />
      </div> */}
    </React.Fragment>
  ))
};

const DeviceList = props => {
    const { dev } = props;
    const { leads = [] } = dev;
    return (
      <Card className="device-row">
        { leads.length > 1 && 
            <Card.Header>{dev.label || dev.name} <span className={'acitivtyDot ' + (dev.isActive ? 'active': '')}></span></Card.Header>
        }
        <Card.Body className="device-body">
          <SwitchDisplay {...dev} onChange={ props.onChange } />
        </Card.Body>
      </Card>
    );
}

export default DeviceList;
