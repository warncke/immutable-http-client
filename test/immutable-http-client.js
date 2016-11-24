'use strict'

const Promise = require('bluebird')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const httpClient = require('../lib/immutable-http-client')
const httpServer = require('http-promise')
const MockLogClient = require('../mock/mock-log-client')

chai.use(chaiAsPromised)
const assert = chai.assert

const testPort = 37591
const testUrl = 'http://localhost:'+testPort

describe('immutable-http-client', function () {

    beforeEach(function () {
        httpClient.reset()
    })

    it('should make GET request', function () {
        // create test server
        var server = httpServer.createServerAsync(function (req, res) {
            // test request
            assert.strictEqual(req.headers.foo, 'bar')
            assert.strictEqual(req.method, 'GET')
            assert.strictEqual(req.url, '/foo/bar?foo=bar')
            // send response
            res.writeHead(200, {'Content-Type': 'text/html'})
            res.end('foo')
        })
        // listen
        return server.listen(testPort)
        // do request
        .then(function () {
            return httpClient.get(testUrl+'/foo/bar', {
                headers: {
                    foo: 'bar'
                },
                qs: {
                    foo: 'bar'
                }
            })
        })
        // test response
        .then(function (res) {
            assert.strictEqual(res.body, 'foo')
            assert.strictEqual(res.rawHeaders[0], 'Content-Type')
            assert.strictEqual(res.rawHeaders[1], 'text/html')
            assert.strictEqual(res.statusCode, 200)
        })
        .finally(function () {
            // stop server
            return server.close()
        })
    })

    it('should parse application/json response when json flag undefined', function () {
        // create test server
        var server = httpServer.createServerAsync(function (req, res) {
            // send response
            res.writeHead(200, {'Content-Type': 'application/json'})
            res.end('{"foo":"bar"}')
        })
        // listen
        return server.listen(testPort)
        // do request
        .then(function () {
            return httpClient.get(testUrl)
        })
        // test response
        .then(function (res) {
            assert.deepEqual(res.body, {foo: 'bar'})
        })
        .finally(function () {
            // stop server
            return server.close()
        })
    })

    it('should not parse application/json response when json flag false', function () {
        // create test server
        var server = httpServer.createServerAsync(function (req, res) {
            // send response
            res.writeHead(200, {'Content-Type': 'application/json'})
            res.end('{"foo":"bar"}')
        })
        // listen
        return server.listen(testPort)
        // do request
        .then(function () {
            return httpClient.get(testUrl, {json: false})
        })
        // test response
        .then(function (res) {
            assert.strictEqual(res.body, '{"foo":"bar"}')
        })
        .finally(function () {
            // stop server
            return server.close()
        })
    })

    it('should parse non application/json response when json flag true', function () {
        // create test server
        var server = httpServer.createServerAsync(function (req, res) {
            // send response
            res.writeHead(200, {'Content-Type': 'application/json'})
            res.end('{"foo":"bar"}')
        })
        // listen
        return server.listen(testPort, {json: true})
        // do request
        .then(function () {
            return httpClient.get(testUrl)
        })
        // test response
        .then(function (res) {
            assert.deepEqual(res.body, {foo: 'bar'})
        })
        .finally(function () {
            // stop server
            return server.close()
        })
    })

    it('should POST request with JSON encoded data in body', function () {
        // create test server
        var server = httpServer.createServerAsync(function (req, res) {
            // test request
            assert.strictEqual(req.headers['content-type'], 'application/json')
            assert.strictEqual(req.method, 'POST')
            // get request body
            var body = []
            req.on('data', function(chunk) {
                body.push(chunk)
            }).on('end', function() {
                body = Buffer.concat(body).toString();
                // test body
                assert.strictEqual(body, '{"foo":"bar"}')
                // send response
                res.writeHead(200, {'Content-Type': 'text/html'})
                res.end('foo')
            });
        })
        // listen
        return server.listen(testPort)
        // do request
        .then(function () {
            return httpClient.post(testUrl, {
                body: {
                    foo: 'bar'
                }
            })
        })
        // test response
        .then(function (res) {
            assert.strictEqual(res.body, 'foo')
            assert.strictEqual(res.statusCode, 200)
        })
        .finally(function () {
            // stop server
            return server.close()
        })
    })

    it('should POST request with form data', function () {
        // create test server
        var server = httpServer.createServerAsync(function (req, res) {
            // test request
            assert.strictEqual(req.headers['content-type'], 'application/x-www-form-urlencoded')
            assert.strictEqual(req.method, 'POST')
            // get request body
            var body = []
            req.on('data', function(chunk) {
                body.push(chunk)
            }).on('end', function() {
                body = Buffer.concat(body).toString();
                // test body
                assert.strictEqual(body, 'foo=bar')
                // send response
                res.writeHead(200, {'Content-Type': 'text/html'})
                res.end('foo')
            });
        })
        // listen
        return server.listen(testPort)
        // do request
        .then(function () {
            return httpClient.post(testUrl, {
                form: {
                    foo: 'bar'
                }
            })
        })
        // test response
        .then(function (res) {
            assert.strictEqual(res.body, 'foo')
            assert.strictEqual(res.statusCode, 200)
        })
        .finally(function () {
            // stop server
            return server.close()
        })
    })

    it('should PUT request with JSON encoded data in body', function () {
        // create test server
        var server = httpServer.createServerAsync(function (req, res) {
            // test request
            assert.strictEqual(req.headers['content-type'], 'application/json')
            assert.strictEqual(req.method, 'PUT')
            // get request body
            var body = []
            req.on('data', function(chunk) {
                body.push(chunk)
            }).on('end', function() {
                body = Buffer.concat(body).toString();
                // test body
                assert.strictEqual(body, '{"foo":"bar"}')
                // send response
                res.writeHead(200, {'Content-Type': 'text/html'})
                res.end('foo')
            });
        })
        // listen
        return server.listen(testPort)
        // do request
        .then(function () {
            return httpClient.put(testUrl, {
                body: {
                    foo: 'bar'
                }
            })
        })
        // test response
        .then(function (res) {
            assert.strictEqual(res.body, 'foo')
            assert.strictEqual(res.statusCode, 200)
        })
        .finally(function () {
            // stop server
            return server.close()
        })
    })

    it('should make DELETE request', function () {
        // create test server
        var server = httpServer.createServerAsync(function (req, res) {
            // test request
            assert.strictEqual(req.method, 'DELETE')
            assert.strictEqual(req.url, '/')
            // send response
            res.writeHead(200, {'Content-Type': 'text/html'})
            res.end('foo')
        })
        // listen
        return server.listen(testPort)
        // do request
        .then(function () {
            return httpClient.delete(testUrl)
        })
        // test response
        .then(function (res) {
            assert.strictEqual(res.statusCode, 200)
        })
        .finally(function () {
            // stop server
            return server.close()
        })
    })

    it('should log request', function () {
        // capture http request id
        var httpRequestId
        // create mock log client
        var mockLogClient = new MockLogClient({
            log: ()=> [
                // 1st call: http request
                (type, data) => {
                    // validate log data
                    assert.strictEqual(type, 'httpRequest')
                    assert.match(data.httpRequestCreateTime, /^\d\d\d\d-\d\d-\d\d \d\d:\d\d:\d\d\.\d\d\d\d\d\d$/)
                    assert.match(data.httpRequestId, /^[0-9A-Z]{32}$/)
                    assert.strictEqual(data.httpRequestMethod, 'GET')
                    assert.strictEqual(data.httpRequestUrl, 'http://localhost:37591')
                    assert.strictEqual(data.moduleCallId, 'foo')
                    assert.strictEqual(data.requestId, 'foo')
                    assert.strictEqual(data.options.foo, true)
                    // capture http request id
                    httpRequestId = data.httpRequestId
                },
                // 2nd call: http response
                (type, data) => {  
                    // validate log data
                    assert.strictEqual(type, 'httpResponse')
                    assert.strictEqual(data.httpRequestId, httpRequestId)
                    assert.match(data.httpResponseCreateTime, /^\d\d\d\d-\d\d-\d\d \d\d:\d\d:\d\d\.\d\d\d\d\d\d$/)
                    assert.strictEqual(data.httpResponseBody, 'foo')
                    assert.strictEqual(data.httpResponseHeader[0], 'Content-Type')
                    assert.strictEqual(data.httpResponseHeader[1], 'text/html')
                    assert.strictEqual(data.httpResponseStatusCode, 200)
                }
            ]
        })
        // set log client so that http client will log requests
        httpClient.logClient(mockLogClient)
        // create test server
        var server = httpServer.createServerAsync(function (req, res) {
            // send response
            res.writeHead(200, {'Content-Type': 'text/html'})
            res.end('foo')
        })
        // listen
        return server.listen(testPort)
        // do request
        .then(function () {
            return httpClient.get(testUrl, {foo: true}, {
                moduleCallId: 'foo',
                requestId: 'foo',
            })
        })
        // test response
        .then(function (res) {
            assert.strictEqual(res.statusCode, 200)
        })
        .finally(function () {
            // stop server
            return server.close()
        })
    })

    it('should log request', function () {
        // capture http request id
        var httpRequestId
        // create mock log client
        var mockLogClient = new MockLogClient({
            log: ()=> [
                // 1st call: http request
                (type, data) => {
                    // capture http request id
                    httpRequestId = data.httpRequestId
                },
                // 2nd call: http error
                (type, data) => {  
                    assert.strictEqual(data.httpRequestId, httpRequestId)
                    assert.match(data.httpRequestError, /Unexpected token/)
                }
            ]
        })
        // set log client so that http client will log requests
        httpClient.logClient(mockLogClient)
        // create test server
        var server = httpServer.createServerAsync(function (req, res) {
            // send response
            res.writeHead(200, {'Content-Type': 'application/json'})
            // send invalid JSON which will cause error to be thrown on decode
            res.end('foo')
        })
        // listen
        return server.listen(testPort)
        // do request
        .then(function () {
            return httpClient.get(testUrl, {foo: true}, {
                moduleCallId: 'foo',
                requestId: 'foo',
            })
        })
        // catch error
        .catch(function (err) {
            assert.instanceOf(err, SyntaxError)
        })
        .finally(function () {
            // stop server
            return server.close()
        })
    })

})