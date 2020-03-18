import React from 'react';
import {Route, Switch} from 'react-router-dom';
import './Root.css';
import Home from './Home';

const Root = () => (
    <main>
        <Switch>
            <Route exact path='/' component={Home}/>
        </Switch>
    </main>
);

export default Root
