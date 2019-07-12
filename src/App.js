import React, {Component} from 'react';
import {Route} from 'react-router-dom';
import './App.css';
import Login from './LoginPage/Login';
import Signup from './SignupPage/Signup';
import Stats from './StatsPage/Stats';
import Admin from './AdminPage/Admin';
import SelectTarget from './StatsPage/SelectTarget';
import CreateGame from './StatsPage/CreateGame';

class App extends Component {
	state = {
		user: null
	}

	render() {
		return (
			<div className="App">
				<Route exact path='/' component={Stats}/>
				<Route exact path='/Login' component={Login}/>
				<Route exact path='/Signup' component={Signup}/>
				<Route exact path='/Admin' component={Admin}/>
				<Route exact path='/SelectTarget' component={SelectTarget}/>
				<Route exact path='/CreateGame' component={CreateGame}/>
			</div>
			);
	}
}

export default App;
