import mongoose from 'mongoose'
const { Schema } = mongoose

const whatsappSchema = new Schema({
	message: String,
	name: String,
	timestamp: String,
	received: Boolean
})

export default mongoose.model('messagecontents', whatsappSchema)