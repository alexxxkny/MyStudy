"use strict"

// Lists
const requests_list = document.getElementById('requests-list')
const users_list = document.getElementById('users-list')
users_list.querySelectorAll('select').forEach(item => {
    item.onchange = async (e) => {
        const selected_row = getSelectedRow(e)
        const user_id = selected_row.dataset.id
        await changeUserRole(user_id, item.value)
    }
})

// Join requests
const accept_btn = document.querySelector('.row__accept')
const decline_btn = document.querySelector('.row__decline')

accept_btn.onclick = async (e) => {
    const selected_row = getSelectedRow(e)
    const request_id = selected_row.dataset.id

    await acceptUserRequest(request_id, selected_row)
}

decline_btn.onclick = async (e) => {
    const selected_row = getSelectedRow(e)
    const request_id = selected_row.dataset.id

    await declineUserRequest(request_id, selected_row)
}

async function acceptUserRequest(request_id, selected_row) {
    let response = await post_json('#', {
        'action': 'accept_request',
        'data': {
            'id': request_id
        }
    })

    if(response.ok) {
        const response_json = await response.json()
        if(is_error_response(response_json)) return

        selected_row.remove()
        rearrangeNumbers(requests_list)
    } else alert('Сервер не отвечает')
}

async function declineUserRequest(request_id, selected_row) {
    let response = await post_json('#', {
        'action': 'decline_request',
        'data': {
            'id': request_id
        }
    })

    if(response.ok) {
        const response_json = await response.json()
        if(is_error_response(response_json)) return

        selected_row.remove()
        rearrangeNumbers(requests_list)
    } else alert('Сервер не отвечает')
}

async function changeUserRole(user_id, role_id) {
    let response = await post_json('#', {
        'action': 'change_role',
        'data': {
            'user_id': user_id,
            'role_id': role_id
        }
    })

    if(response.ok) {
        const response_json = await response.json()
        is_error_response(response_json)
    } else alert('Сервер не отвечает')
}

// Additional functions

function getSelectedRow(e) {
    return e.currentTarget.closest('.row')
}

function rearrangeNumbers(list) {
    const numbers = list.querySelectorAll('.row__number p')
    for(let i = 1; i <= numbers.length; i++) {
        numbers[i].innerText = i;
    }
}