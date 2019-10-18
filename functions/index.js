/* eslint-disable promise/no-nesting */
/* eslint-disable promise/always-return */
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const rp = require('request-promise-native');

admin.initializeApp();

/*********************
 * ON-CALL FUNCTIONS *
 *********************/

exports.logKill = functions.https.onCall((data, context) => {
	let targetId = data.target;
	let assassinId = data.assassin;
	let gameId = data.gameId;
	
	return admin.database().ref(`users/${targetId}`).once('value').then(targetSnap => {
		return admin.database().ref(`users/${assassinId}`).once('value').then(assassinSnap => {
			//Update kill log
			let date = new Date();
			return admin.database().ref(`games/${gameId}/killsToday`).push({
				//Time data
				year: date.getFullYear(),
				month: date.getMonth(),
				day: date.getDate(),
				hour: date.getHours(),
				minutes: date.getMinutes(),
				//Victim data
				victimId: targetId,
				victimName: targetSnap.val().name,
				victimFreeAgent: targetSnap.val().freeAgent,
				victimCounter: targetSnap.val().counter,
				//Assassin data
				assassinId: assassinId,
				assassinName: assassinSnap.val().name,
				assassinFreeAgent: assassinSnap.val().freeAgent,
				assassinCounter: assassinSnap.val().counter
			})
			.catch(e => {
				console.log(e);
				return {
					status: 0
				}
			})
			.then(() => {
				return {
					status: 1
				}
			});
		});
	});
});

exports.shuffleNow = functions.https.onCall((data, context) => {
	let status = 0;
	const gameId = data.gameId;
	return admin.database().ref(`games/${gameId}`).once('value').then(snap => {
		const freeAgent = snap.val().freeAgents;
		return shuffle(freeAgent, gameId)
		.catch(e => {
			console.log(e);
			status = 0;
		})
		.then(() => {
			status = 1;
			return sendMessage(snap.val(), 'Targets have been shuffled by the admin!');
		});
	})
	.catch(e => {
		status = 0;
		return {
			status: status,
			error: e
		}
	})
	.then(() => {
		status = 1;
		return {
			status: status
		}
	});
});

exports.removeTargetsNow = functions.https.onCall((data, context) => {
	const gameId = data.gameId;
	return removeTargets(gameId)
	.catch(e => {
		console.log(e);
		return {
			status: 0,
			error: e
		}
	})
	.then(() => {
		return {
			status: 1
		}
	});
});

exports.killIdlersNow = functions.https.onCall((data, context) => {
	let status = 0;
	const gameId = data.gameId;
	return admin.database().ref(`games/${gameId}`).once('value').then(snap => {
		const standard = snap.val().counterTolerance;
		return killIdlers(gameId, standard)
		.catch(e => {
			status = 0;
			console.log(`Error killing idlers: ${e}`);
		})
		.then(() => {
			status = 1;
			return sendMessage(snap.val(), `Players with a counter greater than or equal to ${standard} have been eliminated`);
		});
	})
	.catch(e => {
		status = 0;
		return {
			status: status,
			error: e
		}
	})
	.then(() => {
		status = 1;
		return {
			status: status
		}
	});
});

/********************************
 * DATABASE TRIGGERED FUNCTIONS *
 ********************************/
//Create the bot for the game
exports.createBot = functions.database.ref('games/{gameId}').onCreate(snap => {
		const cur = snap.val();
		const gameRef = snap.ref;
		let botId = '', groupName = '';

		if(cur.includeBot){
			const accessToken = cur.accessToken;
			const groupId = cur.groupId;
			
			return rp.post(`https://api.groupme.com/v3/bots?token=${accessToken}`, {
				json: {
					bot: {
						name: 'AIDA',
						group_id: groupId
					}
				}
			})
			.then(res => {
				if(res){
					botId = res.response.bot.bot_id;
					groupName = res.response.bot.group_name;
				}
			})
			.catch(err => {
				if(err){
					console.log(err);
				}
			})
			.then(() => {
				return gameRef.update({
					botId: botId,
					groupName: groupName
				})
			})
		}
		return 0;
	});

