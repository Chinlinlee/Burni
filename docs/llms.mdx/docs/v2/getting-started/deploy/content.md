# Deploy (/docs/v2/getting-started/deploy)



## With Node.JS [#with-nodejs]

```sh
node server.js
```

You will see console printing the information below:

```
mongodb://localhost:27017/dbName
moduleName ::  Patient
path :  path\burni\models\mongodb/model
moduleName ::  Patient_history
path :  path\burni\models\mongodb/model
moduleName ::  FHIRStoredID
path :  path\burni\models\mongodb/staticModel
moduleName ::  issuedToken
path :  path\burni\models\mongodb/staticModel
http server is listening on port:8089
we're connected!
```

## With docker-compose [#with-docker-compose]

The example of `docker-compose.yaml` file in root path

```yaml
version: '3.4'
services:
  fhir-burni-mongodb:
    image: mongo:4.2
    container_name : fhir-burni-mongodb
    restart: always
    ports:
      - 27017:27017
    volumes:
      - ./mongodb/db:/data/db
    environment:
      # provide your credentials here
      - MONGO_INITDB_DATABASE=admin
      - MONGO_INITDB_ROOT_USERNAME=root
      - MONGO_INITDB_ROOT_PASSWORD=root
      - MONGO_PORT=27017
  
  fhir-burni:
    build: ./
    container_name: fhir-burni
    command: >
      /bin/sh -c '
      while ! nc -z fhir-burni-mongodb 27017;
      do
        echo "waiting for database ...";
        sleep 3;
      done;
      echo "db is ready!";
      pm2-runtime start ecosystem.config.js;
      '
    volumes :
      - ./:/nodejs/fhir-burni
      - /nodejs/fhir-burni/node_modules
    ports:
      - 8080:8080
    depends_on:
      - fhir-burni-mongodb
    tty : true
    restart: on-failure:3
    stdin_open : true
```

### docker-compose deploy [#docker-compose-deploy]

```sh
docker-compose up -d
```

## MongoDB schema and index provisioning [#mongodb-schema-and-index-provisioning]

Burni sets Mongoose `autoCreate` and `autoIndex` to `false` by default. Model registration only means models are registered inside the application process; it does **not** guarantee that MongoDB collections or indexes exist. Production deployments should run provisioning before application startup, or explicitly enable startup opt-in.

The desired collection and index manifest is generated deterministically at runtime from registered models, the model catalog, approved built-in temporal definitions, and non-temporal SearchParameter derived indexes that pass policy. The manifest stores `artifactIdentity` (compiled SearchParameter artifact) and `derivedIndexPolicy.searchParameterPolicyVersion` (non-temporal index policy). Provisioning reconciles MongoDB against that generated manifest, persists results in `MongoProvisioningState`, and uses `MongoProvisioningLock` with a database-scoped lease for multi-instance runs. Use `writeDesiredManifestArtifact()` when you need a persisted JSON copy (default path `models/mongodb/provisioning/artifacts/desired-index-manifest.json`).

### Pre-deployment provisioning (recommended) [#pre-deployment-provisioning-recommended]

Configure the same MongoDB connection environment variables as the application (`MONGODB_CONNECTION_URL`, or `MONGODB_HOSTS` / `MONGODB_PORTS` / `MONGODB_NAME`), then run:

```sh
npm run mongodb:provision
```

This command runs control-plane initialization, acquires the lock, creates collections, creates baseline indexes, creates approved built-in derived indexes (temporal and non-temporal SearchParameters), runs verify, and persists the manifest checksum and drift summary. Exit code `0` on success; any failed phase returns a non-zero status.

**Partial completion and retry**: Provisioning is additive-only and does not roll back collections or indexes that were already created. If a run fails midway, completed DDL remains in place; rerunning `mongodb:provision` continues from the desired/actual diff. After lock lease expiry, another process can reclaim the expired lock and retry.

### Read-only verify [#read-only-verify]

```sh
npm run mongodb:verify
```

`mongodb:verify` performs **no DDL** and does not modify data. It reads actual collections and indexes and reports:

* **missing**: indexes expected by the manifest but absent in the database
* **extra**: indexes present in the database but not declared in the manifest (reported only, never deleted)
* **mismatch**: indexes whose key or options do not match the expected identity
* **manifest identity drift**: the current desired manifest checksum or version differs from the value stored in `MongoProvisioningState` for the latest successful run

Verify failure uses exit code `2`.

### `id` duplicate audit (read-only) [#id-duplicate-audit-read-only]

```sh
npm run mongodb:audit-id
```

Scans resource and history collections for duplicate `id` values for a future unique-migration clean-audit gate. It **does not modify data**. General provisioning does **not** automatically change an existing `id` index to unique.

### Startup opt-in [#startup-opt-in]

By default, `node server.js` does **not** run provisioning. Application readiness (`mongodb.ready`) and provisioning readiness are separate. Missing performance indexes (including non-temporal derived indexes) do not block HTTP listen, but queries may fall back to COLLSCAN; `mongodb:verify` diagnostics report missing performance indexes.

To wait for a full provisioning run before application ready, set:

```sh
MONGODB_PROVISION_ON_STARTUP=true
```

or `MONGODB_PROVISION_ON_STARTUP=1`. When enabled, server bootstrap runs the same locked run as `mongodb:provision` before listen. On failure it does not declare ready, does not listen, and exits with a non-zero status. Production deployments should still prefer the standalone deployment command over startup opt-in.

### Relationship to SearchParameter derived indexes [#relationship-to-searchparameter-derived-indexes]

The derived index manifest merges temporal and policy-approved non-temporal built-in lookups (token, reference, string, number, quantity, uri). Custom database SearchParameters remain executable but do not create derived indexes by default. Derived index reconcile is additive-only: missing indexes can be created by `provision`, while extra or mismatched indexes are reported by `verify` and never auto-deleted; query runtime does not use `$hint`. Rollback can disable the new policy or restore a manifest version without auto-deleting indexes already created. See [Search parameters overview](/docs/search-parameter/overview) and ADR 0010.
