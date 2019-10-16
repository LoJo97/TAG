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
    let data = {
        counter: props.counter,
        freeAgent: props.freeAgent,
        id: props.id,
        killSinceShuffle: props.killSinceShuffle,
        kills: props.kills,
        name: props.name,
        status: props.status,
        target: props.target,
        targetName: null
    }

    let targetName;
    if(props.targetName){
        targetName = props.targetName;
    }else if(props.freeAgent){
        targetName = 'Free Agent';
    }else{
        targetName = 'No Target';
    }

    data.targetName = targetName;

    return(
        <tr>
            <td style={tdStyle}>
                <Link to={`/PlayerView/${data.id}`} style={linkStyle}>
                    {props.name}
                </Link>
            </td>
            <td style={tdStyle}>
                <Link to={`/PlayerView/${data.id}`} style={linkStyle}>
                    {targetName}
                </Link>
            </td>
            <td style={tdStyle}>
                <Link to={`/PlayerView/${data.id}`} style={linkStyle}>
                    {props.counter}
                </Link>
            </td>
        </tr>
    );
}

export default player;