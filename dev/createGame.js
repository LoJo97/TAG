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

let button = document.getElementById('gameCreator');
let eMsg = document.getElementById('error');

//Add a realtime listener
firebase.auth().onAuthStateChanged(firebaseUser => {
	if(firebaseUser){
		button.classList.remove('hide');
	}else{
		document.getElementById('logoutMessage').classList.remove('hide');
	}
});

button.addEventListener('click', e => {
	firebase.auth().onAuthStateChanged(firebaseUser => {
		if(firebaseUser){
			let gameID = createGameId(); //Gets new random gameID
			let userRef = firebase.database().ref('users/' + firebaseUser.uid);
			let gameRef = firebase.database().ref('games/' + gameID);

			userRef.once("value", function(snapshot){
				//If a user is an admin or player, don't allow them to create a game
				if(!snapshot.val().isAdmin){
					if(!snapshot.val().inGame){
						gameRef.set({ //Create game
							id: gameID,
							adminID: snapshot.val().id,
							numPlayers: 0,
							isLive: false,
							isFinished: false
						})
						.then(() => { //Update the new admin
							userRef.update({
								gameInChargeOf: gameID,
								isAdmin: true
							})
							.then(() => { //Redirect
								window.location.replace('./admin.html');
							});
						});
					}else{
						eMsg.innerText = 'You cannot admin and particpate in a game';
					}
				}else{
					eMsg.innerText = 'You cannot admin more than one game';
				}
			}, function(errorObject){
				console.log(`The read failed: ${errorObject.code}`);
			});
		}
	});
});

function createGameId(){ //Random number generator
	return Math.floor(Math.random() * 1000000);
}