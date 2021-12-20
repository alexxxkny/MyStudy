"use strict"
import * as tableHandler from './schedule_table.js'
import {active_popup, active_popup_bg, openPopup, closePopup, closeActivePopup} from './popup_handler.js'
import {clearNode} from "./schedule_table.js";

// init
document.addEventListener('DOMContentLoaded', async e => {
    const week_start = week_slider.getAttribute('data-week-start')
    const week_end = week_slider.getAttribute('data-week-end')
    let table = await getTable(week_start, week_end)
    tableHandler.fillTable(table, table_nodes)
})

// Popups
const edit_lesson_popup = document.getElementById('edit-lesson-popup')
const edit_lesson_popup_bg = document.getElementById('edit-lesson-popup-bg')
const week_info = document.getElementById('week-info')
const weekday_info = document.getElementById('weekday-info')
const delete_lesson_btn = document.getElementById('delete-lesson')
edit_lesson_popup_bg.addEventListener('click', closeActivePopup)
delete_lesson_btn.addEventListener('click', async e =>{
    console.log('Типа удалил')
})

const choose_action_popup_bg = document.getElementById('choose-action-popup-bg')
const choose_action_popup = document.getElementById('choose-action-popup')
choose_action_popup_bg.addEventListener('click', closeActivePopup)

// Table
let selected_node = null
let table_nodes_elements = Array.from(document.querySelectorAll('.node.data'))
for(let node of table_nodes_elements){
    node.addEventListener('click', e => {
        selected_node = e.currentTarget
        // getting row and column
        const weekday_number = selected_node.getAttribute('data-column')
        const lesson_order = selected_node.getAttribute('data-row')
        // getting weekday and lesson_time
        const lesson_time = document.querySelectorAll('.node.time')[lesson_order].children[0].innerText
        const weekday = weekdays[weekday_number]
        // getting lesson date
        const week_start = week_slider.getAttribute('data-week-start')
        let current_date = new Date(Date.parse(week_start))
        current_date.setDate(current_date.getDate() + Number(weekday_number))
        // customizing popup
        week_info.innerText = current_date.toLocaleDateString()
        weekday_info.innerText = `${weekday}, ${lesson_time}`

        const status = selected_node.getAttribute('data-status')
        if(status === 'template'){
            openPopup(choose_action_popup)
        }
        else if(status === 'custom'){
            openPopup(edit_lesson_popup)
        }
    })
}
let table_nodes = tableHandler.makeTableNodes(table_nodes_elements)

// Week slider
const week_slider = document.getElementById('week-slider')
const left_arrow = document.getElementById('left-arrow')
const right_arrow = document.getElementById('right-arrow')
left_arrow.addEventListener('click', previousWeek)
right_arrow.addEventListener('click', nextWeek)

// Week selecting

async function previousWeek() {
    let monday = week_slider.getAttribute('data-week-start')

    let response = await post_json('#', {
        'action': 'previous_week',
        'data': {
            'date': monday
        }
    })

    if(response.ok){
        const response_data = await response.json()
        if(is_error_response(response_data)) return

        const data = response_data['data']
        setWeekTitle(data)
        tableHandler.clearTable(table_nodes_elements)
        tableHandler.fillTable(data['table'], table_nodes)
    } else alert('Сервер не отвечает')
}

async function nextWeek() {
    let sunday = week_slider.getAttribute('data-week-end')

    let response = await post_json('#', {
        'action': 'next_week',
        'data': {
            'date': sunday
        }
    })

    if(response.ok){
        const response_data = await response.json()
        if(is_error_response(response_data)) return

        const data = response_data['data']
        setWeekTitle(data)
        tableHandler.clearTable(table_nodes_elements)
        tableHandler.fillTable(data['table'], table_nodes)
    } else alert('Сервер не отвечает')
}

async function setWeek(date) {

}

function setWeekTitle(data) {
    const week_start = new Date(data['week_start'])
    const week_end = new Date(data['week_end'])
    week_slider.setAttribute('data-week-start', data['week_start'])
    week_slider.setAttribute('data-week-end', data['week_end'])
    week_slider.querySelector('.week-slider__text').innerText = `${week_start.toLocaleDateString()} - ${week_end.toLocaleDateString()}`
}

// Table

async function getTable(week_start, week_end) {
    let response = await post_json('#', {
        'action': 'get_table',
        'data': {
            'week_start': week_start,
            'week_end': week_end,
        }
    })

    if(response.ok){
        let response_data = await response.json()
        if(is_error_response(response_data)) return

        return response_data['data']['table']
    }
}

// Edit form
let edit_form = document.getElementById('edit-form')
edit_form.addEventListener('submit', async (e) => {
    e.preventDefault()

    let data = getFormData()
    let lesson_id = selected_node.getAttribute('data-id')
    if(lesson_id){
        data['id'] = lesson_id
        await changeLesson(data)
    } else {
        await addLesson(data)
    }

    closeActivePopup()
})

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

async function addLesson(data) {
    // Adding needed information
    const time_order = selected_node.getAttribute('data-row')
    const time_id = document.querySelectorAll('.node.time')[time_order].getAttribute('data-id')

    data['weekday'] = selected_node.getAttribute('data-column')
    data['time_id'] = time_id

    let response = await post_json('#', {
        'action': 'add_lesson',
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

async function changeLesson(data) {
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

async function deleteLesson() {
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