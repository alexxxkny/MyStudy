"use strict"


let active_popup = null;
const add_row_buttons = document.querySelectorAll('div.options-settings__add-row>button');
const formats_form = document.querySelector('.options-settings__form')
let rows = document.getElementsByClassName('options-settings__option')


let delete_format_btn = document.querySelector('#delete_format_btn')
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
        // delete row
    }
})





function selectedRow(event){
    let selected_row = document.querySelector('.options-settings__option_selected')
    if (selected_row){
        selected_row.classList.toggle('options-settings__option_selected')
    }
    event.currentTarget.classList.add('options-settings__option_selected')
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
    event.stopPropagation();
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
        if(event.target.closest('.popup') !== active_popup){
            active_popup.classList.remove('active');
            active_popup = null
        }
    }
}
document.body.addEventListener('click', closePopup);

function addRow(){

}

for (let btn of add_row_buttons){
    btn.addEventListener('click', optionAddPopup);
    // btn.addEventListener('click', function (event) {
    //     formats_form.insertAdjacentHTML('beforeend', `
    //         <div class="options-settings__option">
    //             <div class="options-settings__name">
    //                 <p>
    //                     Example
    //                 </p>
    //             </div>
    //             <div class="options-settings__color">
    //                 <input type="color" value="#000000">
    //             </div>
    //             <div class="options-settings__edit">
    //                 <img src="http://127.0.0.1:8000/static/mystudy_app/images/icons/dots_icon.svg" alt="">
    //             </div>
    //         </div>
    //     `)
    //     formats_form.lastElementChild.addEventListener('click', selectedRow);
    //     formats_form.lastElementChild.querySelector('.options-settings__edit').addEventListener('click', optionEditPopup);
    // });
}

for (let row of rows){
    row.addEventListener('click', selectedRow);
    row.querySelector('.options-settings__edit').addEventListener('click', optionEditPopup);
}
