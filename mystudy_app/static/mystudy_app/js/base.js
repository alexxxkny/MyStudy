const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;

async function post_json(url, data) {
    return await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json;charset=utf-8',
            'X-CSRFToken': csrftoken
        },
        body: JSON.stringify(data)
    })
}

async function post_form(url, form){
    return await fetch(url, {
        method: 'POST',
        headers: {
            'X-CSRFToken': csrftoken
        },
        body: form
    })
}