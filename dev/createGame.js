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
			let gameID = createGameId();
			let userRef = firebase.database().ref('users/' + firebaseUser.uid);
			let gameRef = firebase.database().ref('games/' + gameID);

			userRef.once("value", function(snapshot){
				if(!snapshot.val().isAdmin){
					if(!snapshot.val().inGame){
						gameRef.set({
							id: gameID,
							adminID: snapshot.val().id,
							numPlayers: 0,
							isLive: false,
							isFinished: false
						})
						.then(() => {
							userRef.update({
								gameInChargeOf: gameID,
								isAdmin: true
							})
							.then(() => {
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

function createGameId(){
	return Math.floor(Math.random() * 1000000);
}