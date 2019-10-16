import React, {Component} from 'react';
import * as firebase from 'firebase';
import {Redirect, Link} from 'react-router-dom';
import Player from './Player';
import Loading from '../LoadingPage/Loading';
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
        playerDataSorted: [],
        //Window data
        loggingIn: false,
        window: 'loading',
        sort: 'name'
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

    inputStyle = {
        padding: '5%',
        margin: '5%',
        display: 'inline block',
        width: '10%'
    }

    buttonStyle = {
        margin: '5%',
        padding: '10%',
        backgroundColor: 'rgb(40, 40, 161)',
        color: 'white',
        border: 'none'
    }

    endButtonStyle = {
        margin: '5%',
        padding: '10%',
        backgroundColor: 'rgb(155, 0, 0)',
        color: 'white',
        border: 'none'
    }

    //Sets game status to live
    start = () => {
        let c = window.confirm('Are you sure?'); //Confirmation alert
        if(c){ //On confirm
            if(this.state.numPlayers < 2){
                alert('You need at least two players for a good game of water tag');
            }else{
                this.setState({window: 'loading'});
                let gameRef = firebase.database().ref('games/' + this.state.gameId);
                gameRef.once('value').then(snapshot => {
                    gameRef.update({
                        isLive: true,
                        numLivePlayers: snapshot.val().numPlayers,
                        nextShuffleDefault: this.state.nextShuffleDefault,
                        nextShuffle: this.state.nextShuffleDefault,
                        freeAgents: this.state.freeAgents
                    })
                    .then(() => this.setState({window: 'admin'}));
                });
            }
        }
    }

    //Ends the game by setting the number of live players to -1, which triggers a cloud function
    end = () => {
        let c = window.confirm('Are you sure? Deleted games cannot be recovered.');
        if(c){
            this.setState({window: 'loading'});
            let gameData = {
                numLivePlayers: -1 //Triggers cloud function to end game/Doesn't award wins to living players
            }
            firebase.database().ref('games/' + this.state.gameId).update(gameData)
            .then(() => this.setState({window: 'admin'}));
        }
    }

    //Removes targets on the cloud, takes one arg: {gameId}
    removeTargets = firebase.functions().httpsCallable('removeTargetsNow');

    removeTargetsButton = () => {
        let c = window.confirm("Are you sure?");
        if(c){
            this.setState({window: 'loading'});
            this.removeTargets({gameId: this.state.gameId})
            .then(result => {
                console.log(result);
                this.setState({window: 'admin'});
            });
        }
    }

    //Kills all players who haven't killed another player in an amount of shuffles equal to the standard
    //on the cloud, takes one arg: {gameId}
    killIdlers = firebase.functions().httpsCallable('killIdlersNow');

    killIdleButton = () => {
        let c = window.confirm("Are you sure?");
        if(c){
            this.setState({window: 'loading'});
            this.killIdlers({gameId: this.state.gameId})
            .then(result => {
                console.log(result);
                this.setState({window: 'admin'});
            });
        }
    }

    //Shuffles players on the cloud, takes one arg: {gameId}
    shuffle = firebase.functions().httpsCallable('shuffleNow');

    //Handles the shuffle function
    shuffleButton = () => {
        let c = window.confirm("Are you sure?");
        if(c){
            this.setState({window: 'loading'});
            this.shuffle({gameId: this.state.gameId})
            .then(result => {
                console.log(result);
                //this.setState({window: 'admin'});
            });
        }
    }

    submit = () => {
        let c = window.confirm("Are you sure?");
        if(c){
            this.setState({window: 'loading'});
            firebase.database().ref(`games/${this.state.gameId}`).update({
                freeAgents: this.state.freeAgents,
                nextShuffle: this.state.nextShuffle,
                counterTolerance: this.state.counterTolerance
            })
            .then(() => this.setState({window: 'admin'}));
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

    sortPlayerData = () => {
        let data = this.state.playerData;
        let playerArr = [];

        Object.keys(data).map(index => {
            playerArr.push(data[index]);
        });

        if(this.state.sort === 'counter'){
            playerArr.sort((a, b) => (a.counter > b.counter) ? 1 : (a.counter === b.counter) ? ((a.name > b.name) ? 1 : -1) : -1);
        }else{
            playerArr.sort((a, b) => (a.name > b.name) ? 1 : -1);
        }

        this.setState({playerDataSorted: playerArr});
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
                                })
                                this.sortPlayerData();
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

    table = () => {
        return(
            <table>
                <thead>
                    <tr>
                        <th onClick={() => {
                            this.setState({sort: 'name'});
                            this.sortPlayerData();
                        }}>Name</th>
                        <th onClick={() => {
                            this.setState({sort: 'name'});
                            this.sortPlayerData();
                        }}>Target</th>
                        <th onClick={() => {
                            this.setState({sort: 'counter'});
                            this.sortPlayerData();
                        }}>Count</th>
                    </tr>
                </thead>
                {
                    this.state.playerDataSorted ?
                    <tbody>
                        {
                        this.state.playerDataSorted.map(player => {
                            return(
                                <Player
                                    key={player.id}
                                    counter={player.counter}
                                    freeAgent={player.freeAgent}
                                    id={player.id}
                                    killSinceShuffle={player.killSinceShuffle}
                                    kills={player.kills}
                                    name={player.name}
                                    status={player.status}
                                    target={player.target}
                                />
                            );
                        })
                        /*
                        Object.keys(this.state.playerData).map(index => {
                            return(
                                <Player 
                                    key={this.state.playerData[index].id}
                                    counter={this.state.playerData[index].counter}
                                    freeAgent={this.state.playerData[index].freeAgent}
                                    id={this.state.playerData[index].id}
                                    killSinceShuffle={this.state.playerData[index].killSinceShuffle}
                                    kills={this.state.playerData[index].kills}
                                    name={this.state.playerData[index].name}
                                    status={this.state.playerData[index].status}
                                    target={this.state.playerData[index].target}
                                />
                            );
                        })
                        */
                        }
                    </tbody>
                    :
                    <tbody></tbody>
                }
            </table>
        );
    }

    render(){
        return (
            this.state.window === 'loading' ?
            <Loading/>
            :
            this.state.window === 'PlayerView' ?
            <Redirect push to={`/PlayerView/${this.state.playerToView}`}/>
            :
            this.state.window === 'admin' ?
            <div style={this.style}>
                {
                !this.state.gameIsLive ?
                <div>
                    <h1>Game #{this.state.gameId}</h1>
                    <h3 style={{backgroundColor: 'red'}}>Status: Registration Phase</h3>
                    <input name='nextShuffleDefault' placeholder='Days between shuffles' style={this.inputStyle} onChange={this.handleInputChange}/><br/>
                    <input name='counterTolerance' placeholder='Counter Tolerance' style={this.inputStyle} onChange={this.handleInputChange}/><br/>
                    <label>
                        Add Free Agent?
                        <input name='freeAgents' type='checkbox' checked={this.state.freeAgents} onChange={this.handleInputChange}/>
                    </label><br/>
                    <button style={this.buttonStyle} onClick={this.start}>Begin Game</button>
                    {this.table()}
                    <button style={this.endButtonStyle} onClick={this.end}>End Game</button>
                </div>
                :
                <div>
                    <h1>Game #{this.state.gameId}</h1>
                    <h3 style={{backgroundColor: 'green'}}>Status: Ongoing</h3>
                    <label>
                        Days Until Next Shuffle: <br/>
                        <input name='nextShuffle' value={this.state.nextShuffle} style={this.inputStyle} onChange={this.handleInputChange}/>
                    </label>
                    <br/>
                    <label>
                        Counter Tolerance: <br/>
                        <input name='counterTolerance' value={this.state.counterTolerance} style={this.inputStyle} onChange={this.handleInputChange}/>
                    </label>
                    <br/>
                    <label>
                        Add Free Agent?
                        <input name='freeAgents' type='checkbox' checked={this.state.freeAgents} onChange={this.handleInputChange}/>
                    </label>
                    <br/>
                    <button style={this.buttonStyle} onClick={this.submit}>Submit Changes</button><br/>
                    <button style={this.buttonStyle} onClick={this.shuffleButton}>Shuffle</button><br/>
                    <button style={this.buttonStyle} onClick={this.removeTargetsButton}>Remove Targets</button><br/>
                    <button style={this.buttonStyle} onClick={this.killIdleButton}>Kill Idlers</button><br/>
                    {this.table()}
                    <Link to='/KillLog'><button style={this.buttonStyle}>Kill Log</button></Link><br/>
                    <button style={this.endButtonStyle} onClick={this.end}>End Game</button><br/>
                </div>
                }
            </div>
            :
            <Redirect push to='/'/>
        );
    }
}

export default Admin;