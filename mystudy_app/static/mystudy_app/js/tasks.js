"use strict"
import * as dropdown from './dropdown_handler.js'
import * as popup from './popup_handler.js'

// init
let discipline_labels = null
let custom_labels = null
let tasks = null
document.addEventListener('DOMContentLoaded', async () => {
    await getDisciplineLabels()
    await getCustomLabels()
    await getTasks()
})

// Filters
const main_title = document.querySelector('.filter-title__title p')
const today_filter_btn = document.getElementById('today-filter')
today_filter_btn.onclick = setTodayFilter
const all_filter_btn = document.getElementById('all-filter')
all_filter_btn.onclick = setAllFilter

function setTodayFilter(){
    main_title.innerText = 'Задачи на сегодня'
    setTaskList(todayTasks())
}

function setAllFilter(){
    main_title.innerText = 'Все задачи'
    setTaskList(tasks)
}

function setLabelFilter(label_id) {
    main_title.innerText = custom_labels[label_id]['name']
    const selected_tasks = LabelFilter(label_id)
    setTaskList(selected_tasks)
}

function setDisciplineFilter(label_id) {
    main_title.innerText = discipline_labels[label_id]['short_name']
    const selected_tasks = DisciplineFilter(label_id)
    setTaskList(selected_tasks)
}

function todayTasks() {
    let today_tasks = {}
    for(let key of Object.keys(tasks)) {
        let today = new Date()
        if(tasks[key]['deadline'] === today.toLocaleDateString().slice(0, 5)){
            today_tasks[key] = tasks[key]
        }
    }
    console.log(today_tasks)
    return today_tasks
}

function LabelFilter(label_id) {
    let selected_tasks = {}
    console.log(tasks)
    for(let key of Object.keys(tasks)) {
        console.log(`target ${label_id} current ${tasks[key]['custom_label_id']}`)
        if (+tasks[key]['custom_label_id'] === +label_id) {
            selected_tasks[key] = tasks[key]
        }
    }
    console.log(selected_tasks)
    return selected_tasks
}

function DisciplineFilter(label_id) {
    let selected_tasks = {}
    for(let key of Object.keys(tasks)) {
        if (+tasks[key]['discipline_label_id'] === +label_id) {
            selected_tasks[key] = tasks[key]
        }
    }
    return selected_tasks
}


// Dropdowns
// Disciplines dropdown

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

// Labels dropdown

let selected_label_item = null

const labels_dropdown_toggle = document.getElementById('labels-dropdown-toggle')
const labels_dropdown = document.getElementById('labels-dropdown')
dropdown.setAsDropdownButton(labels_dropdown_toggle, labels_dropdown)

labels_dropdown.querySelectorAll('.sidebar-list__edit').forEach(item => {
    item.onclick = (e) => {
        labelEditClicked(e)
    }
})
labels_dropdown.querySelectorAll('.sidebar-list__item').forEach(item => {
    item.onclick = (e) => {
        labelClicked(e)
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

// Tasks
let task_list = document.getElementById('tasks-list')


// SUID functions
// General

// {id: {short_name, color}, ...}
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

// {id: {name, color}, ...}
async function getCustomLabels() {
    let response = await post_json('#', {
        'action': 'get_custom_labels'
    })

    if (response.ok) {
        let response_json = await response.json()
        if(is_error_response(response_json)) return

        custom_labels = response_json['data']['custom_labels']
        console.log(custom_labels)
    } else alert('Сервер не отвечает')
}

// {id: {name, label_id, discipline_id, deadline}, ...}
async function getTasks() {
    let response = await post_json('#', {
        'action': 'get_tasks'
    })

    if (response.ok) {
        let response_json = await response.json()
        if(is_error_response(response_json)) return

        tasks = response_json['data']['tasks']
        console.log(tasks)
    } else alert('Сервер не отвечает')
}

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

        custom_labels[form_data['id']] = {
            'name': form_data['name'],
            'color': form_data['color']
        }

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

        custom_labels[form_data['id']] = {
            'name': form_data['name'],
            'color': form_data['color']
        }

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

        delete custom_labels['label_id']

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

function setTaskList(task_map) {
    task_list.innerHTML = ''
    for(let [key, item] of Object.entries(task_map)) {
        let task = task_template.cloneNode(true)
        console.log(task)
        task.dataset.id = key
        task.querySelector('.task__title p').innerText = item['name']

        if(item['deadline']){
            task.querySelector('.task__deadline p').innerText = item['deadline']
        } else task.querySelector('.task__deadline').remove()
        if(item['custom_label_id']){
            task.querySelector('.task__label .task__label-text').innerText = custom_labels[item['custom_label_id']]['name']
            task.querySelector('.labels-marker').style.backgroundColor = custom_labels[item['custom_label_id']]['color']
        } else task.querySelector('.task__label').remove()
        if(item['discipline_label_id']){
            task.querySelector('.task__discipline .task__label-text').innerText = discipline_labels[item['discipline_label_id']]['short_name']
            task.querySelector('.disciplines-marker').style.backgroundColor = discipline_labels[item['discipline_label_id']]['color']
        } else task.querySelector('.task__discipline').remove()

        task_list.insertAdjacentElement('beforeend', task)
    }
}

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

function labelClicked(e){
    selected_label_item = e.currentTarget.closest('.sidebar-list__item')
    const label_id = selected_label_item.dataset.id
    setLabelFilter(label_id)
}

function labelEditClicked(e){
    selected_label_item = e.currentTarget.closest('.sidebar-list__item')
    const label_id = selected_label_item.dataset.id
    edit_label_popup.querySelector('input[type=text]').value = custom_labels[label_id]['name']
    edit_label_popup.querySelector('input[type=color]').value = custom_labels[label_id]['color']
    popup.openPopup(edit_label_popup)
    e.stopPropagation()
}


// Mutation observers
// Add custom label observer

const add_label_observer = new MutationObserver((records) => {
    records.forEach((record) => {
        record.addedNodes.forEach((item) => {
            item.querySelector('.sidebar-list__edit').onclick = (e) => {
                labelEditClicked(e)
            }
            item.onclick = (e) => {
                labelClicked(e)
            }
        })
    })
})
add_label_observer.observe(labels_dropdown, {
    childList: true
})

// Templates
const task_template = document.getElementById('task-template').content.firstElementChild