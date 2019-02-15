// Initialize Firebase
firebase.initializeApp(config);

//Get elements
const txtEmail = document.getElementById('txtEmail');
const txtPassword = document.getElementById('txtPassword');
const btnLogin = document.getElementById('logIn');
const btnLogout = document.getElementById('logOut');

//Add login event
btnLogin.addEventListener('click', e => {
	//Get email and pass
	const email = txtEmail.value;
	const pass = txtPassword.value;
	const auth = firebase.auth();

	//Sign in
	const promise = auth.signInWithEmailAndPassword(email, pass);
	//promise.catch(e => document.getElementById('error').innerText = e.message);
});

//Add logout event
btnLogout.addEventListener('click', e => {
	firebase.auth().signOut();
});

//Login stuffs
firebase.auth().onAuthStateChanged(firebaseUser => {
	console.log("AUTH STATE CHANGED");
	if(firebaseUser){
		console.log('User is logged in');
		//Show all elements that should be shown only if a user is logged in
		let loggedInElements = document.getElementsByClassName('loggedIn');
		console.log(loggedInElements);
		for(let i = 0; i < loggedInElements.length; i++){
			console.log(loggedInElements[i]);
			loggedInElements[i].classList.remove('hide');
		}

		//Hide all elements that should be shown only if a user is logged out
		let loggedOutElements = document.getElementsByClassName('loggedOut');
		for(let i = 0; i < loggedOutElements.length; i++){
			loggedOutElements[i].classList.add('hide');
		}

		//Add user info into user menu
		firebase.database().ref('users/' + firebaseUser.uid).on('value', snapshot => {
			let user = snapshot.val();
			let userModal = document.getElementById('username');
			userModal.innerText = `User: ${user.name}`;
		});
	}else{
		console.log('Not logged in');
		//Hide all elements that should be shown only if a user is logged in
		let loggedInElements = document.getElementsByClassName('loggedIn');
		for(let i = 0; i < loggedInElements.length; i++){
			loggedInElements[i].classList.add('hide');
		}

		//Show all elements that should be shown only if a user is logged out
		let loggedOutElements = document.getElementsByClassName('loggedOut');
		for(let i = 0; i < loggedOutElements.length; i++){
			loggedOutElements[i].classList.remove('hide');
		}
	}
});

//Displays the page navigation menu when the icon is clicked
let menu = document.getElementById('menu');
menu.addEventListener('click', e => {
	let overlay = document.getElementById('menuOverlay');
	overlay.style.display = 'block';

	//Set up closing of overlay
	let span = document.getElementById('closeMenu');
	span.addEventListener('click', e => {
		overlay.style.display = 'none';
	});
});


//Displays the user menu when the icon is clicked
let userOverlay = document.getElementById('user');
userOverlay.addEventListener('click', e => {
	let overlay = document.getElementById('userOverlay');
	overlay.style.display = 'block';

	//Close when 'x' is clicked...
	let span = document.getElementById('closeUser');
	span.addEventListener('click', e => {
		overlay.style.display = 'none';
	});
	//...or when anywhere outside the display is clicked
	window.addEventListener('click', e => {
		if(e.target == overlay){
			overlay.style.display = 'none';
		}
	});
});

//Handles switching of tabs for pages with multiple sets of information to display (i.e. playerStats)
function switchTab(evt, animName){
	let pages, tabs;
	pages = document.getElementsByClassName('stats');
	for(let i = 0; i < pages.length; i++){
		pages[i].style.display = 'none';
	}

	tabs = document.getElementsByClassName('tab');
	for(let i = 0; i < pages.length; i++){
		tabs[i].className = tabs[i].className.replace(' teal', '');
	}
	document.getElementById(animName).style.display = 'block';
	evt.currentTarget.className += ' teal';
}