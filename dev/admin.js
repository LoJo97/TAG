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

//Keeps track of data
let userData = {};
let playerData = {};
let gameData = {};

//Stores the buttons
let buttonStart = document.getElementById('start');
let buttonShuffle = document.getElementById('shuffle');
let buttonEnd = document.getElementById('end');
let buttonDeTarget = document.getElementById('deTarget');
let buttonKillIdle = document.getElementById('killIdle');

//Add a realtime listener
firebase.auth().onAuthStateChanged(firebaseUser => {
	if(firebaseUser){
		let userRef = firebase.database().ref('users/' + firebaseUser.uid); //Ref for the logged in user
		
		//Construct the map of player data
		userRef.once('value', function(snapshot){
			userData = snapshot.val();
			if(snapshot.val().isAdmin){ //Is admin, creates player array and prints player table
				let gameRef = firebase.database().ref('games/' + snapshot.val().gameInChargeOf); //Ref for the game the user admins
				
				document.getElementById('login-content').classList.remove('hide'); //Displays the content of the page

				gameRef.on('value', function(snapshot2){
					gameData = snapshot2.val();
					//Displays content and game status
					if(gameData.isFinished){ //Finished game
						buttonStart.classList.add('hide');
						buttonShuffle.classList.add('hide');
						buttonDeTarget.classList.add('hide');
						buttonKillIdle.classList.add('hide');
						buttonEnd.classList.remove('hide');
						document.getElementById('status').textContent = `Status: Finished`;
					}else if(!gameData.isLive){ //Registration phase
						buttonStart.classList.remove('hide');
						buttonShuffle.classList.add('hide');
						buttonDeTarget.classList.add('hide');
						buttonKillIdle.classList.add('hide');
						buttonEnd.classList.remove('hide');
						document.getElementById('status').textContent = `Status: Registration Phase`;
					}else{ //Ongoing game
						buttonStart.classList.add('hide');
						buttonShuffle.classList.remove('hide');
						buttonDeTarget.classList.remove('hide');
						buttonKillIdle.classList.remove('hide');
						buttonEnd.classList.remove('hide');
						document.getElementById('status').textContent = `Status: Ongoing`;
					}
					document.getElementById('gameID').textContent = `Game: ${snapshot2.val().id}`;
					document.getElementById('numPlayers').textContent = `No. of Players: ${snapshot2.val().numPlayers}`;
				});
				
				firebase.database().ref('users').orderByChild('gameId').equalTo(snapshot.val().gameInChargeOf).on('value', function(snapshot3){
					document.getElementById('playerList').innerHTML
					= "<tr>" +
					"<th>Name</th>" +
					"<th>Nickname</th>" +
					"<th>Kills</th>" +
					"<th>Status</th>" +
					"<th>Target</th>" +
					"<th>Counter</th>" +
					"<tr>";
					snapshot3.forEach(function(data){
						playerData[data.key] = data.val();

						if(data.val().target){ //If has target
							firebase.database().ref('users/' + data.val().target).once('value').then(function(target){
								document.getElementById('playerList').innerHTML 
								+= "<tr>" + 
								"<td>" + data.val().name + "</td>" +
								"<td>" + data.val().displayName + "</td>" +
								"<td>" + data.val().kills + "</td>" +
								"<td>" + data.val().status + "</td>" +
								"<td>" + target.val().name + "</td>" +
								"<td>" + data.val().counter + "</td>" +
								"</tr>";
							});
						}else{ //If no target
							document.getElementById('playerList').innerHTML 
							+= "<tr>" + 
							"<td>" + data.val().name + "</td>" +
							"<td>" + data.val().displayName + "</td>" +
							"<td>" + data.val().kills + "</td>" +
							"<td>" + data.val().status + "</td>" +
							"<td>No target</td>" +
							"<td>" + data.val().counter + "</td>" +
							"</tr>";
						}
					});
				});
			}else{
				document.getElementById('no-login').classList.remove('hide'); //Show the page for a not logged in user
			}
		}, function(errorObject){
			console.log(`The read failed: ${errorObject.code}`);
		});
	}else{
		document.getElementById('no-login').classList.remove('hide');
	}
});

buttonStart.addEventListener('click', e => {
	let c = confirm('Are you sure?'); //Confirmation alert
	if(c){ //On confirm
		if(gameData.numPlayers < 2){
			alert('You need at least two players for a good game of water tag');
		}else{
			let gameRef = firebase.database().ref('games/' + gameData.id);
			gameRef.update({
				isLive: true
			});
		}
	}
});

buttonEnd.addEventListener('click', e => {
	let c = confirm('Are you sure? Deleted games cannot be recovered.');
	if(c){
		gameData.isFinished = true;
		gameData.isLive = false;

		for(var playerID in playerData){
			playerData[playerID].inGame = false;
			playerData[playerID].kills = 0;
			playerData[playerID].gameId = null;
			playerData[playerID].status = true;
			playerData[playerID].target = null;
			playerData[playerID].counter = 0;
			playerData[playerID].killSinceShuffle = false;
		}

		userData.gameInChargeOf = null;
		userData.isAdmin = false;

		firebase.database().ref('games/' + gameData.id).update(gameData)
		.then(() => firebase.database().ref('users/').update(playerData))
		.then(() => firebase.database().ref('users/' + userData.id).update(userData));
	}
});

buttonShuffle.addEventListener('click', e => {
	let c = confirm("Are you sure?"); //Confirmation alert
	if(c){
		shuffle();
		firebase.database().ref('users/').update(playerData);
	}
});

buttonDeTarget.addEventListener('click', e => {
	let c = confirm("Are you sure?");
	if(c){
		removeTargets();
		firebase.database().ref('users/').update(playerData);
	}
});

buttonKillIdle.addEventListener('click', e => {
	let standard = prompt("Enter the number of shuffles since last kill that should be tolerated: ", 3);
	if(standard){
		killIdlers(standard);
		firebase.database().ref('users/').update(playerData);
	}
});

function shuffle(){
	let playerArr = new Array();

	for(playerID in playerData){
		if(playerData[playerID].status){
			playerArr[playerArr.length] = playerID;
			if(!playerData[playerID].killSinceShuffle){
				playerData[playerID].counter++;
			}
			playerData[playerID].killSinceShuffle = false;
		}
	}

	let numPlayers = playerArr.length;
	let assassinArr = new Array(numPlayers);

	for(let i = 0; i < numPlayers; i++){ //Randomly puts living players into a new array to shuffle them
		let x = Math.floor(Math.random() * numPlayers);
		//Hashing
		if(assassinArr[x]){  
			let j = (x + 1) % numPlayers;
			while(assassinArr[j]){
				j = (j + 1) % numPlayers;
			}
			assassinArr[j] = playerArr[i];
		}else{
			assassinArr[x] = playerArr[i];
		}
	}

	for(let i = 0; i < numPlayers - 1; i++){
		playerData[assassinArr[i]].target = assassinArr[i + 1];
	}
	playerData[assassinArr[numPlayers - 1]].target = assassinArr[0];
}

function removeTargets(){
	for(playerID in playerData){
		playerData[playerID].target = null;
	}
}

function killIdlers(standard){
	for(playerID in playerData){
		if(playerData[playerID].counter >= standard){
			playerData[playerID].status = false;
		}
	}
}