"use strict"
import * as dropdown from './dropdown_handler.js'
import * as popup from './popup_handler.js'

// Dropdowns
// Disciplines dropdown

let selected_discipline_item = null

const disciplines_dropdown_toggle = document.getElementById('disciplines-dropdown-toggle')
const disciplines_dropdown = document.getElementById('disciplines-dropdown')
dropdown.setAsDropdownButton(disciplines_dropdown_toggle, disciplines_dropdown)

disciplines_dropdown.querySelectorAll('.sidebar-list__edit').forEach(item => {
    item.onclick = (e) => {
        selected_discipline_item = e.currentTarget.closest('.sidebar-list__item')
        popup.openPopup(edit_discipline_popup)
    }
})

// Labels dropdown

let selected_label_item = null

const labels_dropdown_toggle = document.getElementById('labels-dropdown-toggle')
const labels_dropdown = document.getElementById('labels-dropdown')
dropdown.setAsDropdownButton(labels_dropdown_toggle, labels_dropdown)

labels_dropdown.querySelectorAll('.sidebar-list__edit').forEach(item => {
    item.onclick = (e) => {
        selected_label_item = e.currentTarget.closest('.sidebar-list__item')
        popup.openPopup(edit_label_popup)
    }
})

const add_label_btn = document.getElementById('add-label-btn')
add_label_btn.onclick = (e) => {
    e.stopPropagation();
    popup.openPopup(add_label_popup)
}

// Popups
// Add custom label popup
const add_label_popup_bg = document.getElementById('add-label-popup-bg')
const add_label_popup = document.getElementById('add-label-popup')
add_label_popup_bg.addEventListener('click', popup.closePopup)

const add_label_form = document.getElementById('add-label-form')
add_label_form.onsubmit = async (e) => {
    e.preventDefault()
    let form_data = popup.getFormData(add_label_form)
    await addCustomLabel(form_data)
}

// Edit custom label popup
const edit_label_popup_bg = document.getElementById('edit-label-popup-bg')
const edit_label_popup = document.getElementById('edit-label-popup')
edit_label_popup_bg.addEventListener('click', popup.closePopup)

const edit_label_form = document.getElementById('edit-label-form')
edit_label_form.onsubmit = async (e) => {
    e.preventDefault()
    let form_data = popup.getFormData(edit_label_form)
    await editCustomLabel(form_data)
}

const delete_label_btn = document.getElementById('delete-label-btn')
delete_label_btn.onclick = deleteCustomLesson

// Edit discipline popup
const edit_discipline_popup_bg = document.getElementById('edit-discipline-popup-bg')
const edit_discipline_popup = document.getElementById('edit-discipline-popup')
edit_discipline_popup_bg.addEventListener('click', popup.closePopup)

const edit_discipline_form = document.getElementById('edit-discipline-form')
edit_discipline_form.onsubmit = async (e) => {
    e.preventDefault()
    let form_data = popup.getFormData(edit_discipline_form)
    await editDisciplineLabel(form_data)
}

// SUID functions
// Custom label

async function addCustomLabel(form_data) {
    let response = await post_json('#', {
        'action': 'add_custom_label',
        'data': form_data
    })

    if(response.ok) {
        let response_json = await response.json()
        if(is_error_response(response_json)) return

        form_data['id'] = response_json['data']['id']
        const new_item = createCustomLabelItem(form_data)
        fillCustomLabelItem(new_item, form_data)
        labels_dropdown.insertAdjacentElement('beforeend', new_item)
        popup.closeActivePopup()
    } else alert('Сервер не отвечает')
}

async function editCustomLabel(form_data) {
    form_data['id'] = selected_label_item.dataset.id

    let response = await post_json('#', {
        'action': 'edit_custom_label',
        'data': form_data
    })

    if(response.ok) {
        let response_json = await response.json()
        if(is_error_response(response_json)) return

        fillCustomLabelItem(selected_label_item, form_data)
        popup.closeActivePopup()
    } else alert('Сервер не отвечает')
}

async function deleteCustomLesson() {
    const label_id = selected_label_item.dataset.id

    let response = await post_json('#', {
        'action': 'delete_custom_label',
        'data': {
            'id': label_id
        }
    })

    if(response.ok) {
        let response_json = await response.json()
        if(is_error_response(response_json)) return

        selected_label_item.remove()
        selected_label_item = null
        popup.closeActivePopup()
    } else alert('Сервер не отвечает')
}

// Discipline label

async function editDisciplineLabel(form_data) {
    form_data['id'] = selected_discipline_item.dataset.id

    let response = await post_json('#', {
        'action': 'edit_discipline_label',
        'data': form_data
    })

    if(response.ok) {
        let response_json = await response.json()
        if(is_error_response(response_json)) return

        selected_discipline_item.querySelector('.disciplines-marker').style.backgroundColor = form_data['color']
        popup.closeActivePopup()
    } else alert('Сервер не отвечает')
}

// Additional functions


function createCustomLabelItem(data) {
    let template = document.getElementById('custom-label-item-template')
    return template.content.firstElementChild.cloneNode(true)
}

function fillCustomLabelItem(item, data) {
    if(data['id']){
        item.dataset.id = data['id']
    }
    item.querySelector('.labels-marker').style.backgroundColor = data['color']
    item.querySelector('.sidebar-list__name').innerText = data['name']
}


// Mutation observers
// Add custom label observer

const add_label_observer = new MutationObserver((records) => {
    records.forEach((record) => {
        record.addedNodes.forEach((item) => {
            item.querySelector('.sidebar-list__edit').onclick = (e) => {
                selected_label_item = e.currentTarget.closest('.sidebar-list__item')
                popup.openPopup(edit_label_popup)
            }
        })
    })
})
add_label_observer.observe(labels_dropdown, {
    childList: true
})