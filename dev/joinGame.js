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

let join = document.getElementById('join');
let button = document.getElementById('btnJoin');
let eMsg = document.getElementById('error');

button.addEventListener('click', e => {
	firebase.auth().onAuthStateChanged(firebaseUser => {
		if(firebaseUser){
			const gameID = document.getElementById('txtGameID').value;
			const userRef = firebase.database().ref('users/' + firebaseUser.uid);
			const gameRef = firebase.database().ref('games/' + gameID);

			userRef.once('value', function(snapshot){
				if(!snapshot.val().isAdmin){
					if(!snapshot.val().inGame){
						gameRef.once('value', function(snapshot2) {
							if(snapshot2.val()){
								if(!snapshot2.val().isLive){
									let newPlayerRef = gameRef.child('players').push({pID: snapshot.val().id});
									gameRef.update({numPlayers: snapshot2.val().numPlayers + 1})
									userRef.update({
										inGame: true,
										gameId: gameID,
										gamesPlayed: snapshot.val().gamesPlayed + 1
									});
								}else{
									eMsg.innerText = 'Sorry, that game is already in progress';
								}
							}else{
								eMsg.innerText = 'Could not find game with that id';
							}
						});
					}else{
						eMsg.innerText = 'You cannot participate in more than one game';
					}
				}else{
					eMsg.innerText = 'You cannot admin and particpate in a game';
				}
			}, function(errorObject){
				console.log(`The read failed: ${errorObject.code}`);
			});
		}else{
			console.log('Not logged in');
		}
	});
});

//Add a realtime listener
firebase.auth().onAuthStateChanged(firebaseUser => {
	if(firebaseUser){
		join.classList.remove('hide');
	}else{
		document.getElementById('logoutMessage').classList.remove('hide');
	}
});