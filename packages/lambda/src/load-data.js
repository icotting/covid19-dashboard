const dataManager = require('./data');

let run = async () => {
    let data = await dataManager.importData();
    console.log(data);
}

run();