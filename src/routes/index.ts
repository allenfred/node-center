import * as express from 'express';
const router = express.Router();

router.use('/', (req, res) => {
  res.send('OK');
});

export default router;
