var timer = 0;
window.onload = function(){
	window.setInterval(updateTimer, 1000);
	console.log('Loaded!');
};

function updateTimer() {
	timer += 1;
	time = secondsToHMS(timer);
	document.getElementById('queue-timer').innerHTML = time;	
}

function secondsToHMS(d) {
    d = Number(d);

    var h = Math.floor(d / 3600);
    var m = Math.floor(d % 3600 / 60);
    var s = Math.floor(d % 3600 % 60);

    return ('0' + h).slice(-2) + ":" + ('0' + m).slice(-2) + ":" + ('0' + s).slice(-2);
}