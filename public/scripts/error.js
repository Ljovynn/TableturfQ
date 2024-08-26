const notification = document.getElementById('notification-message');

export async function userError(message) {
	notification.innerHTML = message;
	notification.classList.add('notification-error');
	notification.scrollTop = 0;
}

export async function clearError() {
	notification.innerHTML = '';
	notification.classList.remove('notification-error');
}