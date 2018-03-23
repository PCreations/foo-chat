import { createActions } from 'redux-actions';

export const { setIsLoading, addMessage, messageReceived, fetchMessages } = createActions({
  SET_IS_LOADING: isLoading => ({ isLoading }),
  ADD_MESSAGE: ({ userId, content }) => ({ userId, content }),
  MESSAGE_RECEIVED: ({ id, userId, content }) => ({ id, userId, content }),
}, 'FETCH_MESSAGES');
