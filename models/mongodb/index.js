const mongoose = require("mongoose");
const { MongoDbEnv } = require("../../env-class");
class MongooseInstance {
    constructor() { }

    static async connect() {
        let connectionUrl = "";

        MongoDbEnv.hosts.forEach((host, index) => {
            if (index == 0) {
                connectionUrl += `mongodb://${host}:${MongoDbEnv.ports[0]}`;
            } else {
                connectionUrl += `,${host}:${MongoDbEnv.ports[index]}`;
            }
        });

        connectionUrl += `/${MongoDbEnv.dbName}`;

        /** @type { import("mongoose").ConnectOptions } */
        let connectOptions = {};
        if (MongoDbEnv.user && MongoDbEnv.password) {
            connectOptions.user = MongoDbEnv.user;
            connectOptions.pass = MongoDbEnv.password;
            connectOptions.authSource = MongoDbEnv.authSource;
        }

        mongoose.connection.on("open", async () => {
            console.log("Connected to MongoDB!!");
            let collections = await mongoose.connection.db.listCollections().toArray();
            if (MongoDbEnv.isShardingMode) {
                for (let collection of collections) {
                    await mongoose.connection.db
                        .admin()
                        .command({
                            shardCollection: `${MongoDbEnv.dbName}.${collection}`,
                            key: { id: "hashed" }
                        });
                    console.log(`sharding collection ${collection} successfully`);
                }

            }
        });
        
        await mongoose.connect(connectionUrl, connectOptions);
    }
}

module.exports.MongooseInstance = MongooseInstance;