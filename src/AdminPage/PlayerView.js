import React, {Component} from 'react';
import * as firebase from 'firebase';

class PlayerView extends Component{
    state = {
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

    render(){
        return(
            <div style={this.style}>
                <div>
                    <h1><u>{this.props.location.state.name}</u></h1>
                    <p>Kills: {this.props.location.state.kills}</p>
                    <p>Status: {this.props.location.state.status ? 'Alive' : 'Slain'}</p>
                    <p>Target: {this.props.location.state.targetName}</p>
                    <p>Counter: {this.props.location.state.counter}</p>
                    <p>Kill since last shuffle? {this.props.location.state.killSinceShuffle ? 'Yes' : 'No'}</p>
                </div>
            </div>
        );
    }
}

export default PlayerView;