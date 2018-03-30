import { createStore, combineReducers, applyMiddleware } from 'redux';
import merge from 'lodash/merge';
import thunk from 'redux-thunk';
import { createActions, handleActions } from 'redux-actions';

import { fetchUser, fetchMessages, addMessage as _addMessage } from './db';
import resolveMessages from './resolveMessages';

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

export const getMessages = () => async dispatch => {
  dispatch({ type: 'GET_MESSAGES' });
  const messages = await resolveMessages({ fetchUser, fetchMessages });
  dispatch(messagesReceived(messages));
};

const addMessageInCache = ({ id, content, userId, fetchUser }) => async dispatch => {
  const user = await fetchUser(userId);
  dispatch(messageAdded({
    id,
    content,
    user,
  }));
};

const editUserInCache = ({ userId, username }) => dispatch => dispatch(usernameEdited({
  userId,
  username,
}));

export const addMessage = ({ userId, content }) => async dispatch => {
  const message = await _addMessage({ userId, content });
  return addMessageInCache({ id: message.id, userId, content, fetchUser })(dispatch);
};

export const messageReceived = ({ id, user, content }) => addMessageInCache({ id, content, userId: user, fetchUser });

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

export const messagesSelector = state => ({
  messages: Object.values(state.messages).map(msg => ({
    ...msg,
    user: state.users[msg.user],
  })),
});

const store = createStore(reducer, applyMiddleware(thunk));

window.__REDUX__ = {
  editUser: ({ userId, username }) => editUserInCache({ userId, username })(store.dispatch),
  addMessage: ({ userId, content }) => store.dispatch(addMessage({ userId, content })),
  messageReceived: ({ id, user, content }) => store.dispatch(messageReceived({ id, user, content })),
  store,
};

export default store;
