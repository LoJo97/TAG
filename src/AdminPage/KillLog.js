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
                                    return(
                                        <tr>
                                            <td style={this.tdStyle}>
                                                {`${this.state.killsToday[index].month}/${this.state.killsToday[index].day} ${this.state.killsToday[index].hour}:${this.state.killsToday[index].minutes}`}
                                            </td>
                                            <td style={this.tdStyle}>
                                                {this.state.killsToday[index].assassinName}
                                            </td>
                                            <td style={this.tdStyle}>
                                                {this.state.killsToday[index].victimName}
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
                        this.state.killsToday ?
                        <tbody>
                            {
                                Object.keys(this.state.killLog).map(index => {
                                    Object.keys(this.state.killLog[index]).map(innerIndex => {
                                        return(
                                            <tr>
                                                <td style={this.tdStyle}>
                                                    {`${this.state.killLog[index][innerIndex].month}/${this.state.killLog[index][innerIndex].day} ${this.state.killLog[index][innerIndex].hour}:${this.state.killLog[index][innerIndex].minutes}`}
                                                </td>
                                                <td style={this.tdStyle}>
                                                    {this.state.killLog[index][innerIndex].assassinName}
                                                </td>
                                                <td style={this.tdStyle}>
                                                    {this.state.killLog[index][innerIndex].victimName}
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