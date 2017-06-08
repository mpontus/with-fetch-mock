const { Response } = require('node-fetch');
require('fetch-mock');
const Promise = require('bluebird');
const withFetchMock = require('../');

// Initialize withMock to use Bluebird's promise
const withMock = withFetchMock.factory({ Promise });

// Propagate promise fulfillments synchronously
Promise.setScheduler((fn) => { fn() });

process.on("unhandledRejection", function(reason, promise) {
    // Swallow unhandled errors
});

// Wraps async function to returns synchronous function
const wrap = (asyncFn) => (...args) => new Promise((resolve, reject) =>
    asyncFn(...args).then(resolve, reject));


it('must resolve after scenario finishes', () => {
    let release;

    // Set up scenario which we can remotely finish
    const promise = withMock(
        () => new Promise((resolve) => { release = resolve; }),
    );

    // To early for promise to be fullfilled before finishing the scenario
    expect(promise.isPending()).toBe(true);

    // Release the promise to simulate scenario being finished
    release();

    // Confirm that the promise returned by withMock has resolved
    expect(promise.isFulfilled()).toBe(true);
});

it('must reject when scenario throws', () => {
    const error = new Error('foo');
    const promise = withMock(
        () => {
            throw error;
        }
    );

    expect(promise.isRejected()).toBe(true);
    expect(promise.reason()).toBe(error);

    return promise.catch(() => {});
});

it('must reject when scenario returns a promise which rejects', () => {
    const error = new Error('foo');
    const promise = withMock(
        () => Promise.reject(error),
    );

    expect(promise.isRejected()).toBe(true);
    expect(promise.reason()).toBe(error);
});

it('must set the mock for fetch', () => {
    const response = new Response('"foo"', { status: 200 });

    return withMock(
        wrap(async () => {
            const result = await fetch('/foo');

            expect(result).toBe(response);
        }),
        response,
    );
});

it('accepts a function as a mock', () => {
    const response = new Response('"foo"', { status: 200 });

    return withMock(
        wrap(async () => {
            const result = await fetch('/foo');

            expect(result).toBe(response);
        }),
        () => response,
    );
});

it('accepts a promise as a mock', () => {
    const response = new Response('"foo"', { status: 200 });

    return withMock(
        wrap(async () => {
            const result = await fetch('/foo');

            expect(result).toBe(response);
        }),
        Promise.resolve(response),
    );
});

it('accepts a function that returns a promise as response', () => {
    const response = new Response('"foo"', { status: 200 });

    return withMock(
        wrap(async () => {
            const result = await fetch('/foo');

            expect(result).toBe(response);
        }),
        () => Promise.resolve(response),
    );
});

it('must resolve after exhausing all mocks', () => {
    const promise = withMock(
        () => { /* empty scenario */ },
        () => { return 'foo'; /* first mock */ },
        () => { return 'bar'; /* second mock */ },
    );

    expect(promise.isPending()).toBe(true);
    fetch('/foo');
    expect(promise.isPending()).toBe(true);
    fetch('/bar');
    expect(promise.isFulfilled()).toBe(true);
});

it('must resolve after all promises have been fulfilled', () => {
    let releaseScenario, releaseMock;

    const promise = withMock(
        () => new Promise((resolve) => {
            fetch('/foo');
            releaseScenario = resolve;
        }),
        () => new Promise((resolve) => {
            releaseMock = resolve;
        }),
    );

    expect(promise.isPending()).toBe(true);
    releaseMock();
    expect(promise.isPending()).toBe(true);
    releaseScenario();
    expect(promise.isFulfilled()).toBe(true);
});

it('must reject when mock throws', () => {
    const error = new Error('foo');
    const promise = withMock(
        () => { fetch('/foo'); },
        () => { throw error; }
    );

    expect(promise.isPending()).toBe(false);
    expect(promise.isRejected()).toBe(true);
    expect(promise.reason()).toBe(error);
});

it('must reject when the promise returned by the mock rejects', () => {
    const error = new Error('foo');
    const promise = withMock(
        () => { fetch('/foo'); },
        () => Promise.reject(error),
    );

    expect(promise.isPending()).toBe(false);
    expect(promise.isRejected()).toBe(true);
    expect(promise.reason()).toBe(error);
});
