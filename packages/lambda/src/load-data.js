const dataManager = require('./dataConsumer');

let run = async () => {
    console.log(await dataManager.importData());
}

run();