//@flow
import React from 'react';
import { ApolloClient } from 'apollo-client';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { withClientState } from 'apollo-link-state';
import gql from 'graphql-tag';
import { Query, ApolloProvider } from 'react-apollo';

import createStore from './createStore';
import type { StorePayload } from './createStore';

import GET_MESSAGES from './getMessages.gql';



const createStateContainer = ({
  initialState,
  fetchMessages,
  addMessage,
  fetchUser,
}) => {
  const cache = new InMemoryCache();

  const addMessageInCache = async({ cache, message, userId }) => {
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
      id: message.id,
      content: message.content,
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
        id
        username
      }
    `;
    const user = cache.readFragment({ fragment, id });
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
            const { userId, ...rest } = msg;
            return ({
              ...rest,
              userId,
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

  return {
    dispatchMessageReceived: message => {
      addMessageInCache({
        message,
        cache: client,
        userId: message.userId,
        fetchUser,
      })
    },
    client, // TODO EDIT THAT
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
      client.mutate({
        mutation,
        variables: { userId, content },
      });
    },
    editUsername: ({ userId, username }) => {
      editUserInCache({ cache: client, userId, username });
    },
  };
};

const createApolloStore = (storePayload: StorePayload) => {
  const { receivedMessage$, ...stateContainerProps } = storePayload;
  return createStore({
    stateContainer: createStateContainer(stateContainerProps),
    messageListStateFactory: stateContainer => {
      const MessageListState = ({ children }) => {
        return (
          <ApolloProvider client={stateContainer.client}>
            <Query
              query={GET_MESSAGES}
              ssr={false}
            >
              {({ data, loading, error }) => {
                return children({ messages: (data.messages || []).map(msg => ({
                    id: msg.id,
                    content: msg.content,
                    user: {
                      id: msg.user.id,
                      username: msg.user.username,
                    },
                  })),
                  loading,
                });
              }}
            </Query>
          </ApolloProvider>
        );
      };
      return MessageListState;
    },
    receivedMessage$,
  });
}

export default createApolloStore;