//Add player to the game
exports.addPlayer = functions.database.ref('games/{gameId}/players/{pushId}').onCreate((snap, context) => {
		let pid = snap.val().pID;

		let gameRef = admin.database().ref(`games/${context.params.gameId}`);
		let playerRef = admin.database().ref(`users/${pid}`);

		return gameRef.once('value', gameSnap => {
			return gameRef.update({numPlayers: gameSnap.val().numPlayers + 1})
			.then(() => {
				return playerRef.once('value', playerSnap => {
					return playerRef.update({
						inGame: true,
						gameId: gameSnap.val().id,
						gamesPlayed: playerSnap.val().gamesPlayed + 1,
						status: true,
						target: null,
						kills: 0,
						counter: 0,
						freeAgent: false,
						killSinceShuffle: false
					});
				});
			});
		});
	});

//Responds to a kill log by killing the player and updating assassin info
exports.respondToLog = functions.database.ref('games/{gameId}/killsToday/{logId}').onCreate((snap, context) => {
	let log = snap.val();
	let gameId = context.params.gameId;

	if(log.assassinId === "0"){ //If the kill was because of the counter
		let assassin;
		return admin.database().ref(`users`).orderByChild('target').equalTo(log.victimId).once('value').then(assassinSnap => {
			assassinSnap.forEach(data => {
				assassin = data.val();
			});

			let promise = Promise.resolve(0);
			//If assassin exists and victim has a target, update assassin's target to victim's target
			if(assassin){
				promise = admin.database().ref(`users/${log.victimId}`).once('value').then(victimSnap => {
					let victim = victimSnap.val();
					if(victim.target){
						return admin.database().ref(`users/${assassin.id}`).update({
							target: victim.target
						});
					}
				});
			}
			//Kill the victim
			return promise.then(() => {
				return admin.database().ref(`users/${log.victimId}`).update({
					target: null,
					freeAgent: false,
					status: false
				})
				.then(() => {
					return admin.database().ref(`games/${gameId}`).once('value').then(gameSnap => {
						return admin.database().ref(`games/${gameId}`).update({
							numLivePlayers: gameSnap.val().numLivePlayers - 1
						});
					});
				});
			});
		});
	}else if(log.assassinFreeAgent){ //If the assassin is a free agent
		let assassin;
		return admin.database().ref(`users`).orderByChild('target').equalTo(log.victimId).once('value').then(assassinSnap => {
			assassinSnap.forEach(data => {
				assassin = data.val();
			});

			let promise = Promise.resolve(0);
			//If assassin exists and victim has a target, update assassin's target to victim's target
			if(assassin){
				promise = admin.database().ref(`users/${log.victimId}`).once('value').then(victimSnap => {
					let victim = victimSnap.val();
					if(victim.target){
						return admin.database().ref(`users/${assassin.id}`).update({
							target: victim.target
						});
					}
				});
			}
			//Kill the victim
			return promise.then(() => {
				return admin.database().ref(`users/${log.victimId}`).update({
					target: null,
					freeAgent: false,
					status: false
				})
				.then(() => {
					//Increase the free agent's kills
					return admin.database().ref(`users/${log.assassinId}`).once('value').then(agentSnap => {
						return admin.database().ref(`users/${log.assassinId}`).update({
							kills: agentSnap.val().kills + 1,
							killSinceShuffle: true,
							counter: 0
						})
						.then(() => {
							return admin.database().ref(`games/${gameId}`).once('value').then(gameSnap => {
								return admin.database().ref(`games/${gameId}`).update({
									numLivePlayers: gameSnap.val().numLivePlayers - 1
								});
							});
						});
					});
				});
			});
		});
	}else if(log.victimFreeAgent){ //If the victim is a free agent
		return admin.database().ref(`users/${log.assassinId}`).once('value').then(assassinSnap => {
			//Increase the assassin's kills
			return admin.database().ref(`users/${log.assassinId}`).update({
				kills: assassinSnap.val().kills + 1,
				killSinceShuffle: true,
				counter: 0
			})
			.then(() => {
				return admin.database().ref(`users/${log.victimId}`).update({
					freeAgent: false,
					target: null,
					status: false
				})
				.then(() => {
					return admin.database().ref(`games/${gameId}`).once('value').then(gameSnap => {
						return admin.database().ref(`games/${gameId}`).update({
							numLivePlayers: gameSnap.val().numLivePlayers - 1
						});
					});
				});
			});
		});
	}else{ //If the kill was a traditional kill
		return admin.database().ref(`users/${log.victimId}`).once('value').then(victimSnap => {
			newTarget = victimSnap.val().target;
			return admin.database().ref(`users/${log.assassinId}`).once('value').then(assassinSnap => {
				return admin.database().ref(`users/${log.assassinId}`).update({
					kills: assassinSnap.val().kills + 1,
					target: newTarget,
					killSinceShuffle: true,
					counter: 0
				})
				.then(() => {
					return admin.database().ref(`users/${log.victimId}`).update({
						status: false,
						target: null,
						freeAgent: false
					})
					.then(() => {
						return admin.database().ref(`games/${gameId}`).once('value').then(gameSnap => {
							return admin.database().ref(`games/${gameId}`).update({
								numLivePlayers: gameSnap.val().numLivePlayers - 1
							});
						});
					});
				});
			});
		});
	}
});

