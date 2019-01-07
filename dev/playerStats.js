// Initialize Firebase
var config = {
	apiKey: "AIzaSyCSYtxFzgNomtvoSBbn3vuN_-kDl61SxyI",
	authDomain: "watertagtest.firebaseapp.com",
	databaseURL: "https://watertagtest.firebaseio.com",
	projectId: "watertagtest",
	storageBucket: "",
	messagingSenderId: "781205798625"
};
firebase.initializeApp(config);

let button = document.getElementById('kill');

//Add a realtime listener
firebase.auth().onAuthStateChanged(firebaseUser => {
	if(firebaseUser){
		document.getElementById('login-content').classList.remove('hide');
		
		let user = firebaseUser;
		let ref = firebase.database().ref('users/' + firebaseUser.uid);

		ref.on("value", function(snapshot){
			if(snapshot.val().inGame){ //Display if user is in a game
				document.getElementById('nickname').textContent 
					= `Stats for: ${snapshot.val().displayName}`;
				document.getElementById('name').textContent
					= `Full Name: ${snapshot.val().name}`;
				document.getElementById('kills').textContent
					= `Kills: ${snapshot.val().kills}`;

				if(snapshot.val().status){
					document.getElementById('status').textContent
						= 'Status: Alive';
				}else{
					document.getElementById('status').textContent
						= 'Status: Slain';
				}

				if(snapshot.val().target){
					firebase.database().ref('users/' + snapshot.val().target).once('value').then(function(snap){
						document.getElementById('target').textContent
							= `Target: ${snap.val().name} (AKA ${snap.val().displayName})`;

						document.getElementById('kill').classList
							.remove('hide');
					});
				}else{
					document.getElementById('target').textContent
						= 'No target';

					document.getElementById('kill').classList
						.add('hide');
				}

				document.getElementById('counter').textContent
					= `Counter: ${snapshot.val().counter}`;
			}else if(snapshot.val().isAdmin){ //Display if user is an admin
				document.getElementById('nickname').textContent 
					= `${snapshot.val().displayName} is currently a game admin`;
				document.getElementById('name').textContent
					= `Full Name: ${snapshot.val().name}`;
				document.getElementById('kill').classList
					.add('hide');
				document.getElementById('kills').textContent
					= `Head to the admin page to see your game`;
				document.getElementById('status').textContent
					= '';
				document.getElementById('target').textContent
					= '';
			}else{ //Display if a user has no role
				document.getElementById('nickname').textContent 
					= `Stats for: ${snapshot.val().displayName}`;
				document.getElementById('name').textContent
					= `Full name: ${snapshot.val().name}`;
				document.getElementById('kills').textContent
					= `Not in a game. Join one to have some fun!`;
				document.getElementById('kill').classList.add('hide');
				document.getElementById('status').textContent
					= '';
				document.getElementById('target').textContent
					= '';
			}
			//Display all time stats
			document.getElementById('highScore').textContent
				= `High Score: ${snapshot.val().highScore}`;
			document.getElementById('totalKills').textContent
				= `Total Kills: ${snapshot.val().totalKills}`;
			document.getElementById('gamesPlayed').textContent
				= `Games Played: ${snapshot.val().gamesPlayed}`;
			document.getElementById('gamesWon').textContent
				= `Games Won: ${snapshot.val().gamesWon}`;
		}, function(errorObject){
			console.log(`The read failed: ${errorObject.code}`);
		});
	}else{
		console.log('Not logged in');
		document.getElementById('no-login').classList.remove('hide');
	}
});

button.addEventListener('click', e => {
	let c = confirm("Are you sure? Only mark your target as dead if you know the kill is not in dispute");
	if(c){
		firebase.auth().onAuthStateChanged(firebaseUser => {
			if(firebaseUser){
				killTarget(firebaseUser.uid);
			}else{
				console.log('Not logged in');
			}
		});
	}
});

//Kills player's target and gets the old target's target
function killTarget(assassinID){
	let assassinRef = firebase.database().ref('users/' + assassinID);
	let targetRef;
	let gameRef;
	let player;
	let oldTarget;

	assassinRef.once('value').then(function(snapshot){
		targetRef = firebase.database().ref('users/' + snapshot.val().target);
		gameRef = firebase.database().ref('games/' + snapshot.val().gameId);
		player = snapshot.val();
		oldTarget = snapshot.val().target;
	})
	.then(function(){
		targetRef.once('value').then(function(snapshot){
			//Updates local player data
			player.kills++;
			player.totalKills++;
			if(player.totalKills > player.highScore){
				player.highScore = player.totalKills;
			}
			player.target = snapshot.val().target;

			//Updates cloud player data
			assassinRef.update({
				kills: player.kills,
				killSinceShuffle: true,
				counter: 0,
				totalKills: player.totalKills,
				highScore: player.highScore,
				target: player.target
			})
			.then(function(){
				targetRef.update({
					target: null,
					status: false
				})
				.then(function(){
					let date = new Date();
					gameRef.child('killLog').push({
						month: date.getMonth(),
						day: date.getDate(),
						hour: date.getHours(),
						minutes: date.getMinutes(),
						player: oldTarget
					})
					.then(function(){
						if(player.target === player.id){
							endGame(player, assassinRef);
							document.getElementById('win')
							.classList.remove('hide');
						}
					});
				});
			});
		});
	});
}

function endGame(player, assassinRef){
	let gameRef = firebase.database().ref('games/' + player.gameId);
	//Updates the winner's data
	if(player.kills > player.highScore){
		assassinRef.update({
			target: null,
			kills: 0,
			gamesWon: player.gamesWon + 1,
			highScore: player.kills
		})
		.then(() => {
			//Updates the game
			gameRef.update({
				isFinished: true,
				isLive: false
			})
			.then(function(){
				//Updates the players
				gameRef.child('players').orderByKey().once('value')
				.then(function(snapshot){
					snapshot.forEach(function(data){
						firebase.database().ref('users/' + data.val().pID).update({
							inGame: false,
							gameId: null,
							status: true,
							counter: 0,
							killSinceShuffle: false
						});
					});
				});
			});
		});
	}else{
		assassinRef.update({
			target: null,
			gamesWon: player.gamesWon + 1
		})
		.then(() => {
			//Updates the game
			gameRef.update({
				isFinished: true,
				isLive: false
			}).
			then(function(){
				//Updates the players
				gameRef.child('players').orderByKey().once('value')
				.then(function(snapshot){
					snapshot.forEach(function(data){
						firebase.database().ref('users/' + data.val().pID).update({
							inGame: false,
							gameId: null,
							status: true,
							counter: 0,
							killSinceShuffle: false
						});
					});
				});
			});
		});
	}
}


