//@flow
import { Component } from 'react';

export type MessageReceived = {
  id: string,
  userId: string,
  content: string,
};

export type StateContainer = {
  dispatchMessageReceived: (message: MessageReceived) => void,
  addMessage: (payload: { content: string, userId: string }) => void,
  editUsername: (payload: { userId: string, username: string }) => void,
};

export type Stream<T> = {
  subscribe: (next: (data: T) => void) => void,
};

export type MessageListState = Component<{ children: ({ messages: Array<{}>, loading: boolean }) => any}>;

export type StorePayload = {
  stateContainer: StateContainer,
  receivedMessage$: Stream<MessageReceived>,
  messageListStateFactory: (container: StateContainer) => MessageListState,
};

export type Store = {
  MessageListState: MessageListState,
  addMessage: (payload: { content: string, userId: string }) => void,
  editUsername: (payload: { userId: string, username: string }) => void,
};

const createStore = ({
  stateContainer,
  receivedMessage$,
  messageListStateFactory,
}: StorePayload): Store => {

  receivedMessage$.subscribe(stateContainer.dispatchMessageReceived);

  const MessageListState = messageListStateFactory(stateContainer);

  return {
    MessageListState,
    addMessage: stateContainer.addMessage,
    editUsername: stateContainer.editUsername,
  };
};

export default createStore;
