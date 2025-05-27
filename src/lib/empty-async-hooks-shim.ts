// This is an empty module to shim 'async_hooks' for client-side bundles.
// It prevents errors when server-side code relying on 'async_hooks' is
// inadvertently or transitively pulled into the client.
export {};
