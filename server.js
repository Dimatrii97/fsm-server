const express = require('express');

const server = express();

const path = require('path');

const cors = require('cors');

const bodyParser = require('body-parser');

server.use(bodyParser.json());
server.use(
  cors({
    origin: ['http://localhost:8080', 'https://localhost:8080'],
    credentials: true,
    exposedHeaders: ['set-cookie'],
  })
);
const routerUsers = require('./router/files');
server.use(routerUsers);

const dir = path.join(__dirname, 'img');

server.use(express.static(dir));


server.listen(5000, () => {
  console.log('server-start');
});
