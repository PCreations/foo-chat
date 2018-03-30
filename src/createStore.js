const createStore = ({
  stateContainer,
  receivedMessage$,
  messageListStateFactory,
}) => {

  receivedMessage$.subscribe(stateContainer.dispatchMessageReceived);

  const MessageListState = messageListStateFactory(stateContainer);

  return {
    MessageListState,
    addMessage: stateContainer.addMessage,
    editUsername: stateContainer.editUsername,
  };
};

export default createStore;
