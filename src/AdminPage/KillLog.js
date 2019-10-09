import React, {Component} from 'react';
import * as firebase from 'firebase';
import {Redirect} from 'react-router-dom';
import Loading from '../LoadingPage/Loading';
import {app} from '../config';

class KillLog extends Component {
    state = {
        //Admin data
        firebaseUser: null,
        name: null,
        isAdmin: null,
        //Game data
        gameId: null,
        gameIsLive: null,
        numPlayers: 0,
        numLivePlayers: 0,
        killsToday: null,
        killLog: null,
        //Window data
        loggingIn: false,
        window: 'loading'
    }

    style = { 
        display: 'flex',
        justifyContent:'center',
        alignItems: 'center',
        position: 'absolute',
        textAlign: 'center',
        left: '50%',
        width: '50%',
        transform: 'translate(-50%, 0%)'
    }

    tdStyle = {
        textAlign: 'center',
        border: '2px solid white',
        textDecoration: 'none'
    }

    getDaysInMonth = (month, year) => {
        if(month === 1 || month === 3 || month === 5 || month === 7 || month === 8 || month === 10 || month === 12){
            return 31;
        }else if(month === 2){
            if((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0){
                return 29;
            }else{
                return 28;
            }
        }else{
            return 30;
        }
    }

    formatDate = (y, m, d, h, min) => {
        let year = y;
        let month = m;
        let day = d;
        let hour = h;
        let minutes = min;

        if(hour < 5){ //If hour in UTC is less than 5...
            hour = 24 + (hour - 5); //Convert the hour to Central Time
            //And adjust the date accordingly:
            if(day === 1){ //If the day is the first of the month
                //Adjust the month
                if(month === 1){ //If the month is January, adjust to December
                    month = 12;
                }else{ //Otherwise decrement month
                    month--;
                }
                day = this.getDaysInMonth(year, month); //Adjust days to be the last of the previous month
            }else{
                day--;
            }
        }else{
            hour -= 5;
        }

        return `${month}/${day}/${year} ${hour}:${minutes < 10 ? '0' : ''}${minutes}`;
    }

    //On mount, load in neccessary data from Firebase
    componentDidMount() {
        this.firebaseListener = firebase.auth().onAuthStateChanged(firebaseUser => {
            if (firebaseUser) {
                let ref = firebase.database().ref('users/' + firebaseUser.uid);

                ref.on('value', snap => {
                    this.setState({ //Grab the admin's data
                        firebaseUser: firebaseUser,
                        name: snap.val().name,
                        isAdmin: snap.val().isAdmin
                    });
                    if(this.state.isAdmin){
                        this.setState({ //Grab and store the game id and show the window
                            gameId: snap.val().gameInChargeOf
                        });

                        let gameRef = firebase.database().ref(`games/${this.state.gameId}`);
                        let playersRef = firebase.database().ref('users').orderByChild('gameId').equalTo(this.state.gameId);
                        gameRef.on('value', gameSnap => { //Grab the game data
                            this.setState({
                                gameIsLive: gameSnap.val().isLive,
                                numPlayers: gameSnap.val().numPlayers,
                                numLivePlayers: gameSnap.val().numLivePlayers,
                                killsToday: gameSnap.val().killsToday,
                                killLog: gameSnap.val().killLog
                            });
                            playersRef.on('value', playersSnap => { //Grab the player data
                                this.setState({
                                    playerData: playersSnap.val(),
                                    window: 'admin'
                                });
                            });
                        });
                    }else{
                        this.setState({window: 'invalid'});
                    }
                });
            }else{
                this.setState({
                    firebaseUser: null,
                    window: 'invalid'
                });
            }
        });
    }
    
    componentWillUnmount() {
        this.firebaseListener && this.firebaseListener();
        this.authListener = undefined;
     }

    render(){
        return (
            this.state.window === 'loading' ?
            <Loading/>
            :
            this.state.window === 'admin' ?
            <div style={this.style}>
                <div>
                <h2>Players Left: {this.state.numLivePlayers}/{this.state.numPlayers}</h2>
                <h2>Today's Kills</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Time</th>
                            <th>Assassin</th>
                            <th>Victim</th>
                        </tr>
                    </thead>
                    {
                        this.state.killsToday ?
                        <tbody>
                            {
                                Object.keys(this.state.killsToday).map(index => {
                                    let kill = this.state.killsToday[index];
                                    return(
                                        <tr>
                                            <td style={this.tdStyle}>
                                                {this.formatDate(kill.year, kill.month, kill.day, kill.hour, kill.minutes)}
                                            </td>
                                            <td style={this.tdStyle}>
                                                {kill.assassinName}
                                            </td>
                                            <td style={this.tdStyle}>
                                                {kill.victimName}
                                            </td>
                                        </tr>
                                    );
                                })
                            }
                        </tbody>
                        :
                        <tbody></tbody>
                    }
                </table>

                <h2>Previous Kills</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Time</th>
                            <th>Assassin</th>
                            <th>Victim</th>
                        </tr>
                    </thead>
                    {
                        this.state.killLog ?
                        <tbody>
                            {
                                Object.keys(this.state.killLog).map(index => {
                                    return Object.keys(this.state.killLog[index].log).map(innerIndex => {
                                        let kill = this.state.killLog[index].log[innerIndex];
                                        return(
                                            <tr>
                                                <td style={this.tdStyle}>
                                                    {this.formatDate(kill.year, kill.month, kill.day, kill.hour, kill.minutes)}
                                                </td>
                                                <td style={this.tdStyle}>
                                                    {kill.assassinName}
                                                </td>
                                                <td style={this.tdStyle}>
                                                    {kill.victimName}
                                                </td>
                                            </tr>
                                        );
                                    });
                                })
                            }
                        </tbody>
                        :
                        <tbody></tbody>
                    }
                </table>
                </div>
            </div>
            :
            <Redirect push to='/'/>
        );
    }
}

export default KillLog;