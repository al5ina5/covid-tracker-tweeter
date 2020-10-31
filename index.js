require('dotenv').config()
const Axios = require('axios')
const Twitter = require('twitter')
const R = require('random')
const numeral = require('numeral')
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const states = require('./states.json')
const adapter = new FileSync('db.json')
const db = low(adapter)

var client = new Twitter({
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token_key: process.env.TWITTER_ACESS_TOKEN_KEY,
    access_token_secret: process.env.TWITTER_ACESS_TOKEN_SECRET
})

db.defaults({ days: [] }).write()

async function sendTweet(callback) {
    var randomType = R.int(0, 2)

    console.log(`Case: ${randomType}`)

    switch (randomType) {
        case 0:
            try {
                var get = await Axios.get('https://covidtracking.com/api/v1/states/current.json')
                var data = get.data
            } catch (e) {
                console.log(e)
                discordLog(JSON.stringify(e, null, 1))
                return
            }

            data = data.filter(state => state.state !== 'AS')

            var randomState = data[R.int(0, (data.length - 1))]
            var stateName = '#' + states[randomState.state].replace(/ /g, '')

            var possibleTweets = [
                `#Coronavirus in ${stateName}: There is a total of ${numeral(randomState.death).format()} confirmed deaths from #COVID19.`
            ]

            var tweetString = possibleTweets[R.int(0, (possibleTweets.length - 1))]

            break
        case 1:
            try {
                var get = await Axios.get('https://covidtracking.com/api/v1/us/current.json')
                var data = get.data[0]

                // console.log(data)
                // console.log(numeral(data.positive).format())
            } catch (e) {
                console.log(e)
                discordLog(JSON.stringify(e, null, 1))
                return
            }

            var possibleTweets = [
                `${numeral(data.positive).format()} people have tested positive in the USA.`,
                `${numeral(data.negative).format()} people have tested negative in the USA.`,
                `There are currently ${numeral(data.hospitalizedCurrently).format()} people hospitalized in the USA.`,
                `In total, ${numeral(data.hospitalizedCumulative).format()} people have been hospitalized in the USA.`,
                `More than ${numeral(data.death).format()} have died in the USA.`,
                `In the USA, the number of total deaths has increased by ${numeral(data.deathIncrease).format()} in the past day.`,
                `In the USA, the number of positive cases has increased by ${numeral(data.positiveIncrease).format()} in the past day.`,
            ]

            var tweetString = possibleTweets[R.int(0, possibleTweets.length - 1)]

            break
        case 2:
            try {
                var get = await Axios.get('https://api.covid19api.com/summary')
                var data = get.data

                // console.log(data)
                // console.log(numeral(data.positive).format())
            } catch (e) {
                console.log(e)
                discordLog(JSON.stringify(e, null, 1))
                return
            }

            var countryOrGlobal = R.int(0, 1)
            if (countryOrGlobal == 0) {
                var randomCountry = data.Countries[R.int(0, data.Countries.length - 1)]

                if (randomCountry.TotalConfirmed == 0 || randomCountry.TotalDeaths == 0) {
                    sendTweet()
                    return
                }

                if (randomCountry.Country.includes(',')) {
                    randomCountry.Country = randomCountry.Country.split(',')[0]
                }

                if (randomCountry.Country.includes('(')) {
                    randomCountry.Country = randomCountry.Country.split('(')[0]
                }

                randomCountry.Country = randomCountry.Country.replace(/ /g, '')

                var possibleTweets = [
                    `#Coronavirus in #${randomCountry.Country}: There is a total of ${numeral(randomCountry.TotalConfirmed).format()} confirmed cases of #COVID19.`,
                    `#Coronavirus in #${randomCountry.Country}: There is a total of ${numeral(randomCountry.TotalDeaths).format()} confirmed deaths from #COVID19.`
                ]
            } else if (countryOrGlobal == 1) {
                var possibleTweets = [
                    `There is a total of ${numeral(data.Global.TotalDeaths).format()} confirmed deaths worldwide.`,
                    `There is a total of ${numeral(data.Global.TotalConfirmed).format()} confirmed cases worldwide.`
                ]
            }

            var tweetString = possibleTweets[R.int(0, possibleTweets.length - 1)]

            break
    }

    client.post('statuses/update', { status: tweetString }, function (error, tweet, response) {
        if (error) {
            console.log(`Failed to tweet: ${tweetString}`)
            sendTweet()
            return
        }
        var log = `Tweeted: ${tweetString}`
        console.log(log)
    })
}

sendTweet()
setInterval(() => {
    sendTweet()
}, (1000 * 60 * 15))
// }, (1000))