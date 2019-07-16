'use strict';
require('dotenv').config()
var Twitter = require('twitter');

var client = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});

const { Client } = require('@elastic/elasticsearch')
const esclient = new Client({ node: 'https://search-cenpro-2669-b5cshljcv7p63veezhk7wkfbai.us-east-2.es.amazonaws.com' })

async function putTweetsInES() {
  let tweetdata;

  await client.get('search/tweets', {q: 'TensorFlow'})
  .then(function (tweet) {
    console.log(Object.keys(tweet["statuses"]));
    tweetdata = tweet;
  })
  .catch(function (error) {
    throw error;
  })

  // Iterate over available tweets and put into ES
  for(var key in tweetdata["statuses"]){
    var value = tweetdata["statuses"][key];
    //console.log(value["id_str"]);
    //console.log(value["created_at"]);
    //console.log(value["user"]["screen_name"]);
    console.log(value["text"]);

    var date = new Date(value["created_at"]);

    var esDoc = {
      index: 'tweets',
      id: value["id_str"],
      body: {
        Id: value["id_str"],
        Timestamp: date,
        Author: value["user"]["screen_name"],
        Content: value["text"]
      }
    };
    
    //console.log(esDoc);
    await esclient.index(esDoc)

  }

  return tweetdata
}

module.exports.tweet2es = async(event,context) => {
 
  return {
    statusCode: 200,
    body: JSON.stringify(await putTweetsInES()),
    headers: {
      'Content-Type': 'application/json',
    },
  }
};
