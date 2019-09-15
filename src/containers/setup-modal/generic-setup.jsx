import React, {
  useState,
  useCallback
} from 'react';
import { Form, Row, Col, Card } from 'react-bootstrap';
import Switch from '../../components/switch';
import { findParent } from '../../common/helper';

const formFieldsStyle = {
  'margin-top': '1rem'
};

export default function(props) {
  const [switchEnabled, enableSwitch] = useState([false, false, false, false]);

  const onLeadUpdate = useCallback(e => {
    const { name, type, value, checked } = e.target;
    const finalValue = (type === 'checkbox' ? checked : value);
    const leadNum = findParent('lead-row', e.target).getAttribute('data-lead-num');

    if(name === 'enabled') {
      enableSwitch(oldState => 
        oldState.map((state, idx) => idx === Number(leadNum) ? finalValue : state));
    }

    props.updateLead(leadNum, { [name]: finalValue });
  }, props.updateLead);

  return (
    <React.Fragment>
      <p style={{ 'margin-top': '1rem', 'margin-bottom': 0 }}>Device type: Generic switch board</p>
      <Form.Label style={{
        'margin-top': '1rem'
      }}>Room</Form.Label>
      <Form.Control name="room" placeholder="which room is this device in?" onChange={props.updateValue} />
      <Form.Label style={formFieldsStyle}>Device label</Form.Label>
      <Form.Control 
        as="input"
        name="deviceLabel"
        placeholder="Give a friendly name" 
        onChange={props.updateValue} />
      <br />
      <hr />
      <p>This switch-board can control upto four devices.</p>
      <p>Enable the switches on which you've connected a device and give it a name.</p>
      <Form.Group style={formFieldsStyle}>
        {
          [0,1,2,3].map(rowNum => (
            <Card className="lead-row" style={ formFieldsStyle } data-lead-num={rowNum}>
              <Card.Header>
                <Row>
                  <Col><span className="align-middle">Switch {rowNum + 1}:</span></Col>
                  <Col><Switch name="enabled" onChange={onLeadUpdate} /></Col>
                </Row>
              </Card.Header>
              <Card.Body className={switchEnabled[rowNum] ? '' : 'd-none' }>
                <Row>
                  <Col>
                    <Form.Control as="select" name="type" onChange={onLeadUpdate}>
                      <option value="switch">Generic switch</option>
                      <option value="tv">Television</option>
                      <option value="light">Light</option>
                      <option value="fan">Fan</option>
                      <option value="ac">AC</option>
                    </Form.Control>
                  </Col>
                  <Col>
                    <Form.Control 
                      name="label"
                      placeholder="Name of device" 
                      onChange={onLeadUpdate} />
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          ))
        }
      </Form.Group>
    </React.Fragment>
  );
};
