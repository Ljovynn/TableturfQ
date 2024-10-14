const settingsLinks = document.getElementsByClassName('settings-link');
const modal = document.getElementById("settings-modal");
const overlay = document.querySelector(".overlay");
const openModalBtn = document.querySelector(".btn-open");
const closeModalBtn = document.querySelector(".settings-close");

// Individual settings toggles
const settingsQueueSound = document.getElementById('settings-queue-sound');

setUserSettings();

console.log(settingsLinks);
for ( let settingsLink of settingsLinks ) {
	settingsLink.addEventListener('click', async (e) => {
		openModal();
	});
}

closeModalBtn.addEventListener('click', closeModal);

settingsQueueSound.addEventListener('click', (e) => {
	localStorage.setItem('queueSound', Boolean(settingsQueueSound.checked));
});

function openModal() {
    modal.classList.remove('hidden');
    overlay.classList.remove('hidden');
    overlay.scrollTop = 0;
}

function closeModal() {
    modal.classList.add('hidden');
    overlay.classList.add('hidden');
}

function setUserSettings() {
	let queueSound = localStorage.getItem('queueSound');
	console.log(queueSound);
	console.log(queueSound == true);
	console.log(queueSound == null);

	if ( queueSound != 'false' ) {
		settingsQueueSound.setAttribute('checked', true);
	}
}