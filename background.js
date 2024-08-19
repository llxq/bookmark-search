const getBookmarks = async () => {
     return new Promise(async resolve => {
         const bookmarks = []

         /* 拿到所有的书签 */
         const getBookMarksByNode = (node, parentTitle = '') => {
            // 如果没有url，则可能是文件夹。记录父节点的title
             if (node.children) {
                 node.children.forEach(n => getBookMarksByNode(n, parentTitle ? `${parentTitle}/${node.title}` : node.title))
             }
             /* 不留存目录，只查询书签 */
             if (node.url && node.title) {
                 bookmarks.push({
                     url: node.url,
                     title: node.title,
                     id: node.id,
                     parentId: node.parentId,
                     parentTitle,
                 })
             }
         }

         const nodes = await chrome.bookmarks.getTree()
         if (Array.isArray(nodes)) {
             nodes.forEach(getBookMarksByNode)
         } else {
             getBookMarksByNode(nodes)
         }

         resolve(bookmarks)
     })
}

const startListener = () => {
    chrome.commands.onCommand.addListener(command => {
        if (command === 'open-search-dialog') {
            chrome.tabs.query({active: true, currentWindow: true}, async tabs => {
                if (tabs[0]) {
                    const url = tabs[0].url
                    if (url && !url.startsWith('chrome://') && !url.startsWith('chrome-extension://')) {
                        try {
                            chrome.tabs.sendMessage(tabs[0].id, {action: 'openPopup', bookMarks: await getBookmarks()})
                        } catch (e) {
                            console.error('bookmark-search error:', e)
                        }
                    } else {
                        console.warn('Cannot inject script into this page:', url)
                    }
                }
            });
        }
    })
}

startListener()

chrome.runtime.onMessage.addListener(message => {
    if (message.action === 'goToBookmark') {
        chrome.tabs.create({url: message.url})
    }
})