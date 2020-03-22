const rp = require('request-promise');
const csv = require('csv-string');
const aws_util = require('./util');

let CASES = 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Confirmed.csv';
let DEATHS = 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Deaths.csv';
let RECOVERIES = 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Recovered.csv';

class GeoValue {
    constructor(name, lat, lon) {
        this.children = {};
        this.entries = [];
        this.name = name;
        this.lat = lat;
        this.lon = lon;

    }
}

class GeoStat {
    constructor(date) {
        this.date = new Date(Number(date)); 
        this.cases = 0;
        this.deaths = 0;
        this.recoveries = 0;
    }
}

exports.importData = () => {
    Promise.all([rp(CASES), rp(DEATHS), rp(RECOVERIES)]).then((results) => {
        
        let countries = {};
        console.log("Processing cases...");
        processStat(csv.parse(results[0]), countries, "CASES");
        
        console.log("Processing deaths...");
        processStat(csv.parse(results[1]), countries, "DEATHS");
        
        console.log("Processing recoveries...");
        processStat(csv.parse(results[2]), countries, "RECOVERIES");

        let case_data = {
            "geoData": countries
        };

        console.log("Uploading to S3...");
        aws_util.uploadToWebCache('covid.json', JSON.stringify(case_data));
    });
};

function processStat(data, countries, type) {
    var start_date;

    data.forEach(row => {
        if (row[1] == 'Country/Region') { // skip header
            start_date = new Date(Date.parse(row[4]));
            return;
        }

        let country_name = row[1] == 'US' ? "United States" : row[1];
        let region_name = row[0] == "" ? null : row[0];
        let lat = parseFloat(row[2]);
        let lon = parseFloat(row[3]);
        let values = row.slice(4);

        var country = countries[country_name];
        
        if (region_name) {
            if (!country) {
                country = new GeoValue(country_name, -1, -1);
                countries[country_name] = country;
            }

            var region;
            if (country.children[region_name]) {
                region = country.children[region_name];
            } else {
                region = new GeoValue(region_name, lat, lon)
            }

            processEntry(region, values, start_date, type);
            country.children[region_name] = region;
        } else {
            if (!country) {
                country = new GeoValue(country_name, lat, lon);
                countries[country_name] = country;
            }
            // if we see a region first, update country coords
            country.lat = lat;
            country.lon = lon;
            processEntry(country, values, start_date, type);
        }
    });
}

function processEntry(geo, data, startDate, type) { 

    var pos_date = new Date(Number(startDate));

    for (var i=0; i<data.length; i++) {
        var stat = geo.entries[i];
        if (!stat) {
            stat = new GeoStat(pos_date);
            geo.entries.push(stat);
            pos_date.setDate(pos_date.getDate()+1);
        }
        
        switch (type) {
            case "CASES":
                stat.cases += parseInt(data[i]);
                break;
            case "DEATHS":
                stat.deaths += parseInt(data[i]);
                break;
            case "RECOVERIES":
                stat.recoveries += parseInt(data[i]);
                break;
        }
    }
}