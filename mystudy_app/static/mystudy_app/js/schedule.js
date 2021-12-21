"use strict"
import * as tableHandler from './schedule_table.js'
import {active_popup, active_popup_bg, openPopup, closePopup, closeActivePopup,
        getEditFromPopupData} from './popup_handler.js'
import {clearNode, fillNode, flushNode, createStatusElement} from "./schedule_table.js";

// init
document.addEventListener('DOMContentLoaded', async e => {
    const week_start = week_slider.getAttribute('data-week-start')
    const week_end = week_slider.getAttribute('data-week-end')
    let table = await getTable(week_start, week_end)
    tableHandler.fillTable(table, table_nodes)
})

// Popups
// Custom Edit Popup
const edit_lesson_popup = document.getElementById('edit-lesson-popup')
const edit_lesson_popup_bg = document.getElementById('edit-lesson-popup-bg')
const week_info = document.getElementById('week-info')
const weekday_info = document.getElementById('weekday-info')
const delete_lesson_btn = document.getElementById('delete-lesson')
edit_lesson_popup_bg.addEventListener('click', closePopup)
delete_lesson_btn.addEventListener('click', async e =>{
    await deleteCustomLesson()
    closeActivePopup()
})

// Choose Action Popup
const choose_action_popup_bg = document.getElementById('choose-action-popup-bg')
const choose_action_popup = document.getElementById('choose-action-popup')
const cancel_btn = document.getElementById('cancel-lesson-btn')
const set_custom_btn = document.getElementById('set-custom-lesson-btn')
const edit_template_btn = document.getElementById('edit-template-btn')
choose_action_popup_bg.addEventListener('click', closePopup)

cancel_btn.addEventListener('click', cancelLesson)
set_custom_btn.addEventListener('click', () => {
    //closeActivePopup()
    openPopup(edit_lesson_popup)
})
edit_template_btn.addEventListener('click', () => {
    window.location.href = 'http://127.0.0.1:8000/schedule/templates'
})

// Uncancel Template Lesson Popup
const uncancel_lesson_popup_bg = document.getElementById('uncancel-lesson-popup-bg')
const uncancel_lesson_popup = document.getElementById('uncancel-lesson-popup')
const uncancel_btn = document.getElementById('uncancel-btn')
uncancel_lesson_popup_bg.addEventListener('click', closePopup)
uncancel_btn.addEventListener('click', async () => {
    await deleteCustomLesson()
    selected_node.setAttribute('data-status', 'template')
    closeActivePopup()
})

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
        const current_date = getNodeDate(weekday_number)
        // customizing popup
        week_info.innerText = current_date.toLocaleDateString()
        weekday_info.innerText = `${weekday}, ${lesson_time}`

        const status = selected_node.getAttribute('data-status')
        console.log(status)
        console.log(!status)
        if(status === 'template'){
            openPopup(choose_action_popup)
        }
        else if(status === 'custom-canceled'){
            openPopup(uncancel_lesson_popup)
        }
        else if(!status || status === 'custom'){
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

    let data = getEditFromPopupData(edit_form)
    const lesson_id = selected_node.getAttribute('data-id')
    const status = selected_node.getAttribute('data-status')
    console.log(`id=${lesson_id}, status=${status}`)
    if(lesson_id && status === 'custom') {
        data['id'] = lesson_id
        await changeCustomLesson(data)
    }
    else if(!(lesson_id) || (lesson_id && status === 'template')) {
        console.log('here')
        await addCustomLesson(data)
    }

    closeActivePopup()
})

// Table Nodes

function getNodeDate(weekday_number) {
    const week_start = week_slider.getAttribute('data-week-start')
    let current_date = new Date(Date.parse(week_start))
    current_date.setDate(current_date.getDate() + Number(weekday_number))

    return current_date
}

async function cancelLesson() {
    const template_id = selected_node.getAttribute('data-id')
    const current_date = getNodeDate(selected_node.getAttribute('data-column'))

    let response = await post_json('#', {
        'action': 'cancel_template_lesson',
        'data': {
            'template_id': template_id,
            'current_date': current_date.toISOString().substring(0,10)
        }
    })

    if(response.ok){
        let response_json = await response.json()
        if(is_error_response(response_json)) return

        selected_node.setAttribute('data-id', response_json['data']['id'])
        selected_node.setAttribute('data-status', response_json['data']['status'])

        const status_block = createStatusElement('Отменена')
        selected_node.insertAdjacentElement('afterbegin', status_block)
        closeActivePopup()
    }
}

async function addCustomLesson(data) {
    const current_date = getNodeDate(selected_node.getAttribute('data-column'))
    const time_order = selected_node.getAttribute('data-row')
    const time_id = document.querySelectorAll('.node.time')[time_order].getAttribute('data-id')

    data['current_date'] = current_date.toISOString().substring(0, 10)
    data['time_id'] = time_id

    let response = await post_json('#', {
        'action': 'add_custom_lesson',
        'data': data
    })

    if(response.ok){
        let response_json = await response.json()
        if(is_error_response(response_json)) return

        let response_data = response_json['data']
        selected_node.setAttribute('data-id', response_data['id'])
        selected_node.setAttribute('data-status', response_data['status'])
        fillNode(selected_node, {
            'discipline': data['discipline'],
            'room': data['room'],
            'type': data['type'],
            'color': response_data['color'],
        })
    } else alert('Сервер не отвечает')
}

async function changeCustomLesson(data) {
    let response = await post_json('#', {
        'action': 'change_custom_lesson',
        'data': data
    })

    if(response.ok) {
        let response_json = await response.json()
        if(is_error_response(response_json)) return

        data['color'] = response_json['data']['color']
        fillNode(selected_node, data)
        closeActivePopup()
    }
}

async function deleteCustomLesson() {
    const lesson_id = selected_node.getAttribute('data-id')

    let response = await post_json('#', {
        'action': 'delete_custom_lesson',
        'data': {
            'id': lesson_id
        }
    })

    if(response.ok){
        const response_json = await response.json()
        if(is_error_response(response_json)) return

        if(selected_node.getAttribute('data-status') === 'custom-canceled'){
            selected_node.children[0].remove()
        } else {
            clearNode(selected_node)
        }
    }
}
