import React, {Component} from 'react';
import water_bottle from '../water_bottle.png';

class Loading extends Component {
    render(){
        return(
            <div className='loading'>
                <img src={water_bottle} className='img' alt='Water Bottle'/>
                <p>Loading...</p>
            </div>
        );
    }
}

export default Loading;