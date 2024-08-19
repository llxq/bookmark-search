const search_dom_id = '__bookmarks_search__'

let bookMarks = []

const hidden = () => {
    const container = document.getElementById(search_dom_id)
    if (container) {
        Object.assign(container.style, {
            display: 'none',
        })
    }
    /* 恢复焦点 */
    window.focus()
}

const createContent = () => {
    const iframe = document.createElement('iframe')
    iframe.src = chrome.runtime.getURL('popup.html')
    Object.assign(iframe.style, {
        width: '100%',
        height: '100%',
    })
    return iframe
}

const sendBookMarks = () => {
    chrome.runtime.sendMessage({action: 'updateBookMarks', bookMarks})
}

const focusInput = () => {
    const iframe = document.getElementById(search_dom_id).querySelector('iframe')
    if (iframe) {
        // 通过postMessage发送消息
        iframe.contentWindow.postMessage({action: 'focusInput'}, '*')
        sendBookMarks()
    }
}

const createContainer = () => {
    let container = document.getElementById(search_dom_id)
    if (container) {
        Object.assign(container.style, {
            display: 'initial',
        })
        Promise.resolve().then(focusInput)
        return
    } else {
        container = document.createElement('div')
        container.id = search_dom_id
        Object.assign(container.style, {
            position: 'fixed',
            inset: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 9999,
        })
        const iframe = createContent()
        container.appendChild(iframe)
        document.body.appendChild(container)
        window.addEventListener('message', e => {
            const action = e.data?.action ?? ''
            if (action === 'initSuccess') {
                focusInput()
            } else if (action === 'closePopup') {
                hidden()
            } else if (action === 'goToBookmark') {
                const url = e.data?.url
                if (url) {
                    chrome.runtime.sendMessage({action: 'goToBookmark', url})
                }
            }
        })
    }
}

// 监听来自 popup.html 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'openPopup') {
        bookMarks = message.bookMarks || []
        createContainer()
    }
})
