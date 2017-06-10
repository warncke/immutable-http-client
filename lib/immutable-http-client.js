'use strict'

/* npm libraries */
const ImmutableAI = require('immutable-ai')
const Promise = require('bluebird')
const microTimestamp = require('micro-timestamp')
const randomUniqueId = require('random-unique-id')
const requireValidLogClient = require('immutable-require-valid-log-client')
const requireValidOptionalObject = require('immutable-require-valid-optional-object')
const rp = require('request-promise')

/* public functions */
const ImmutableHttpClient = {
    // request methods
    delete: httpDelete,
    get: get,
    post: post,
    put: put,
    request: request,
    // config methods
    automock: automock,
    logClient: setLogClient,
    reset: reset,
    // class properties
    class: 'ImmutableHttpClient',
    ImmutableHttpClient: true,
}

module.exports = ImmutableHttpClient

// initialize ImmutableAI with ImmutableCoreModel instance
ImmutableAI.immutableHttpClient(ImmutableHttpClient)

// optional automock request function - if set will be called instead of
// execution the regular request function
var automockRequest
// optional client for logging requests
var logClient

/**
 * @function automock
 *
 * get/set the automock http request wrapper function
 *
 * @param {function|undefined} automock
 *
 * @returns {ImmutableHttpClient|boolean}
 *
 * @throws {Error}
 */
function automock (automock) {
    // set default if value passed
    if (automock !== undefined) {
        // require function
        if (typeof automock !== 'function') {
            throw new Error('automock error: automock must be function')
        }
        // set global value
        automockRequest = automock(ImmutableHttpClient)
        // return immutable-http-client instance
        return ImmutableHttpClient
    }
    // return current value
    return automockRequest
}

/**
 * @function httpDelete
 *
 * @param {string} url - url to request
 * @param {object} options - options
 * @param {object} session
 *
 * @returns {Promise}
 */
function httpDelete (url, options, session) {
    return _request('DELETE', url, options, session)
}

/**
 * @function get
 *
 * @param {string} url - url to request
 * @param {object} options - options
 * @param {object} session
 *
 * @returns {Promise}
 */
function get (url, options, session) {
    return _request('GET', url, options, session)
}

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
 * @function post
 *
 * @param {string} url - url to request
 * @param {object} options - options
 * @param {object} session
 *
 * @returns {Promise}
 */
function post (url, options, session) {
    return _request('POST', url, options, session)
}

/**
 * @function put
 *
 * @param {string} url - url to request
 * @param {object} options - options
 * @param {object} session
 *
 * @returns {Promise}
 */
function put (url, options, session) {
    return _request('PUT', url, options, session)
}

/**
 * @function request
 *
 * @param {object} options
 * @param {object} session
 *
 * @returns {Promise}
 */
function request (options, session) {
    // require options and session to be objects
    options = requireValidOptionalObject(options)
    session = requireValidOptionalObject(session)
    // if automock function is set then call and return it unless
    // the automock session flag is false
    if (automockRequest && session.automock !== false) {
        // call automock wrapper
        return automockRequest.apply(this, arguments)
    }
    // get request id
    var uniqueId = randomUniqueId()
    // http request log id
    logHttpRequest(uniqueId, options, session)
    // always resolve with full response for logging
    options.resolveWithFullResponse = true
    // set json flag by default if body is object
    if (options.json === undefined && typeof options.body === 'object') {
        options.json = true
    }
    // set simple mode to only reject on transport and other tech
    // errors - resolve on 404 and other HTTP errors
    options.simple = false
    // make request
    return rp(options)
    // log success
    .then(res => {
        // parse json response
        if (options.json === undefined && res.headers['content-type'] === 'application/json') {
            res.body = JSON.parse(res.body)
        }
        // remove all non-critical data from response
        var cleanedRes = cleanRes(res)
        // log response
        logHttpResponse(uniqueId, cleanedRes)
        // return modified response
        return cleanedRes
    })
    // log error
    .catch(err => {
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
    automockRequest = undefined
    logClient = undefined
    // return class instance
    return ImmutableHttpClient
}

/* private functions */

/**
 * @function _request
 *
 * call request with given method
 *
 * @param {string} method - http method
 * @param {string} url - url to request
 * @param {object} options - options
 * @param {object} session
 */
function _request (method, url, options, session) {
    // require options to be object
    options = requireValidOptionalObject(options)
    // set http method
    options.method = method
    // merge arguments into options
    options.uri = url
    // make request
    return request(options, session)
}

/**
 * @function cleanRes
 *
 * @param {object} res - http response
 *
 * @returns (object)
 */
function cleanRes (res) {
    return {
        body: res.body,
        rawHeaders: res.rawHeaders,
        statusCode: res.statusCode,
    }
}

/**
 * @function logHttpRequest
 *
 * @param {object} uniqueId
 * @param {object} options
 * @param {object} session
 *
 * @returns {string}
 */
function logHttpRequest (uniqueId, options, session) {
    // require log client
    if (!logClient) {
        return
    }
    // log request
    logClient.log('httpRequest', {
        httpRequestCreateTime: uniqueId.timestamp,
        httpRequestId: uniqueId.id,
        httpRequestMethod: options.method,
        httpRequestUrl: options.uri,
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
    // log response
    logClient.log('httpResponse', {
        httpRequestId: uniqueId.id,
        httpResponseBody: res.body,
        httpResponseHeader: res.rawHeaders,
        httpResponseCreateTime: microTimestamp(),
        httpResponseStatusCode: res.statusCode,

    })
}
