import React from 'react';
import { Container, Subscribe, Provider } from 'unstated';
import merge from 'lodash/merge';
import createStore from './createStore';

const createUnstatedContainer = ({
  initialState,
  fetchMessages,
  addMessage,
  fetchUser,
}) => {
  class MessageListStateContainer extends Container {
    state = {
      messages: [],
      loading: false,
    };

    async messageReceived({ id, content, userId }) {
      const user = await fetchUser(userId);
      this.setState({
        messages: [
          ...this.state.messages,
          {
            id,
            content,
            user,
          },
        ],
      });
    }

    async addMessage({ content, userId }) {
      const mesRes = await addMessage({ content, userId });
      const user = await fetchUser(userId);
      this.setState({
        messages: [
          ...this.state.messages,
          {
            id: mesRes.id,
            content: mesRes.content,
            user,
          },
        ],
      });
    }

    async fetchMessages() {
      this.setState({
        loading: true,
      });
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
      this.setState({
        loading: false,
        messages: resolvedMessages,
      });
    }

    editUsername({ userId, username }) {
      this.setState({
        messages: this.state.messages.map(msg => ({
          ...msg,
          user: msg.user.id === userId ? {
            id: msg.user.id,
            username,
          } : msg.user,
        })),
      });
    }
  }

  const messageListStateContainer = new MessageListStateContainer();

  return {
    dispatchMessageReceived: messageListStateContainer.messageReceived.bind(messageListStateContainer),
    addMessage: messageListStateContainer.addMessage.bind(messageListStateContainer),
    editUsername: messageListStateContainer.editUsername.bind(messageListStateContainer),
    messageListStateContainer,
    MessageListStateContainer,
  };
};

const createUnstatedStore = ({ receivedMessage$, ...stateContainerProps }) =>
  createStore({
    stateContainer: createUnstatedContainer(stateContainerProps),
    messageListStateFactory: stateContainer =>
      class MessageListState extends React.Component {
        componentWillMount() {
          stateContainer.messageListStateContainer.fetchMessages();
        }
        render() {
          return (
            <Provider inject={[stateContainer.messageListStateContainer]}>
              <Subscribe to={[stateContainer.MessageListStateContainer]}>
                {messageListState => this.props.children(messageListState.state)}
              </Subscribe>
            </Provider>
          );
        }
      },
    receivedMessage$,
  });


export default createUnstatedStore;
