import React, {Component} from 'react';
import * as firebase from 'firebase';
import {Redirect} from 'react-router-dom';
import Player from './Player';
import Loading from '../LoadingPage/Loading'
import {app} from '../config';

class Admin extends Component {
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
        freeAgents: false,
        nextShuffle: 0,
        nextShuffleDefault: 0,
        counterTolerance: 0,
        //Player data
        playerData: {},
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
        top: '50%',
        transform: 'translate(-50%, -30%)'
    }
    /*
    style = {
        position: 'absolute', left: '50%', top: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center'
    }
    */
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

    tableStyle = {
        border: '1px solid white'
    }

    //Sets game status to live
    start = () => {
        let c = window.confirm('Are you sure?'); //Confirmation alert
        if(c){ //On confirm
            if(this.state.numPlayers < 2){
                alert('You need at least two players for a good game of water tag');
            }else{
                let gameRef = firebase.database().ref('games/' + this.state.gameId);
                gameRef.once('value').then(snapshot => {
                    gameRef.update({
                        isLive: true,
                        numLivePlayers: snapshot.val().numPlayers,
                        nextShuffleDefault: this.state.nextShuffleDefault,
                        nextShuffle: this.state.nextShuffleDefault,
                        freeAgents: this.state.freeAgents
                    });
                });
            }
        }
    }

    //Ends the game by setting the number of live players to -1, which triggers a cloud function
    end = () => {
        let c = window.confirm('Are you sure? Deleted games cannot be recovered.');
        if(c){
            let gameData = {
                numLivePlayers: -1 //Triggers cloud function to end game/Doesn't award wins to living players
            }
            firebase.database().ref('games/' + this.state.gameId).update(gameData);
        }
    }

    //Removes targets from all players
    removeTargets = () => {
        let playerData = this.state.playerData;
        for(let playerID in playerData){
            playerData[playerID].target = null;
            playerData[playerID].freeAgent = false;
        }
        this.setState({playerData: playerData});
    }

    removeTargetsButton = () => {
        let c = window.confirm("Are you sure?");
        if(c){
            this.removeTargets();
            firebase.database().ref('users/').update(this.state.playerData);
        }
    }
    
    //Kills all players who haven't killed another player in an amount of shuffles equal to the standard
    killIdlers = standard => {
        let playerData = this.state.playerData;
        for(let playerID in playerData){
            if(playerData[playerID].counter >= standard){
                playerData[playerID].status = false;
                playerData[playerID].freeAgent = false;
            }
        }
        this.setState({playerData: playerData});
    }

    killIdleButton = () => {
        let standard = window.prompt("Enter the number of shuffles since last kill that should be tolerated: ", 3);
        if(standard){
            this.killIdlers(standard);
            firebase.database().ref('users/').update(this.state.playerData);
        }
    }

    //Shuffles players on the cloud, takes one arg: {gameId}
    shuffle = firebase.functions().httpsCallable('shuffleNow');

    //Handles the shuffle function
    shuffleButton = () => {
        this.shuffle({gameId: this.state.gameId})
        .then(result => {
            console.log(result);
        });
    }

    submit = () => {
        let c = window.confirm("Are you sure?");
        if(c){
            firebase.database().ref(`games/${this.state.gameId}`).update({
                freeAgents: this.state.freeAgents,
                nextShuffle: this.state.nextShuffle,
                counterTolerance: this.state.counterTolerance
            });
        }
    }

    handleInputChange = event => {
        const target = event.target;
        const value = target.type === 'checkbox' ? target.checked : target.value;
        const name = target.name;
        let actualValue = value;

        if(value && (name === 'nextShuffle' || name === 'nextShuffleDefault' || name === 'counterTolerance')){
            actualValue = parseInt(value);
        }

        this.setState({
            [name]: actualValue
        });
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
                                freeAgents: gameSnap.val().freeAgents,
                                nextShuffleDefault: gameSnap.val().nextShuffleDefault,
                                nextShuffle: gameSnap.val().nextShuffle,
                                counterTolerance: gameSnap.val().counterTolerance
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

    table = props => {
        return(
            <table style={this.tableStyle}>
                <thead style={this.tableStyle}>
                    <tr>
                        <th>Name</th>
                        <th>Target</th>
                        <th>Counter</th>
                    </tr>
                </thead>
                {
                    this.state.playerData ?
                    <tbody style={this.tableStyle}>
                        {
                        Object.keys(this.state.playerData).map(key => {
                            return(
                                <Player
                                    key={this.state.playerData[key].id}
                                    name={this.state.playerData[key].name}
                                    target={this.state.playerData[key].target}
                                    freeAgent={this.state.playerData[key].freeAgent}
                                    counter={this.state.playerData[key].counter}
                                />
                            );
                        })
                        }
                    </tbody>
                    :
                    <tbody style={this.tableStyle}></tbody>
                }
            </table>
        );
    }

    render(){
        return (
            this.state.window === 'loading' ?
            <Loading/>
            :
            this.state.window === 'admin' ?
            <div style={this.style}>
                {
                !this.state.gameIsLive ?
                <div>
                    <h1>Game #{this.state.gameId}</h1>
                    <p>Status: Registration Phase</p>
                    <input name='nextShuffleDefault' placeholder='Days between shuffles' style={this.inputStyle} onChange={this.handleInputChange}/>
                    <input name='counterTolerance' placeholder='Counter Tolerance' style={this.inputStyle} onChange={this.handleInputChange}/>
                    <label>
                        Add Free Agent?
                        <input name='freeAgent' type='checkbox' checked={this.state.freeAgents} onChange={this.handleInputChange}/>
                    </label>
                    <button style={this.buttonStyle} onClick={this.start}>Begin Game</button>
                    <button style={this.buttonStyle} onClick={this.end}>End Game</button>
                    {this.table()}
                </div>
                :
                <div>
                    <h1>Game #{this.state.gameId}</h1>
                    <p>Status: Ongoing</p>
                    <label>
                        Days Until Next Shuffle:
                        <input name='nextShuffle' value={this.state.nextShuffle} style={this.inputStyle} onChange={this.handleInputChange}/>
                    </label>
                    <label>
                        Counter Tolerance:
                        <input name='counterTolerance' value={this.state.counterTolerance} style={this.inputStyle} onChange={this.handleInputChange}/>
                    </label>
                    <label>
                        Add Free Agent?
                        <input name='freeAgents' type='checkbox' checked={this.state.freeAgents} onChange={this.handleInputChange}/>
                    </label>
                    <button style={this.buttonStyle} onClick={this.submit}>Submit Changes</button>
                    <button style={this.buttonStyle} onClick={this.shuffleButton}>Shuffle</button>
                    <button style={this.buttonStyle} onClick={this.removeTargetsButton}>Remove Targets</button>
                    <button style={this.buttonStyle} onClick={this.killIdleButton}>Kill Idlers</button>
                    <button style={this.buttonStyle} onClick={this.end}>End Game</button>
                    {this.table()}
                </div>
                }
            </div>
            :
            <Redirect push to='/'/>
        );
    }
}

export default Admin;