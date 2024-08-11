const notification = document.getElementById('notification-message');

export async function userError(message) {
	notification.innerHTML = message;
	notification.classList.add('notification-error');
	notification.scrollTop = 0;
}