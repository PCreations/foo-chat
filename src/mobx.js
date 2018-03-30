import { observable, action, runInAction, autorun } from 'mobx';
import memoize from 'lodash/memoize';

import { fetchUser as __fetchUser, fetchMessages as __fetchMessages, addMessage as __addMessage } from './db';


const createUser = memoize(async({ id, username }) => observable({
  id,
  username,
  setUsername(username) {
    this.username = username;
  },
}, {
  setUsername: action,
}));

const createMessage = memoize(async({ id, content, userId, userStore }) => observable({
  id,
  content,
  user: await (userStore.resolveUser(userId)),
}));

const createUserStore = ({ fetchUser }) => observable({
  users: new Map(),
  async resolveUser(userId) {
    if (this.users.has(userId)) {
      return this.users.get(userId);
    }
    const userRes = await fetchUser(userId);
    const user = await createUser(userRes);
    runInAction(() => this.users.set(user.id, user));
    return user;
  },
});

const createMessageStore = ({ createMessage, userStore, fetchMessages, saveMessage }) => observable({
  isLoading: false,
  messages: new Map(),
  async messageReceived({ id, userId, content }) {
    const message = await createMessage({ id, userId, content, userStore });
    runInAction(() => this.messages.set(message.id, message));
    return message;
  },
  async addMessage({ userId, content }) {
    const messageRes = await saveMessage({ userId, content });
    const message = await createMessage({ id: messageRes.id, userId, content, userStore });
    runInAction(() => this.messages.set(message.id, message));
    return message;
  },
  async fetchMessages() {
    runInAction(() => this.isLoading = true);
    const messagesRes = await fetchMessages();
    const messagesEntries = await Promise.all(messagesRes.map(async msgRes => {
      const message = await createMessage({
        id: msgRes.id,
        content: msgRes.content,
        userId: msgRes.user,
        userStore,
      });
      return [message.id, message];
    }));
    runInAction(() => {
      this.messages = new Map(messagesEntries);
      this.isLoading = false;
    });
  },
});

const userStore = createUserStore({ fetchUser: __fetchUser });
const messageStore = createMessageStore({ userStore, createMessage, fetchMessages: __fetchMessages, saveMessage: __addMessage });

const stores = observable({
  userStore,
  messageStore
});

window.__MOBX__ = {
  stores,
  subscribe: next => autorun(() => next(stores)),
  selectors: {
    messages: stores => ({
      messages: stores.messageStore.messages.toJS(),
      loading: stores.messageStore.isLoading,
    }),
    users: stores => stores.userStore.users,
  },
};

export const createStore = ({ fetchUser, fetchMessages, addMessage }) => {
  const userStore = createUserStore({ fetchUser });
  const messageStore = createMessageStore({ userStore, createMessage, fetchMessages, saveMessage: addMessage });

  const stores = observable({
    userStore,
    messageStore,
  });

  return {
    subscribe: next => autorun(() => next(stores)),
    fetchMessages: () => messageStore.fetchMessages(),
    editUsername: ({ userId, username }) => userStore.users.get(userId).setUsername(username),
  };
};

export const messageSelector = stores => {
  const messages = [];
  stores.messageStore.messages.forEach(msg => messages.push({
    ...msg,
    user: {
      id: msg.user.id,
      username: msg.user.username,
    },
  }));
  return messages;
};

export const areMessagesLoadingSelector = stores => stores.messageStore.isLoading;

export default stores;
