export {active_popup, active_popup_bg, openPopup, closePopup, closeActivePopup}

let active_popup = null
let active_popup_bg = null

function openPopup(popup){
    if(active_popup){
        closePopup()
    }

    active_popup = popup
    active_popup_bg = popup.parentElement
    active_popup.classList.add('active')
    active_popup_bg.classList.add('active')
}

function closeActivePopup(){
    active_popup.classList.remove('active')
    active_popup_bg.classList.remove('active')

    active_popup = null
    active_popup_bg = null
}

function closePopup(e){
    if(e.target === active_popup_bg){
        closeActivePopup()
    }
}