'use strict'

/* npm libraries */
const ImmutableAI = require('immutable-ai')
const Promise = require('bluebird')
const debug = require('debug')('immutable-http-client')
const microTimestamp = require('micro-timestamp')
const randomUniqueId = require('random-unique-id')
const requireValidLogClient = require('immutable-require-valid-log-client')
const requireValidOptionalObject = require('immutable-require-valid-optional-object')
const nodeFetch = require('node-fetch');

/* public functions */
const ImmutableHttpClient = {
    // request methods
    fetch: fetch,
    logClient: setLogClient,
    reset: reset,
    // class properties
    class: 'ImmutableHttpClient',
    ImmutableHttpClient: true,
}

module.exports = ImmutableHttpClient

// initialize ImmutableAI with ImmutableCoreModel instance
ImmutableAI.immutableHttpClient(ImmutableHttpClient)

// optional client for logging requests
var logClient

/**
 * @function setLogClient
 *
 * get/set logClient
 *
 * @param {object} setLogClient
 *
 * @returns {object}
 *
 * @throws (Error)
 */
function setLogClient (setLogClient) {
    // set new log client if argument passed
    if (setLogClient !== undefined) {
        // validate log client
        requireValidLogClient(setLogClient)
        // set new log client
        logClient = setLogClient
    }
    // return existing log client
    return logClient
}

/**
 * @function fetch
 *
 * @param {string} url
 * @param {object} options
 * @param {object} session
 *
 * @returns {Promise}
 */
function fetch (url, options, session) {
    // require options and session to be objects
    options = requireValidOptionalObject(options)
    session = requireValidOptionalObject(session)
    // get request id
    var uniqueId = randomUniqueId()
    // http request log id
    logHttpRequest(uniqueId, url, options, session)
    // debug
    debug('http request', url, options)
    // make request
    return nodeFetch(url, options)
    // log success
    .then(res => {
        debug('http response', res)
        logHttpResponse(uniqueId, res)
        return res
    })
    // log error
    .catch(err => {
        debug('http error', err)
        logHttpRequestError(uniqueId, err)
        // reject promise
        return Promise.reject(err)
    })
}

/**
 * @function reset
 *
 * clear global singleton data
 *
 * @returns {ImmutableHttpClient}
 */
function reset () {
    // clear global singleton data
    logClient = undefined
    // return class instance
    return ImmutableHttpClient
}

/* private functions */

/**
 * @function logHttpRequest
 *
 * @param {object} uniqueId
 * @param {string} url
 * @param {object} options
 * @param {object} session
 *
 * @returns {string}
 */
function logHttpRequest (uniqueId, url, options, session) {
    // require log client
    if (!logClient) {
        return
    }
    const httpRequestMethod = options.method
        ? options.method.toUpperCase()
        : 'GET'
    // log request
    logClient.log('httpRequest', {
        httpRequestCreateTime: uniqueId.timestamp,
        httpRequestId: uniqueId.id,
        httpRequestMethod,
        httpRequestUrl: url,
        options: options,
        moduleCallId: session.moduleCallId,
        requestId: session.requestId,
    })
}

/**
 * @function logHttpRequestError
 *
 * @param {object} uniqueId
 * @param {object} err
 */
function logHttpRequestError (uniqueId, err) {
    // require log client
    if (!logClient) {
        return
    }
    // log error
    logClient.log('httpRequestError', {
        httpRequestId: uniqueId.id,
        httpRequestErrorCreateTime: microTimestamp(),
        httpRequestError: err.message,
    })
}

/**
 * @function logHttpResponse
 *
 * @param {object} uniqueId
 * @param {object} res - http response
 */
function logHttpResponse (uniqueId, res) {
    // require log client
    if (!logClient) {
        return
    }
    res = res.clone()
    Promise.all([
        res.text(),
        res.headers.raw(),
    ]).then(([ httpResponseBody, httpResponseHeaders ]) => {
        const httpResponseLogData = {
            httpRequestId: uniqueId.id,
            httpResponseBody,
            httpResponseHeaders,
            httpResponseCreateTime: microTimestamp(),
            httpResponseStatusCode: res.status,
        }
        // log response
        logClient.log('httpResponse', httpResponseLogData)
    })
}
