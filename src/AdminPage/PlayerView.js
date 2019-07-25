import React, {Component} from 'react';
import Loading from '../LoadingPage/Loading';
import * as firebase from 'firebase';

class PlayerView extends Component{
    state = {
        dataSave: {},
        freeAgent: false,
        kills: 0,
        status: true,
        targetName: null,
        counter: 0,
        killSinceShuffle: false,
        showButtons: true,
        statusColor: 'green',
        killColor: 'green',
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

    toggleStatus = () => {
        let statusColor = 'green';

        if(this.state.status){
            statusColor = 'rgb(155, 0, 0)';
        }

        this.setState({
            status: !this.state.status,
            statusColor: statusColor
        });
    }

    toggleKill = () => {
        let newKillColor = 'green';
        
        if(this.state.killSinceShuffle){
            newKillColor = 'rgb(155, 0, 0)';
        }

        this.setState({
            killSinceShuffle: !this.state.killSinceShuffle,
            killColor: newKillColor
        });
    }

    reset = () => {
        let statusColor = 'green';
        let killColor = 'green';

        if(!this.state.dataSave.status){
            statusColor = 'rgb(155, 0, 0)';
        }

        if(!this.state.dataSave.killSinceShuffle){
            killColor = 'rgb(155, 0, 0)';
        }

        this.setState({
            kills: this.state.dataSave.kills,
            status: this.state.dataSave.status,
            counter: this.state.dataSave.counter,
            killSinceShuffle: this.state.dataSave.killSinceShuffle,
            statusColor: statusColor,
            killColor: killColor
        });
    }

    submit = () => {
        firebase.database().ref(`users/${this.state.id}`).update({
            kills: this.state.kills,
            status: this.state.status,
            counter: this.state.counter,
            killSinceShuffle: this.state.killSinceShuffle
        })
        .then(() => {
            if((this.state.dataSave.kills !== this.state.kills) ||
                (this.state.dataSave.status !== this.state.status) ||
                (this.state.dataSave.counter !== this.state.counter) ||
                (this.state.dataSave.killSinceShuffle !== this.state.killSinceShuffle)){
                    this.setState({
                        window: 'loading'
                    });
                }
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
        let playerId = this.props.match.params.id;
        this.ref = firebase.database().ref(`users/${playerId}`)
        this.ref.on('value', snap => {
            let playerData = snap.val();

            let targetName;
            firebase.database().ref(`users/${playerData.target}/name`).once('value')
            .then(targetSnap => {
                targetName = targetSnap.val();
                let statusColor = playerData.status ? 'green' : 'rgb(155, 0, 0)';
                let killColor = playerData.killSinceShuffle ? 'green' : 'rgb(155, 0, 0)';

                this.setState({
                    dataSave: {
                        kills: playerData.kills,
                        status: playerData.status,
                        counter: playerData.counter,
                        killSinceShuffle: playerData.killSinceShuffle
                    },
                    freeAgent: playerData.freeAgent,
                    id: playerData.id,
                    kills: playerData.kills,
                    status: playerData.status,
                    targetName: targetName,
                    counter: playerData.counter,
                    killSinceShuffle: playerData.killSinceShuffle,
                    killColor: killColor,
                    name: playerData.name,
                    statusColor: statusColor,
                    window: 'view'
                });
            });
        });
    }

    componentWillUnmount(){
        this.ref.off();
    }

    render(){
        let statusButtonStyle = {
            margin: '5%',
            padding: '5%',
            color: 'white',
            border: 'none',
            backgroundColor: this.state.statusColor
        }
    
        let killButtonStyle = {
            margin: '5%',
            padding: '5%',
            color: 'white',
            border: 'none',
            backgroundColor: this.state.killColor
        }

        return(
            <div>
                {
                this.state.window ==='loading' ?
                <Loading/>
                :
                <div style={this.style}>
                    <div>
                        <h1><u>{this.state.name}</u></h1>
                        <label>
                            Kills:
                            <input name='kills' value={this.state.kills} style={this.inputStyle} onChange={this.handleInputChange}/>
                        </label><br/>
                        <p>Status:
                            <button style={statusButtonStyle} onClick={this.toggleStatus}>
                                {this.state.status ? 'Alive' : 'Slain'}
                            </button>
                        </p>
                        <label>
                            Counter:
                            <input name='counter' value={this.state.counter} style={this.inputStyle} onChange={this.handleInputChange}/>
                        </label><br/>
                        <p>Kill this round?
                            <button style={killButtonStyle} onClick={this.toggleKill}>
                                {this.state.killSinceShuffle ? 'Yes' : 'No'}
                            </button>
                        </p>
                        <p>{this.state.freeAgent ? 'Free Agent' : `${this.state.target ? `Target: ${this.state.targetName}` : `No Target`}`}</p>
                        <button style={this.buttonStyle} onClick={this.submit}>Save Changes</button><br/>
                        <button style={this.buttonStyle} onClick={this.reset}>Reset</button>
                    </div>
                </div>
                }
            </div>
        );
    }
}

export default PlayerView;