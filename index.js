const args = process.argv.slice(2)
if (args.length && args[0] == '--id' && args[1]) {
  const videoId = args[1]
  const fetchUrl = require("fetch").fetchUrl
  const youtubeLink = `https://www.youtube.com/watch?v=${videoId}`
  console.log('please wait..')
  fetchUrl(youtubeLink, (error, meta, body) => {
    const content = body.toString()
    const split1 = content.split('type=audio%2Fmp4')[1]
    const split2 = split1.split('url=')[1]
    const split3 = split2.split('index=')[0]
    const decodedString = decodeURIComponent(split3)
    const result = decodedString.split('\\u0026')[0]
    console.log(`Audio: ${result}`)
  })
} else {
  console.log("please provide '--id'")
}