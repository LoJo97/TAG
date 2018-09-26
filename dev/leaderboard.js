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

let gameID;

firebase.auth().onAuthStateChanged(firebaseUser => {
	if(firebaseUser){
		document.getElementById('login-content').classList.remove('hide');

		let user = firebaseUser;
		let userRef = firebase.database().ref('users/' + firebaseUser.uid);

		userRef.child('gameId').once('value', function(snapshot){
			gameID = snapshot.val();
		}).then(() => {
			firebase.database().ref('users/').orderByChild('kills').on('value', function(snapshot){
				let leaderBoard = document.getElementById('leaders');
				leaderBoard.innerHTML = "<h2>This game's top 10!</h2>";

				let i = 0;
				snapshot.forEach(function(data){
					if(i < 10 && data.val().gameId == gameID){
						leaderBoard.innerHTML
						+= `<p>#${i + 1}: ${data.val().displayName} - Kills: ${data.val().kills} - Status: ${data.val().status ? 'Alive' : 'Slain'}</p>`;
						i++;
					}
				});
			});
		});		
	}else{
		document.getElementById('no-login').classList.remove('hide');
	}
});