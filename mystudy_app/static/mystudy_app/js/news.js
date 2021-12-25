import * as popup from "./popup_handler.js";
import {getFormData} from "./popup_handler.js";

// Common elements

const news_list = document.querySelector('.news-list')

// SUID functions

async function addNews(form_data) {
    let response = await post_json('#', {
        'action': 'add_news',
        'data': form_data
    })

    if(response.ok) {
        let response_json = await response.json()
        if(is_error_response(response_json)) return

        let news_data = response_json['data']
        addNewsItem(news_data)

        popup.closeActivePopup()
    } else alert('Сервер не отвечает')
}

// Additional functions

function addNewsItem(data) {
    let item = news_template.cloneNode(true)

    // set title
    item.querySelector('.news-item__title p').innerText = data['title']
    // set datetime
    item.querySelector('.news-item__datetime p').innerText = data['datetime']
    // set content
    item.querySelector('.news-item__description p').innerText = data['content']
    // set picture
    item.querySelector('img').src = 'http://127.0.0.1:8000/static/mystudy_app/images/icons/nav/news.svg'

    news_list.insertAdjacentElement('afterbegin', item)
}

// Popups
// Add news popup

const add_news_popup_bg = document.getElementById('add-news-popup-bg')
const add_news_popup = document.getElementById('add-news-popup')
add_news_popup_bg.addEventListener('click', popup.closePopup)

const add_news_form = document.getElementById('add-news-form')
add_news_form.onsubmit = async (e) => {
    e.preventDefault()
    let form_data = getFormData(add_news_form)

    await addNews(form_data)
}

const add_news_btn = document.getElementById('add-news-btn').onclick = () => {
    popup.openPopup(add_news_popup)
}

// Templates

const news_template = document.getElementById('news-template').content.firstElementChild