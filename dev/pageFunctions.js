let menu = document.getElementById('menu');

menu.addEventListener('click', e => {
	let overlay = document.getElementById('menuOverlay');
	overlay.style.display = 'block';

	let span = document.getElementsByClassName('close')[0];

	span.addEventListener('click', () => {
		overlay.style.display = 'none';
	});
});