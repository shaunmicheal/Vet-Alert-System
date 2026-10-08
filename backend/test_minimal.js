const express = require('express');
const app = express();
const r = express.Router();
r.get('/', (req, res) => res.send('hi'));
app.use('/api/test', r);
const http = require('http');
const s = http.createServer();
s.listen(0, async () => {
  const res = await fetch('http://127.0.0.1:' + s.address().port + '/api/test');
  console.log('minimal router mount works, status:', res.status);
  s.close();
  process.exit(0);
});
