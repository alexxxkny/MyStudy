"use strict"

let active_row = null
let active_popup = null
const add_row_buttons = document.querySelectorAll('div.options-settings__add-row>button')
const formats_form = document.querySelector('.options-settings__form')
let rows = document.getElementsByClassName('options-settings__option')
let example_node = document.getElementById('example-node')

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
