export {toggleDropdown, setAsDropdownButton}

function toggleDropdown(dropdown) {
    dropdown.classList.toggle('open')
    dropdown.parentElement.querySelector('#toggle-arrow').classList.toggle('open')
}

function setAsDropdownButton(btn, dropdown) {
    btn.onclick = () => {
        toggleDropdown(dropdown)
    }
}