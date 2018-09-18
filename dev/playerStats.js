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
					+= snapshot.val().displayName;
				document.getElementById('name').textContent
					+= snapshot.val().name;
				document.getElementById('kills').textContent
					+= snapshot.val().kills;

				if(snapshot.val().status){
					document.getElementById('status').textContent
						+= 'Alive';
				}else{
					document.getElementById('status').textContent
						+= 'Slain';
				}

				if(snapshot.val().target){
					firebase.database().ref('users/' + snapshot.val().target + '/name').once('value').then(function(snap){
						document.getElementById('target').textContent
						= snap.val();
					});
				}else{
					document.getElementById('target').textContent
						= 'No target';
				}

				document.getElementById('highScore').textContent
					+= snapshot.val().highScore;
				document.getElementById('totalKills').textContent
					+= snapshot.val().totalKills;
				document.getElementById('gamesPlayed').textContent
					+= snapshot.val().gamesPlayed;
				document.getElementById('gamesWon').textContent
					+= snapshot.val().gamesWon;

			}else if(snapshot.val().isAdmin){ //Display if user is an admin
				document.getElementById('nickname').textContent 
					= `${snapshot.val().displayName} is currently a game admin`;
				document.getElementById('name').textContent
					+= snapshot.val().name;
				document.getElementById('kill').classList
					.add('hide');
				document.getElementById('kills').textContent
					= `Head to the admin page to see your game`;
				document.getElementById('status').textContent
					= '';
				document.getElementById('target').textContent
					= '';
				document.getElementById('highScore').textContent
					+= snapshot.val().highScore;
				document.getElementById('totalKills').textContent
					+= snapshot.val().totalKills;
				document.getElementById('gamesPlayed').textContent
					+= snapshot.val().gamesPlayed;
				document.getElementById('gamesWon').textContent
					+= snapshot.val().gamesWon;
			}else{ //Display if a user has no role
				document.getElementById('nickname').textContent 
					+= snapshot.val().displayName;
				document.getElementById('name').textContent
					+= snapshot.val().name;
				document.getElementById('kills').textContent
					= `Not in a game. Join one to have some fun!`;
				document.getElementById('kill').classList.add('hide');
				document.getElementById('status').textContent
					= '';
				document.getElementById('target').textContent
					= '';
				document.getElementById('highScore').textContent
					+= snapshot.val().highScore;
				document.getElementById('totalKills').textContent
					+= snapshot.val().totalKills;
				document.getElementById('gamesPlayed').textContent
					+= snapshot.val().gamesPlayed;
				document.getElementById('gamesWon').textContent
					+= snapshot.val().gamesWon;
			}
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

function killTarget(assassinID){
	let assassinRef = firebase.database().ref('users/' + assassinID);
	let targetRef;
	let player;

	assassinRef.once('value').then(function(snapshot){
		targetRef = firebase.database().ref('users/' + snapshot.val().target);
		player = snapshot.val();
		console.log('Begin kill');
		console.log(player);
	})
	.then(function(){
		console.log('then 1');
		targetRef.once('value').then(function(snapshot){
			console.log('in ref.once');

			//Updates local player data
			player.kills++;
			player.totalKills++;
			player.target = snapshot.val().target;

			//Updates cloud player data
			assassinRef.update({
				kills: player.kills,
				totalKills: player.totalKills,
				target: player.target
			})
			.then(function(){
				console.log('then 2');
				targetRef.update({
					target: null,
					status: false
				})
				.then(function(){
					console.log('then 3');
					if(player.target === player.id){
						endGame(player, assassinRef);
						document.getElementById('win')
						.classList.remove('hide');
					}
				});
			});
		});
	});
}

function endGame(player, assassinRef){
	console.log('Enters end game');

	//Updates the winner's data
	if(player.kills > player.highScore){
		console.log('Updating scores');
		assassinRef.update({
			target: null,
			gamesWon: player.gamesWon + 1,
			highScore: player.kills
		});
	}else{
		assassinRef.update({
			target: null,
			gamesWon: player.gamesWon + 1
		});
	}
	console.log('scores updated');

	let gameRef = firebase.database().ref('games/' + player.gameId);

	//Updates the game
	gameRef.update({
		isFinished: true,
		isLive: false
	}).then(function(){
		//Updates the players
		gameRef.child('players').orderByKey().once('value')
		.then(function(snapshot){
			snapshot.forEach(function(data){
				firebase.database().ref('users/' + data.val().pID).update({
					inGame: false,
					gameId: null,
					status: true
				});
			});
		})
		.then(function(){ //Updates the admin
			gameRef.child('adminID').once('value').then(function(snapshot){
				firebase.database.ref('users/' + snapshot.val()).update({
					gameInChargeOf: null,
					isAdmin: false
				});
			});

		});
	});
}