//Check if the game should be ended when numLivePlayers is updated
exports.endGame = functions.database.ref('games/{gameId}/numLivePlayers').onUpdate(change => {
		let snapshot = change.after;
		let value = snapshot.val(); //Value of number of live players

		let gameRef = snapshot.ref.parent;
		let usersRef = admin.database().ref(`users`);

		if(value <= 1){ //If the number of live players has dropped to a point at which the game should be ended
			return gameRef.once('value').then(game => {
				let gameData = game.val();

				//If the game has a bot, send an ending message and then destroy it
				let winnerPromise = Promise.resolve(0);
				let botPromise;
				
				let msg = '';
				if(value === 1 && gameData.isLive){
					//Get the winner's name
					winnerPromise = usersRef.orderByChild('gameId').equalTo(gameData.id).once('value')
					.catch(e => {
						if(e) console.log(`Error in fetching winner: ${e}`);
					})
					.then(snap => {
						snap.forEach(player => { //Search the set of players for the last live player
							if(player.val().status && player.val().target === player.val().id){ //If the player is alive, set the message to contain their name
								msg = `We have a winner! ${player.val().name} is the victor in this game of Water Tag!\n`;
							}
						});
						msg += `The last players to fall were:\n`;
						for(key in gameData.killsToday){
							msg += `${gameData.killsToday[key].victimName}\n`;
						}
						msg += `Now, let's have a final roast for those fallen and especially our illustrious winner!`;

						botPromise = sendAndDestroy(gameData, msg);
					});
				}else if(value === -1){
					msg = 'Game ended by admin. Bye!';
					botPromise = sendAndDestroy(gameData, msg);
				}
				
				if(gameData.isLive || value === -1){
					//Once the bot (if it exists) finishes doing it's thing, clean up the data
					return winnerPromise.then(() => {
						return botPromise
						.then(() => {
							//Update data for each player in the game
							return usersRef.orderByChild('gameId').equalTo(gameData.id).once('value')
							.catch(e => {
								if(e) console.log(`Error in fetching player data: ${e}`);
							})
							.then(snap => {
								let promiseList = [];
								snap.forEach(data => {
									player = data.val();
									let playerRef = admin.database().ref(`users/${player.id}`);

									let highScore = player.highScore;
									let gamesWon = player.gamesWon;
									//If player is alive and last standing (winner)
									if(player.status === true && value === 1){ 
										gamesWon++;
										//If high score needs updated
										if(player.kills > highScore) highScore = player.kills;
									}

									let promise = playerRef.update({
										target: null,
										kills: 0,
										gamesWon: gamesWon,
										highScore: highScore,
										inGame: false,
										gameId: null,
										status: true,
										counter: 0,
										killSinceShuffle: false,
										freeAgent: false
									});
									//Store the promise for later resolution
									promiseList[promiseList.length] = promise;
								});

								return Promise.all(promiseList)
								.catch(e => {
									if(e) console.log(`Error updating player data: ${e}`);
								})
								.then(() => {
									let adminRef = admin.database().ref(`users/${gameData.adminID}`);
									return adminRef.update({
										gameInChargeOf: null,
										isAdmin: false
									})
									.catch(e => {
										if(e) console.log(`Error updating admin data: ${e}`);
									})
									.then(() => {
										return gameRef.remove()
										.catch(e => {
											if(e) console.log(`Error removing game: ${e}`);
										});
									});
								});
							});
						});
					});
				}
				return 1;
			});
		}
		return 0;
	});

