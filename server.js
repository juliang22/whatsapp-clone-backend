import mongoose from 'mongoose'
import express from 'express'
import Messages from './dbMessages.js'
import Cors from 'cors'
import Pusher from 'pusher'
import MONGODB from './config.js'

// app config
const app = express()
const port = process.env.PORT || 8000

// middlewares
app.use(express.json())
app.use(Cors())

// Makes mongodb realtime
const pusher = new Pusher({
	appId: "1109419",
	key: "6e1e4b59a56111a2838d",
	secret: "afa3e0517aabfdc35987",
	cluster: "us3",
	useTLS: true
});

// api routers
app.get('/', (req, res) => res.status(200).send('Hello world'))

app.post('/messages/new', (req, res) => {
	const dbMessage = req.body
	Messages.create(dbMessage, (err, data) => {
		if (err) res.status(500).send(err)
		else res.status(201).send(`new message created: ${data}`)
	})
})

app.get('/messages/sync', (req, res) => {
	const dbMessage = req.body
	Messages.find(dbMessage, (err, data) => {
		if (err) res.status(500).send(err)
		else res.status(200).send(data)
	})
})

// DB config and listener
mongoose
	.connect(MONGODB, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true })
	.then(() => {
		console.log('MongoDB Connected')

		const db = mongoose.connection
		const msgCollection = db.collection("messagecontents") //Messages model/collection
		const changeStream = msgCollection.watch() //listening to changes in that specific model

		changeStream.on('change', change => {
			console.log("change occured in messages")
			if (change.operationType === 'insert') {
				const messageDetails = change.fullDocument //contents of data
				pusher.trigger('messages', 'inserted', { //creating new pusher channel called messages
					name: messageDetails.name,
					message: messageDetails.message,
					timestamp: messageDetails.timestamp,
					received: messageDetails.received
				})
			} else console.log('error triggering pusher')
		}) //doing something every time a change occurs

		return app.listen(port)
	})
	.then((req, res) => console.log(`Server running at ${port}`))
	.catch(error => console.error(`Trouble connecting to MongoDB: ${error}`))

