import React, {Component} from 'react';
import { Container, Row, Col, Form, NavDropdown } from "react-bootstrap";
import {Navbar, Nav} from "react-bootstrap";
import countries from './countries.json';
import {renderMap} from './CaseHeatMap';
import {renderTimeline, renderStatus, renderSummary, renderMortalityRates} from "./DataCharts";
import './Home.css';

class Home extends Component {

    constructor(props) {
        super(props);
        this.state = {
            caseMap: [
                ['Country', 'Confirmed Cases']
            ], 
            caseSummary: [['Country', 'Current Cases', 'Deaths', 'Recovered Cases']], 
            mortalityRates: [['ID', 'Mortality', 'Recovery', 'Status', 'Confirmed Cases']], 
            globalTimeSeries: [['x', 'Active Cases', 'Deaths', 'Recoveries']],
            countryFilter: null, 
            mapOptions: {
                displayMode: "",
                colorAxis: { colors: ['white', 'red'] }
            },
            countryList: [{index: 0, value: "Loading ..."}],
            dateIndex: 58
        };
    }

    componentDidMount() {
        fetch('/covid.json', {
            credentials: "same-origin"
        }).then((res) => res.json()).then((data) => {
            this.caseData = data;

            this.iso_names = {};

            countries.forEach((country) => {
                this.iso_names[country.name] = country["alpha-2"];
            });
            
            this.setState(this.computeState());
        });
    }

    onCountrySelect(e) {
        this.countryFilter = this.countrySelect.value == "Global" ? null : this.countrySelect.value;
        this.setState(this.computeState());
    }