/***********************
 * SCHEDULED FUNCTIONS *
 ***********************/

//Automatically shuffles players in games whose nextShuffle counter has reached 0
exports.scheduledShuffle = functions.pubsub.schedule('0 12 * * *').timeZone('America/Chicago').onRun(context => {
	return admin.database().ref('games').once('value').then(snap => {
		let promiseList = [];
		snap.forEach(game => {
			if(game.val().nextShuffle === 0 && game.val().numLivePlayers > 2){
				promiseList[promiseList.length] = removeTargets(game.val().id) //Remove targets from all players in game
				.then(() => {
					return killIdlers(game.val().id, game.val().counter) //Kill all players who haven't gotten a kill in the specified number of shuffles
					.then(() => {
						return shuffle(game.val().freeAgents, game.val().id) //Assign new targets
						.then(() => {
							return sendMessage(game.val(), 'Targets have been shuffled! May the odds be ever in your favor!'); //Send a message to GroupMe announcing the shuffle
						});
					});
				});	
			}else{
				promiseList[promiseList.length] = admin.database().ref(`games/${game.val().id}`).update({
					nextShuffle: game.val().nextShuffle - 1
				});
			}
		});
		return promiseList.all()
		.catch(e => {
			console.log(`Error finishing shuffle: ${e}`);
		});
	})
	.catch(e => {
		console.log(`Error getting games: ${e}`);
	});
});

//Every day at 10 PM Central, post a message listing fallen players for the past 24 hours
exports.scheduledKillAnnouncement = functions.pubsub.schedule('0 22 * * *').timeZone('America/Chicago').onRun(context => {
	let msg = '';
	return admin.database().ref(`games`).orderByChild('isLive').equalTo(true).once('value').then(snap => {
		let promiseArr = [];
		snap.forEach(game => {
			let gameData = game.val();
			let logPromise = Promise.resolve(0);
			//Construct a log of all fallen players for the day
			if(gameData.killsToday){
				msg = `Let us now honor today's fallen with a roast:\n`;
				console.log(gameData);
				console.log(gameData.killsToday);
				for(key in gameData.killsToday){
					msg += `${gameData.killsToday[key].victimName}\n`;
				}
				msg += `There are ${gameData.numLivePlayers} left alive\n`;
				
				let log = gameData.killsToday;
				logPromise = admin.database().ref(`games/${gameData.id}/killLog`).push({log}) //Archive the log
				.catch(e => {
					if(e) console.log(`Error in archiving log: ${e}`);
				})
				.then(() => {
					return admin.database().ref(`games/${gameData.id}/killsToday`).remove()
					.catch(e => {
						if(e) console.log(`Error in deleting daily log: ${e}`);
					})
				});
			}else{
				msg = 'Guys, really? No kills today? Step it up!';
			}
			promiseArr[promiseArr.length] = logPromise.then(() => {
				return sendMessage(gameData, msg);
			});
		});
		return Promise.all(promiseArr)
		.catch(e => {
			if(e) console.log(`Error in sending messages: ${e}`);
		});
	})
	.catch(e => {
		if(e) console.log(`Error getting games: ${e}`);
	});
});

/********************
 * HELPER FUNCTIONS * 
 ********************/

const sendAndDestroy = (gameData, msg) => {
	return sendMessage(gameData, msg)
	.then(() => destroyBot(gameData));
}

