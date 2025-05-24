This is a session middleware for griffinwebserver_v2.

Each request with no session will get a 32char random sessionid as a cookie that live for 12hours, that act as the session identifier.
If a sessionid for a existing session exists is in the cookies, that session will be attached to res.session.

Use the res.session.data object to store things like username etc.
The res.session also contains information about time to live for session as well create time.
Any changes you do to res.session will be saved and available on next request.

Here is a more advance example using the session middleware to handle login among other things.

```javascript
const Webserver = require('griffinwebserver_v2');
const session = require('griffinwebserver_v2-middleware-session');
const webserver = new Webserver('www/', 8080);
webserver.start();

function isJSON(str) {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
}

function apiFunction(req, res) {
  const baseUrl = 'http://' + req.headers.host + '/';
  const parsedUrl = new URL(req.url, baseUrl);

  // split the path into parts after removing leading /
  const pathParts = parsedUrl.pathname.substring(1).split('/');
  const apiName = pathParts[1]; // the second part of the path is the API name, first is /api/

  let responseBody;
  let body = []; // any posted data will go here
  let data = {};

  req.on('data', (data) => {
    body.push(data)
  });

  req.on('end', function () {
    dataDone();
  })

  function dataDone() {
    // convert posted data to data
    body = Buffer.concat(body).toString(); // convert to string
    if(isJSON(body)) body = JSON.parse(body); // parse the data if it is json

    req.session.data.counter = (req.session.data.counter || 0) + 1; // increment the counter of request made in this session
    req.statusCode = 200; // default status is Ok
    switch(apiName) {
      case 'hello':
        responseBody = 'Hello, world!';
        break;
      case 'counter':
        responseBody = 'Counter: ' + req.session.data.counter;
        break;
      case 'login':
        if(body.username === 'admin' && body.password === 'password') {
          req.session.data.loggedIn = true;
          responseBody = 'Logged in';
        } else {
          req.session.data.loggedIn = false;
          req.statusCode = 401;
          responseBody = 'Invalid username or password';
        }
       break;
      case 'logout':
        if(req.session.data.loggedIn) {
          req.session.data.loggedIn = false;
          responseBody = 'Logged out';
        } else {
          req.statusCode = 401;
          responseBody = 'Not logged in';
        }
       break;
        default:
          req.statusCode = 404;
          responseBody = 'Invalid API name';
    }
    res.end(responseBody);
  }
}

webserver.addMiddleware('/api/', session);
webserver.addEndpoint('/api/', apiFunction);
```
