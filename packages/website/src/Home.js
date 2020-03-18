import React, {Component} from 'react';
import { Chart } from "react-google-charts";
import { FluidContainer, Container, Row, Col, FormControl, Form, Button, NavDropdown } from "react-bootstrap"
import {Navbar, Nav} from "react-bootstrap"
import countries from './countries.json'

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
            dateIndex: 55
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
                        global_totals.push([new Date(entry.date).toDateString(), entry.cases-(entry.deaths+entry.recoveries), entry.deaths, entry.recoveries]);
                    } else {
                        global_totals[i][1] += entry.cases-(entry.deaths+entry.recoveries);
                        global_totals[i][2] += entry.deaths;
                        global_totals[i][3] += entry.recoveries;
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
                            case_map.push([country.lat, country.lon, name, r.current]);
                        }
                    } else {
                        if (!this.iso_names[name]) { // don't let them charge me for geo-coding!
                            console.log(name+"--"+this.iso_names[name]);
                        } else {
                            case_map.push([{v: this.iso_names[name], f:name}, r.current]);
                        }
                    }

                    case_summary.push([name, r.current, r.deaths, r.recoveries]);
                    let mt = r.current + r.deaths + r.recoveries;
                    mortality_rates.push(
                        [
                            name,
                            r.deaths/mt, 
                            r.recoveries/mt,
                            r.recoveries > r.current ? "Declining" : "Increasing", 
                            mt
                        ]
                    );
                } else if (filter_match) { //rollup children
                    var total = 0;
                    var case_totals = [name, 0,0,0];

                    for (let [name, region] of Object.entries(country.children)) {
                        let r = process(region.entries);
                        total += r.current;
                        case_totals[1] += r.current;
                        case_totals[2] += r.deaths;
                        case_totals[3] += r.recoveries; 
                    }

                    let mt = case_totals[1]+case_totals[2]+case_totals[3];
                    mortality_rates.push(
                        [
                            name,
                            case_totals[2]/mt, 
                            case_totals[3]/mt,
                            case_totals[3] > case_totals[1] ? "Declining" : "Increasing", 
                            mt
                        ]
                    );

                    if (!this.iso_names[name]) {
                        console.log(name+"--"+this.iso_names[name]);
                    } else {
                        case_map.push([{v: this.iso_names[name], f:name}, total]);
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
        
        var z = 1;

        let s = (x,y) => {
            if (x[z] > y[z]) {
                return -1;
            } else if (x[z] < y[z]) {
                return 1;
            } else {
                return 0;
            }
        };

        if (markers) {
            case_map.unshift(['Latitude', 'Longitude', 'Region', 'Cases']);
        } else {
            case_map.unshift(['Country', 'Active Cases']);
        }
        case_summary = case_summary.sort(s);
        case_summary = case_summary.slice(0,11);
        case_summary.unshift(this.state.caseSummary[0]);

        z = 4;
        mortality_rates = mortality_rates.sort(s);
        mortality_rates = mortality_rates.slice(0,11);
        mortality_rates.unshift(this.state.mortalityRates[0]);

        global_totals.unshift(this.state.globalTimeSeries[0]);

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
                <NavDropdown title="Map Options" id="basic-nav-dropdown">
                    <NavDropdown.Item selected href="#action/3.1">Show Active Cases</NavDropdown.Item>
                    <NavDropdown.Item href="#action/3.2">Show Deaths</NavDropdown.Item>
                    <NavDropdown.Item href="#action/3.3">Show Recovery</NavDropdown.Item>
                    <NavDropdown.Item href="#action/3.3">Show Total Confirmed Cases</NavDropdown.Item>
                    <NavDropdown.Divider />
                    <NavDropdown.Item href="#action/3.4">Separated link</NavDropdown.Item>
                </NavDropdown>
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
                    <Chart
                            width={'100%'}
                            height={'600px'}
                            chartType="GeoChart"
                            data={this.state.caseMap}
                            mapsApiKey="AIzaSyAJkUR6orJ6uvqaHhcZAQdbB7zqnJ6CqOI"
                            rootProps={{ 'data-testid': '1' }}
                            options={this.state.mapOptions}
                        />
                </Col>
            </Row>
            <Row>
                <Col sm={6}>
                    <Chart
                        width={'100%'}
                        height={'300px'}
                        chartType="BarChart"
                        loader={<div>Loading Chart</div>}
                        data={this.state.caseSummary}
                        options={{
                            title: 'Top Cases of COVID-19',
                            chartArea: { width: '50%' },
                            isStacked: true,
                            hAxis: {
                            title: 'Total Reported Cases',
                            minValue: 0,
                            },
                            vAxis: {
                            title: 'Country',
                            },
                        }}
                        // For tests
                        rootProps={{ 'data-testid': '3' }}/>
                    </Col>
                    <Col sm={6}>
                        <Chart
                                width={'100%'}
                                height={'300px'}
                                chartType="BubbleChart"
                                loader={<div>Loading Chart</div>}
                                data={this.state.mortalityRates}
                                options={{
                                    title:
                                    'Correlation between mortality, recovery rate ' +
                                    'and number of confirmed cases',
                                    hAxis: { title: 'Mortality' },
                                    vAxis: { title: 'Recovery Rate' },
                                    bubble: { textStyle: { fontSize: 11 } },
                                }}
                                rootProps={{ 'data-testid': '1' }}
                                />
                    </Col>
                </Row>
                <Row>
                    <Col sm={12}>
                        <Chart
                            width={'100%'}
                            height={'400px'}
                            chartType="LineChart"
                            loader={<div>Loading Chart</div>}
                            data={this.state.globalTimeSeries}
                            options={{
                                hAxis: {
                                title: 'Time',
                                },
                                vAxis: {
                                title: 'Popularity',
                                },
                                series: {
                                1: { curveType: 'function' },
                                },
                            }}
                            rootProps={{ 'data-testid': '2' }}
                            />
                    </Col>
                </Row>
            </Container>
            </div>
        );
    }
}

export default Home;
