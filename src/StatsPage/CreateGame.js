import React, {Component} from 'react';
import {Redirect} from 'react-router-dom';
import Loading from '../LoadingPage/Loading';
import * as firebase from 'firebase';
import {app} from '../config';

class CreateGame extends Component{
    state = {
        window: 'loading',
        firebaseUser: null,
        gameId: '',
        includeBot: false,
        accessToken: '',
        groupId: ''
    }

    style = { 
        display: 'flex',
        justifyContent:'center',
        alignItems: 'center',
        position: 'absolute',
        textAlign: 'center',
        left: '50%',
        width: '50%',
        transform: 'translate(-50%, -0%)'
    }

    inputStyle = {
        padding: '5%',
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

    createGameId = () => { //Random number generator and duplicate checker
        let newId = Math.floor(Math.random() * 1000000);
        let ref = firebase.database().ref(`games/${newId}`);
        ref.once('value', snap => {
            if(snap.value){
                return this.createGameId(); //If duplicate, try again
            }else{
                return newId; //If not, return the new id
            }
        });
        return newId;
    }

    create = () => {
        let gameRef = firebase.database().ref(`games/${this.state.gameId}`);
        let userRef = firebase.database().ref(`users/${this.state.firebaseUser.uid}`);

        gameRef.set({ //Create game
            id: this.state.gameId,
            adminID: this.state.firebaseUser.uid,
            numPlayers: 0,
            numLivePlayers: 0,
            freeAgents: false,
            nextShuffle: 0,
            nextShuffleDefault: 3,
            counterTolerance: 3,
            isLive: false,
            includeBot: this.state.includeBot,
            accessToken: this.state.accessToken,
            groupId: this.state.groupId,
            botId: '',
            groupName: ''
        })
        .then(() => { //Update the new admin
            userRef.update({
                gameInChargeOf: this.state.gameId,
                isAdmin: true
            })
            .then(() => {
                this.setState({window: 'stats'});
            });
        });
    }

    handleInputChange = event => {
        const target = event.target;
        const value = target.type === 'checkbox' ? target.checked : target.value;
        const name = target.name;

        this.setState({
            [name]: value
        });
    }

    componentDidMount(){
        this.firebaseListener = firebase.auth().onAuthStateChanged(firebaseUser => {
            this.setState({
                window: 'create',
                firebaseUser: firebaseUser,
                gameId: this.createGameId()
            });
        });
    }

    componentWillUnmount() {
        this.firebaseListener && this.firebaseListener();
        this.authListener = undefined;
    }

    render(){
        return(
            <div style={this.style}>
                {
                this.state.window === 'create' ?
                <div>
                    <h1>Game ID: {this.state.gameId}</h1>
                    <label>
                        <input name='includeBot' type='checkbox' checked={this.state.includeBot} onChange={this.handleInputChange}/>
                        Include GroupMe Bot?
                    </label>
                    <br/>
                    {
                        this.state.includeBot ?
                        <div>
                            <input name='accessToken' placeholder='Access Token' onChange={this.handleInputChange} style={this.inputStyle}/>
                            <br/>
                            <input name='groupId' placeholder='Group ID' onChange={this.handleInputChange} style={this.inputStyle}/>
                        </div>
                        :
                        null
                    }
                    <button style={this.buttonStyle} onClick={this.create}>Create!</button>
                </div>
                :
                this.state.window === 'stats' ?
                <Redirect push to='/'/>
                :
                <Loading/>
                }
            </div>
        );
    }
}

export default CreateGame;