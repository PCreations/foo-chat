import map from 'lodash/fp/map';

export const createMessageMapper = ({ getIdField, getUserIdField, getContentField }) =>
  msg => ({
    id: getIdField(msg),
    userId: getUserIdField(msg),
    content: getContentField(msg),
  });

const createFetchMessages = ({ fetchFn, messageMapper }) => () =>
  fetchFn().then(map(messageMapper));

export default createFetchMessages;
