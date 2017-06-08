This is a wrapper around [fetch-mock](http://www.wheresrhys.co.uk/fetch-mock/) which allows to set up expectations for api calls more easily.

Features overview:
 * Returns a promise which can used to block test from finishing early.
 * Captures thrown errors to be used as a reason for test failure.
 * Captures every request to assist in debugging.
 * Request matching is performed through assertions.
 * Supports async functions in scenario and mocks.
 * Supports many [shortcuts](http://www.wheresrhys.co.uk/fetch-mock/api#mockmatcher-response-options-or-mockoptions) carried over from fetch-mock.

# Usage

Import the wrapper:

```js
const withMock = require('with-fetch-mock');
```

`withMock` returns a promise and accepts following arguments:
 * `scenario` callback which makes requests and verifies responses
 * one or more `mock` which can be function or a value

Scenario can be an asyn

Promise returned by `withMock` will not fulfill until:
 * All declared mocks have been called
 * Promises returned by scenario and mock callbacks have been fulfilled

Mocks can be declared as one of the following forms:
 * `number` which will be used as the status code of the response with empty body
 * `string` which will be used as the body of the response with status code 200
 * `object` with magical properties which will be used to create a `Response` object:
     * `body` response body
     * `status` response status code
     * `headers` response headers
     * `throws` a rejection reason for the promise returned to `fetch` call
     * `sendAsJson` can be set to false in order to prevent `body` from being forcefully converted to `string`
 * `object` without magical properties which will be converted to `string` and used as the response body
 * `Response` which will be resolved to from the `Promise` returned to the fetch call
 * `Promise` which resolves to one of the values described above
 * `function` which returns one of the values described above

Arguments supplied to `fetch` will be passed to the mock function:
 * `input` request url (`string`)
 * `init` request settings (`object`)
     * `method` the request method (`string`)
     * `headers` request headers (`object`)
     * `body` request body (`string`, `Blob`, or `FormData`)
     * [and other request settings](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch)...

## Intended usage

Return the promise created by `withMock` to prevent your tests from finishing early and to ensure that meaningful failure messages will be produced in response to assertion errors inside the scenario or mock callbacks.

Any callback may return a promise or be declared as an [async function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function). Resolution of the top level promise will be delayed until promise returned by callback is fulfilled. Callback promise rejection will be propagated to the top level promise.

## Example

```js
it('must make some requests', () => {
    return withMock(
        async () => {
            const posts = await fetch('/posts/18')
                .then(response => response.json());

            expect(posts).toEqual({
                title: 'Some random post',
            });

            const response = await fetch('/posts', {
                method: 'POST',
                body: JSON.stringify({
                    title: 'A work of art',
                }),
            });

            expect(response.status).toBe(201);
        },
        (url) => {
            expect(url).toEqual('/posts/18');

            return { title: 'Some random post' };
        },
        (url, options) => {
            expect(url).toEqual('/posts');
            expect(options.method).toEqual('POST');
            expect(options.body).toEqual(
                JSON.stringify({
                    title: 'A work of art',
                })
            );

            return 201;
        }
    )
});
```

