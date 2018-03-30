import { ApolloClient } from 'apollo-client';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { withClientState } from 'apollo-link-state';
import gql from 'graphql-tag';

import { fetchUser, fetchMessages, addMessage } from './db';

const cache = new InMemoryCache();

const addMessageInCache = async({ cache, message, userId, fetchUser }) => {
  const query = gql `
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
  `;
  const previous = cache.readQuery({ query });
  const newMessage = {
    ...message,
    user: {
      ...await fetchUser(userId),
      __typename: 'User'
    },
    __typename: 'Message'
  };
  const data = {
    messages: previous.messages.concat([newMessage]),
  };
  cache.writeQuery({ query, data });
  return newMessage;
};

const editUserInCache = ({ cache, userId, username }) => {
  const id = `User:${userId}`;
  const fragment = gql `
    fragment user on User {
      username
    }
  `;
  const user = cache.readFragment({ fragment, id });
  console.log('existing user', user);
  const data = {
    ...user,
    username,
    __typename: 'User',
  };
  cache.writeFragment({
    fragment,
    id,
    data,
  });
  return data;
};

const stateLink = withClientState({
  cache,
  resolvers: {
    Message: {
      user: async({ userId }) => ({
        ...await fetchUser(userId),
        __typename: 'User',
      }),
    },
    Query: {
      messages: async(_, args, { cache }) => (await fetchMessages()).map(
        msg => {
          const { user, ...rest } = msg;
          return ({
            ...rest,
            userId: user,
            __typename: 'Message',
          });
        }
      ),
    },
    Mutation: {
      addMessage: async(_, { content, userId }, { cache }) => {
        const message = await addMessage({ content, userId });
        return addMessageInCache({ cache, message, userId, fetchUser });
      }
    }
  },
});

const client = new ApolloClient({
  cache,
  link: stateLink,
});

window.__APOLLO__ = {
  messageReceived: message => addMessageInCache({
    message,
    cache: client,
    userId: message.user,
    fetchUser,
  }),
  editUser: ({ userId, username }) => {
    return editUserInCache({ cache: client, userId, username });
  },
  addMessage: ({ userId, content }) => {
    const mutation = gql `
      mutation AddMessage($userId: ID!, $content: String!) {
        addMessage(userId: $userId, content:$content) @client {
          id
          content
          user {
            id
            username
          }
        }
      }
    `;
    return client.mutate({
      mutation,
      variables: { userId, content },
    });
  },
};

export default client;
