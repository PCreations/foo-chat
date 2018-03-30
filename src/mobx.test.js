/*global expect beforeAll*/
import { createStore, messageSelector, areMessagesLoadingSelector } from './mobx';

const fetchMessages = () => Promise.resolve([{
  id: 1,
  content: 'message 1',
  user: 1,
}, {
  id: 2,
  content: 'message 2',
  user: 1,
}, {
  id: 3,
  content: 'message 3',
  user: 2
}]);

const fetchUser = id => Promise.resolve([{
  id: 1,
  username: "user 1",
}, {
  id: 2,
  username: "user 2",
}, {
  id: 3,
  username: "user 3",
}][id - 1]);

const createTestStore = () => createStore({ fetchMessages, fetchUser });

test('messagesSelector should return an empty Map for initial state', () => {
  const store = createTestStore();
  store.subscribe(state => {
    expect(messageSelector(state)).toEqual([]);
  });
});

test('areMessagesLoadingSelector should return false for initial state', () => {
  const store = createTestStore();
  store.subscribe(state => {
    expect(areMessagesLoadingSelector(state)).toEqual(false);
  });
});

describe('fetch messages', () => {
  const store = createTestStore();
  const stateUpdates = [];
  beforeAll(() => new Promise(resolve => {
    store.subscribe(stores => {
      stateUpdates.push({
        messages: messageSelector(stores),
        loading: areMessagesLoadingSelector(stores),
      });
      if (stateUpdates.length === 3) {
        resolve();
      }
    });
    store.fetchMessages();
  }));

  test('first state update : message should be loading', () => {
    expect(stateUpdates[1].loading).toEqual(true);
  });

  test('second state update : messages should be correctly loaded', () => {
    expect(stateUpdates[2].loading).toEqual(false);
    expect(stateUpdates[2].messages).toEqual([{
      id: 1,
      content: 'message 1',
      user: {
        id: 1,
        username: 'user 1',
      },
    }, {
      id: 2,
      content: 'message 2',
      user: {
        id: 1,
        username: 'user 1',
      },
    }, {
      id: 3,
      content: 'message 3',
      user: {
        id: 2,
        username: 'user 2',
      }
    }]);
  });
});

describe('editing the username of an user', () => {
  const store = createTestStore();
  const stateUpdates = [];
  beforeAll(() => new Promise(async resolve => {
    store.subscribe(stores => {
      stateUpdates.push({
        messages: messageSelector(stores),
        loading: areMessagesLoadingSelector(stores),
      });
      console.log(stateUpdates, stateUpdates.length);
      if (stateUpdates.length === 4) {
        console.log('RESOLVING');
        resolve();
      }
    });
    await store.fetchMessages();
    store.editUsername({ userId: 1, username: 'foobar' });
  }));

  test('should update correctly the messages list', () => {
    expect(stateUpdates[3].messages).toEqual([{
      id: 1,
      content: 'message 1',
      user: {
        id: 1,
        username: 'foobar',
      },
    }, {
      id: 2,
      content: 'message 2',
      user: {
        id: 1,
        username: 'foobar',
      },
    }, {
      id: 3,
      content: 'message 3',
      user: {
        id: 2,
        username: 'user 2',
      }
    }]);
  });
});
