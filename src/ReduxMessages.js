import React, { Component } from 'react';
import { connect } from 'react-redux';
import { getMessages } from './store';

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

export default withMessagesFromRedux(class SmartReduxMessages extends Component {
  componentWillMount() {
    this.props.getMessages();
  }
  render() {
    return this.props.children({ messages: this.props.messages, loading: this.props.loading });
  }
});
