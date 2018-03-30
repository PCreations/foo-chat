import React from 'react';
import { observable, action, runInAction } from 'mobx';
import memoize from 'lodash/memoize';
import { observer } from 'mobx-react';
import withProps from 'recompose/withProps';
import compose from 'recompose/compose';

const createStore = ({
  initialState,
  fetchMessages,
  addMessage,
  fetchUser,
  receivedMessage$,
}) => {
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
          userId: msgRes.userId,
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

  const userStore = createUserStore({ fetchUser });
  const messageStore = createMessageStore({ userStore, createMessage, fetchMessages, saveMessage: addMessage });

  receivedMessage$.subscribe(messageStore.messageReceived.bind(messageStore));

  const MessageListState = compose(
    withProps({ messageStore }),
    observer,
  )(class MobxMessages extends React.Component {
    componentWillMount() {
      this.props.messageStore.fetchMessages();
    }
    render() {
      let messages = [];
      this.props.messageStore.messages.forEach(msg => {
        messages.push({
          id: msg.id,
          content: msg.content,
          user: {
            id: msg.user.id,
            username: msg.user.username,
          },
        });
      });
      return this.props.children({
        messages,
        loading: this.props.messageStore.isLoading
      });
    }
  });

  return {
    MessageListState,
    addMessage: messageStore.addMessage.bind(messageStore),
    editUsername: ({ userId, username }) => userStore.users.get(userId).setUsername(username),
  };
};

export default createStore;
