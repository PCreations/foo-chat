import merge from 'lodash/merge';

const messageResolver = async({ fetchMessages, fetchUser }) => {
  const messages = await fetchMessages();
  const allPromises = messages
    .map(msg => msg.user)
    .map(fetchUser)
    .map(fetchUserPromise => fetchUserPromise.then(user => ({
      [user.id]: user
    })));
  const users = await Promise.all(allPromises);
  const usersMap = users.reduce(merge, {});
  const resolvedMessages = messages.map(msg => ({
    ...msg,
    user: usersMap[msg.user],
  }));
  return resolvedMessages;
};

export default messageResolver;
