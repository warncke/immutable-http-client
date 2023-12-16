'use strict'

const Promise = require('bluebird')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const nock = require('nock')
const sinon = require('sinon')

const httpClient = require('../lib/immutable-http-client')
const MockLogClient = require('./mock/mock-log-client')

chai.use(chaiAsPromised)
const assert = chai.assert
sinon.assert.expose(chai.assert, { prefix: '' })

const testUrl = 'http://localhost'

describe('immutable-http-client', function () {

    var logClient
    var sandbox
    var scope

    beforeEach(function () {
        httpClient.reset()
        // create sinon sandbox
        sandbox = sinon.createSandbox()
        // create mock logclient
        logClient = new MockLogClient(sandbox)
    })

    afterEach(function () {
        // clear sinon sandbox
        sandbox.restore()
        // assert that all nock requests completed
        scope.done()
    })

    it('should make GET request', async function () {
        scope = nock(`${testUrl}`)
            .get('/foo/bar')
            .reply(200, 'foo')

        const res = await httpClient.fetch(testUrl+'/foo/bar')
        assert.strictEqual(await res.text(), 'foo')
        assert.strictEqual(res.status, 200)
    })

    it('should log request', async function () {
        // set log client so that http client will log requests
        httpClient.logClient(logClient)
        // create test server
        scope = nock(`${testUrl}`)
            .get('/foo/bar')
            .reply(200, 'foo', { 'X-Header-Test': 'foo' })

        const res = await httpClient.fetch(testUrl+'/foo/bar', {foo: true}, {
            moduleCallId: 'foo',
            requestId: 'foo',
        })
        // log does not block so need to wait a bit
        await Promise.delay(10)

        assert.strictEqual(await res.text(), 'foo')
        assert.calledTwice(logClient.log)

        assert.calledWithMatch(logClient.log, 'httpRequest', {
            httpRequestMethod: 'GET',
            httpRequestUrl: 'http://localhost/foo/bar',
            options: { foo: true },
            moduleCallId: 'foo',
            requestId: 'foo'
        })
        assert.calledWithMatch(logClient.log, 'httpResponse', {
            httpResponseBody: 'foo',
            httpResponseHeaders: { 'x-header-test': [ 'foo' ] },
            httpResponseStatusCode: 200,
        })

    })
})