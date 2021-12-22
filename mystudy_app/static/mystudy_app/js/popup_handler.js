export {active_popup, active_popup_bg, openPopup, closePopup, closeActivePopup,
        getEditFromPopupData, getFormData}

let active_popup = null
let active_popup_bg = null

function openPopup(popup){
    if(active_popup){
        closeActivePopup()
    }
    active_popup = popup
    active_popup_bg = popup.parentElement
    active_popup.classList.add('active')
    active_popup_bg.classList.add('active')
}

function closeActivePopup(){
    if(active_popup){
        active_popup.classList.remove('active')
        active_popup_bg.classList.remove('active')

        active_popup = null
        active_popup_bg = null
    }
}

function closePopup(e){
    if(e.target === active_popup_bg){
        closeActivePopup()
    }
}

function getEditFromPopupData(edit_form) {
    let form = new FormData(edit_form)
    const discipline_id = form.get('class')
    const type = form.get('type')
    const room = form.get('room')
    const format_id = form.get('format')
    const discipline_sel = edit_form.querySelector('#class-input')
    const discipline = discipline_sel.options[discipline_sel.selectedIndex].text

    let data = {
        'discipline_id': discipline_id,
        'discipline': discipline,
        'type': type,
        'room': room,
        'format_id': format_id,
    }

    return data
}

function getFormData(form) {
    const form_obj = new FormData(form)

    let form_data = {}
    for(let item of form_obj.entries()) form_data[item[0]] = item[1]
    return form_data
}