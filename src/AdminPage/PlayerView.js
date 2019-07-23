import React, {Component} from 'react';
import * as firebase from 'firebase';

class PlayerView extends Component{
    state = {
        dataSave: {},
        kills: 0,
        status: true,
        targetName: null,
        counter: 0,
        killSinceShuffle: false,
        showButtons: true
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
        padding: '1%',
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

    reset = () => {
        this.setState({
            kills: this.state.dataSave.kills,
            status: this.state.dataSave.status,
            counter: this.state.dataSave.counter,
            killSinceShuffle: this.state.dataSave.killSinceShuffle
        });
    }

    submit = () => {
        this.setState({
            dataSave: {
                kills: this.state.kills,
                status: this.state.status,
                counter: this.state.counter,
                killSinceShuffle: this.state.killSinceShuffle
            }
        });

        firebase.database().ref(`users/${this.state.id}`).update({
            kills: this.state.kills,
            status: this.state.status,
            counter: this.state.counter,
            killSinceShuffle: this.state.killSinceShuffle
        });
    }
    
    handleInputChange = event => {
        const target = event.target;
        const value = target.type === 'checkbox' ? target.checked : target.value;
        const name = target.name;
        let actualValue = value;

        if(value && (name === 'kills' || name === 'counter')){
            actualValue = value.replace(/\D/,'');
            if(actualValue){
                actualValue = parseInt(actualValue);
            }
        }

        this.setState({
            [name]: actualValue
        });
    }

    componentDidMount() {
        this.setState({
            dataSave: {
                kills: this.props.location.kills,
                status: this.props.location.state.status,
                counter: this.props.location.state.counter,
                killSinceShuffle: this.props.location.state.killSinceShuffle
            },
            id: this.props.location.state.id,
            kills: this.props.location.kills,
            status: this.props.location.state.status,
            targetName: this.props.location.state.targetName,
            counter: this.props.location.state.counter,
            killSinceShuffle: this.props.location.state.killSinceShuffle
        });
    }

    render(){
        return(
            <div style={this.style}>
                <div>
                    <h1><u>{this.props.location.state.name}</u></h1>
                    <label>
                        Kills:
                        <input name='kills' value={this.state.kills} style={this.inputStyle} onChange={this.handleInputChange}/>
                    </label><br/>
                    <p>Status: {this.props.location.state.status ? 'Alive' : 'Slain'}</p>
                    <p>Target: {this.props.location.state.targetName}</p>
                    <label>
                        Counter:
                        <input name='counter' value={this.state.counter} style={this.inputStyle} onChange={this.handleInputChange}/>
                    </label><br/>
                    <p>Kill since last shuffle? {this.props.location.state.killSinceShuffle ? 'Yes' : 'No'}</p>
                    <button style={this.buttonStyle} onClick={this.submit}>Save Changes</button><br/>
                    <button style={this.buttonStyle} onClick={this.reset}>Reset</button>
                </div>
            </div>
        );
    }
}

export default PlayerView;