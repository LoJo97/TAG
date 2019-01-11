// Initialize Firebase
firebase.initializeApp(config);

//Get elements
const txtEmail = document.getElementById('txtEmail');
const txtPassword = document.getElementById('txtPassword');
const btnLogin = document.getElementById('btnLogin');
const btnLogout = document.getElementById('btnLogout');

//Add login event
btnLogin.addEventListener('click', e => {
	//Get email and pass
	const email = txtEmail.value;
	const pass = txtPassword.value;
	const auth = firebase.auth();

	//Sign in
	const promise = auth.signInWithEmailAndPassword(email, pass);
	promise.catch(e => document.getElementById('error').innerText = e.message);
});

btnLogout.addEventListener('click', e => {
	firebase.auth().signOut();
});
	//Add a realtime listener
firebase.auth().onAuthStateChanged(firebaseUser => {
	if(firebaseUser){
		btnLogout.classList.remove('hide');
		document.getElementById('login-form').classList.add('hide');
	}else{
		console.log('Not logged in');
		document.getElementById('login-form').classList.remove('hide');
		btnLogout.classList.add('hide');
	}
});