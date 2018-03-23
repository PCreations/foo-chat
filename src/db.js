const db = {
  messages: {
    m1: {
      id: 'm1',
      content: 'message 1',
      user: 'u1',
    },
    m2: {
      id: 'm2',
      content: 'message 2',
      user: 'u2',
    },
    m3: {
      id: 'm3',
      content: 'message 3',
      user: 'u1',
    },
  },
  users: {
    u1: {
      id: 'u1',
      username: 'user 1',
    },
    u2: {
      id: 'u2',
      username: 'user 2',
    },
    u3: {
      id: 'u3',
      username: 'user 3',
    },
  },
};

export const fetchUser = userId => new Promise(resolve => setTimeout(() => {
  const user = db.users[userId];
  resolve(user);
}, 500));

export const fetchMessages = () => new Promise(resolve => setTimeout(() => resolve(Object.values(db.messages)), 500));

let currMsgId = 3;

export const addMessage = ({ userId, content }) => new Promise(resolve => setTimeout(() => {
  const id = `m${++currMsgId}`;
  const message = {
    id,
    content,
    user: userId,
  };
  db.messages[id] = message;
  resolve(message);
}), 200);


window.__DB__ = db;
