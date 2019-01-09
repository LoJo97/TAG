const functions = require('firebase-functions');

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

exports.endGame = functions.database().ref('games/{gameId}/numLivePlayers')
	.onUpdate((snapshot, context) => {
		let value = snapshot.val();
		let gameRef = snapshot.ref.parent;

		if(value <= 1){
			return gameRef.update({
				isFinished: true,
				isLive: false
			})
			.then(() => {
				gameRef.child('players').orderByKey().once('value').then(snap => {
					snap.forEach(data => {
						player = data.val();
						let playerRef = firebase.database.ref(`users/${player.pID}`);
						
						if(player.status === true){
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
									killSinceShuffle: false
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
									killSinceShuffle: false
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
								killSinceShuffle: false
							});
						}
					});
				});
			});
		}else{
			return null;
		}
	});