const rp = require('request-promise');
const csv = require('csv-string');
const aws_util = require('./util');

let BASE = "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_daily_reports/";
let CHANGE_INDEX = 20;
let START_DATE = new Date(2020, 2, 1); 

class GeoValue {
    constructor(name, lat, lon, index, data) {
        this.children = {};
        this.entries = [];
        this.unclassified = [];
        this.name = name;
        this.lat = lat;
        this.lon = lon;

        var date = new Date(START_DATE);

        if (!data) {
            // fill in entries to keep column count across all countries
            for (var i=0; i<index; i++) { 
                console.log("Filling with date: "+date);
                this.entries.push(new GeoStat(date, 0, 0, 0));
                this.unclassified.push(new GeoStat(date, 0, 0, 0));
                date = new Date(date.setDate(date.getDate() + 1));
            }
        } else {
            this.entries = data;
        }
    }
}

class GeoStat {
    constructor(date, cases, deaths, recoveries) {
        this.date = new Date(Number(date)); 
        this.cases = cases;
        this.deaths = deaths;
        this.recoveries = recoveries;
    }
}

exports.importData = () => {
    return new Promise((resolve, reject) => {
        let top = {};

        let next = (d, index) => {
            rp(BASE+formatDate(d)+".csv").then((data) => {
                try {
                    processStat(csv.parse(data), top, d, index);
                    fill(top, index, d);
                    sum(top, index);
                    next(new Date(d.setDate(d.getDate() + 1)), index+1);
                } catch (e) { 
                    console.log(e);
                }
            }).catch((e) => {
                if (!e.statusCode == 404) {
                    reject(e);
                } else {

                    for (let [name, geo] of Object.entries(top)) {
                        geo.children["Unassigned Location"] = (new GeoValue("Unassigned Location", -1, -1, -1, geo.unclassified));
                    }

                    let case_data = {
                        "geoData": top
                    };

                    let data = JSON.stringify(case_data);
                    console.log("Uploading to S3...");
                    aws_util.uploadToWebCache('covid2.json', data);
                    
                    var end = new Date('01-01-1970');
                    var start = new Date();
                    var entries = 0;
            
                    for (let [name, country] of Object.entries(top)) {
                        country.entries.forEach((entry) => {
                            entries++; 
                            end = (entry.date > end) ? entry.date : end;
                            start = (entry.date < start) ? entry.date : start;
                        });
                    }
            
                    resolve({
                        status: "Success", 
                        startDate: start,
                        endDate: end,
                        totalRecords: entries
                    });
                }
            });
        };

        next(START_DATE, 0);
    });
}

function fill(data, index, date) {

    for (let [name, geo] of Object.entries(data)) {
        if (Object.keys(geo.children).length > 0) {
            fill(geo.children, index, date);
        }
        
        if (geo.entries.length === index) {
            geo.entries.push(new GeoStat(date, 0, 0, 0));
        }
    }

    for (let [name, geo] of Object.entries(data)) {
        geo.unclassified[index] = JSON.parse(JSON.stringify(geo.entries[index]));
    }
}

function sum(data, index) {
    for (let [name, geo] of Object.entries(data)) {
        if (Object.keys(geo.children).length > 0) {
            for (let [name, child] of Object.entries(geo.children)) {
                geo.entries[index].cases += child.entries[index].cases;                
                geo.entries[index].deaths += child.entries[index].deaths;  
                geo.entries[index].recoveries += child.entries[index].recoveries;  
            }   
        }
    }
}

function processStat(data, countries, date, index) {
    var start_date;

    data.forEach((row, i) => {
        if (i == 0) { // skip header
            return;
        }

        let country_name = index > CHANGE_INDEX ? cleanCountryName(row[3]) : cleanCountryName(row[1]);
        var region_name = index > CHANGE_INDEX ? row[2] : row[0];
        region_name = region_name == "" ? null : region_name;
        
        let lat = index > CHANGE_INDEX ? parseFloat(row[5]) : parseFloat(row[6]);
        let lon = index > CHANGE_INDEX ? parseFloat(row[6]) : parseFloat(row[7]);

        let tuple = index > CHANGE_INDEX ? 
            [parseInt(row[7]), parseInt(row[8]), parseInt(row[9])] 
            : [parseInt(row[3]), parseInt(row[4]), parseInt(row[5])];

        var country = countries[country_name];
        
        if (!country) {
            console.log("Create new country "+country_name);
            country = new GeoValue(country_name, lat, lon, index);
            countries[country_name] = country;
        }

        if (region_name) {
            var region;
            if (country.children[region_name]) {
                region = country.children[region_name];
            } else {
                console.log("Create new region "+country_name+", "+region_name);
                region = new GeoValue(region_name, lat, lon, index);
            }

            if (region.entries.length <= index) {
                console.log("Push for "+country_name+"---"+region_name+"----"+date);
                region.entries.push(new GeoStat(date, tuple[0], tuple[1], tuple[2]));
            } else {
                region.entries[index].cases += tuple[0];
                region.entries[index].deaths += tuple[1];
                region.entries[index].recoveries += tuple[2];
            }

            country.children[region_name] = region;
        } else {
            // if we see a region first, update country coords
            country.lat = lat;
            country.lon = lon;
            console.log("Push for "+country_name+"----"+date);
            country.entries.push(new GeoStat(date, tuple[0], tuple[1], tuple[2]));
        }
    });
}

function formatDate(date) {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) 
        month = '0' + month;
    if (day.length < 2) 
        day = '0' + day;

    return [month, day, year].join('-');
}

function cleanCountryName(name) { 
    switch (name) {
        case "US":
            return "United States";
        case "Mainland China": 
            return "China";
        case "UK":
            return "United Kingdom";
        case "Taiwan*":
            return "Taiwan";
        default: 
            return name;
    }
}