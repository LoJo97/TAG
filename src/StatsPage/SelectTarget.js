import React, {Component} from 'react';
import * as firebase from 'firebase';

class SelectTarget extends Component {
    state = {
        firebaseUser: null,
        freeAgent: null,
        gameId: null,
        kills: null,
        totalKills: null,
        window: 'loading',
        selection: null,
        playerData: {}
    }

    style = {
        position: 'absolute', left: '50%', top: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center'
    }

    buttonStyle = {
        margin: '5%',
        padding: '10%',
        backgroundColor: 'rgb(40, 40, 161)',
        color: 'white',
        border: 'none'
    }

    updateSelection = event => {
        this.setState({
            selection: event.target.value
        });
    }

    //Kills selected target (cloud function will take care of a lot of this)
    killTarget = () => {
        let assassinID = this.state.firebaseUser.uid;
        let targetRef = firebase.database().ref('users/' + this.state.selection);
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

    componentDidMount() {
        this.firebaseListener = firebase.auth().onAuthStateChanged(firebaseUser => {
            if(firebaseUser){ //If there is a user logged in, get their info
                let ref = firebase.database().ref('users/' + firebaseUser.uid);

                ref.on('value', snap => {
                    this.setState({
                        firebaseUser: firebaseUser,
                        freeAgent: snap.val().freeAgent,
                        gameId: snap.val().gameId,
                        kills: snap.val().kills,
                        totalKills: snap.val().totalKills,
                        window: 'select'
                    });
                    let playersRef = firebase.database().ref('users/').orderByChild('gameId').equalTo(this.state.gameId);
                    playersRef.on('value', playerSnap => {
                        this.setState({playerData: playerSnap.val()})
                    });
                });
            }else{
                this.setState({window: 'invalid'});
            }
        });
    }

    componentWillUnmount() {
        this.firebaseListener && this.firebaseListener();
        this.authListener = undefined;
    }

    render(){
        return(
            <div style={this.style}>
                <select onChange={this.updateSelection}>
                    {
                        Object.keys(this.state.playerData).map(key => {
                            if(this.state.playerData[key].status && (key !== this.state.firebaseUser.uid)){
                                return(
                                    <option key={key} value={this.state.playerData[key].id}>{this.state.playerData[key].name}</option>
                                );
                            }
                        })
                    }
                </select>
                <button style={this.buttonStyle} onClick={this.killTarget}>Confirm</button>
            </div>
        );
    }
}

export default SelectTarget;