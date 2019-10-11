import React, {Component} from 'react';
import * as firebase from 'firebase';
import {Redirect} from 'react-router-dom';
import Loading from '../LoadingPage/Loading'
import {app} from '../config';

class Signup extends Component {
    state = {
        firebaseUser: null,
        email: '',
        name: '',
        displayName: '',
        pass: '',
        confirmPass: '',
        signingIn: false,
        error: '',
        window: 'loading'
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

    signup = () => {
        const email = this.state.email;
        const name = this.state.name;
        const displayName = this.state.displayName;
        const pass = this.state.pass;
        const confirmPass = this.state.confirmPass;
        const auth = firebase.auth();

        if(pass === confirmPass){
            this.setState({signingIn: true});
            const promise = auth.createUserWithEmailAndPassword(email, pass);
            promise.catch(e => {
                if(e){
                    this.setState({error: e.message});
                }else{
                    this.setState({error: ''});
                }
            });

            firebase.auth().onAuthStateChanged(newUser => {
                if(newUser){
                    firebase.database().ref('users/' + newUser.uid).set({
                        id: newUser.uid,
                        name: name,
                        displayName: displayName,
                        kills: 0,
                        status: true,
                        isAdmin: false,
                        inGame: false,
                        killSinceShuffle: false,
                        counter: 0,
                        highScore: 0,
                        totalKills: 0,
                        gamesWon: 0,
                        gamesPlayed: 0
                    })
                    .then(() => this.setState({window: 'stats'}));
                }else{
                    this.setState({window: 'signup'});
                }
            });
        }else{
            this.setState({error: 'Passwords do not match'});
        }
    }

    componentDidMount() {
        this.firebaseListener = firebase.auth().onAuthStateChanged(firebaseUser => {
            if(!this.state.signingIn){
                if (firebaseUser) {
                    this.setState({firebaseUser: firebaseUser});
                }else{
                    this.setState({
                        firebaseUser: null,
                        window: 'signup'
                    });
                }
            }
        });
    }

    componentWillUnmount() {
        this.firebaseListener && this.firebaseListener();
        this.authListener = undefined;
    }

    updateEmail = event => {
        this.setState({
            email: event.target.value
        });
    }

    updateName = event => {
        this.setState({
            name: event.target.value
        });
    }

    updateNickname = event => {
        this.setState({
            displayName: event.target.value
        });
    }

    updatePass = event => {
        this.setState({
            pass: event.target.value
        });
    }

    updateConfirmPass = event => {
        this.setState({
            confirmPass: event.target.value
        });
    }

    render(){
        return (
            <div>
                {
                    this.state.window === 'loading' ?
                    <Loading/>
                    :
                    this.state.window === 'stats' ?
                    <Redirect push to='/'/>
                    :
                    <div style={this.style}>
                        <h1><u>Sign Up</u></h1>
                        <input style={this.inputStyle} type='email' placeholder='E-Mail' onChange={e => this.updateEmail(e)}/> <br/>
                        <input style={this.inputStyle} type='text' placeholder='Full Name' onChange={e => this.updateName(e)}/> <br/>
                        <input style={this.inputStyle} type='text' placeholder='Nickname' onChange={e => this.updateNickname(e)}/> <br/>
                        <input style={this.inputStyle} type='password' placeholder='Password' onChange={e => this.updatePass(e)}/> <br/>
                        <input style={this.inputStyle} type='password' placeholder='Confirm Password' onChange={e => this.updateConfirmPass(e)}/> <br/>
                        {
                            this.state.error ?
                            <p style={{color: 'red'}}>{this.state.error}</p>
                            :
                            null
                        }
                        <button style={this.buttonStyle} onClick={this.signup}>Sign Up</button>
                    </div>
                }
            </div>
        );
    }
}

export default Signup;