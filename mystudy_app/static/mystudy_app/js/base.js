const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;

const weekdays = {
    0: 'Понедельник',
    1: 'Вторник',
    2: 'Среда',
    3: 'Четверг',
    4: 'Пятница',
    5: 'Суббота',
}

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

function is_error_response(response_data){
    if(response_data['result'] === 'error'){
        console.log(`Ошибка на стороне сервера.\n${response_data['data']['error_text']}`)
        alert(`Ошибка на стороне сервера.\n${response_data['data']['error_text']}`)
        return true
    }
    return false
}