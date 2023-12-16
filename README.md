# immutable-http-client

HTTP client for immutable-core based on [node-fetch](https://www.npmjs.com/package/node-fetch).

## v0.8.0

Switch to using [node-fetch](https://www.npmjs.com/package/node-fetch) instead
of [request-promise](https://www.npmjs.com/package/request-promise) which is
now deprecated. It is better to use a single API on front and back end so
switching to fetch was desirable for that reason in any case.

Removed automock functionality which was experimental and will likely be
replaced with superior functionality instead of being continued.

Remove the custom response handling logic. This makes the client slightly less
convenient but now that it is targeting the fetch standard it is better to
provide the raw fetch response for maximum compatibility will calling code.

## Getting HTTP Client instance

    const http = require('immutable-http-client')

Immutable HTTP Client provides a singleton global client instance that will be
returned whenever it is required.

## Methods

### fetch (url, options, session)

Make a request using [node-fetch](https://www.npmjs.com/package/node-fetch).

## Setting a log client

    const http = require('immutable-http-client')

    http.logClient(logClient)

The logClient sets the logging client which will be used to log all http
requests and responses.