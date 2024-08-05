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
        })/*.then(function(response) {
            return response.status;
        }).then(function(data) {
            console.log('Promise data response: ' + data);
            return data;
        });*/
        .then(response => Promise.all([Promise.resolve(response.status), response.json()]))
        .then(([status, data]) => {
            let res = {
                code: status, //I want to put http status code here,
                data: data
            }

            return res;
        });
    } catch (error) {
        console.error('Error:', error);
    }
}

async function getData(url='', data={}) {
    console.log('Get Data body: ' + JSON.stringify(data));
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
        })/*.then(function(response) {
            console.log('Promise response: ' + JSON.stringify(response) );
            return response.json();
        }).then(function(data) {
            console.log('Promise data response: ' + JSON.stringify(data) );
            return data;
        });*/
        .then(response => Promise.all([Promise.resolve(response.status), response.json()]))
        .then(([status, data]) => {
            let res = {
                code: status, //I want to put http status code here,
                data: data
            }

            return res;
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
        })/*.then(function(response) {
            console.log('Promise response: ' + JSON.stringify(response) );
            return response.json();
        }).then(function(data) {
            console.log('Promise data response: ' + data);
            return data;
        });*/
        .then(response => Promise.all([Promise.resolve(response.status), response.json()]))
        .then(([status, data]) => {
            let res = {
                code: status, //I want to put http status code here,
                data: data
            }

            return res;
        })
    } catch (error) {
        console.error('Error:', error);
    }
}