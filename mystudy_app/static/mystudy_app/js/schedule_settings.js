"use strict"

let active_row = null
let active_popup = null
const add_row_buttons = document.querySelectorAll('div.options-settings__add-row>button')
const formats_form = document.querySelector('.options-settings__form')
let rows = document.getElementsByClassName('options-settings__option')
const example_node = document.getElementById('example-node')
const times_table = document.getElementById('times-table')


const schedule_start_input = document.getElementById('schedule_start_input')
schedule_start_input.addEventListener('change', async (e) => {
    let date = schedule_start_input.value

    let response = await post_json('#',{
        'action': 'set_schedule_start',
        'date': date
    })

    if(response.ok){
        let response_data = await response.json()
        is_error_response(response_data)
    }
})

let time_inputs = document.querySelectorAll('input[type=time]')
for(let item of time_inputs){
    item.addEventListener('change', commitTimeChanging)
}

const times_counter = document.getElementById('lesson-count')
let prev_times_count = parseInt(times_counter.value)
times_counter.addEventListener('change', (e) => {
    let actual_times_count = +times_counter.value
    if(actual_times_count > times_counter.max){
        actual_times_count = times_counter.max
        times_counter.value = times_counter.max
    }
    else if (actual_times_count < times_counter.min){
        actual_times_count = times_counter.min
        times_counter.value = times_counter.min
    }
    if(actual_times_count > prev_times_count){
        for(let i = prev_times_count + 1; i <= actual_times_count; ++i){
            add_time_row(i)
        }
    }
    else if(actual_times_count < prev_times_count){
        for(let i = actual_times_count; i < prev_times_count; ++i){
            delete_time_row()
        }
    }

    prev_times_count = actual_times_count
})
function add_time_row(number) {
    times_table.insertAdjacentHTML('beforeend', `
        <div class="lessons-time__node right-border" data-id="none">
        <p>${number}</p>
        </div>
        <div class="lessons-time__node">
            <input type="time" value="">
        </div>
        <div class="lessons-time__node left-border">
            <input type="time" value="">
        </div>
    `.replace(/>\s+</g,'><'))
}
async function delete_time_row() {
    let to_delete = Array.from(times_table.children).slice(-3)
    let time_id = to_delete[0].getAttribute('data-id')
    await post_json('#', {
        'action': 'delete_time',
        'id': time_id
    })
    for(let row of to_delete){
        row.remove()
    }
}
const times_table_observer = new MutationObserver(async (mutations) => {
    for(let mutation of mutations){
        if(mutation.type === 'childList'){
            if(mutation.addedNodes.length > 0){
                for(let item of mutation.addedNodes){
                    if(!(item instanceof HTMLElement)) continue
                    let times = item.querySelectorAll('input[type=time]')
                    for(let item of times){
                        console.log('set')
                        item.addEventListener('change', commitTimeChanging)
                    }
                }
            }
        }
    }
})
times_table_observer.observe(times_table, {
    childList: true,
    attributes: true,
    attributeOldValue: true
})

async function commitTimeChanging(e){
    let first_block, first_input, second_input
    if(e.currentTarget.parentElement.classList.contains('left-border')) {
        first_input = e.currentTarget.parentElement.previousElementSibling.children[0]
        second_input = e.currentTarget
        first_block = first_input.parentElement.previousElementSibling
    } else {
        first_input = e.currentTarget
        second_input = first_input.parentElement.nextElementSibling.children[0]
        first_block = first_input.parentElement.previousElementSibling
    }
    if(second_input.value){
        console.log(first_input.value)
        console.log(second_input.value)
        console.log('sending...')
        let time_id = first_block.getAttribute('data-id')
        if(time_id === 'none'){
            let response = await post_json('#', {
                'action': 'add_time',
                'order': first_block.children[0].textContent,
                'start': first_input.value,
                'end': second_input.value
            })
            if(response.ok){
                let response_data = await response.json()
                first_block.setAttribute('data-id', response_data['id'])
            }
        } else {
            let response = await post_json('#', {
                'action': 'change_time',
                'id': time_id,
                'start': first_input.value,
                'end': second_input.value
            })
            if(response.ok){
                console.log('Successfully changed!')
            }
        }
    }
}


function changeExampleColor(){
    const color = active_row.querySelector('input[type=color]').value
    example_node.style.backgroundColor = color
}

