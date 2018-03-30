import React, { Component } from 'react';
import { createStore as createReduxStore, combineReducers, applyMiddleware } from 'redux';
import merge from 'lodash/merge';
import thunk from 'redux-thunk';
import { createActions, handleActions } from 'redux-actions';
import { connect } from 'react-redux';
import compose from 'recompose/compose';
import withProps from 'recompose/withProps';
import createStore from './createStore';

const createStateContainer = ({
  initialState,
  fetchMessages,
  addMessage,
  fetchUser,
}) => {
  /******** STATE **********/
  const defaultState = {
    messages: {},
    loadingMessages: false,
    users: {},
  };

  const { messagesReceived, messageAdded, usernameEdited } = createActions({
    MESSAGES_RECEIVED: messages => ({ messages }),
    MESSAGE_ADDED: message => ({ message }),
    USERNAME_EDITED: ({ userId, username }) => ({ userId, username }),
  });

  const resolveMessages = async() => {
    const messages = await fetchMessages();
    const allPromises = messages
      .map(msg => msg.userId)
      .map(fetchUser)
      .map(fetchUserPromise => fetchUserPromise.then(user => ({
        [user.id]: user
      })));
    const users = await Promise.all(allPromises);
    const usersMap = users.reduce(merge, {});
    const resolvedMessages = messages.map(({ userId, ...msg }) => ({
      ...msg,
      user: usersMap[userId],
    }));
    return resolvedMessages;
  };

  const getMessages = () => async dispatch => {
    dispatch({ type: 'GET_MESSAGES' });
    const messages = await resolveMessages();
    dispatch(messagesReceived(messages));
  };

  const addMessageInCache = ({ id, content, userId }) => async dispatch => {
    const user = await fetchUser(userId);
    dispatch(messageAdded({
      id,
      content,
      user,
    }));
  };

  const _addMessage = ({ userId, content }) => async dispatch => {
    const message = await addMessage({ userId, content });
    return addMessageInCache({ id: message.id, userId, content })(dispatch);
  };

  const messageReceived = ({ id, userId, content }) => addMessageInCache({ id, content, userId });

  const messagesReducer = handleActions({
    [messagesReceived.toString()]: (messages, action) => action.payload.messages.reduce((messages, msg) => ({
      ...messages,
        [msg.id]: {
        ...msg,
        user: msg.user.id,
      }
    }), {}),
    [messageAdded.toString()]: (messages, action) => ({
      ...messages,
      [action.payload.message.id]: {
        ...action.payload.message,
        user: action.payload.message.user.id,
      },
    }),
  }, defaultState.messages);

  const loadingMessagesReducer = handleActions({
    GET_MESSAGES: () => true,
    [messagesReceived.toString()]: () => false,
  }, defaultState.loadingMessages);

  const usersReducer = handleActions({
    [messagesReceived.toString()]: (users, action) => {
      const _users = ({
        ...users,
        ...action.payload.messages.map(msg => ({
          [msg.user.id]: msg.user
        })).reduce(merge, {}),
      });
      return _users;
    },
    [messageAdded.toString()]: (users, action) => {
      const _users = ({
        ...users,
        [action.payload.message.user.id]: action.payload.message.user,
      });
      return _users;
    },
    [usernameEdited.toString()]: (users, action) => ({
      ...users,
      [action.payload.userId]: {
        ...users[action.payload.userId],
        username: action.payload.username,
      },
    }),
  }, defaultState.users);

  const reducer = combineReducers({
    messages: messagesReducer,
    loadingMessages: loadingMessagesReducer,
    users: usersReducer,
  });

  const messagesSelector = state => ({
    messages: Object.values(state.messages).map(msg => ({
      ...msg,
      user: state.users[msg.user],
    })),
  });

  const store = createReduxStore(reducer, merge(initialState, defaultState), applyMiddleware(thunk));

  return {
    dispatchMessageReceived: msg => store.dispatch(messageReceived(msg)),
    addMessage: msg => store.dispatch(_addMessage(msg)),
    editUsername: ({ userId, username }) => store.dispatch(usernameEdited({ userId, username })),
    messagesSelector,
    store,
    getMessages,
  };
};

const _createReduxStore = ({ receivedMessage$, ...stateContainerProps }) => createStore({
  stateContainer: createStateContainer(stateContainerProps),
  messageListStateFactory: stateContainer => {
    const withMessagesFromRedux = compose(
      withProps({ store: stateContainer.store }),
      connect(
        state => {
          const props = ({
            ...stateContainer.messagesSelector(state),
            loading: state.loadingMessages,
          });
          return props;
        },
        dispatch => ({
          getMessages: () => dispatch(stateContainer.getMessages()),
        }),
      ),
    );

    const MessageListState = withMessagesFromRedux(class SmartReduxMessages extends Component {
      componentWillMount() {
        this.props.getMessages();
      }
      render() {
        return !(this.props.messages.length === 0 && !this.props.loading) && this.props.children({ messages: this.props.messages, loading: this.props.loading });
      }
    });

    return MessageListState;
  },
  receivedMessage$,
});

export default _createReduxStore;
