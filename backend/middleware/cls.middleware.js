const { AsyncLocalStorage } = require('async_hooks');

const asyncLocalStorage = new AsyncLocalStorage();

const namespace = {
  run: (callback) => {
    asyncLocalStorage.run(new Map(), callback);
  },
  set: (key, value) => {
    const store = asyncLocalStorage.getStore();
    if (store) store.set(key, value);
  },
  get: (key) => {
    const store = asyncLocalStorage.getStore();
    return store ? store.get(key) : undefined;
  },
  bindEmitter: () => {} // AsyncLocalStorage automatically tracks contexts natively
};

/**
 * Middleware to initialize async storage for the current request.
 * This must be used before any other asynchronous operations.
 */
exports.clsMiddleware = (req, res, next) => {
  namespace.run(() => {
    next();
  });
};

/**
 * Utility to get the current namespace interface
 */
exports.getNamespace = () => namespace;
