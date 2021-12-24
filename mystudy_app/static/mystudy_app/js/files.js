import * as dropdown from "./sidebar_handler.js";
import * as popup from "./popup_handler.js";

// init
let files
let discipline_labels = null
document.addEventListener('DOMContentLoaded', async () => {
    await getDisciplineLabels()
    await getFiles()
})

// Disciplines Dropdown

let selected_discipline_item = null

const disciplines_dropdown_toggle = document.getElementById('disciplines-dropdown-toggle')
const disciplines_dropdown = document.getElementById('disciplines-dropdown')
dropdown.setAsDropdownButton(disciplines_dropdown_toggle, disciplines_dropdown)

disciplines_dropdown.querySelectorAll('.sidebar-list__edit').forEach(item => {
    item.onclick = (e) => {
        selected_discipline_item = e.currentTarget.closest('.sidebar-list__item')
        const discipline_label_id = selected_discipline_item.dataset.id
        edit_discipline_popup.querySelector('input[type=color]').value = discipline_labels[discipline_label_id]['color']
        popup.openPopup(edit_discipline_popup)
        e.stopPropagation()
    }
})
disciplines_dropdown.querySelectorAll('.sidebar-list__item').forEach(item => {
    item.onclick = (e) => {
        selected_discipline_item = e.currentTarget.closest('.sidebar-list__item')
        const discipline_label_id = selected_discipline_item.dataset.id
        setDisciplineFilter(discipline_label_id)
    }
})

// Filter
function setDisciplineFilter(discipline_label_id) {}

// Popups
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

async function getFiles() {
    let response = await post_json('#', {
        'action': 'get_files'
    })

    if (response.ok) {
        let response_json = await response.json()
        if(is_error_response(response_json)) return

        files = response_json['data']['files']
        console.log(files)
    } else alert('Сервер не отвечает')
}

async function getDisciplineLabels() {
    let response = await post_json('#', {
        'action': 'get_discipline_labels'
    })

    if (response.ok) {
        let response_json = await response.json()
        if(is_error_response(response_json)) return

        discipline_labels = response_json['data']['discipline_labels']
        console.log(discipline_labels)
    } else alert('Сервер не отвечает')
}

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