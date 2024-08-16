let bookMarks = []
const isIframe = window.self !== window.top

const focusInput = () => {
    const input = document.getElementById('bookmarksSearchInput')
    input && input.focus()
}

const sendMessage = message => {
    window.parent.postMessage(message, '*')
}

window.addEventListener('message', focusInput)

const search = event => {
    const value = event.target.value
    const list = document.getElementById('bookmarksSearchList')
    let listItems = ''
    if (value) {
        listItems = bookMarks.filter(item => item.title.includes(value) || item.url.includes(value)).map(item => `
        <div class="bookmarks-search__list-item" data-url="${ item.url }">${ item.title }</div>
    `).join('')
    }
    list.innerHTML = listItems
}

document.getElementById('bookmarksSearchInput').addEventListener('input', search)

const goToBookmark = event => {
    const goToUrl = event.target?.getAttribute?.('data-url') ?? ''
    goToUrl && sendMessage({action: 'goToBookmark', url: goToUrl})
}
document.getElementById('bookmarksSearchList').addEventListener('click', goToBookmark)

const container = document.getElementById('bookmarksSearchContainer')
if (container) {
    Object.assign(container.style, {
        width: isIframe ? '100%' : '500px',
        height: isIframe ? '100%' : '500px',
    }) 
}

chrome.runtime.onMessage.addListener(message => {
    if (message.action === 'updateBookMarks') {
        bookMarks = message.bookMarks || []
    }
})

window.addEventListener('keydown', event => {
    /* 按下esc关闭 */
    if (event.key === 'Escape') {
        sendMessage({action: 'closePopup'})
    }
})

sendMessage({action: 'initSuccess'})