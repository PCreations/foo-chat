import { createWorker } from 'apollo-link-webworker';

import schema from './schema';

createWorker({
  schema,
  context: {},
});
