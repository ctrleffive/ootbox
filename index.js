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
          if (result['nextPageToken']) {
            videos = await getList(result['nextPageToken'], videos)
          }
          console.log(`${videos.length} VIDEOS FETCHED!`)
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
              {'title': 'esSENSE'},
              {'link': 'https://essenseglobal.com'},
              {'description': 'esSENSE aspires to be the premier rationalist platform in India.We bring together rationalist speakers, writers, thinkers, activists, supporters, and well-wishers, with the goal of promoting rationalism and freethinking in Kerala and in the larger global environment. Through our publications, e-magazines, seminars, online media, and other collaborative platforms, we will endeavour to develop rationalist thought, share ideas, expand our intellectual horizons, facilitate learning, and foster collaboration.&#xA;&#xA;We build a better tomorrow that embraces science and rationality, pursues freethinking and atheism, and elevates humanism and justice, while resisting superstition, quackery, ignorance, and hate.&#xA;We seek truth, science, and rationality as the essence of life.'},
              {'category': 'Nonprofits &amp; Activism'},
              {'language': 'en-us'},
              {'lastBuildDate': lastBuildDate},
              {'pubDate': '16 Sep 2018 11:31:27 +0000'},
              {
                'name': 'image',
                'children': [
                  {'title': 'esSENSE'},
                  {'link': 'https://essenseglobal.com'},
                  {'url': 'https://chandujs.in/essense-podcast/assets/icon.png'},
                ]
              },
              {'itunes:author': 'esSENSE Global'},
              {'itunes:subtitle': 'esSENSE'},
              {'itunes:summary': `<![CDATA[esSENSE aspires to be the premier rationalist platform in India.We bring together rationalist speakers, writers, thinkers, activists, supporters, and well-wishers, with the goal of promoting rationalism and freethinking in Kerala and in the larger global environment. Through our publications, e-magazines, seminars, online media, and other collaborative platforms, we will endeavour to develop rationalist thought, share ideas, expand our intellectual horizons, facilitate learning, and foster collaboration.
			
                We build a better tomorrow that embraces science and rationality, pursues freethinking and atheism, and elevates humanism and justice, while resisting superstition, quackery, ignorance, and hate.
                
                We seek truth, science, and rationality as the essence of life.
                
                esSENSE Social links:
                Website of esSENSE: http://essenseglobal.com/
                Website of neuronz: http://neuronz.in
                FaceBook Group: https://www.facebook.com/groups/esSENSEGlobal/
                FaceBook Page of esSENSE: https://www.facebook.com/essenseglobal/
                FaceBook Page of neuronz: https://www.facebook.com/neuronz.in/
                Twitter: https://twitter.com/esSENSEGlobal
                Podcast: http://podcast.essenseglobal.com/]]>`},
                {
                  'name': 'itunes:image',
                  'attrs': {
                    'href': 'https://chandujs.in/essense-podcast/assets/icon.png'
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
          const pubDate = new Date(video['snippet']['publishedAt']).toUTCString().replace('GMT', '+00000')
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
              {'itunes:author': 'esSENSE'},
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