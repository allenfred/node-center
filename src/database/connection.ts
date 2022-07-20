const mongoose = require('mongoose');
const sh_host = '81.68.80.59';
const host = sh_host;
const port = '27011';
const db = 'crypto';
const username = 'data_manager';
const password = 'qazwsx123=-*';

mongoose.set('useCreateIndex', true);

async function connect() {
  await mongoose.connect(
    `mongodb://${username}:${password}@${host}:${port}/${db}`,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      poolSize: 50,
    },
  );
}

export default connect;
