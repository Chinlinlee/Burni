# Configuration (/docs/v3/getting-started/configuration)



# Configuration [#configuration]

Before launching the Burni FHIR Server, please complete the following configuration steps: specify supported FHIR resources, set environment variables in `.env`, and run the build generator to create Mongoose models and API code.

***

## 1. Create and Edit `config/config.js` [#1-create-and-edit-configconfigjs]

Burni uses `config/config.js` to determine which FHIR resources and interactions (such as `read`, `create`, `search`, etc.) should be enabled and supported.

The repository provides a complete template file at `config/config.template.js`, covering all 146 FHIR R4 resources. Copy this template to create your `config.js`:

<CodeBlockTabs defaultValue="bash">
  <CodeBlockTabsList>
    <CodeBlockTabsTrigger value="bash">
      bash
    </CodeBlockTabsTrigger>

    <CodeBlockTabsTrigger value="powershell">
      PowerShell
    </CodeBlockTabsTrigger>

    <CodeBlockTabsTrigger value="cmd">
      CMD
    </CodeBlockTabsTrigger>
  </CodeBlockTabsList>

  <CodeBlockTab value="bash">
    ```bash
    cp config/config.template.js config/config.js
    ```
  </CodeBlockTab>

  <CodeBlockTab value="powershell">
    ```powershell
    Copy-Item config/config.template.js config/config.js
    ```
  </CodeBlockTab>

  <CodeBlockTab value="cmd">
    ```cmd
    copy config\config.template.js config\config.js
    ```
  </CodeBlockTab>
</CodeBlockTabs>

<Callout type="info">
  `config/config.template.js` enables all standard FHIR resources by default. If your deployment only requires a subset (such as `Patient` and `Observation`), you can modify `config/config.js` to omit unused resources, minimizing generated model code and database index footprints.
</Callout>

### Example `config/config.js` Structure [#example-configconfigjs-structure]

```javascript
module.exports = {
    // Add the resource names that you need
    "Patient": { 
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    },
    "Observation": {
        "interaction": {
            "read": true,
            "vread": true,
            "update": true,
            "delete": true,
            "history": true,
            "create": true,
            "search": true
        }
    }
};
```

***

## 2. Configure Environment Variables (`.env`) [#2-configure-environment-variables-env]

Create a `.env` file in the project root to configure MongoDB connection parameters, server ports, and feature flags:

```bash
# ==========================================
# MongoDB Connection Settings
# ==========================================
MONGODB_NAME="burni-db"
MONGODB_HOSTS=["localhost"]
MONGODB_PORTS=[27017]
MONGODB_USER="myAdmin"
MONGODB_PASSWORD="MymongoAdmin1"
MONGODB_IS_SHARDING_MODE=false
MONGODB_SLAVEMODE=false

# Alternatively, specify a single connection string URL:
# MONGODB_CONNECTION_URL="mongodb://myAdmin:MymongoAdmin1@localhost:27017/burni-db?authSource=admin"

# ==========================================
# Server Port and API Path
# ==========================================
SERVER_PORT=8080

FHIRSERVER_HOST="localhost"
FHIRSERVER_PORT=8080 # Used for generating bundle fullUrl
FHIRSERVER_APIPATH="fhir"

# ==========================================
# Token Authentication
# ==========================================
ENABLE_TOKEN_AUTH=true
ADMIN_LOGIN_PATH="adminLogin"  
ADMIN_USERNAME="adminUsername"
ADMIN_PASSWORD="adminPassword"

# ==========================================
# FHIR Integrity Checks
# ==========================================
ENABLE_CHECK_ALL_RESOURCE_ID=false # Check uniqueness of resource ID across all resource types
ENABLE_CHECK_REFERENCE=true        # Validate that referenced resources exist

# ==========================================
# MongoDB Provisioning Startup Option (Optional)
# ==========================================
MONGODB_PROVISION_ON_STARTUP=false # If true, runs locked index provisioning on server startup
```

***

## 3. Generate Code [#3-generate-code]

After configuring `config/config.js` and `.env`, run the code generator. Burni will automatically create Mongoose models, schemas, and RESTful API routes based on your configuration:

```bash
npm run build
```

<Callout type="warn">
  `TypeError: genParamFunc[type] is not a function` indicates that this specific search parameter type is not currently supported.
</Callout>

Once code generation is complete, proceed to the &#x2A;*[Deploy](./deploy)** guide to launch the server and initialize database indexes.
