import React from 'react';
import * as firebase from 'firebase';

let tdStyle = {
    textAlign: 'center',
    border: '1px solid white'
}

const player = props => {
    let targetName;
    if(props.target){
        firebase.database().ref(`users/${props.target}`).on('value', snap => {
            targetName = snap.val().name
        });
    }else if(props.freeAgent){
        targetName = 'Free Agent';
    }else{
        targetName = 'No Target';
    }

    return(
        <tr>
            <td style={tdStyle}>{props.name}</td>
            <td style={tdStyle}>{targetName}</td>
            <td style={tdStyle}>{props.counter}</td>
        </tr>
    );
}

export default player;