    computeState() {

        var case_map = [];
        var case_summary = [];
        var mortality_rates = [];

        let country_list = [];

        let process = (entries) => {
            let last = entries[this.state.dateIndex];
            if (last) {
                let current = last.cases - (last.recoveries + last.deaths);
                return { 
                    current: current,
                    total: last.cases, 
                    deaths: last.deaths, 
                    recoveries: last.recoveries, 
                    mortality: last.deaths/last.cases
                };
            } else {
                return 0;
            }
        };

        let global_totals = [];
        
        let process_geo = (geo) => {
            geo.entries.forEach((entry,i) => { 
                if (i < this.state.dateIndex) {
                    if (i == global_totals.length) {
                        global_totals.push({
                            date: new Date(entry.date).toDateString(), 
                            active: entry.cases-(entry.deaths+entry.recoveries), 
                            cases: entry.cases, 
                            deaths: entry.deaths, 
                            recoveries: entry.recoveries});
                    } else {
                        global_totals[i].cases += entry.cases;
                        global_totals[i].active += entry.cases-(entry.deaths+entry.recoveries);
                        global_totals[i].deaths += entry.deaths;
                        global_totals[i].recoveries += entry.recoveries;
                    }
                }
            });
        };

        var c_index = 1;
        var markers = false;
        for (let [name, country] of Object.entries(this.caseData.geoData)) {
            country_list.push({ id: c_index++, value: country.name });
            let filter_match = (this.countryFilter == null || country.name == this.countryFilter);
            
            if (country.entries && filter_match) {
                process_geo(country);
            }

            if (country.children && filter_match) {

                for (let [name, child] of Object.entries(country.children)) {
                    if (child) {
                        markers = this.countryFilter != null ? true : false;
                        process_geo(child);
                    }
                }
            }
        };

        for (let [name, country] of Object.entries(this.caseData.geoData)) {

            let main_body = (name, country) => {
                if (country.entries.length > 0 && filter_match) {
                    let r = process(country.entries);
                    
                    if (markers) {
                        if (r.current > 0) {
                            case_map.push({id: name, latitude: country.lat, longitude: country.lon, value: r.current});
                       }
                    } else {
                        case_map.push({id: this.iso_names[name], value: r.current});
                    }

                    case_summary.push({category: name, value1: r.current, value2: r.deaths, value3: r.recoveries});
                    let mt = r.current + r.deaths + r.recoveries;
                    mortality_rates.push(
                        {
                            title: name,
                            x: (r.deaths/mt)*100, 
                            y: (r.recoveries/mt)*100,
                            value: mt, 
                            color: r.recoveries > r.current ? "green" : "red", 
                        }
                    );
                } else if (filter_match) { //rollup children
                    var total = 0;
                    var case_totals = {category: name, value1: 0, value2: 0, value3: 0};

                    for (let [name, region] of Object.entries(country.children)) {
                        let r = process(region.entries);
                        total += r.current;
                        case_totals.value1 += r.current;
                        case_totals.value2 += r.deaths;
                        case_totals.value3 += r.recoveries; 
                    }

                    let mt = case_totals.value1 + case_totals.value2 + case_totals.value3;
                    mortality_rates.push(
                        {
                            title: name,
                            x: (case_totals.value2/mt)*100, 
                            y: (case_totals.value3/mt)*100,
                            value: mt,
                            color: case_totals.value3 > case_totals.value1 ? "green" : "red", 
                        }
                    );

                    if (!this.iso_names[name]) {
                        console.log(name+"--"+this.iso_names[name]);
                    } else {
                        case_map.push({id: this.iso_names[name], value: total});
                    }
                    case_summary.push(case_totals);
                }
            };

            let filter_match = (this.countryFilter == null || country.name == this.countryFilter);
            if (this.countryFilter != null && filter_match && Object.values(country.children).length > 0) {
                for (let [regionName, region] of Object.entries(country.children)) {
                    main_body(regionName, region);
                }
            } else {
                main_body(name, country);
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

        case_summary = case_summary.slice(0,25);
        mortality_rates = mortality_rates.slice(0,25);
        
        let map_opts = this.state.mapOptions;
        if (this.countryFilter != null) {
            map_opts.displayMode = markers ? 'markers' : '';

            let iso_name = this.iso_names[this.countryFilter] ? this.iso_names[this.countryFilter] : null;
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
        renderMap(this, case_map, case_summary[0].value1, markers, this.iso_names[this.countryFilter]);
        renderTimeline(global_totals);
        renderStatus(global_totals);
        renderSummary(case_summary);
        renderMortalityRates(mortality_rates);

        return {
            caseMap: case_map, 
            caseSummary: case_summary, 
            mortalityRates: mortality_rates, 
            globalTimeSeries: global_totals, 
            countryList: country_list
        };
    }

    render() {
        return (
            <div>
            <Navbar variant="dark" bg="dark">
            <Navbar.Brand href="#home">COVID-19 Data Dasbboard</Navbar.Brand>
            <Navbar.Collapse id="basic-navbar-nav">
                <Nav className="mr-auto">

                </Nav>
                <Form inline>
                    <Form.Control as="select" onChange={this.onCountrySelect.bind(this)} ref={ el => this.countrySelect=el}>
                        {
                            this.state.countryList.map((option, index) => {
                                return (<option key={index} value={option.value}>{option.value}</option>)
                            })
                        }
                    </Form.Control>
                </Form>
                </Navbar.Collapse>
            </Navbar>

            <Container fluid>
            <Row>
                <Col sm={12}>
                <div id="mapdiv" style={{ width: "100%", height: "600px" }}></div>
                </Col>
            </Row>
            <Row>
                    <Col sm={8}>
                        <div id="timelinediv" style={{ width: "100%", height: "400px" }}></div>
                    </Col>
                    <Col sm={4}>
                        <div id="statusdiv" style={{ width: "100%", height: "400px" }}></div>
                    </Col>
                </Row>            
            <Row>
                <Col sm={6}>
                    <div id="summarydiv" style={{ width: "100%", height: "400px" }}></div>
                </Col>
                    <Col sm={6}>
                        <div id="mortalitydiv" style={{ width: "100%", height: "400px" }}></div>
                    </Col>
                </Row>
            </Container>
            </div>
        );
    }
}

export default Home;
