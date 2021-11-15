var mongoose = require('mongoose');
const username = 'dev';
const password = 'qazwsx123';
// HK server
const host = '8.210.170.98';
const port = '27017';
const db = 'okex';

mongoose.set('useCreateIndex', true);

async function connect() {
  await mongoose.connect(`mongodb://${username}:${password}@${host}:${port}/${db}`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
}

export default connect;