const edit_form = document.getElementById('edit-form')
edit_form.addEventListener('submit', async (e) => {
    e.preventDefault()
    let form = new FormData(edit_form)
    form.set('id', active_row.getAttribute('data-id'))
    let response = await post_form('#', form)
    if(response.ok){
        active_row.querySelector('.options-settings__name>p').innerText = form.get('name')
        closePopup()
    }
})

async function changeColorHandler(event){
    const picker = event.currentTarget
    const color = picker.value.slice(1)
    const id = picker.closest('.options-settings__option').getAttribute('data-id')
    const response = await post_json('#', {
        'action': 'change_color',
        'id': id,
        'color': color
    })
}
let color_pickers = document.querySelectorAll('.options-settings__color>input[type=color]')
for(let picker of color_pickers){
    picker.addEventListener('input', changeExampleColor)
    picker.addEventListener('change', changeColorHandler)
}

const delete_format_btn = document.querySelector('#delete_format_btn')
delete_format_btn.addEventListener('click', async (e) => {
    console.log(active_popup)
    const format_id = active_popup.getAttribute('data-id')
    console.log(format_id)
    const response = await fetch('#', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json;charset=utf-8',
            'X-CSRFToken': csrftoken
        },
        body: JSON.stringify({'action': 'delete', 'id': format_id})
    })
    if(response.ok){
        if(active_row){
            active_row.remove()
            active_row = null
            closePopup()
        }
    }
})

function selectedRow(event){
    if (active_row){
        active_row.classList.remove('options-settings__option_selected')
    }
    active_row = event.currentTarget
    active_row.classList.add('options-settings__option_selected')
    changeExampleColor()
    event.stopPropagation()
}

function optionEditPopup(event){
    if(active_popup){
        closePopup(event);
    }
    const option = event.currentTarget.closest('.options-settings__option');
    const name = option.querySelector('.options-settings__name>p').innerText;
    const id = option.getAttribute('data-id');
    const popup = document.getElementById('edit_popup');
    popup.querySelector('input[type=text]').value = name;
    popup.setAttribute('data-id', id)
    active_popup = popup;
    popup.classList.add('active');
    //event.stopPropagation();
}

function optionAddPopup(event){
    if(active_popup){
        closePopup(event);
    }
    const popup = document.getElementById('add_popup');
    active_popup = popup;
    popup.classList.add('active');
    event.stopPropagation();
}

function closePopup(event){
    if(active_popup){
        if(event){
            if(event.target.closest('.popup') !== active_popup){
                active_popup.classList.remove('active');
                active_popup = null
            }
        }
        else{
            active_popup.classList.remove('active');
            active_popup = null
        }
    }
}
document.body.addEventListener('click', closePopup);

async function addFormat(event){
    event.preventDefault()
    if(active_popup){
        const name = active_popup.querySelector('input[name=name]').value
        const color = active_popup.querySelector('input[name=color]').value.slice(1)
        if(name){
            let response = await post_json('#',{
                'action': 'add',
                'name': name,
                'color': color
            })
            if(response.ok){
                const is_json = response.headers.get('Content-Type').includes('json')
                if(is_json){
                    const json = await response.json()
                    const id = json['id']
                    formats_form.insertAdjacentHTML('beforeend', `
                        <div class="options-settings__option" data-id="${id}">
                            <div class="options-settings__name">
                                <p>
                                    ${name}
                                </p>
                            </div>
                            <div class="options-settings__color">
                                <input type="color" value="#${color}">
                            </div>
                            <div class="options-settings__edit">
                                <img src="http://127.0.0.1:8000/static/mystudy_app/images/icons/dots_icon.svg" alt="">
                            </div>
                        </div>
                    `)
                    formats_form.lastElementChild.addEventListener('click', selectedRow);
                    formats_form.lastElementChild.querySelector('.options-settings__edit').addEventListener('click', optionEditPopup);
                    formats_form.lastElementChild.querySelector('input[type=color]').addEventListener('change', changeColorHandler)
                    active_popup.querySelector('input[name=name]').value = ''
                }
                closePopup()
            }
        }
    }
}
const add_format_form = document.getElementById('add-format-form')
add_format_form.addEventListener('submit', addFormat)

for (let btn of add_row_buttons){
    btn.addEventListener('click', optionAddPopup);
}

for (let row of rows){
    row.addEventListener('click', selectedRow);
    row.querySelector('.options-settings__edit').addEventListener('click', optionEditPopup);
}


