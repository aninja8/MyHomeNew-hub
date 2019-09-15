'use strict';
import React, { Component } from 'react';
import { Container, Row } from 'react-bootstrap';

import * as API from '../common/api';
import { getViewPortWidth, noop } from '../common/helper';
import Nav from '../components/nav';
import LoginComponent from '../components/login';
import SideNav from '../components/side-nav';
import MainSectionContainer from './MainSectionContainer';

class PageContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loggedin: true,
      isMobile: getViewPortWidth() <= 768
    };
    this.onLogin = this.onLogin.bind(this);
    this.getCurrentUserDetails = this.getCurrentUserDetails.bind(this);
    this.onResize = this.onResize.bind(this);
    this.onNavToggle = this.onNavToggle.bind(this);
    this.navigateTo = this.navigateTo.bind(this);

    setTimeout(this.getCurrentUserDetails, 10);
  }

  componentDidMount() {
    window.addEventListener("resize", this.onResize);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.onResize);
  }

  getCurrentUserDetails () {
    API.getCurrentUserDetails()
      .then(user => {
        this.setState({
          loggedin: !!user,
          user
        });
      })
      .catch(err => {
        if(err === API.UNAUTHORIZED) {
          this.setState({
            loggedin: false,
            user: null
          });
        }
        console.error('an error occured: ', err);
      });
  }

  onResize() {
    const isMobile = getViewPortWidth() <= 768;
    if(this.state.isMobile !== isMobile) {
      this.setState({
        isMobile
      });
    }
  }

  onNavToggle() {
    this.setState({
      navOpen: !this.state.navOpen
    });
  }

  onLogin (username, password) {
    API.login(username, password)
      .then(() => {
        this.setState({
          loggedin: true
        });
      })
      .catch(err=> console.error);
  };

  navigateTo(event) {
    if(event === 'login') {
      return this.setState({
        loggedin: false
      });
    }

    if(event === 'logout') {
      return API.logout()
        .then(resp => this.setState({
          loggedin: false
        }))
        .catch(noop);
    }

    if(event === 'setup') {
      return window.setupNewDevice();
    }

    return this.setState({
      selectedPage: event
    });
  }

  getPage() {
    if(!this.state.loggedin) {
      return <LoginComponent onLogin={this.onLogin} />;
    }
    return (
      <Container fluid={true}>
        <Row className="flex-xl-nowrap">
          <SideNav 
            displayNav={ !this.state.isMobile || this.state.navOpen } 
            navigate={this.navigateTo} />
          <MainSectionContainer 
            selectedPage={this.state.selectedPage} 
            user={this.state.user} 
            navigateTo={this.navigateTo} />
        </Row>
      </Container>
    );
  }

  render() {
    return (
      <React.Fragment>
        <Nav isMobile={ this.state.isMobile } onToggle={ this.onNavToggle } onLogout={ this.navigateTo.bind(this, 'logout')}/>
        { this.getPage() }
      </React.Fragment>
    );
  }
}

export default PageContainer;
