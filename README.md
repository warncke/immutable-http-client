# immutable-http-client

HTTP client for immutable-core based on request-promise.

## Native async/await

Immutable HTTP Client requires Node.js v7.6.0 or greater with native
async/await support.

## Getting HTTP Client instance

    const http = require('immutable-http-client')

Immutable HTTP Client provides a singleton global client instance that will be
returned whenever it is required.

## Methods

### delete (url, options, session)

    http.delete('http://foo.com/foo/id')

### get (url, options, session)

    http.get('http://foo.com/foo/id')

### post (url, options, session)

    http.post('http://foo.com/foo', {
        body: {
            foo: 'foo'
        }
    })

### put (url, options, session)

    http.put('http://foo.com/foo/id', {
        body: {
            foo: 'bar'
        }
    })

Immutable HTTP Client provides 4 convenience methods for the most commonly used
HTTP request methods. All of these methods share the same interface and
implementation. They only differ in setting the respective HTTP request method
appropriately.

The options object is optional and is used to set request-promise options for
the request.

The session argument is an immutable-core session object.

## request (options, session)

The request method is what Immutable HTTP Client uses internally to implement
the delete, get, post, and put methods.

The options for the request method are options for request-promise.

If the body option is an object and the `json` option is not set then the json
option will be set to true so that the body is serialized as JSON for the
request.

The `simple` option is always set to false so that HTTP errors will *not*
result in promise rejections.

With Immutable HTTP Client a rejection will only occur on a system level error
not on HTTP response code errors.

If the HTTP response has the content-type application/json header set and the
`json` option is not explicitly set then the response will be parsed using
JSON.parse. If the response is not valid JSON this will throw an exception.

The response that will be returned by all methods is a simple object that
includes the body (string|object), rawHeaders (array), and statusCode (integer).

## Setting a log client

    const http = require('immutable-http-client')

    http.logClient(logClient)

The logClient sets the logging client which will be used to log all http
requests and responses.