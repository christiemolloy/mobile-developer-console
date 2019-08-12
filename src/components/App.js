import React from 'react';
import { connect } from 'react-redux';
import { BrowserRouter as Router, Switch, Redirect, Route } from 'react-router-dom';
import { OutlinedQuestionCircleIcon } from '@patternfly/react-icons';
import {
  Brand,
  Page,
  PageHeader,
  PageSection,
  Toolbar,
  ToolbarGroup,
  ToolbarItem,
  DropdownToggle,
  Dropdown,
  DropdownItem
} from '@patternfly/react-core';
import Overview from '../containers/Overview';
import Client from '../containers/Client';
import ErrorMessages from '../containers/ErrorMessages';
import { fetchUserInfo } from '../actions/users';
import './App.css';

class App extends React.Component {
  state = {
    isDropdownOpen: false,
    isIconOpen: false
  };

  componentWillMount() {
    this.props.fetchUserInfo();
  }

  onDropdownToggle = () => {
    this.setState({ isDropdownOpen: !this.state.isDropdownOpen });
  };

  onIconToggle = () => {
    this.setState({ isIconOpen: !this.state.isIconOpen });
  };

  render() {
    const userDropdownItems = [
      <DropdownItem>
        <a href="/oauth/sign_in">Logout</a>
      </DropdownItem>
    ];

    const questionIconItems = [
      <DropdownItem>
        <a href="https://docs.aerogear.org/aerogear/latest/getting-started.html">Documentation</a>
      </DropdownItem>
    ];

    const PageToolbar = (
      <Toolbar>
        <ToolbarGroup>
          <ToolbarItem>
            <Dropdown
              isPlain
              position="right"
              isOpen={this.state.isIconOpen}
              onSelect={this.onDropdownSelect}
              toggle={
                <DropdownToggle onToggle={this.onIconToggle} iconComponent={null}>
                  <OutlinedQuestionCircleIcon />
                </DropdownToggle>
              }
              dropdownItems={questionIconItems}
            />
            <Dropdown
              isPlain
              position="right"
              isOpen={this.state.isDropdownOpen}
              onSelect={this.onDropdownSelect}
              toggle={
                <DropdownToggle onToggle={this.onDropdownToggle}>
                  {this.props.user ? this.props.user.name : 'Unknown'}
                </DropdownToggle>
              }
              dropdownItems={userDropdownItems}
            />
          </ToolbarItem>
        </ToolbarGroup>
      </Toolbar>
    );

    return (
      <Router>
        <ErrorMessages />
        <Page
          header={
            <PageHeader
              logo={<Brand src="/img/aerogear_logo.svg" alt="Mobile Developer Console Logo" style={{ width: '150px' }}/>}
              toolbar={PageToolbar}
            />
          }
        >
          <PageSection>
            <Switch>
              <Route exact path="/overview" component={Overview} />
              <Route exact path="/mobileclient/:id" component={Client} />
              {/* Default redirect */}
              <Redirect to="/overview" />
            </Switch>
          </PageSection>
        </Page>
      </Router>
    );
  }
}

function mapStateToProps(state) {
  return {
    user: state.user.currentUser
  };
}

const mapDispatchToProps = {
  fetchUserInfo
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(App);
