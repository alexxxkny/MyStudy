"use strict"
import * as popup from "./popup_handler.js";
import {closeActivePopup, openPopup} from "./popup_handler.js";

// List
let selected_row = null
const disciplines_list = document.querySelector('.disciplines-list')

let edit_btns = document.querySelectorAll('.disciplines-list__edit')
for(let btn of edit_btns){
    btn.addEventListener('click', editClicked)
}

async function editClicked(e) {
    selected_row = e.currentTarget.parentElement
    fillEditForm()
    openPopup(edit_discipline_popup)
}


// Add Btn
const add_btn = document.getElementById('add-btn')
add_btn.addEventListener('click', () => {
    popup.openPopup(add_discipline_popup)
})

// Popups
// Add discipline popup
const add_discipline_popup_bg = document.getElementById('add-discipline-popup-bg')
const add_discipline_popup = document.getElementById('add-discipline-popup')
add_discipline_popup_bg.addEventListener('click', popup.closePopup)

const add_discipline_form = document.getElementById('add-discipline-form')
add_discipline_form.addEventListener('submit', async (e) => {
    e.preventDefault()
    await addDiscipline()
})

// Edit discipline popup
const edit_discipline_popup_bg = document.getElementById('edit-discipline-popup-bg')
const edit_discipline_popup = document.getElementById('edit-discipline-popup')
edit_discipline_popup_bg.addEventListener('click', popup.closePopup)

const edit_discipline_name = document.getElementById('edit-discipline-name')
const edit_discipline_short_name = document.getElementById('edit-discipline-short-name')

const delete_btn = document.getElementById('popup-delete-btn')
delete_btn.addEventListener('click', deleteDiscipline)

const edit_discipline_form = document.getElementById('edit-discipline-form')
edit_discipline_form.addEventListener('submit', async (e) => {
    e.preventDefault()
    await editDiscipline()
})

function getFormData(form) {
    const form_obj = new FormData(form)

    let form_data = {}
    for(let item of form_obj.entries()) form_data[item[0]] = item[1]
    return form_data
}

// Discipline functions

async function addDiscipline() {
    let form_data = getFormData(add_discipline_form)

    let response = await post_json('#', {
        'action': 'add_discipline',
        'data': form_data
    })

    if(response.ok) {
        let response_json = await response.json()
        if(is_error_response(response_json)) return

        let new_row = createRow()
        form_data['id'] = response_json['data']['id']
        fillRow(new_row, form_data)
        disciplines_list.lastElementChild.insertAdjacentElement('beforebegin', new_row)
        rearrangeNumbers()
        closeActivePopup()
    } else alert('Сервер не отвечает')
}

async function editDiscipline() {
    const discipline_id = selected_row.getAttribute('data-id')
    let form_data = getFormData(edit_discipline_form)

    form_data['id'] = discipline_id

    let response = await post_json('#', {
        'action': 'edit_discipline',
        'data': form_data
    })

    if(response.ok){
        let response_json = await response.json()
        if(is_error_response(response_json)) return

        fillRow(selected_row, form_data)
        closeActivePopup()
    } else alert('Сервер не отвечает')
}

async function deleteDiscipline() {
    const discipline_id = selected_row.getAttribute('data-id')

    let response = await post_json('#', {
        'action': 'delete_discipline',
        'data': {
            'id': discipline_id
        }
    })

    if(response.ok){
        let response_json = await response.json()
        if(is_error_response(response_json)) return

        selected_row.remove()
        selected_row = null
        rearrangeNumbers()
        closeActivePopup()
    } else alert('Сервер не отвечает')
}

// Appearance functions

function rearrangeNumbers() {
    const numbers = document.querySelectorAll('.disciplines-list__number')
    for(let i = 1; i <= numbers.length; i++){
        numbers[i - 1].children[0].innerText = i
    }
}

function fillRow(row, data) {
    if(data['id']) {
        row.setAttribute('data-id', data['id'])
    }
    row.children[1].children[0].innerText = data['name']
    row.children[2].children[0].innerText = data['short_name']
}

function fillEditForm() {
    edit_discipline_name.value = selected_row.children[1].children[0].innerText
    edit_discipline_short_name.value = selected_row.children[2].children[0].innerText
}

function createRow() {
    let row = document.createElement('div')
    row.classList.add('disciplines-list__row')

    let number = document.createElement('div')
    number.classList.add('disciplines-list__number')
    number.insertAdjacentHTML('afterbegin', '<p></p>')

    let name = document.createElement('div')
    name.classList.add('disciplines-list__name')
    name.insertAdjacentHTML('afterbegin', '<p></p>')

    let short_name = document.createElement('div')
    short_name.classList.add('disciplines-list__short-name')
    short_name.insertAdjacentHTML('afterbegin', '<p></p>')

    let edit = document.createElement('div')
    edit.classList.add('disciplines-list__edit')
    let img = document.createElement('img')
    img.src = 'http://127.0.0.1:8000/static/mystudy_app/images/icons/dots_icon.svg'
    edit.insertAdjacentElement('afterbegin', img)

    row.insertAdjacentElement('beforeend', number)
    row.insertAdjacentElement('beforeend', name)
    row.insertAdjacentElement('beforeend', short_name)
    row.insertAdjacentElement('beforeend', edit)

    return row
}

// Mutation Observers

let new_row_observer = new MutationObserver(records => {
    for(let record of records){
        for(let node of Array.from(record.addedNodes)){
            node.querySelector('.disciplines-list__edit').addEventListener('click', editClicked)
        }
    }
})
new_row_observer.observe(disciplines_list, {
    childList: true
})