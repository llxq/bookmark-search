let bookMarks = [],
    selectUrl = null
const isIframe = window.self !== window.top

const selectedByUrl = url => {
    if (url) {
        sendMessage({action: 'goToBookmark', url})
        sendMessage({action: 'closePopup'})
    }
}

const focusInput = () => {
    const input = document.getElementById('bookmarksSearchInput')
    if (input) {
        setTimeout(() => {
            input.focus()
        }, 100)
    }
}

const sendMessage = message => {
    window.parent.postMessage(message, '*')
}


window.addEventListener('message', focusInput)

const setSelectStatus = () => {
    const currentItem = document.querySelector('.bookmarks-search__list-item[data-url="' + selectUrl + '"]')
    currentItem && currentItem.classList.add('bookmarks-search__list-item-active')
}

const nextSelect = () => {
    const currentItem = document.querySelector('.bookmarks-search__list-item.bookmarks-search__list-item-active')
    if (currentItem) {
        const nextItem = currentItem.nextElementSibling
        if (nextItem) {
            nextItem.classList.add('bookmarks-search__list-item-active')
            currentItem.classList.remove('bookmarks-search__list-item-active')
            selectUrl = nextItem.getAttribute('data-url')
        }
    }
}

const preSelect = () => {
    const currentItem = document.querySelector('.bookmarks-search__list-item.bookmarks-search__list-item-active')
    if (currentItem) {
        const preItem = currentItem.previousElementSibling
        if (preItem) {
            preItem.classList.add('bookmarks-search__list-item-active')
            currentItem.classList.remove('bookmarks-search__list-item-active')
            selectUrl = preItem.getAttribute('data-url')
        }
    }
}

const search = event => {
    const value = event.target.value
    const list = document.getElementById('bookmarksSearchList')
    let listItems = ''
    if (value) {
        const filterResult = bookMarks.filter(item => item.title.includes(value) || item.url.includes(value))
        listItems = filterResult.map(item => `
        <div class="bookmarks-search__list-item" data-url="${ item.url }">${ item.title }</div>
    `).join('')
        selectUrl = filterResult[0]?.url
    }
    list.innerHTML = listItems
    setSelectStatus()
}

document.getElementById('bookmarksSearchInput').addEventListener('input', search)

const goToBookmark = event => {
    const goToUrl = event.target?.getAttribute?.('data-url') ?? ''
    selectedByUrl(goToUrl)
}
document.getElementById('bookmarksSearchList').addEventListener('click', goToBookmark)

const container = document.getElementById('bookmarksSearchContainer')
if (container) {
    Object.assign(container.style, {
        width: isIframe ? '100%' : '500px',
        height: isIframe ? '100%' : '500px',
    }) 
}

chrome.runtime?.onMessage?.addListener(message => {
    if (message.action === 'updateBookMarks') {
        bookMarks = message.bookMarks || []
    }
})

window.addEventListener('keydown', event => {
    /* 按下esc关闭 */
    if (event.key === 'Escape') {
        sendMessage({action: 'closePopup'})
    }

    /* 按上/下箭头切换 */
    if (event.key === 'ArrowUp') {
        preSelect()
    }

    if (event.key === 'ArrowDown') {
        nextSelect()
    }

    /* 按下回车 */
    if (event.key === 'Enter') {
        if (selectUrl) {
            selectedByUrl(selectUrl)
        }
    }
})

sendMessage({action: 'initSuccess'})