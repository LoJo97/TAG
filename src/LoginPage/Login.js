import React, {Component} from 'react';
import {Link, Redirect} from 'react-router-dom';
import * as firebase from 'firebase';
import Loading from '../LoadingPage/Loading'
import {app} from '../config';

class Login extends Component {
    state = {
        email: '',
        pass: '',
        firebaseUser: null,
        loggingIn: false,
        error: false,
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

    updateEmail = event => {
        this.setState({
            email: event.target.value
        });
    }

    updatePass = event => {
        this.setState({
            pass: event.target.value
        });
    }

    login = () => {
        this.setState({loggingIn: true});
        const email = this.state.email;
        const pass = this.state.pass;
        const auth = firebase.auth();

        const promise = auth.signInWithEmailAndPassword(email, pass);
        promise.catch(e => {
            if(e){
                this.setState({error: true});
            }else{
                this.setState({error: false});
            }
        }).then(() => this.setState({window: '/'}));
    }

    componentDidMount() {
        this.firebaseListener = firebase.auth().onAuthStateChanged(firebaseUser => {
            if(!this.state.loggingIn){
                if (firebaseUser) {
                    this.setState({firebaseUser: firebaseUser});
                }else{
                    this.setState({
                        firebaseUser: null,
                        window: 'login'
                    });
                }
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
                {
                    this.state.window === 'loading' ?
                    <Loading/>
                    :
                    this.state.window === '/' ?
                    <Redirect push to='/'/>
                    :
                    <div style={this.style}>
                        <h1><u>Assassin</u></h1>
                        <input id='txtEmail' style={this.inputStyle} type='text' placeholder='Email' onChange={e => this.updateEmail(e)}/> <br/>
                        <input id='txtPass' style={this.inputStyle} type='password' placeholder='Password' onChange={e => this.updatePass(e)}/> <br/>
                        {
                            this.state.error ?
                            <p style={{color: 'red'}}>
                                User not recognized, please try again
                            </p>
                            :
                            null
                        }
                        <button style={this.buttonStyle} onClick={() => this.login()}>Log In</button>
                        <p>Or create an account</p>
                        <Link to='/Signup'><button style={this.buttonStyle}>Sign Up</button></Link>
                    </div>
                }
            </div>
        );
    }
}

export default Login;