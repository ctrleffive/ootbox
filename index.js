const fs = require('fs')
const path = require('path')
const configPath = './config.json'
const streamsPath = './streams.json'
const exceute = async () => {
  if (fs.existsSync(path.join(__dirname, configPath)) && fs.existsSync(path.join(__dirname, streamsPath))) {
    const config = require(configPath)
    const request = require('request')
    const getList = async (pageToken = null, videos = []) => {
      let playlistApi = `https://www.googleapis.com/youtube/v3/playlistItems`
          playlistApi += `?part=snippet,contentDetails&maxResults=50`
          playlistApi += `&playlistId=${config.playlistId}`
          playlistApi += `&key=${config.key}`
      if (pageToken) {
        playlistApi += `&pageToken=${pageToken}`
      }
      return new Promise((resolve, reject) => {
        request.get(playlistApi, async (error, response, body) => {
          if (error) {
            return reject(error)
          }
          const result = JSON.parse(body)
          videos = videos.concat(result['items'])
          console.log(`FETCHED ${videos.length} VIDEOS SO FAR!`)
          if (result['nextPageToken']) {
            videos = await getList(result['nextPageToken'], videos)
          }
          return resolve(videos)
        })
      })
    }
    const writeToFeed = (videos) => {
      const jsonxml = require('jsontoxml')
      const lastBuildDate = new Date().toUTCString().replace('GMT', '+0000')
      const basicData = [{
        'name': 'rss',
        'attrs': {
          'version': '2.0',
          'xmlns:itunes': 'http://www.itunes.com/dtds/podcast-1.0.dtd'
        },
        'children': [{
            'name': 'channel',
            'children': [
              {'title': 'OotBox'},
              {'link': 'https://ootbox.chandujs.in/'},
              {'description': ''},
              {'category': 'Nonprofits &amp; Activism'},
              {'language': 'en-in'},
              {'lastBuildDate': lastBuildDate},
              {'pubDate': '26 Feb 2019 23:58:00 +0530'},
              {
                'name': 'image',
                'children': [
                  {'title': 'OotBox'},
                  {'link': 'https://ootbox.chandujs.in/'},
                  {'url': 'https://ootbox.chandujs.in/assets/icon.png'},
                ]
              },
              {'itunes:author': 'Chandu J S'},
              {'itunes:subtitle': 'OotBox'},
              {'itunes:summary': `<![CDATA[]]>`},
                {
                  'name': 'itunes:image',
                  'attrs': {
                    'href': 'https://ootbox.chandujs.in/assets/icon.png'
                  }
                },
                {'itunes:explicit': 'no'},
                {
                  'name': 'itunes:category',
                  'attrs': {
                    'text': 'Nonprofits &amp; Activism'
                  }
                },
            ]
        }]
      }]
      for (let index = 0; index < videos.length; index++) {
        const video = videos[index]
        const streams = require(streamsPath)
        let audioStream = streams[video['contentDetails']['videoId']] || '#'
        if (audioStream != '#') {
          const length = audioStream['length']
          const duration = audioStream['duration']
                audioStream = audioStream['stream']
          const description = video['snippet']['description'].replace(/&/g, '&#038;')
          const title = video['snippet']['title'].replace(/&/g, '&#038;')
          const pubDate = new Date(video['contentDetails']['videoPublishedAt']).toUTCString().replace('GMT', '+0530')
          const link = `https://youtube.com/watch?v=${video['contentDetails']['videoId']}`
          const image = `https://i.ytimg.com/vi/${video['contentDetails']['videoId']}/maxresdefault.jpg`

          const videoXml = {
            'name': 'item',
            'children': [
              {'link': link},
              {'pubDate': pubDate},
              {'guid': audioStream},
              {
                'name': 'enclosure',
                'attrs': {
                  'url': audioStream,
                  'length': length,
                  'type': 'audio/mp3'
                }
              },
              {'title': title},
              {'description': description},
              {
                'name': 'itunes:image',
                'attrs': {
                  'href': image
                }
              },
              {'itunes:order': index},
              {'itunes:author': 'Source Author'},
              {'itunes:summary': `<![CDATA[${description}]]>`},
              {'itunes:subtitle': title},
              {'itunes:explicit': 'no'},
              {'itunes:duration': duration},
            ]
          }
          basicData[0]['children'][0]['children'].push(videoXml)
        }
      }
      const xmlData = jsonxml(basicData)
      fs.writeFileSync('./feed.xml', xmlData, (error) => {
        if(error) {
          return console.log(error)
        }
        console.log('FEED SAVED!')
      })
    }

    console.log('PLEASE WAIT..')
    const allVideos = await getList()

    writeToFeed(allVideos)

  } else {
    throw new Error('NO CONFIG FILE!')
  }
}

exceute()
