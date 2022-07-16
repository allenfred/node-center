const mongoose = require('mongoose');
// HK server
// const hk_host = '8.210.170.98';
// SH server
const sh_host = '121.4.15.211';
const host = sh_host;
const port = '27011';
const db = 'crypto';
const username = 'dev';
const password = 'qazwsx123';

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
