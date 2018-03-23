import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import gql from 'graphql-tag';
import map from 'lodash/map';
import { Query, ApolloProvider } from 'react-apollo'
import { Provider, connect } from 'react-redux';
import { observer, Provider as MobxProvider, inject } from 'mobx-react';
import DevTools from 'mobx-react-devtools'
import { inspect } from 'util';
import client from './client';
import store, { getMessages } from './store';
import stores from './mobx';

const GET_MESSAGES = gql `
  query {
    messages @client {
      id
      content,
      user {
        id
        username
      }
    }
  }
`;

const withMessagesFromRedux = connect(
  state => {
    const props = ({
      messages: Object.values(state.messages).map(msg => ({
        ...msg,
        user: state.users[msg.user],
      })),
      loading: state.loadingMessages,
    });
    return props;
  },
  dispatch => ({
    getMessages: () => dispatch(getMessages()),
  }),
);

const ReduxMessages = withMessagesFromRedux(class SmartReduxMessages extends Component {
  componentWillMount() {
    this.props.getMessages();
  }
  render() {
    return this.props.children({ messages: this.props.messages, loading: this.props.loading });
  }
});

const MobxMessages = inject('messageStore')(observer(class MobxMessages extends Component {
  componentWillMount() {
    this.props.messageStore.fetchMessages();
  }
  render() {
    return this.props.children({ messages: this.props.messageStore.messages, loading: this.props.messageStore.isLoading.get() });
  }
}));

const renderMessage = messages => {
  const li = [];
  for (const message of messages.values()) {
    li.push(
      <li key={message.id}>
        <strong>{message.user ? message.user.username : 'chargement...'}</strong> : {message.content}
      </li>
    );
  }
  return li;
};


class App extends Component {
  render() {
    return (
      <div>
        <div style={{ width: '30%', display:'inline-block' }}>
          <ApolloProvider client={client}>
            <Query
              query={GET_MESSAGES}
              ssr={false}
            >
              {({ data, loading, error }) => {
                return error ? <p style={{ color: 'red' }}>{inspect(error)}</p> : (loading ? <p>Chargement...</p> : (
                  <div className="App">
                    <header className="App-header">
                      <img src={logo} className="App-logo" alt="logo" />
                      <h1 className="App-title">Apollo link state</h1>
                    </header>
                    <ul>
                      {data.messages.map(message => (
                        <li key={message.id}>
                          <strong>{message.user.username}</strong> : {message.content}
                        </li>
                      ))}
                    </ul>
                  </div>
                ));
              }}
            </Query>
          </ApolloProvider>
        </div>
        <div style={{ width: '30%', display: 'inline-block' }}>
          <Provider store={store}>
            <ReduxMessages>
              {({ messages, loading }) => (
                loading ? <p>Chargement...</p> : (
                  <div className="App">
                    <header className="App-header">
                      <img src={logo} className="App-logo" alt="logo" />
                      <h1 className="App-title">Redux</h1>
                    </header>
                    <ul>
                      {messages.map(message => (
                        <li key={message.id}>
                          <strong>{message.user ? message.user.username : 'chargement...'}</strong> : {message.content}
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              )}
            </ReduxMessages>
          </Provider>
        </div>
        <div style={{ width: '30%', display: 'inline-block' }}>
          <MobxProvider {...stores}>
            <div>
              <MobxMessages>
                {({ messages, loading }) => (
                  loading ? <p>Chargement...</p> : (
                    <div className="App">
                      <header className="App-header">
                        <img src={logo} className="App-logo" alt="logo" />
                        <h1 className="App-title">Mobx</h1>
                      </header>
                      <ul>
                        {renderMessage(messages)}
                      </ul>
                    </div>
                  )
                )}
              </MobxMessages>
              <DevTools />
            </div>
          </MobxProvider>
        </div>
      </div>
    );
  }
}

export default App;
