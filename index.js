const fetchMock = require('fetch-mock');

const createWithMock = ({
    Promise = window.Promise,
} = {}) => {
    // Register mock with fetch-mock to be executed once
    const setupMock = (callback) => new Promise((resolve, reject) => {
        fetchMock.once('*', (...args) => {
            const result = callback(...args);

            result.then(resolve, reject);

            return result;
        });
    });

    // Normalize mock to be a function that returns promise
    const normalizeMock = (value) => {
        const callback = typeof value === 'function' ? value : () => value;

        return (...args) => {
            let result;

            try {
                result = callback(...args);
            } catch (error) {
                return Promise.reject(error);
            }

            if (result instanceof Promise) {
                return result;
            }

            return Promise.resolve(result);
        };
    };

    return (scenario, ...mocks) => {
        const mockPromise = Promise.all(mocks.map(normalizeMock).map(setupMock));
        const scenarioPromise = normalizeMock(scenario)();

        return Promise.all([scenarioPromise, mockPromise]);
    };
};

const withFetchMock = createWithMock();
withFetchMock.factory = createWithMock;

module.exports = withFetchMock;

