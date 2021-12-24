export function toggleDropdown(dropdown) {
    dropdown.classList.toggle('open')
    dropdown.parentElement.querySelector('#toggle-arrow').classList.toggle('open')
}

export function setAsDropdownButton(btn, dropdown) {
    btn.onclick = () => {
        toggleDropdown(dropdown)
    }
}