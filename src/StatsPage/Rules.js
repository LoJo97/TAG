import React, {Component} from 'react';
import {app} from '../config';

class Rules extends Component{
    state = {
    }

    style = {
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
                <h1><u>RULES:</u></h1>
                <p>1. Thou shalt use a weapon composed strictly of one plastic beverage container, of the particular variety that have caps that screw onto the top. You must poke a hole in said cap to allow your weapon the ability to be fired at unwitting (or witting) opponents. No bottles of the kind that would be typically be referred to as “refillable” shall be utilized.</p>
                <p>2. Thou shalt use said weapon to spray thine target. Targets shall be assigned by your administrator. If you kill thine target, you shall report said kill in the “Check Stats” page. You will then be assigned your new target.</p>
                <p>3. Thou shalt not fire thine weapon inside buildings. No one wants to deal with that mess. This doth mean that, should either party, assassin or prey, be indoors at the time of an uncouth firing of the assassin’s weapon, any kill that may have been otherwise had shall be considered as null. BCM property (including the parking lot) is also a safe zone.</p>
                <p>4. Thou shalt not bear witness (true or false) against thine neighbor. No one likes a snitch, and remember that dead men tell no tales.</p>
                <p>5. There is one admin to rule them all,</p>
                <p>one admin to find them,</p>
                <p>one admin to bring them all,</p>
                <p>and in water tag bind them…</p>
                <p>In other words, your administrator’s rulings are final. This website is for making the game easier on your admin. Please, respect your leader, respect the game.</p>
            </div>
        );
    }
}

export default Rules;