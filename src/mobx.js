import { decorate, observable, action } from 'mobx';
import memoize from 'lodash/memoize';

import { fetchUser, fetchMessages, addMessage } from './db';

import resolveMessages from './resolveMessages';

class User {
  id;
  username;

  constructor({ id, username }) {
    this.id = id;
    this.username = username;
  }

  editUsername(username) {
    this.username = username;
  }
}

decorate(User, {
  username: observable,
  editUsername: action,
});

class Message {
  id;
  content;
  user;

  constructor({ id, content, user }) {
    this.id = id;
    this.content = content;
    this.user = user;
  }
}

decorate(Message, {
  content: observable,
  user: observable,
});

const createUser = memoize(user => new User(user));

class UserStore {
  _fetchUser;
  users = {};

  constructor({ fetchUser }) {
    this._fetchUser = fetchUser;
  }

  async fetchUser(id) {
    this.fetchUserSuccess(await this._fetchUser(id));
  }

  fetchUserSuccess(user) {
    this.users[user.id] = new User(user);
  }
}

decorate(UserStore, {
  users: observable,
  fetchUser: action,
  fetchUserSuccess: action.bound,
});

class MessageStore {
  _addMessage;
  fetchUser;
  messages = observable.map(new Map());
  isLoading = observable.box(false);

  constructor({ resolveMessages, fetchUser, addMessage }) {
    this._resolveMessages = resolveMessages;
    this.fetchUser = fetchUser;
    this._addMessage = addMessage;
  }

  addMessageInCache({ messages, message, userId }) {
    this.fetchUser(userId).then(action(user => {
      messages.set(message.id, new Message({
        id: message.id,
        content: message.content,
        user: createUser(user),
      }));
    }));
  }

  messageReceived({ id, user, content }) {
    this.addMessageInCache({ messages: this.messages, message: { id, content }, userId: user });
  }

  addMessage({ userId, content }) {
    this._addMessage({ userId, content }).then(action(message => {
      this.addMessageInCache({ messages: this.messages, message, userId });
    }));
  }

  fetchMessages() {
    this.isLoading.set(true);
    this._resolveMessages().then(this.fetchMessagesSuccess);
  }

  fetchMessagesSuccess(messages) {
    this.messages = observable.map(new Map(messages.map(msg => ([msg.id, new Message({
      id: msg.id,
      content: msg.content,
      user: createUser(msg.user),
    })]))));
    console.log('LOADING FALSE');
    this.isLoading.set(false);
  }
}

decorate(MessageStore, {
  fetchMessages: action,
  messageReceived: action,
  addMessage: action,
  addMessageInCache: action,
  fetchMessagesSuccess: action.bound,
});


const stores = observable({
  userStore: new UserStore({ fetchUser }),
  messageStore: new MessageStore({ addMessage, fetchUser, resolveMessages: () => resolveMessages({ fetchMessages, fetchUser }) }),
});

window.__MOBX__ = stores;

export default stores;
