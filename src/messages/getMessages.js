const getMessages = async({ loadMessages, loadUser }) => {
  const messages = await loadMessages();
  return messages.map(async msg => {
    const { userId, ...msgRest } = msg;
    return {
      ...msgRest,
      user: await loadUser(userId),
    };
  });
};

export default getMessages;
