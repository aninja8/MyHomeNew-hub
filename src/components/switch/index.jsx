import React from 'react';
import './switch.less';

export default function Switch(props){
  return (
    <label className="switch align-middle">
      <input name={props.name} type="checkbox" onChange={ props.onChange } checked={props.checked} />
      <span className="slider"></span>
    </label>
  );
};
