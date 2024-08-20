let bookMarks = [],
    selectUrl = null
const isIframe = window.self !== window.top

const close = () => {
    sendMessage({action: 'closePopup'})
}

const selectedByUrl = url => {
    if (url) {
        sendMessage({action: 'goToBookmark', url})
        close()
    }
}

const focusInput = e => {
    const action = e.data?.action ?? ''
    if (action === 'focusInput') {
        const input = document.getElementById('bookmarksSearchInput')
        if (input) {
            setTimeout(() => {
                input.focus()
            }, 100)
        }
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
        const filterResult = bookMarks.filter(item => item.title.includes(value) || item.url.includes(value) || item.parentTitle?.includes?.(value))
        listItems = filterResult.map(item => `
        <div class="bookmarks-search__list-item" data-url="${ item.url }">
            ${item.faviconURL ? `<img class="bookmarks-search__list-item-favicon" src="${ item.faviconURL }">` : ''}
            ${ item.title }
        </div>
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
        width: isIframe ? '100%' : '300px',
        height: isIframe ? '100%' : 'max-content',
    })
    if (!isIframe) {
        container.classList.add('tips__container')
        container.innerHTML = `这是一个chroma插件，可以按住 ctrl/command + B 进行搜索您的书签，并且点击打开您的书签。支持上下切换回车打开新页面。支持文件夹搜索。多层级文件夹使用 / 分割。如：文件夹1/文件夹2/标签1。有问题欢<a id="feedback" href="https://github.com/llxq/bookmark-search/issues/new">反馈</a>。`
        document.getElementById('feedback').onclick = () => {
            window.open('https://github.com/llxq/bookmark-search/issues/new')
        }
    }
}

chrome.runtime?.onMessage?.addListener(message => {
    if (message.action === 'updateBookMarks') {
        bookMarks = message.bookMarks || []
    }
})

window.addEventListener('keydown', event => {
    /* 按下esc关闭 */
    if (event.key === 'Escape') {
        close()
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