const sendMessage = (gameData, msg) => {
	if(gameData.includeBot){
		return rp.post(`https://api.groupme.com/v3/bots/post?token=${gameData.accessToken}`, {
			json: {
				bot_id: gameData.botId,
				text: msg
			}
		})
		.catch(e => {
			if(e) console.log(`Error in sending bot message: ${e}`);
		});
	}
	return Promise.resolve(0);
}

const destroyBot = gameData => {
	if(gameData.includeBot){
		return rp.post(`https://api.groupme.com/v3/bots/destroy?token=${gameData.accessToken}`, {
			json: {
				bot_id: gameData.botId
			}
		})
		.catch(e => {
			if(e) console.log(`Error in deleting bot: ${e}`);
		});
	}
	return Promise.resolve(0);
}

const removeTargets = gameId => {
	let playersRef = admin.database().ref('users').orderByChild('gameId').equalTo(gameId);
	return playersRef.once('value').then(snap => {
		let playerData = snap.val();
		for(let playerID in playerData){
            playerData[playerID].target = null;
            playerData[playerID].freeAgent = false;
		}
		return admin.database().ref('users').update(playerData)
		.catch(e => {
			console.log(`Error updating player data: ${e}`);
		});
	})
	.catch(e => {
		console.log(`Error fetching player data: ${e}`);
	});
}

const killIdlers = (gameId, standard) => {
	let playersRef = admin.database().ref('users').orderByChild('gameId').equalTo(gameId);
	return playersRef.once('value').then(snap => {
		let playerData = snap.val();
		let killRecords = [];
		for(let playerID in playerData){
			let date = new Date();
            if(playerData[playerID].counter >= standard){
                playerData[playerID].status = false;
				playerData[playerID].freeAgent = false;
				killRecords.push({
					year: date.getFullYear(),
					month: date.getMonth(),
					day: date.getDate(),
					hour: date.getHours(),
					minutes: date.getMinutes(),
					victimId: playerData[playerID].id,
					victimName: playerData[playerID].name,
					assassinId: "0",
					assassinName: "COUNTER"
				});
            }
		}
		return admin.database().ref('users').update(playerData)
		.catch(e => {
			console.log(`Error updating player data: ${e}`);
		})
		.then(() => {
			let promises = [];
			killRecords.forEach(element => {
				let p = admin.database().ref(`games/${gameId}/killsToday`).push(element);
				promises.push(p);
			});
			return Promise.all(promises);
		})
	})
	.catch(e => {
		console.log(`Error fetching player data: ${e}`);
	});
}

//Does the heavy lifting for shuffling players
const shuffle = (freeAgent, gameId) => {
	let playerArr = [];

	let playersRef = admin.database().ref('users').orderByChild('gameId').equalTo(gameId);
	return playersRef.once('value').then(snap => {
		let playerData = snap.val();

		for(let playerID in playerData){
			if(playerData[playerID].status){
				playerArr[playerArr.length] = playerID;
				playerData[playerID].counter++;
				playerData[playerID].killSinceShuffle = false;
				playerData[playerID].freeAgent = false;
			}
		}

		let numPlayers = playerArr.length;

		//Set the free agent if requested
		if(freeAgent){
			let x = Math.floor(Math.random() * numPlayers);
			let agent = playerArr.splice(x, 1);
			playerData[agent].freeAgent = true;
			playerData[agent].target = null;
			numPlayers--;
		}

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
		return admin.database().ref('users/').update(playerData)
		.catch(e => {
			console.log(`Error updating player data ${e}`);
		})
		.then(() => {
			let gameRef = admin.database().ref(`games/${gameId}`);
			return gameRef.once('value').then(gameSnap => {
				return gameRef.update({
					nextShuffle: gameSnap.val().nextShuffleDefault
				})
				.catch(e => {
					console.log(`Error updating shuffle timer: ${e}`);
				});
			})
			.catch(e => {
				console.log(`Error fetching game data: ${e}`);
			});
		});
	})
	.catch(e => {
		console.log(`Error getting player data ${e}`);
	});
}