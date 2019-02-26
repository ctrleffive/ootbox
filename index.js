const videoId = '_5bNufWmzlo'

const fetchUrl = require("fetch").fetchUrl
fetchUrl(`https://www.youtube.com/watch?v=${videoId}`, function(error, meta, body){
    const content = body.toString()
    const audioArea = content.split('type=audio%2Fmp4').pop().split('index=')[0]
    const decodedString = decodeURIComponent(audioArea)
    const result = decodedString.replace(/&/g, '&#038;')
    console.log(result)
})