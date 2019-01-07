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

let join = document.getElementById('join');
let button = document.getElementById('btnJoin');
let eMsg = document.getElementById('error');

button.addEventListener('click', e => {
	firebase.auth().onAuthStateChanged(firebaseUser => {
		if(firebaseUser){
			const gameID = parseInt(document.getElementById('txtGameID').value, 10);
			const userRef = firebase.database().ref('users/' + firebaseUser.uid);
			const gameRef = firebase.database().ref('games/' + gameID);

			userRef.once('value', function(snapshot){
				if(!snapshot.val().isAdmin){
					if(!snapshot.val().inGame){
						gameRef.once('value', function(snapshot2) {
							if(snapshot2.val()){
								if(!snapshot2.val().isLive){
									let newPlayerRef = gameRef.child('players').push({pID: snapshot.val().id})
									.then(() => {
										gameRef.update({numPlayers: snapshot2.val().numPlayers + 1})
										.then(() => {
											userRef.update({
												inGame: true,
												gameId: gameID,
												gamesPlayed: snapshot.val().gamesPlayed + 1
											})
											.then(() => window.location.replace('./playerStats.html'));
										});
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