// Initialize Firebase
var config = {
	apiKey: "AIzaSyChDtDILPRAsEo4AVLtQslhaYhTNYHjEeE",
	authDomain: "watertag-6ffd8.firebaseapp.com",
	databaseURL: "https://watertag-6ffd8.firebaseio.com",
	projectId: "watertag-6ffd8",
	storageBucket: "watertag-6ffd8.appspot.com",
	messagingSenderId: "347326684747"
};
firebase.initializeApp(config);

let playerArr = new Array();
let buttonStart = document.getElementById('start');
let buttonShuffle = document.getElementById('shuffle');

//Add a realtime listener
firebase.auth().onAuthStateChanged(firebaseUser => {
	if(firebaseUser){
		let userRef = firebase.database().ref('users/' + firebaseUser.uid);
		
		//Construct the array of players
		userRef.once('value', function(snapshot){
			if(snapshot.val().isAdmin){ //Is admin, creates player array and prints player table
				let gameRef = firebase.database().ref('games/' + snapshot.val().gameInChargeOf);
				
				document.getElementById('login-content').classList.remove('hide');

				//Takes care of text content and game status
				gameRef.on('value', function(snapshot2){
					if(snapshot2.val().isFinished){
						document.getElementById('start').classList.add('hide');
						document.getElementById('shuffle').classList.add('hide');
						document.getElementById('status').textContent = `Status: Finished`;
					}else if(!snapshot2.val().isLive){
						document.getElementById('start').classList.remove('hide');
						document.getElementById('shuffle').classList.add('hide');
						document.getElementById('status').textContent = `Status: Registration Phase`;
					}else{
						document.getElementById('start').classList.add('hide');
						document.getElementById('shuffle').classList.remove('hide');
						document.getElementById('status').textContent = `Status: Ongoing`;
					}
					document.getElementById('gameID').textContent = `Game: ${snapshot2.val().id}`;
					document.getElementById('numPlayers').textContent = `No. of Players: ${snapshot2.val().numPlayers}`;
				});

				gameRef.child('players').orderByKey().once('value')
				.then(function(snapshot2){
					snapshot2.forEach(function(data){
						firebase.database().ref('users/' + data.val().pID + '/status').once('value', function(data2){
							if(data2.val()) playerArr[playerArr.length] = data.val().pID;
						});

						firebase.database().ref('users/' + data.val().pID).once('value')
						.then(function(snapshot3){
							if(snapshot3.val().target){
								firebase.database().ref('users/' + snapshot3.val().target + '/name').once('value')
								.then(function(snap4){
									document.getElementById('playerList').innerHTML 
									+= "<tr>" + 
									"<td>" + snapshot3.val().name + "</td>" +
									"<td>" + snapshot3.val().displayName + "</td>" +
									"<td>" + snapshot3.val().kills + "</td>" +
									"<td>" + snapshot3.val().status + "</td>" +
									"<td>" + snap4.val() + "</td>" +
									"</tr>";
								});
							}else{
								document.getElementById('playerList').innerHTML 
								+= "<tr>" + 
								"<td>" + snapshot3.val().name + "</td>" +
								"<td>" + snapshot3.val().displayName + "</td>" +
								"<td>" + snapshot3.val().kills + "</td>" +
								"<td>" + snapshot3.val().status + "</td>" +
								"<td>No target</td>" +
								"</tr>";
							}
						});
					});
				});
			}else{
				document.getElementById('no-login').classList.remove('hide');
			}
		}, function(errorObject){
			console.log(`The read failed: ${errorObject.code}`);
		});
	}else{
		console.log('Not logged in');
		document.getElementById('no-login').classList.remove('hide');
	}
});

buttonStart.addEventListener('click', e => {
	let c = confirm("Are you sure?");
	if(c){
		firebase.auth().onAuthStateChanged(firebaseUser => {
			if(firebaseUser){
				firebase.database().ref('users/' + firebaseUser.uid).child('gameInChargeOf').once('value').then(function(snapshot){
					let gameRef = firebase.database().ref('games/' + snapshot.val());
					
					gameRef.update({
						isLive: true
					});
				});
			}else{
				console.log('Not logged in');
			}
		});
	}
});

buttonShuffle.addEventListener('click', e => {
	let c = confirm("Are you sure?");
	if(c){
		firebase.auth().onAuthStateChanged(firebaseUser => {
			if(firebaseUser){
				shuffle();
				window.location.assign('./admin.html');
			}else{
				console.log('Not logged in');
			}
		});
	}
});

function shuffle(){ // Assigns targets to the assassins
	let numPlayers = playerArr.length;
	console.log(numPlayers);
	let assassinArr = new Array(numPlayers);
	
	for(let i = 0; i < numPlayers; i++){ //Randomly puts players into a new array to shuffle them
		let x = Math.floor(Math.random() * numPlayers);

		if(assassinArr[x]){ //Hashing 
			let j = (x + 1) % numPlayers;
			while(assassinArr[j]){
				j = (j + 1) % numPlayers;
			}
			assassinArr[j] = playerArr[i];
		}else{
			assassinArr[x] = playerArr[i];
		}
	}

	for(let i = 0; i < numPlayers - 1; i++){ //Assigns each player's target to be the player after them
		assignTarget(assassinArr[i], assassinArr[i + 1]);
	}
	assignTarget(assassinArr[numPlayers - 1], assassinArr[0]);
}

function assignTarget(assassinID, targetID){ //Updates data on the cloud
	let assassinRef = firebase.database().ref('users/' + assassinID);
	console.log(assassinID);
	console.log(targetID);
	assassinRef.update({target: targetID});
}