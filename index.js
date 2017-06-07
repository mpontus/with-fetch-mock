const fetchMock = require('fetch-mock');

const createWithMock = ({
    Promise = window.Promise,
} = {}) => {
    const setupMock = (mock) => new Promise((resolve, reject) => {
        const callback = typeof mock === 'function' ? mock : () => mock;

        fetchMock.once('*', (...args) => {
            let result;

            try {
                result = callback(...args);
            } catch (error) {
                reject(error);

                return Promise.reject(error);
            }

            if (result instanceof Promise) {
                result.then(resolve, reject);

                return result;
            }

            resolve();

            return Promise.resolve(result);
        });
    });

    return (scenario, ...mocks) => {
        const mockPromise = Promise.all(mocks.map(setupMock));
        const scenarioPromise = new Promise((resolve, reject) => {
            let result;
            try {
                result = scenario();
            } catch (error) {
                reject(error);

                return;
            }

            if (result instanceof Promise) {
                result.then(() => {
                    resolve();
                }, (error) => {
                    reject(error);
                });

                return;
            }

            resolve();
        });

        return Promise.all([scenarioPromise, mockPromise]);
    };
};

const withFetchMock = createWithMock();
withFetchMock.factory = createWithMock;

module.exports = withFetchMock;

