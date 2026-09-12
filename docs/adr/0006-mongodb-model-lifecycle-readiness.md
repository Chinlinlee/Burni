---
status: accepted
---

# MongoDB model lifecycle and application readiness

`models/mongodb/connector.js` previously registered every model synchronously while
starting the MongoDB connection, and triggered SearchParameter registry reload from
connection events. `server.js` loaded the model index, then created the session
store, loaded routes, and listened without waiting for application readiness.

Callers already use the synchronous model map or the global Mongoose model registry.
Test helpers may establish the same MongoDB connection before loading the connector.
The design must preserve synchronous model access, make duplicate initialization
safe to share, and make "HTTP server is listening" a reliable signal that the
application is ready.

## Decision

- Implement a module-level singleton initialization state on first connector call.
  The state is immutable and includes a normalized config fingerprint, the
  synchronous model map, and application readiness and sharding provisioning
  results. Subsequent calls with the same fingerprint share the state; conflicting
  fingerprints are rejected immediately. Failed initialization is also retained so
  later calls do not silently start a second flow.
- Attach non-enumerable `ready` and `shardingReady` Promises to the synchronous
  model map. `ready` resolves only after model registry, default Mongoose
  connection, and SearchParameter registry are complete. `shardingReady` resolves
  immediately when sharding mode is off; when enabled, it runs independently after
  database ready. Non-enumerable properties avoid treating readiness fields as
  model map entries while preserving direct model-name lookup.
- Keep the default Mongoose connection instead of introducing a separate
  connection. Initialization shares an existing connection that matches the config
  and waits for true database ready state rather than registering an open event and
  leaving timing to callers. A conflicting config does not attempt to switch the
  existing connection.
- Register models in fixed phases after a single filesystem scan with stable
  sorting: resource models, then history models, then static models. Each phase
  completes before the next begins; any registration error terminates
  initialization immediately.
- Gate server bootstrap on application readiness. After application wiring,
  `server.js` awaits `mongodb.ready`, then creates the session store, loads
  routes, and starts listening. Ready rejection is logged by startup logic, HTTP
  listen is skipped, and the process exits with a non-zero status. The connector
  does not call `process.exit()`.
- Run sharding provisioning independently from application readiness. Expose
  `shardingReady` so deployments that require sharding setup can wait explicitly;
  the server may accept traffic before sharding provisioning finishes.
- Log phase timings for model registry, database connection, SearchParameter
  registry, and total initialization. Logs use masked connection identifiers or
  database metadata only; full connection URLs and credentials must not appear.
  Memory usage is not measured.

## Considered Options

- Per-request or per-resource-type lazy model loading. Rejected: changes startup
  semantics and model hook dependencies; full schema construction cost remains and
  is deferred to a separate change.
- Promise-only connector export. Rejected: breaks existing synchronous callers of
  the model map and global Mongoose registry.
- Separate Mongoose connection for initialization. Rejected: larger impact on
  resource services, session store, SearchParameter registry, and model hooks;
  the default connection already matches production and test-helper usage.
- Re-initialize on every connector call. Rejected: accumulates models, listeners,
  and connection side effects within one process.
- Call `process.exit()` from the connector on readiness failure. Rejected: process
  lifecycle belongs in server bootstrap, not the data layer.

## Consequences

- Synchronous model map access is unchanged; callers that need full service state
  must explicitly await `ready`.
- Startup still builds every model; fixed phases, single scan, and single
  initialization reduce extra cost but do not remove full schema construction.
- One process cannot serve multiple MongoDB configs; conflicts fail loudly instead
  of silently switching connections.
- SearchParameter registry reload failure prevents server startup, avoiding
  incomplete search behavior after listen.
- Test helpers that pre-connect with the same URI share connection readiness;
  lifecycle tests cover that path.
- Sharding provisioning failure does not block application readiness; operators
  must await `shardingReady` when sharding completion is required before serving
  or routing traffic.
- Deployment scripts that assumed immediate listen must treat readiness failure as
  a non-zero exit and verify listen occurs only after application ready.
- Initialization timing logs aid operations without leaking credentials.
