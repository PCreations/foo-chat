/*global expect*/

import getMessages from '../getMessages';

describe('getMessages', () => {
  test('given a loadMessages and loadUser functions it should return a promise with proper messages', async () => {
    const expectedMessages = [{
      id: 'm1',
      content: 'message 1',
      user: {
        id: 'u1',
        username: 'user 1'
      }
    }, {
      id: 'm2',
      content: 'message 2',
      user: {
        id: 'u2',
        username: 'user 2',
      },
    }, {
      id: 'm3',
      content: 'message 3',
      user: {
        id: 'u2',
        username: 'user 2',
      },
    }];
    const loadMessages = () => Promise.resolve([{
      id: 'm1',
      content: 'message 1',
      userId: 'u1',
    }, {
      id: 'm2',
      content: 'message 2',
      userId: 'u2',
    }, {
      id: 'm3',
      content: 'message 3',
      userId: 'u2',
    }]);
    const loadUser = userId => Promise.resolve({
      u1: {
        id: 'u1',
        username: 'user 1',
      },
      u2: {
        id: 'u2',
        username: 'user 2',
      },
    }[userId]);
    const messages = await getMessages({ loadMessages, loadUser });
    expect(messages).toEqual(expectedMessages);
  });
});
