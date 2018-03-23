/*global beforeAll expect*/
import {
  actions,
  createStore as createMessageStore,
  areMessagesLoadingSelector,
  messagesSelector,
}
from '../index';
import {
  createStore as createUserStore
}
from '../../users';
import createActionDispatcher from '../../../createActionDispatcher';
import createStoreObservable from '../../../createStoreObservable';
import createStore from '../../../createStore';

const getMessagesUseCase = ({ dispatch }) => {
  dispatch(getMessagesAction());
}

describe('dispatching setIsLoadingAction', () => {
  test('should set the "is loading" value of the store', () => {
    subscribe(store, state => expect(areMessagesLoadingSelector(state)).toBe(true));
    dispatch(store, actions.setIsLoadingAction(true));
  });
});

describe('dispatching getLessagesAction', () => {

})

describe('get messages use case', () => {
  test('toto', () => {
    getMessagesUseCase({ storeObservable$, dispatch });
  });
  describe('store updates', () => {
    const messageStore = createMessageStore();
    const userStore = createUserStore();
    const store = createStore({ messageStore, userStore });
    const stateUpdates = [];
    beforeAll(() => new Promise(resolve => {

      store.subscribe(newState => {
        stateUpdates.push(newState);
        if (stateUpdates.length === 3) resolve();
      });
      store.dispatch(getMessagesAction());
    }));
    test('areMessagesLoading selector should return true', () => {
      expect(areMessagesLoadingSelector(stateUpdates[0])).toEqual(true);
    });
    test('messagesSelector should return a list of messages with users', () => {
      expect(messagesSelector(stateUpdates[1])).toEqual();
    });
    test('areMessagesLoading selector should return false', () => {
      expect(areMessagesLoadingSelector(stateUpdates[2])).toEqual(false);
    });
  });
});
