import {dashboardColors} from "./Util";
import {renderMap} from './CaseHeatMap';
import {renderSummary, renderMortalityRates} from "./DataCharts";
import population from '../population.json';
import {formatNumber} from "./Util";

export let computeState = (home) => {

    var case_map = [];
    var case_summary = [];
    var mortality_rates = [];
    var latest = null;
    let country_list = [];

    let process = (entries) => {
        let last = entries[home.dateIndex];
        let prior = home.dateIndex - 3 > 0 ? entries[home.dateIndex-3] : entries[0];
        if (last) {
            let current = last.cases - (last.recoveries + last.deaths);
            return { 
                current: current,
                total: last.cases, 
                deaths: last.deaths, 
                recoveries: last.recoveries, 
                mortality: last.deaths/last.cases,
                delta: current - (prior.cases - (prior.recoveries + prior.deaths))
            };
        } else {
            return 0;
        }
    };

    let global_totals = [];
    
    let process_geo = (geo) => {
        geo.entries.forEach((entry,i) => {
            if (i <= home.dateIndex) {
                if (i === global_totals.length) {
                    global_totals.push({
                        date: new Date(entry.date).toDateString(), 
                        active: entry.cases-(entry.deaths+entry.recoveries), 
                        cases: entry.cases, 
                        deaths: entry.deaths, 
                        recoveries: entry.recoveries});
                } else {
                    global_totals[i].cases += entry.cases;
                    global_totals[i].active += (entry.cases-(entry.deaths+entry.recoveries));
                    global_totals[i].deaths += entry.deaths;
                    global_totals[i].recoveries += entry.recoveries;
                }
            }
        });
    };

    var c_index = 1;
    var markers = false;
    for (let [name, country] of Object.entries(home.caseData.geoData)) {
        country_list.push({ id: c_index++, value: name });
        let filter_match = (home.countryFilter != null && country.name === home.countryFilter);
        
        if (Object.keys(country.children).length > 0 && filter_match) {
            for (let child of Object.values(country.children)) {
                if (child) {
                    markers = home.countryFilter != null ? true : false;
                    process_geo(child);
                }
            }
        } else if ((country.entries.length > 0 && filter_match) || home.countryFilter == null) {
            if (home.dateIndex === -1) {                
                home.dateIndex = country.entries.length-1;
                latest = country.entries[home.dateIndex].date;
            }
            process_geo(country);
        }
    };

    var max = 0;
    let main_body = (name, country, filter_match) => {
        if (country.entries.length > 0 && filter_match) {
            let r = process(country.entries);
            let val = home.mapType === "recoveries" ? r.recoveries : home.mapType === "deaths" ? r.deaths : r.current;
            max = val > max ? val : max; 

            if (markers) {
                if (val > 0) {
                    case_map.push({id: name, latitude: country.lat, longitude: country.lon, value: val});
               }
            } else {
                case_map.push({id: home.iso_names[name], value: val});
            }

            case_summary.push({category: name, value1: r.current, value2: r.deaths, value3: r.recoveries, delta: r.delta});
            let mt = r.current + r.deaths + r.recoveries;
            mortality_rates.push(
                {
                    title: name,
                    x: (r.deaths/mt)*100, 
                    y: (r.recoveries/mt)*100,
                    value: mt, 
                    rate: r.recoveries > r.current ? "Declining" : "Increasing",
                    color: r.recoveries > r.current ? dashboardColors.recoveries : dashboardColors.deaths, 
                }
            );
        }
    };


    for (let [name, country] of Object.entries(home.caseData.geoData)) {
        let filter_match = (home.countryFilter == null || country.name === home.countryFilter);
        if (home.countryFilter != null && filter_match && Object.values(country.children).length > 0) {
            for (let [regionName, region] of Object.entries(country.children)) {
                main_body(regionName, region, filter_match);
            }
        } else {
            main_body(name, country, filter_match);
        }
    }
    

    case_summary = case_summary.sort((x,y) => {
        if (x.value1 > y.value1) {
            return -1;
        } else if (x.value1 < y.value1) {
            return 1;
        } else {
            return 0;
        }
    });
    
    mortality_rates = mortality_rates.sort((x,y) => {
        if (x.value > y.value) {
            return -1;
        } else if (x.value < y.value) {
            return 1;
        } else {
            return 0;
        }
    });

    case_summary = case_summary.map((c) => {
        let country = home.iso_names[c.category]; 
        let pop = population[country] ? population[country] : -1;
        return { 
            category: c.category, 
            value1: c.value1, 
            value2: c.value2, 
            value3: c.value3, 
            delta: c.delta, 
            percent: (home.countryFilter) || c.value1 <= 0 ? -99 : parseFloat(c.value1) / parseFloat(pop)
        };
    });

    let top_case_summary = case_summary.slice(0,10);
    mortality_rates = mortality_rates.slice(0,50);
    
    let map_opts = home.state.mapOptions;
    if (home.countryFilter != null) {
        map_opts.displayMode = markers ? 'markers' : '';

        let iso_name = home.iso_names[home.countryFilter] ? home.iso_names[home.countryFilter] : null;
        map_opts.region = iso_name;
    } else { 
        map_opts.displayMode = '';
        map_opts.region = null;
    }

    country_list = country_list.sort((x,y) => {
        if (x.value > y.value) {
            return 1;
        } else if (y.value > x.value) {
            return -1;
        } else { 
            return 0;
        }
    });

    country_list.unshift({id: 0, value: "Global"});
    renderMap(home, case_map, max, markers, home.iso_names[home.countryFilter]);
    renderSummary(top_case_summary);
    renderMortalityRates(mortality_rates);
    home.globalTotals = global_totals;

    let totals = global_totals[global_totals.length-1];

    return {
        activeCases: formatNumber(totals.active), 
        deaths: formatNumber(totals.deaths), 
        recoveries: formatNumber(totals.recoveries),
        caseMap: case_map, 
        caseSummary: top_case_summary, 
        fullCaseSummary: case_summary,
        mortalityRates: mortality_rates, 
        countryList: country_list, 
        latestDate: home.state.latestDate ? home.state.latestDate : new Date(latest).toDateString()
    };
};