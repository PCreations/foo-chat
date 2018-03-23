import { makeExecutableSchema } from 'graphql-tools';

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

const typeDefs = `
	type Message {
		id: ID!
		content: String!
		user: User!
	}
	type User {
		id: ID!
		username: String!
	}
  type Query {
    messages: [Message]!
  }
`;

const resolvers = {
  Message: {
    user: ({ user }) => db.users[user]
  },
  Query: {
    messages: (root, args, context) => Object.values(db.messages),
  },
};

export default makeExecutableSchema({
  typeDefs,
  resolvers,
});
