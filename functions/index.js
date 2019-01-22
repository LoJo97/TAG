const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

//Repair the targeting chain when a player is killed
exports.repairChain = functions.database.ref('users/{userId}/status') //ON status change
	.onUpdate((change, context) => {
		let parentRef = change.after.ref.parent; //Get the ref to users/{userId}

		return parentRef.once('value').then(snapshot => {
			if(!change.after.val()){ //If target's status has been changed to dead
				let parent = snapshot.val();
				let usersRef = admin.database().ref('users');

				let deceasedID = parent.id; //Id of the killed player
				let target = parent.target; //Id of the killed player's target

				let gameRef = admin.database().ref(`games/${parent.gameId}`);

				return gameRef.once('value').then(game => {
					return gameRef.update({ //Update the number of live players
						numLivePlayers: game.val().numLivePlayers - 1
					})
					.then(() => { //Update the killLog
						let date = new Date();
						return gameRef.child('killLog').push({
							month: date.getMonth(),
							day: date.getDate(),
							hour: date.getHours(),
							minutes: date.getMinutes(),
							player: deceasedID
						})
						.then(() => {
							if(target){ //If target exists, perform updates
								let assassin;
								return parentRef.update({ //Update deceased player's data
									target: null,
									freeAgent: false
								})
								.then(() => {
									//Get the deceased player's assassin
									return usersRef.orderByChild('target').equalTo(deceasedID).once('value').then(snap => {
										snap.forEach(data => { //Store the assassin
											assassin = data.val();
										});

										if(assassin){ //If assassin exists, update target to deceased player's target
											return admin.database.ref(`users/${assassin.id}`).update({
												target: target
											});
										}
									});
								});
							}
						});
					});
				});
			}
		});
	});

//Check if the game should be ended when numLivePlayers is updated
exports.endGame = functions.database.ref('games/{gameId}/numLivePlayers')
	.onUpdate((change, context) => {
		let snapshot = change.after;
		let value = snapshot.val(); //Value of number of live players
		let gameRef = snapshot.ref.parent;

		return gameRef.once('value').then(game => {
			//If value has dropped to 1 or below and the game has started
			if(value <= 1 && game.val().isLive){
				return gameRef.update({ //Update game to finished
					isFinished: true,
					isLive: false
				})
				.then(() => {
					//Get players in the game
					return gameRef.child('players').orderByChild('gameId').equalTo(game.val().id).once('value').then(snap => {
						snap.forEach(data => {
							player = data.val();
							let playerRef = admin.database().ref(`users/${player.pID}`);
							
							//If player is alive and was last one standing
							if(player.status === true && value == 1){
								//If highscore needs updated
								if(player.kills > player.highScore){
									playerRef.update({
										target: null,
										kills: 0,
										gamesWon: player.gamesWon + 1,
										highScore: player.kills,
										inGame: false,
										gameId: null,
										status: true,
										counter: 0,
										killSinceShuffle: false,
										freeAgent: false
									});
								}else{
									playerRef.update({
										target: null,
										kills: 0,
										gamesWon: player.gamesWon + 1,
										inGame: false,
										gameId: null,
										status: true,
										counter: 0,
										killSinceShuffle: false,
										freeAgent: false
									});
								}
							}else{
								playerRef.update({
									target: null,
									kills: 0,
									inGame: false,
									gameId: null,
									status: true,
									counter: 0,
									killSinceShuffle: false,
									freeAgent: false
								});
							}
						});
					});
				});
			}
		});
	});
