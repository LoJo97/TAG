import React from 'react';
import {Link} from 'react-router-dom';
import * as firebase from 'firebase';

let tdStyle = {
    textAlign: 'center',
    border: '2px solid white',
    textDecoration: 'none'
}

let linkStyle = {
    textDecoration: 'none',
    display: 'inline-block',
    height: '100%',
    width: '100%',
    color: 'white'
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
            <td style={tdStyle}>
                <Link to={{pathname: `/PlayerView/${props.id}`, state: props}} style={linkStyle}>
                    {props.name}
                </Link>
            </td>
            <td style={tdStyle}>
                <Link to={{pathname: `/PlayerView/${props.id}`, state: props}} style={linkStyle}>
                    {targetName}
                </Link>
            </td>
            <td style={tdStyle}>
                <Link to={{pathname: `/PlayerView/${props.id}`, state: props}} style={linkStyle}>
                    {props.counter}
                </Link>
            </td>
        </tr>
    );
}

export default player;