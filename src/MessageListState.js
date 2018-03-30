import React, { Component } from 'react';
import { connect } from 'react-redux';
// import { observer, inject } from 'mobx-react';
import { getMessages } from './store';
// import { Query } from 'react-apollo';
// import GET_MESSAGES from './getMessages.gql';


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

export const MessageListStateRedux = withMessagesFromRedux(({ messages, loading, children }) =>
    !(messages.length === 0 && loading) && children({ messages, loading })

    /*export const MessageListStateApollo = ({ children }) => (
      <Query
        query={GET_MESSAGES}
        ssr={false}
      >
        {({ data, loading, error }) => children({ messages: (data.messages || []).map(msg => ({
          id: msg.id,
          content: msg.content,
          user: {
            id: msg.user.id,
            username: msg.user.username,
          },
        })), loading })}
      </Query>
    );

    export const MessageListStateMobx = inject('messageStore')(observer(class MobxMessages extends Component {
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
    }));*/
