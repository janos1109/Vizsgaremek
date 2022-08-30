const express = require('express');

const app = express();

const port = 3000;

app.get('/', (request, response) => {
    response.send('Welcome!');
});

app.listen(port, () => {
    console.log(`Express server listening on port ${port}!`);
});