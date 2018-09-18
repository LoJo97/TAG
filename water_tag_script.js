// Models a basic user
class User{
	constructor(fullName, userID, nickName){ // The basic user that can be an admin or a player
		this.fullName = fullName; // The user's real name
		this.userID = userID; // The user's ID
		this.nickName = nickName; // The user's display name
	}
}

// Models a player
class Player extends User{ // The player class that gives users player functionality
	constructor(fullName, userID, nickName){
		super(fullName, userID, nickName);
		this.status = true; // True = alive, false = dead
		this.kills = 0; // # of kills
		this.target;
	}

	addKill(){ // Increments the player's killcount
		this.kills++;
	}

	assignTarget(target){ // Assigns another player to be this player's target
		this.target = target;
	}

	kill(){ // Kills this player by setting their status to false
		this.status = false;
	}
}

// Sets up a game
class Game{
	constructor(gameID){
		this.gameID = gameID;
		this.playerArr = [];
		this.gameStatus = true;
		this.gameOpen = true;
	}

	addPlayer(newPlayer){ // Adds a new player to the game
		this.playerArr.push(newPlayer);
	}

	assignTargets(){ // Assigns targets to the 
		let numPlayers = this.playerArr.length;
		console.log(numPlayers);
		let assassinArr = new Array(numPlayers);
		for(let i = 0; i < numPlayers; i++){ //Randomly puts players into a new array to shuffle them
			let x = Math.floor(Math.random() * numPlayers);

			if(assassinArr[x]){ //Hashing 
				let j = (x + 1) % numPlayers;
				while(assassinArr[j]){
					j = (j + 1) % numPlayers;
				}
				assassinArr[j] = this.playerArr[i];
			}else{
				assassinArr[x] = this.playerArr[i];
			}
		}

		for(let i = 0; i < numPlayers - 1; i++){ //Assigns each player's target to be the player after them
			assassinArr[i].assignTarget(assassinArr[i + 1]);
		}
		assassinArr[numPlayers - 1].assignTarget(assassinArr[0]);
	}

	showTargetingChain(){
		let start = this.playerArr[0];
		let i = 1;
		while(!start.target){
			if(i === this.playerArr.length){
				console.log('No one has any targets');
				return;
			}
			start = this.playerArr[i];
			i++;
		}
		console.log(start.fullName + '->');

		let curPlayer = start.target;
		while(!(start === curPlayer)){
			console.log(curPlayer.fullName + '->');
			curPlayer = curPlayer.target;

		}
	}

	performKill(killer){ //FIXME: Issues when getting down to 2 players
		if(killer.target.target === killer){
			killer.target.target = undefined;
			killer.target = undefined;
			killer.addKill();
			killer.target.kill();
			gameStatus = false;
			console.log(killer.nickName + ' won!');
		}else{
			let newTar = killer.target.target;
			killer.target.target = undefined;
			killer.target.kill();
			killer.assignTarget(newTar);
		}
	}
}

function createGame(){
	let newGame = new Game(createGameId());
	console.log(`Game ${newGame.gameID} created`);
}

function createGameId(){
	return Math.floor(Math.random() * 1000000);
}

document.getElementById('gameCreator').onclick = () => createGame();
/*
let newGame = new Game([], 1, 'Logan');
let toaster = new Player('Bailey Gulsby', 1, 'Toaster');
let tim = new Player('Timothy Bomers', 2, 'The Tim');
let baugh = new Player('Matthew Baughman', 3, 'Dude with the shorts');
let lojo = new Player('Logan Jordan', 4, 'LoJo');
let syd = new Player('Sydney Basden', 5, 'Syd');

newGame.addPlayer(toaster);
newGame.addPlayer(tim);
newGame.addPlayer(baugh);
newGame.addPlayer(lojo);
newGame.addPlayer(syd);
console.log(newGame.playerArr);

newGame.assignTargets();
newGame.showTargetingChain();
*/
