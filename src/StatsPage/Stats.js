import React, {Component} from 'react';
import * as firebase from 'firebase';
import {Link, Redirect} from 'react-router-dom';
import Loading from '../LoadingPage/Loading';
import {app} from '../config';

class Stats extends Component{
    state = {
        window: 'loading',
        gameId: '',
        firebaseUser: null,
        loggingOut: false,
        displayName: null,
        name: null,
        kills: null,
        totalKills: null,
        status: null,
        targetId: null,
        targetName: null,
        targetDisplayName: null,
        counter: null,
        gamesPlayed: null,
        gamesWon: null,
        highScore: null,
        inGame: null,
        isAdmin: null,
        killSinceShuffle: null,
        freeAgent: null
    }

    style = {
        position: 'absolute', left: '50%', top: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center'
    }

    inputStyle = {
        padding: '10%',
        margin: '5%',
        display: 'inline block',
        width: '75%'
    }

    buttonStyle = {
        margin: '5%',
        padding: '10%',
        backgroundColor: 'rgb(40, 40, 161)',
        color: 'white',
        border: 'none'
    }

    updateGameId = event => {
        this.setState({
            gameId: event.target.value
        });
    }

    logout = () => {
        this.setState({loggingOut: true}); //This keeps the onAuthStateChanged function from triggering and causing leaks
        firebase.auth().signOut().then(() => this.setState({window: 'login'}));
    }

    joinGame = () => {
        const gameId = this.state.gameId;
        const gameRef = firebase.database().ref('games/' + gameId);

        if(!this.state.isAdmin){
            if(!this.state.inGame){
                gameRef.once('value', snapshot => {
                    if(snapshot.val()){
                        if(!snapshot.val().isLive){
                            gameRef.child('players').push({pID: this.state.firebaseUser.uid});
                        }else{
                            console.log('Sorry, that game is already in progress');
                        }
                    }else{
                        console.log('Could not find game with that id');
                    }
                });
            }else{
                console.log('You cannot participate in more than one game');
            }
        }else{
            console.log('You cannot admin and particpate in a game');
        }
    }
    
    //Kills player's target (cloud function will take care of a lot of this)
    killTarget = () => {
        let assassinID = this.state.firebaseUser.uid;
        if(!this.state.freeAgent){
            let targetRef = firebase.database().ref('users/' + this.state.targetId);
            let playerRef = firebase.database().ref(`users/${assassinID}`);

            let c = window.confirm('Are you sure? Only mark your target as dead if you know the kill is not in dispute');
            if(c){
                targetRef.once('value').then(snapshot => {
                    //Updates cloud player data
                    playerRef.update({
                        kills: this.state.kills + 1,
                        killSinceShuffle: true,
                        counter: 0,
                        totalKills: this.state.totalKills + 1
                    })
                    .then(() => {
                        //Update cloud target data
                        targetRef.update({
                            status: false
                        });
                    });
                });
            }
        }
    }

    componentDidMount() {
        this.firebaseListener = firebase.auth().onAuthStateChanged(firebaseUser => {
            if(firebaseUser){ //If there is a user logged in, get their info
                let ref = firebase.database().ref('users/' + firebaseUser.uid);

                ref.on('value', snap => {
                    this.setState({
                        firebaseUser: firebaseUser,
                        displayName: snap.val().displayName,
                        name: snap.val().name,
                        kills: snap.val().kills,
                        totalKills: snap.val().totalKills,
                        status: snap.val().status,
                        targetId: snap.val().target,
                        counter: snap.val().counter,
                        gamesPlayed: snap.val().gamesPlayed,
                        gamesWon: snap.val().gamesWon,
                        highScore: snap.val().highScore,
                        inGame: snap.val().inGame,
                        isAdmin: snap.val().isAdmin,
                        killSinceShuffle: snap.val().killSinceShuffle,
                        freeAgent: snap.val().freeAgent,
                        window: 'stats'
                    });
                    if(snap.val().target){
                        firebase.database().ref('users/' + snap.val().target).once('value').then(targetSnap => {
                            this.setState({
                                targetName: targetSnap.val().name,
                                targetDisplayName: targetSnap.val().displayName
                            });
                        });
                    }
                });
            }else{ //If sign out has not already been initiated by the logout funtion, do it here
                if(!this.state.loggingOut) this.setState({window: 'login'});
            }
        });
    }

    componentWillUnmount() {
        this.firebaseListener && this.firebaseListener();
        this.authListener = undefined;
    }

    render(){
        return (
            <div>
                { //If logged in, display stats, if not, go to login
                    this.state.window === 'loading' ?
                    <Loading/>
                    :
                    this.state.window === 'stats' ?
                    <div style={this.style}>
                        <h1><u>Stats</u></h1>
                        <p>Name: {this.state.name}</p>
                        <p>Alias: {this.state.displayName}</p>
                        { //If in a game, display current stats or admin link. If not, let user join a game
                            this.state.inGame ?
                            <div>
                                <p>Kills: {this.state.kills}</p>
                                <p>Status: {this.state.status ? 'Alive' : 'Slain'}</p>
                                {
                                    this.state.freeAgent ?
                                    <div>
                                        <p>Free Agent</p>
                                        <Link to='/SelectTarget'><button style={this.buttonStyle}>Kill A Target</button></Link>
                                    </div>
                                    :
                                    this.state.targetId ?
                                    <div>
                                        <p>{`Target: ${this.state.targetName}`}</p>
                                        <button style={this.buttonStyle} onClick={this.killTarget}>Kill Target</button>
                                    </div>
                                    : 
                                    <p>No Target</p>
                                }
                                <p>Counter: {this.state.counter}</p>
                            </div>
                            :
                            this.state.isAdmin ?
                            <Link to='/Admin'><button style={this.buttonStyle}>Admin Game</button></Link>
                            :
                            <div>
                                <input placeholder='Game ID' onChange={this.updateGameId}/> <br/>
                                <button style={this.buttonStyle} onClick={this.joinGame}>Join Game</button>
                                <p>Or</p>
                                <Link to='/CreateGame'><button style={this.buttonStyle}>Create Game</button></Link>
                            </div>
                        }
                        <h2><u>All Time</u></h2>
                        <p>High Score: {this.state.highScore}</p>
                        <p>Total Kills: {this.state.totalKills}</p>
                        <p>Games Played: {this.state.gamesPlayed}</p>
                        <p>Games Won: {this.state.gamesWon}</p>
                        <button style={this.buttonStyle} onClick={this.logout}>Sign out</button>
                    </div>
                    :
                    <Redirect push to='/Login'/>
                }
            </div>
        );
    }
}

export default Stats;