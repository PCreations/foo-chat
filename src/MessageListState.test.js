/*global beforeAll afterAll expect jest*/
import React from 'react';
import { mount } from 'enzyme';
import { Subject } from 'rxjs/Rx';

import createStore from './createUnstatedStore';

/*import { MessageListStateRedux, MessageListStateMobx, MessageListStateApollo } from './MessageListState';*/

const waitUntilMultipleCalls = ({ mockFn, callsCount, timeout = 1000, interval = 100 }) => new Promise((resolve, reject) => {
  const timeoutId = setTimeout(() => reject(new Error(`timeout reached, renderProp has been called ${mockFn.mock.calls.length} time(s) but was expected to be called ${callsCount} times`)), timeout);
  const intervalId = setInterval(() => {
    if (mockFn.mock.calls.length === callsCount) {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
      resolve();
    }
    if (mockFn.mock.calls.length > callsCount) {
      reject(new Error('mockFn has not been cleared'));
    }
  }, interval);
});

const createTestStore = (initialState = {}, receivedMessage$) => createStore({
  initialState,
  fetchMessages: () => Promise.resolve([{
    content: 'message 1',
    id: 'm1',
    userId: 'u1',
  }, {
    content: 'message 2',
    id: 'm2',
    userId: 'u1',
  }]),
  addMessage: ({ userId, content }) => Promise.resolve({
    id: '__TEST_ID__',
    content,
    userId,
  }),
  fetchUser: userId => Promise.resolve(({
    u1: {
      id: 'u1',
      username: 'user 1',
    },
    u2: {
      id: 'u2',
      username: 'user 2',
    },
    u3: {
      id: 'u3',
      username: 'user 3',
    },
  })[userId]),
  receivedMessage$,
});

const setupTest = initialState => {
  const messageReceivedSubject$ = new Subject();
  const { MessageListState, addMessage, editUsername } = createTestStore(initialState, messageReceivedSubject$);
  const renderProp = jest.fn(() => null);
  mount(<MessageListState>{renderProp}</MessageListState>);
  return {
    renderProp,
    addMessage,
    editUsername,
    messageReceivedSubject$,
  };
};

describe('given an empty initial messages list', () => {
  describe('when MessageListState is fetching messages', () => {
    let renderProp;
    beforeAll(() => {
      ({ renderProp } = setupTest());
      return waitUntilMultipleCalls({
        mockFn: renderProp,
        callsCount: 2,
      });
    });
    test('then pass loading = true and an empty messages list to the render prop', () => {
      expect(renderProp.mock.calls[0]).toEqual([{
        loading: true,
        messages: [],
      }]);
    });

    test('then pass loading = false and the proper messages list to the render prop', () => {
      expect(renderProp.mock.calls[1]).toEqual([{
        loading: false,
        messages: [{
          content: 'message 1',
          id: 'm1',
          user: {
            id: 'u1',
            username: 'user 1',
          },
        }, {
          content: 'message 2',
          id: 'm2',
          user: {
            id: 'u1',
            username: 'user 1',
          },
        }]
      }]);
    });
  });

  describe('when a new message is received from an already known user', () => {

    test('then pass loading = false and the messages list appended with the correct message', async() => {
      const { renderProp, messageReceivedSubject$ } = setupTest();
      await waitUntilMultipleCalls({
        mockFn: renderProp,
        callsCount: 2,
      });
      renderProp.mockClear();
      messageReceivedSubject$.next({ id: 'm3', userId: 'u2', content: 'message 3' });
      await waitUntilMultipleCalls({
        mockFn: renderProp,
        callsCount: 1
      });
      expect(renderProp.mock.calls[0]).toEqual([{
        loading: false,
        messages: [{
          content: 'message 1',
          id: 'm1',
          user: {
            id: 'u1',
            username: 'user 1',
          },
        }, {
          content: 'message 2',
          id: 'm2',
          user: {
            id: 'u1',
            username: 'user 1',
          },
        }, {
          content: 'message 3',
          id: 'm3',
          user: {
            id: 'u2',
            username: 'user 2',
          },
        }],
      }]);
    });
  });

  describe('when a new message is received from an user NOT already known', () => {

    test('then pass loading = false and the messages list appended with the correct message', async() => {
      const { renderProp, messageReceivedSubject$ } = setupTest();
      await waitUntilMultipleCalls({
        mockFn: renderProp,
        callsCount: 2,
      });
      renderProp.mockClear();
      messageReceivedSubject$.next({ id: 'm3', userId: 'u3', content: 'message 3' });
      await waitUntilMultipleCalls({
        mockFn: renderProp,
        callsCount: 1
      });
      expect(renderProp.mock.calls[0]).toEqual([{
        loading: false,
        messages: [{
          content: 'message 1',
          id: 'm1',
          user: {
            id: 'u1',
            username: 'user 1',
          },
        }, {
          content: 'message 2',
          id: 'm2',
          user: {
            id: 'u1',
            username: 'user 1',
          },
        }, {
          content: 'message 3',
          id: 'm3',
          user: {
            id: 'u3',
            username: 'user 3',
          },
        }],
      }]);
    });

  });

  describe('when a message is added', () => {
    let renderProp, addMessage;
    beforeAll(async() => {
      ({ renderProp, addMessage } = setupTest());
      await waitUntilMultipleCalls({
        mockFn: renderProp,
        callsCount: 2,
      });
      renderProp.mockClear();
      addMessage({ userId: 'u3', content: 'message added' });
      return waitUntilMultipleCalls({
        mockFn: renderProp,
        callsCount: 1,
      });
    });

    test('then pass loading = false and the message list with appended message', () => {
      expect(renderProp.mock.calls[0]).toEqual([{
        loading: false,
        messages: [{
          content: 'message 1',
          id: 'm1',
          user: {
            id: 'u1',
            username: 'user 1',
          },
        }, {
          content: 'message 2',
          id: 'm2',
          user: {
            id: 'u1',
            username: 'user 1',
          },
        }, {
          content: 'message added',
          id: '__TEST_ID__',
          user: {
            id: 'u3',
            username: 'user 3',
          },
        }],
      }]);
    });
  });

  describe('when a username is modified', () => {
    let renderProp, editUsername;
    beforeAll(async() => {
      ({ renderProp, editUsername } = setupTest());
      await waitUntilMultipleCalls({
        mockFn: renderProp,
        callsCount: 2,
      });
      renderProp.mockClear();
      editUsername({ userId: 'u1', username: 'toto' });
      return waitUntilMultipleCalls({
        mockFn: renderProp,
        callsCount: 1,
      });
    });

    test('then messages list should be updated to reflect the username change', () => {
      expect(renderProp.mock.calls[0]).toEqual([{
        loading: false,
        messages: [{
          content: 'message 1',
          id: 'm1',
          user: {
            id: 'u1',
            username: 'toto',
          },
        }, {
          content: 'message 2',
          id: 'm2',
          user: {
            id: 'u1',
            username: 'toto',
          },
        }],
      }]);
    });

  });
});
