'use strict'

const Promise = require('bluebird')
const _ = require('lodash')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const httpClient = require('../lib/immutable-http-client')
const httpServer = require('http-promise')

chai.use(chaiAsPromised)
const assert = chai.assert

const testPort = 37591
const testUrl = 'http://localhost:'+testPort

describe('immutable-http-client: automock', function () {

    beforeEach(function () {
        httpClient.reset()
    })

    it('should allow setting an automock function', function () {
        // set automock function
        httpClient.automock(function () {})
        // test automock function
        assert.isFunction(httpClient.automock())
    })

    it('should call automock function when doing a request', function () {
        // set automock function
        httpClient.automock(function () {
            return Promise.resolve('automock called')
        })
        // call http client which should call automock function
        return httpClient.get().then(function (res) {
            assert.strictEqual(res, 'automock called')
        })
    })

    it('should execute regular request when automock does not have mock', function () {
        // count of calls to automock wrapper
        var automockCount = 0
        // set automock function
        httpClient.automock(function (options, session) {
            automockCount++
            // get shallow clone of session to do local change on automock prop
            session = _.clone(session)
            // set automock flag to false so that call to httpClient.request will
            // actually be processed
            session.automock = false
            // call request method which should not execute
            return httpClient.request.apply(this, [options, session])
        })
        // count of requests handled by server
        var requestCount = 0
        // create test server
        var server = httpServer.createServerAsync(function (req, res) {
            requestCount++
            res.writeHead(200, {'Content-Type': 'text/plain'})
            res.end('foo')
        })
        // listen
        return server.listen(testPort)
        // do request
        .then(function () {
            return httpClient.get(testUrl, {}, {})
        })
        // test response
        .then(function (res) {
            assert.strictEqual(res.body, 'foo')
            assert.strictEqual(automockCount, 1)
            assert.strictEqual(requestCount, 1)
        })
        // stop server
        .finally(function () {
            return server.close()
        })
    })

    it('should return mock data and not execute regular request when automock has mock', function () {
        // count of calls to automock wrapper
        var automockCount = 0
        // set automock function
        httpClient.automock(function (options, session) {
            automockCount++
            // get shallow clone of session to do local change on automock prop
            session = _.clone(session)
            // return response
            return Promise.resolve({body: 'bar'})
        })
        // count of requests handled by server
        var requestCount = 0
        // create test server
        var server = httpServer.createServerAsync(function (req, res) {
            requestCount++
            res.writeHead(200, {'Content-Type': 'text/plain'})
            res.end('foo')
        })
        // listen
        return server.listen(testPort)
        // do request
        .then(function () {
            return httpClient.get(testUrl, {}, {})
        })
        // test response
        .then(function (res) {
            assert.strictEqual(res.body, 'bar')
            assert.strictEqual(automockCount, 1)
            assert.strictEqual(requestCount, 0)
        })
        // stop server
        .finally(function () {
            return server.close()
        })
    })
})