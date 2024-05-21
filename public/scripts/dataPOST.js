// General POST function
// Set data and call from the buttons
async function postData(url='', data={}) {
    try {
        const response = await fetch(url, {
            method: 'POST',
            mode: 'cors',
            cache: 'no-cache',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json'
            },
            redirect: 'follow',
            referrerPolicy: 'no-referrer',
            body: JSON.stringify(data)
        });
        return response.json();
    } catch (error) {
        console.error('Error:', error);
    }
}
