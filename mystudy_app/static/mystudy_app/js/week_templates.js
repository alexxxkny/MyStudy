"use strict"
import * as tableHandler from './schedule_table.js'
import {clearNode} from "./schedule_table.js";
import {active_popup, active_popup_bg, openPopup, closePopup, closeActivePopup} from './popup_handler.js'
// init
document.addEventListener('DOMContentLoaded', () => {
    // select the first tab
    selectTab(tabs[0])
})

// Popups
const edit_lesson_popup = document.getElementById('edit-lesson-popup')
const edit_lesson_popup_bg = document.getElementById('edit-lesson-popup-bg')
const week_info = document.getElementById('week-info')
const weekday_info = document.getElementById('weekday-info')
const delete_btn = document.getElementById('delete-template')
edit_lesson_popup_bg.addEventListener('click', closePopup)
delete_btn.addEventListener('click', deleteTemplateLesson)

//Edit Form
let edit_form = document.getElementById('edit-form')
edit_form.addEventListener('submit', async (e) => {
    e.preventDefault()

    let data = getFormData()
    let lesson_id = selected_node.getAttribute('data-id')
    if(lesson_id){
        data['id'] = lesson_id
        await changeTemplateLesson(data)
    } else {
        await addTemplateLesson(data)
    }

    closeActivePopup()
})

// Menu fields
const week_name = document.getElementById('week-name')
week_name.addEventListener('change', editWeekName)
const week_order = document.getElementById('week-order')
week_order.addEventListener('change', editWeekOrder)

// Tabs initializing
let tabs = document.querySelectorAll('.tab__label')
let selected_tab = null
for(let tab of tabs){
    tab.addEventListener('click', e => {
        selectTab(e.currentTarget)
    })
}

// Table
let selected_node = null
let table_nodes_elements = Array.from(document.querySelectorAll('.node.data'))
const column_count = 6
const row_count = table_nodes_elements.length / column_count
for(let node of table_nodes_elements){
    node.addEventListener('click', (e) => {
        const weekday_number =  e.currentTarget.getAttribute('data-column')
        const lesson_order = e.currentTarget.getAttribute('data-row')
        const weekday = weekdays[weekday_number]
        const lesson_time = document.querySelectorAll('.node.time')[lesson_order].children[0].innerText
        week_info.innerText = `Неделя: ${selected_tab.children[0].innerText}`
        weekday_info.innerText = `${weekday}, ${lesson_time}`
        selected_node = e.currentTarget
        openPopup(edit_lesson_popup)
    })
}

// Making a matrix of nodes like a table
let table_nodes = tableHandler.makeTableNodes(table_nodes_elements)


async function selectTab(tab) {
    // unselect current tab
    if(selected_tab){
        selected_tab.classList.remove('tab__label_selected')
    }
    // select new tab
    selected_tab = tab
    selected_tab.classList.add('tab__label_selected')
    // fill fields
    week_name.value = selected_tab.children[0].innerText
    week_order.value = selected_tab.getAttribute('data-order')
    const table = await getTable(selected_tab.getAttribute('data-id'))
    clearTable()
    tableHandler.fillTable(table, table_nodes)
}

// Table

async function getTable(template_id) {
    let response = await post_json('#', {
        'action': 'get_table',
        'data': {
            'template_id': template_id
        }
    })
    if(response.ok){
        let response_data = await response.json()
        let table = response_data['data']['table']
        return table
    }
}

function clearTable() {
    tableHandler.clearTable(table_nodes_elements)
}

// Table Nodes

function getFormData() {
    let form = new FormData(edit_form)
    const discipline = form.get('class')
    const type = form.get('type')
    const room = form.get('room')
    const format_id = form.get('format')

    if(discipline === ''){
        alert('"Предмет" - обязательное поле')
        closeActivePopup()
        return
    }

    let data = {
        'discipline': discipline,
        'type': type,
        'room': room,
        'format_id': format_id,
    }

    return data
}

async function addTemplateLesson(data) {
    // Adding needed information
    const time_order = selected_node.getAttribute('data-row')
    const time_id = document.querySelectorAll('.node.time')[time_order].getAttribute('data-id')

    data['weekday'] = selected_node.getAttribute('data-column')
    data['time_id'] = time_id
    data['template_id'] = selected_tab.getAttribute('data-id')

    let response = await post_json('#', {
        'action': 'add_template_lesson',
        'data': data
    })

    if(response.ok){
        let response_data = await response.json()
        if(is_error_response(response_data)) return

        let lesson_id = response_data['data']['id']
        let color = '#' + response_data['data']['color']
        selected_node.setAttribute('data-id', lesson_id)
        selected_node.children[0].innerText = data['discipline']
        selected_node.children[1].innerText = data['type']
        selected_node.children[2].innerText = data['room']
        selected_node.style.backgroundColor = color
    } else alert('Сервер не отвечает')
}

async function changeTemplateLesson(data) {
    // Adding additional information
    data['template_id'] = selected_node.getAttribute('data-id')

    let response = await post_json('#', {
        'action': 'edit_template_lesson',
        'data': data
    })

    if(response.ok){
        let response_data = await response.json()
        if(is_error_response(response_data)) return

        selected_node.querySelector('.node__lesson').innerText = data['discipline']
        selected_node.querySelector('.node__type').innerText = data['type']
        selected_node.querySelector('.node__room').innerText = data['room']
        selected_node.style.backgroundColor = '#' + response_data['data']['color']
    }
}

async function deleteTemplateLesson() {
    const template_id = selected_node.getAttribute('data-id')
    if(!template_id) {
        closeActivePopup()
        return
    }

    let response = await post_json('#', {
        'action': 'delete_template_lesson',
        'data': {
            'id': template_id
        }
    })

    if(response.ok){
        const response_data = await response.json()
        if(is_error_response(response_data)) return

        clearNode(selected_node)
        closeActivePopup()
    }
}

// Menu

async function editWeekName() {
    const week_id = selected_tab.getAttribute('data-id')
    const new_name = week_name.value

    let response = await post_json('#', {
        'action': 'change_template_name',
        'data': {
            'id': week_id,
            'name': new_name
        }
    })
    if(response.ok){
        let response_data = await response.json()
        if(is_error_response(response_data)) return

        selected_tab.children[0].innerText = new_name
    } else alert('Сервер не отвечает')
}

async function editWeekOrder() {
    // we must to swap orders not just change one
    const template_id = selected_tab.getAttribute('data-id')
    const old_order = selected_tab.getAttribute('data-order')
    const new_order = week_order.value

    let response = await post_json('#', {
        'action': 'change_template_order',
        'data': {
            'id': template_id,
            'old_order': old_order,
            'new_order': new_order
        }
    })

    if(response.ok){
        const response_data = await response.json()
        if(is_error_response(response_data)) return

        // swap tab orders
        for(let tab of tabs){
            if(tab.getAttribute('data-order') === new_order){
                tab.setAttribute('data-order', old_order)
                selected_tab.setAttribute('data-order', new_order)
                break
            }
        }
    } else alert('Сервер не отвечает')
}
