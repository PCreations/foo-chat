/*global expect*/
import { Subject } from 'rxjs/Rx';
import gql from 'graphql-tag';

import client from './client';

const store = {
  messages: {
    getAll() {
      const querySubject = new Subject();
      client.watchQuery({
        query: gql `
          query {
            messages @client {
              id
              content,
              user {
                id
                username
              }
            }
          }
        `,
      }).subscribe(console.log);
      return querySubject.do(console.log).map(({ data, loading }) => ({
        loading,
        messages: data.messages || []
      }));
    }
  }
};

describe('given an empty list of messages', () => {
  describe('when requesting for messages', () => {
    test('then', async() => {
      expect.assertions(2);
      const updates = await new Promise(resolve => {
        store.messages.getAll().bufferCount(2).subscribe(updates => resolve(updates));
      });
      expect(updates[0]).toEqual({
        loading: true,
        messages: [],
      });
      expect(updates[1]).toEqual({
        loading: false,
        messages: [{ "content": "message 1", "id": "m1", "user": { "id": "u1", "username": "user 1" } }, { "content": "message 2", "id": "m2", "user": { "id": "u2", "username": "user 2" } }, { "content": "message 3", "id": "m3", "user": { "id": "u1", "username": "user 1" } }],
      });
    });
  });
});
