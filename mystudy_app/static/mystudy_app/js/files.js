import * as dropdown from "./sidebar_handler.js";
import * as popup from "./popup_handler.js";
import {getFormData, openPopup} from "./popup_handler.js";

const extension_images = {
    '.docx': 'http://127.0.0.1:8000/static/mystudy_app/images/icons/files/word_img.svg',
    '.pdf': 'http://127.0.0.1:8000/static/mystudy_app/images/icons/files/pdf_img.svg',
    '.xlsx': 'http://127.0.0.1:8000/static/mystudy_app/images/icons/files/excel_img.svg',
    '.zip': 'http://127.0.0.1:8000/static/mystudy_app/images/icons/files/zip_img.svg',
    '.rar': 'http://127.0.0.1:8000/static/mystudy_app/images/icons/files/zip_img.svg',
    '.7z': 'http://127.0.0.1:8000/static/mystudy_app/images/icons/files/zip_img.svg',
    'other': 'http://127.0.0.1:8000/static/mystudy_app/images/icons/files/file_img.svg',
}

// init
let files = null
let discipline_labels = null
document.addEventListener('DOMContentLoaded', async () => {
    await getDisciplineLabels()
    await getFiles()
    setAllFilter()
})

// Disciplines Dropdown

// Filters
let filter_state = {
    'filter': 'all',
    'id': null
}

document.getElementById('all-filter').onclick = setAllFilter

function refreshFilter() {
    if(filter_state['filter'] === 'all') {
        setFiles(files)
    }
    else if(filter_state['filter'] === 'discipline') {
        setDisciplineFilter(filter_state['id'])
    }
}

function setAllFilter(){
    setFiles(files)
    filter_state = {
    'filter': 'all',
    'id': null
}
}

function disciplineFilter(discipline_label_id) {
    let selected_files = {}
    for(let [key, item] of Object.entries(files)){
        if(+item['discipline_label_id'] === +discipline_label_id){
            selected_files[key] = item
        }
    }
    return selected_files
}

function setFiles(files_obj) {
    nodes_list.innerHTML = ''
    for(let [key, item] of Object.entries(files_obj)){
        let new_node = node_template.cloneNode(true)
        new_node.querySelector('.file-node__delete').onclick = async () => {
            await deleteFile(key)
        }
        new_node.dataset.id = key
        fillFileNode(new_node, item)
        nodes_list.insertAdjacentElement('beforeend', new_node)
    }
}

function setDisciplineFilter(discipline_label_id) {
    console.log(discipline_label_id)
    let selected_files = disciplineFilter(discipline_label_id)
    setFiles(selected_files)
    filter_state = {
        'filter': 'discipline',
        'id': discipline_label_id
    }
}

let selected_discipline_item = null

// Files

const upload_btn = document.getElementById('upload-file-btn')
upload_btn.onclick = () => {
    openPopup(upload_file_popup)
}

let nodes_list = document.querySelector('.files-list')

// Dropdowns

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
        console.log('click')
        selected_discipline_item = e.currentTarget.closest('.sidebar-list__item')
        const discipline_label_id = selected_discipline_item.dataset.id
        setDisciplineFilter(discipline_label_id)
    }
})

// Popups
// Edit discipline
const edit_discipline_popup_bg = document.getElementById('edit-discipline-popup-bg')
const edit_discipline_popup = document.getElementById('edit-discipline-popup')
edit_discipline_popup_bg.addEventListener('click', popup.closePopup)

const edit_discipline_form = document.getElementById('edit-discipline-form')
edit_discipline_form.onsubmit = async (e) => {
    e.preventDefault()
    let form_data = popup.getFormData(edit_discipline_form)
    await editDisciplineLabel(form_data)
}

// Upload file
const upload_file_popup_bg = document.getElementById('upload-file-popup-bg')
const upload_file_popup = document.getElementById('upload-file-popup')
upload_file_popup_bg.addEventListener('click', popup.closePopup)

const upload_file_form = document.getElementById('upload-file-form')
upload_file_form.onsubmit = async (e) => {
    e.preventDefault()
    let form_data = new FormData(upload_file_form)
    await uploadFile(form_data)
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

async function uploadFile(form_data) {
    let response = await post_form('#', form_data)

    if(response.ok) {
        let response_json = await response.json()
        if(is_error_response(response_json)) return

        let data = response_json['data']
        files[data['id']] = data['file_info']
        refreshFilter()

        popup.closeActivePopup()
    } else alert('Сервер не отвечает')
}

async function deleteFile(id) {
    let response = await post_json('#', {
        'action': 'delete_file',
        'data': {
            'id': id
        }
    })

    if(response.ok) {
        let response_json = await response.json()
        if(is_error_response(response_json)) return

        delete files[id]
        refreshFilter()

        popup.closeActivePopup()
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

// Additional Functions

function fillFileNode(node, file) {
    // setting an image
    let img = node.querySelector('.file-node__img img')
    if(extension_images[file['extension']]) {
        img.src = extension_images[file['extension']]
    } else {
        img.src = extension_images['other']
    }

    // setting a name
    node.querySelector('.file-node__title p').innerText = file['name']

    // setting am adding datetime
    node.querySelector('.file-node__datetime p').innerText = file['adding_datetime']

    // setting an url for downloading
    node.querySelector('.file-node__download a').href = file['url']
}

// Templates

const node_template = document.getElementById('template-node').content.firstElementChild