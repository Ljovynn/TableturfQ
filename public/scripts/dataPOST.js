// General POST function
// Set data and call from the buttons
async function postData(url='', data={}) {
    try {
        return fetch(url, {
            method: 'POST',
            mode: 'cors',
            cache: 'no-cache',
            credentials: 'same-origin',
            headers: new Headers({
                'Content-Type': 'application/json'
            }),
            redirect: 'follow',
            referrerPolicy: 'no-referrer',
            body: JSON.stringify(data)
        }).then(function(response) {
            return response.status;
        }).then(function(data) {
            console.log('Promise data response: ' + data);
            return data;
        });
    } catch (error) {
        console.error('Error:', error);
    }
}

async function getData(url='', data={}) {
    console.log('Get Data body: ' + JSON.stringify(data));
    try {
        return fetch(url, {
            method: 'POST',
            mode: 'cors',
            cache: 'no-cache',
            credentials: 'same-origin',
            headers: new Headers({
                'Content-Type': 'application/json'
            }),
            redirect: 'follow',
            referrerPolicy: 'no-referrer',
            body: JSON.stringify(data)
        }).then(function(response) {
            console.log('Promise response: ' + JSON.stringify(response) );
            return response.json();
        }).then(function(data) {
            console.log('Promise data response: ' + JSON.stringify(data) );
            return data;
        });
    } catch (error) {
        console.error('Error:', error);
    }
}

async function fetchData(url='') {
     try {
        return fetch(url, {
            mode: 'cors',
            cache: 'no-cache',
            credentials: 'same-origin',
            headers: new Headers({
                'Content-Type': 'application/json'
            }),
            redirect: 'follow',
            referrerPolicy: 'no-referrer',
        }).then(function(response) {
            console.log('Promise response: ' + JSON.stringify(response) );
            return response.json();
        }).then(function(data) {
            console.log('Promise data response: ' + data);
            return data;
        });
    } catch (error) {
        console.error('Error:', error);
    }
}