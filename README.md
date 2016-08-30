# Mockingbird
A Node.js server that mocks API request using stored request. The server can work in two different ways.

* Update mode: Mockingbird behaves as a proxy, it redirects requests received from the client application to the
configured API address. It gets responses from API and saves them in a responses JSON file. Then it sends the received
response to the client.
* Serve mode: MockingBird serves client requests reading responses from the JSON file. The response for a request is
found if its method, url, query and body are the same as one saved request. A request matches to one saved, even if the
properties order in the query string or in the JSON body is different.

A basic workflow to use Mockingbird for testing client application may be summarized in the following 4 steps.

1. Configure the client to send requests to the local port where Mockingbird is running, instead of the API address.
2. Start Mockingbird in update mode and run the test suite.
3. Now responses are saved, start Mockingbird in serve mode and run the test suite every time you need.
4. Every time responses from API change or you need to save new requests not included in previous test suite, simply
repeat step 2.

## Getting started with development
Set up the environment.
```sh
$ npm install
```
The `mockingbird-conf.json` file allows to set the port where Mockingbird should run modifying the value of `port` property.
The `format` property can be modified to define the format of the saved response file.  The `dir` specify the directory
where the response file will be saved. This string is considered as the relative path to the desired directory, starting
from Mockingbird root directory. The path must end with final slash '/' (ASCII 47).
The `api` section of the same file represents the configuration for the REST service you would mock. The `hostname` and
the `protocol` fields are mandatory, the base path (`base`) and the `port` are optional. Mockingbird will prepend the
base to each request path. In the example below the API port is not specified, so it assumes the API REST service runs at
the standard 80 port.
```json
{
  "port": 1337,
  "format": "single",
  "dir": "mocks/",
  "api": {
    "protocol": "https",
    "hostname": "example.com",
    "base": "/api/v1"
  }
}
```
With the previous configuration, Mockingbird will resolve URL will as follow:
```
http://localhost:1337/user/login --> https://example.com/api/v1/user/login
```
### File savers
File saver is the module responsible of saving requests and responses: each file saver saves requests in a different
format. File saver can be chosen modifying the `format` property of the configuration file. Available file savers are
listed below:

* `single`: requests and responses are saved in a single file;
* `protractorHttpMock`: requests and responses are saved in a protractor-http-mock module format.
## Usage
Start the server in 'update' mode, redirecting requests to the real service and storing responses:
```sh
$ npm run update filename
```
Start the server in 'serve' mode, reading from stored response file:
```sh
$ npm run serve filename
```
Delete the stored response file:
```sh
$ npm run reset filename
```
The filename must be a simple string without any file extension, and the file will be saved in the directory specified
in the configuration file. The default filename is 'response'.
## Test
Start the test suite for testing Mockingbird:
```sh
$ npm test
```
Lint the code:
```sh
$ npm run lint
```
## To do
* Add a plugin for recognize contents with different encoding from response headers
