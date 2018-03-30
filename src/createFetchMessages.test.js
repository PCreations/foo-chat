/*global expect*/
import createFetchMessages, { createMessageMapper } from './createFetchMessages';

describe('given the createFetchMessages function', () => {
  describe('when given a fetchFn and messageMapper function', () => {
    test('then build a fetchMessages function that returns the correctly mapped messages', async() => {
      const fetchFn = () => Promise.resolve([{
        id: 'm1',
        someDbDependantSyntaxFieldForUserId: 'u1',
        content: 'message 1',
      }, {
        id: 'm2',
        someDbDependantSyntaxFieldForUserId: 'u2',
        content: 'message 2',
      }]);
      const messageMapper = createMessageMapper({
        getIdField: msg => msg.id,
        getUserIdField: msg => msg.someDbDependantSyntaxFieldForUserId,
        getContentField: msg => msg.content,
      });

      const fetchMessages = createFetchMessages({
        fetchFn,
        messageMapper,
      });

      const messages = await fetchMessages();

      expect(messages).toEqual([{
        id: 'm1',
        userId: 'u1',
        content: 'message 1',
      }, {
        id: 'm2',
        userId: 'u2',
        content: 'message 2',
      }]);
    });
  });
});
