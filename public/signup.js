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

//Get elements
const txtEmail = document.getElementById('txtEmail');
const txtPassword = document.getElementById('txtPassword');
const txtConfirmPassword = document.getElementById('txtConfirmPassword');
const txtFullName = document.getElementById('txtFullName');
const txtNickName = document.getElementById('txtNickName');
const btnSignUp = document.getElementById('btnSignUp');

//Add sign up event
btnSignUp.addEventListener('click', e => {
	const pass = txtPassword.value;
	const passConfirm = txtConfirmPassword.value;

	let err = document.getElementById('error');

	if(pass === passConfirm){
		//Get email and pass
		//TODO: Check real email
		const email = txtEmail.value;
		const fullName = txtFullName.value;
		const nickname = txtNickName.value;
		const auth = firebase.auth();

		//Sign up
		const promise = auth.createUserWithEmailAndPassword(email, pass);
		promise.catch(e => err.innerText = e.message);

		firebase.auth().onAuthStateChanged(newUser => {
			if(newUser){
				firebase.database().ref('users/' + newUser.uid).set({
					id: newUser.uid,
					name: fullName,
					displayName: nickname,
					kills: 0,
					status: true,
					isAdmin: false,
					inGame: false,
					highScore: 0,
					totalKills: 0,
					gamesWon: 0,
					gamesPlayed: 0
				}).then(() => window.location.replace('./playerStats.html'));
			};
		});
	}else{
		err.innerText = 'Passwords do not match';
	}
});