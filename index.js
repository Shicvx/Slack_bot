const { App } = require('@slack/bolt');
const axios = require('axios')
const dotenv = require('dotenv')

dotenv.config()

// Initializes your app with your bot token and signing secret
const app = new App({
  token: process.env.BOT_TOKEN,
  signingSecret: process.env.SIGNING_SECRET,
  socketMode: true, // add this
  appToken: process.env.APP_TOKEN, // add this
  port: process.env.PORT || 3000
});

// Listens to incoming messages that contain "hello"
app.message('hello', async ({ message, say }) => {
  // say() sends a message to the channel where the event was triggered
  await say({
    blocks: [
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": `Hey there <@${message.user}>!`
        },
        "accessory": {
          "type": "button",
          "text": {
            "type": "plain_text",
            "text": "Cat Facts"
          },
          "action_id": "button_click"
        }
      }
    ],
    text: `Hey there <@${message.user} 😊>!`
  });
});

const get_catfact = async () => {

    url = 'https://catfact.ninja/fact'
    try {
        const result = await axios.get(url);
        return result.data.fact
    }catch (err) {
      console.log(err);
    }

}

app.action('button_click', async ({ body, ack, say }) => {
  // Acknowledge the action
  await ack();
  const fact = await get_catfact()
  await say(`<@${body.user.id}> Cat fact for you -
             ${fact}.`);
});




const welcomeChannelId = 'C03B23GHVFS';

// When a user joins the team, send a message in a predefined channel asking them to introduce themselves
app.event('team_join', async ({ event, client, logger }) => {
  try {
    // Call chat.postMessage with the built-in client
    const result = await client.chat.postMessage({
      channel: welcomeChannelId,
      text: `Welcome to the team, <@${event.user.id}>! 🎉 You can introduce yourself in this channel.`
    });
    logger.info(result);
  }
  catch (error) {
    logger.error(error);
  }
});

app.command('/cool', async ({ command, ack, respond }) => {
  // Acknowledge command request
  await ack();

  await respond(`Nice, slash command is working ${command.text}`);
});



// Listen for a slash command invocation
app.command('/weather', async ({ ack, body, client, logger }) => {
  // Acknowledge the command request
  await ack();

  try {
    // Call views.open with the built-in client
    const result = await client.views.open({
      // Pass a valid trigger_id within 3 seconds of receiving it
      trigger_id: body.trigger_id,
      // View payload
      view: {
        type: 'modal',
        // View identifier
        callback_id: 'view_1',
        title: {
          type: 'plain_text',
          text: 'Check weather'
        },
        blocks: [
          {
            type: 'input',
            block_id: 'input_c',
            label: {
              type: 'plain_text',
              text: 'Enter the name of the city'
            },
            element: {
              type: 'plain_text_input',
              action_id: 'dreamy_input',
              multiline: false
            }
          }
        ],
        
        submit: {
          type: 'plain_text',
          text: 'Submit'
        }
      }
    });
    logger.info(result);
  }
  catch (error) {
    logger.error(error);
  }
});

const get_weather = async (city) => {

  url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${process.env.WEATHER_API_KEY}`
  try {
      const result = await axios.get(url);
      const temp = parseFloat(result.data.main.temp-273.15).toFixed(2)
      const weather = result.data.weather[0].description
      const area = result.data.name
      const country = result.data.sys.country

      return `Weather in ${area} | ${country} | ${weather}, Temp = ${temp} °С`
  }catch (err) {
    console.log(err);
  }

}

app.view('view_1', async ({ ack, body, view, client, logger }) => {
  // Acknowledge the view_submission request
  await ack();
  const val = view['state']['values']['input_c'];
  const user = body['user']['id'];

  const msg = await get_weather(val.dreamy_input.value);

  try {
    await client.chat.postMessage({
      channel: user,
      text: msg
    });
  }
  catch (error) {
    logger.error(error);
  }

});






(async () => {
  // Start your app
  await app.start();

  console.log('⚡️ Bolt app is running!');
})();

