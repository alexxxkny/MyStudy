export {active_popup, active_popup_bg, openPopup, closePopup, closeActivePopup,
        getEditFromPopupData}

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