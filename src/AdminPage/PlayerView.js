import React, {Component} from 'react';
import * as firebase from 'firebase';

class PlayerView extends Component{
    state = {
        id: null
        //kills, counter, name, displayName, killSinceShuffle, status
    }

    componentDidMount(){
        const {id} = this.props.match.params;
        this.setState({id: id});
        console.log(id);
    }

    render(){
        return(
            <p>Working: {this.state.id}</p>
        );
    }
}

export default PlayerView;