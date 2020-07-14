import React, {Component} from 'react';
import { Container, Row, Col, Form, Button, ButtonGroup } from "react-bootstrap";
import {Navbar, Nav} from "react-bootstrap";
import countries from './countries.json';

import {renderTimeline} from "./helpers/DataCharts";
import './Home.css';
import {computeState} from "./helpers/ParseData";
import BootstrapTable from "react-bootstrap-table-next";
import {formatNumber} from "./helpers/Util";

const tbl_format = (content, row) => {
    return formatNumber(content);
};

const percent_format = (content, row) => {
    if (content < 0) {
        return "-";
    } else { 
        return "1 out of "+formatNumber((1/content).toFixed(0))+" people";
    }
};

class Home extends Component {

    constructor(props) {
        super(props);
        this.state = {
            caseMap: [
                ['Country', 'Confirmed Cases']
            ], 
            caseSummary: [], 
            fullCaseSummary: [],
            mortalityRates: [['ID', 'Mortality', 'Recovery', 'Status', 'Confirmed Cases']], 
            globalTimeSeries: [['x', 'Active Cases', 'Deaths', 'Recoveries']],
            countryFilter: null, 
            mapOptions: {
                displayMode: "",
                colorAxis: { colors: ['white', 'red'] }
            },
            countryList: [{index: 0, value: "Loading ..."}],
            latestDate: ''
        };
        this.globalTotals = null;
        this.dateIndex = -1;
        this.mapType = "cases";
    }

    componentDidMount() {
        fetch('https://covid-dashboard.s3-us-west-2.amazonaws.com/covid2.json', {
            credentials: "same-origin"
        }).then((res) => res.json()).then((data) => {
            console.log(data);
            this.caseData = data;
            this.iso_names = {};

            countries.forEach((country) => {
                this.iso_names[country.name] = country["alpha-2"];
            });
            
            this.setState(computeState(this));
            renderTimeline(this, this.globalTotals);
        });
    }

    onCountrySelect(e) {
        this.countryFilter = this.countrySelect.value === "Global" ? null : this.countrySelect.value;
        this.setState(computeState(this));
        renderTimeline(this, this.globalTotals);
    }

    onDayChange(e) {
        this.dateIndex = e.day;
        this.setState(computeState(this));
    }

    onMapTypeSelect(type) {
        if (this.caseData) {
            this.mapType = type;
            this.setState(computeState(this));
        }
    }

    render() {
        return (
            <div>
            <Navbar variant="dark" bg="dark">
            <Navbar.Brand href="#home">COVID-19 Data Dashboard</Navbar.Brand>
            <Navbar.Collapse id="basic-navbar-nav">
                <Nav className="mr-auto">
                <Button href="https://github.com/CSSEGISandData/COVID-19" variant="secondary">Data Current as of: {this.state.latestDate}</Button>
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
            <div id="mapControls"> 
            <ButtonGroup aria-label="Basic example">
                <Button size="sm" variant="outline-primary" onClick={(e) => {
                        this.onMapTypeSelect('cases');}
                    }>Active Cases</Button>{' '}
                <Button size="sm" variant="outline-danger" onClick={(e) => {
                        this.onMapTypeSelect('deaths');}
                    }>Deaths</Button>{' '}
                <Button size="sm" variant="outline-success" onClick={(e) => {
                        this.onMapTypeSelect('recoveries');}
                    }>Recoveries</Button>{' '}
            </ButtonGroup>
            </div>
            <Container fluid>
            <Row>
                <Col sm={8}>
                    <div id="mapdiv" style={{ width: "100%", height: "400px" }}></div>
                </Col>
                <Col sm={4}>
                    <div id="summarydiv" style={{ width: "100%", height: "400px" }}></div>
                </Col>
            </Row>
            <Row>
                    <Col sm={8}>
                        <div id="timelinediv" style={{ width: "100%", height: "400px" }}></div>
                    </Col>
                    <Col sm={4}>
                        <div id="mortalitydiv" style={{ width: "100%", height: "400px" }}></div>
                    </Col>
            </Row>
            <Row>
                <Col sm={4}>
                    <h3>
                        Active Cases:&nbsp;&nbsp;&nbsp;
                        <small className="text-muted">{this.state.activeCases}</small>
                    </h3>
                </Col>
                <Col sm={4}>
                    <h3>
                        Deaths:&nbsp;&nbsp;&nbsp;
                        <small className="text-muted">{this.state.deaths}</small>
                    </h3>
                </Col>
                <Col sm={4}>
                    <h3>
                        Recoveries:&nbsp;&nbsp;&nbsp;
                        <small className="text-muted">{this.state.recoveries}</small>
                    </h3>
                </Col>
            </Row>
            <Row>
                <Col>
                    <BootstrapTable
                        keyField="category"
                        data={this.state.fullCaseSummary}
                        columns={[
                            {
                                dataField: "category", 
                                text: "Region"
                            }, 
                            {
                                dataField: "value1", 
                                text: "Active Cases",
                                formatter: tbl_format
                            }, 
                            {
                                dataField: "percent", 
                                text: "Currently Infected", 
                                formatter: percent_format
                            },
                            {
                                dataField: "delta", 
                                text: "3-Day Delta", 
                                formatter: tbl_format
                            },
                            {
                                dataField: "value2", 
                                text: "Deaths",
                                formatter: tbl_format
                            }, 
                            {
                                dataField: "value3", 
                                text: "Recovered",
                                formatter: tbl_format
                            }
                        ]}
                    />
                </Col>
            </Row>
            </Container>
            </div>
        );
    }
}

export default Home;
