// Initialize Firebase
firebase.initializeApp(config);

let gameID;
let leaderArr = [];
let leaderArrSize = 0;

firebase.auth().onAuthStateChanged(firebaseUser => {
	if(firebaseUser){
		document.getElementById('login-content').classList.remove('hide');

		let user = firebaseUser;
		let userRef = firebase.database().ref('users/' + firebaseUser.uid);

		userRef.once('value', function(snapshot){
			if(snapshot.val().isAdmin){
				gameID = snapshot.val().gameInChargeOf;
			}else{
				gameID = snapshot.val().gameId;
			}
		}).then(() => {
			firebase.database().ref('users/').orderByChild('kills').limitToLast(10).on('value', function(snapshot){
				let leaderBoard = document.getElementById('leaders');
				leaderBoard.innerHTML = "<h2>This game's top players!</h2>";

				snapshot.forEach(function(data){
					if(data.val().gameId === gameID && data.val().kills > 0){
						leaderArrSize = leaderArr.push(`<p>#${leaderArrSize + 1}: ${data.val().displayName === "" ? data.val().name : data.val().displayName} - Kills: ${data.val().kills} - Status: ${data.val().status ? 'Alive' : 'Slain'}</p>`);
					}
				});

				for(let j = 0; j < leaderArrSize; j++){
					leaderBoard.innerHTML += leaderArr[j];
				}

				if(leaderArrSize === 0){
					leaderBoard.innerHTML += '<p>No kills yet. Check back when somebody has made a kill<p>';
				}
			});
		});		
	}else{
		document.getElementById('no-login').classList.remove('hide');
	}
});