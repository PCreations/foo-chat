import React, { Component } from 'react';
import { Subject } from 'rxjs/Rx';
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
import GET_MESSAGES from './getMessages.gql';
import createUnstatedStore from './createUnstatedStore';

import { fetchMessages, fetchUser, addMessage } from './db';

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

export const ReduxMessages = withMessagesFromRedux(class SmartReduxMessages extends Component {
  componentWillMount() {
    this.props.getMessages();
  }
  render() {
    return !(this.props.messages.length === 0 && !this.props.loading) && this.props.children({ messages: this.props.messages, loading: this.props.loading });
  }
});

const MobxMessages = inject('messageStore')(observer(class MobxMessages extends Component {
  componentWillMount() {
    this.props.messageStore.fetchMessages();
  }
  render() {
    const messages = [];
    this.props.messageStore.messages.forEach(msg => {
      messages.push({
        id: msg.id,
        content: msg.content,
        user: {
          id: msg.user.id,
          username: msg.user.username,
        }
      });
    });
    return this.props.children({ messages, loading: this.props.messageStore.isLoading });
  }
}));

const ApolloMessages = ({ children }) => (
  <Query
    query={GET_MESSAGES}
    ssr={false}
  >
    {({ data, loading, error }) => {
      return children({ messages: data.messages || [], loading });
    }}
  </Query>
);

const unstatedMessageSubject$ = new Subject();

const { MessageListState: UnstatedMessages, addMessage: addUnstatedMessage, editUsername } = createUnstatedStore({
  fetchMessages: () => fetchMessages().then(messages => messages.map(({ user, ...msg }) => ({
    ...msg,
    userId: user,
  }))),
  addMessage,
  fetchUser,
  receivedMessage$: unstatedMessageSubject$,
});

window.__UNSTATED__ = {
  addMessage: addUnstatedMessage,
  editUsername,
  messageReceived: unstatedMessageSubject$.next.bind(unstatedMessageSubject$),
};

const renderMessageList = title => ({ messages, loading }) => {
  return (
    loading ? <p>Chargement...</p> : (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">{title}</h1>
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
  );
};


class App extends Component {
  render() {
    return (
      <div>
        <div style={{ width: '24%', display:'inline-block' }}>
          <ApolloProvider client={client}>
            <ApolloMessages>
              {renderMessageList('Apollo link State')}
            </ApolloMessages>
          </ApolloProvider>
        </div>
        <div style={{ width: '24%', display: 'inline-block' }}>
          <Provider store={store}>
            <ReduxMessages>
              {renderMessageList('Redux')}
            </ReduxMessages>
          </Provider>
        </div>
        <div style={{ width: '24%', display: 'inline-block' }}>
          <MobxProvider {...stores}>
            <MobxMessages>
              {renderMessageList('Mobx')}
            </MobxMessages>
          </MobxProvider>
        </div>
        <div style={{ width: '24%', display: 'inline-block' }}>
          <UnstatedMessages>
            {renderMessageList('Unstated')}
          </UnstatedMessages>
        </div>
      </div>
    );
  }
}

export default App;
