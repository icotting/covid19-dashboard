const dataManager = require('./dataConsumer');

let run = async () => {
    await dataManager.importData();
}

run();