const jwt = require('jsonwebtoken')
const { User } = require('../models/user')
const mongoose = require('mongoose')
const express = require('express')
const router = express.Router()
const config = require('config')
const { Nova } = require('../models/nova')

// ------------------------------------------------------------------------------------------

router.post('/create', async (req, res) => {
  const token = req.headers['token']
  if (!token) return res.status(401).send({ msg: 'No token provided.' })

  const decoded = jwt.verify(token, config.get('jwtPrivateKey'))

  var user = await User.findOne({ _id: decoded._id })
  if (!user) return res.status(404).send({ msg: 'The user with the given ID was not found.' })

  //  let nova_ID = req.body.nova_ID //to be changed later

  let nova = await Nova.findOne({ _id: new mongoose.Types.ObjectId(req.body.nova_ID) })
  if (!nova) return res.status(400).send({ msg: 'nova_ID Doesnt exist' })

  var user2 = await User.findOne({ _id: new mongoose.Types.ObjectId(nova.user) })
  if (!user2) return res.status(404).send({ msg: 'The Owner of this Nova no longer exist' })

  if (mongoose.Types.ObjectId.isValid(decoded._id)) {
    let favorited = await Nova.findOne({ $and: [{ _id: req.body.nova_ID }, { favorited_by_IDs: user }] })
    if (favorited) return res.status(403).send({ msg: 'Already favorited (liked)' })

    await Nova.update({ _id: req.body.nova_ID },
      { $inc: { favorite_count: 1 },
        favorited: true,
        '$push': { 'favorited_by_IDs': decoded._id } }, { new: true }
    )
    await User.update({ _id: decoded._id }
      , { $inc: { favorites_count: 1 },
        '$push': { 'favorites_novas_IDs': req.body.nova_ID } }, { new: true }
    )
    // const notifyObject =
    await User.update({ _id: user2._id },
      { notification_object: {
        favorite_list: {
          '$push': { 'nova_ID': nova._id, 'user_action_ID': user._id, 'date': Date(Date.now()) }
        }
      }
      }, { new: true }
    )
    return res.status(200).send({ msg: 'Succussfully Liked', user, user2 })
  } else return res.status(404).send({ msg: 'User Not Valid' })
})

// ------------------------------------------------------------------------------------------

router.post('/destroy', async (req, res) => {
  const token = req.headers['token']
  if (!token) return res.status(401).send({ msg: 'No token provided.' })

  const decoded = jwt.verify(token, config.get('jwtPrivateKey'))

  var user = await User.findOne({ _id: decoded._id })
  if (!user) return res.status(404).send({ msg: 'The user with the given ID was not found.' })

  let nova = await Nova.findOne({ _id: new mongoose.Types.ObjectId(req.body.nova_ID) })
  if (!nova) return res.status(400).send({ msg: 'nova_ID Doesnt exist' })

  var user2 = await User.findOne({ _id: new mongoose.Types.ObjectId(nova.user) })
  if (!user2) return res.status(404).send({ msg: 'The Owner of this Nova no longer exist' })

  if (mongoose.Types.ObjectId.isValid(user._id)) {
    let favorited = await Nova.findOne({ $and: [{ _id: req.body.nova_ID }, { favorited_by_IDs: user }] })
    if (favorited) {
      await Nova.update({ _id: nova._id },
        { $inc: { favorite_count: -1 },
          favorited: false,
          '$pull': { 'favorited_by_IDs': decoded._id } }, { new: true }
      )
      await User.update({ _id: decoded._id },
        { $inc: { favorites_count: -1 },
          '$pull': { 'favorites_novas_IDs': nova._id } }, { new: true }
      )
      return res.status(200).send({ msg: 'Succussfully Un-Liked', user, user2 })
    } else return res.status(403).send({ msg: 'You dont like this nova' })
  } else return res.status(404).send({ msg: 'User Not Valid' })
})

// ------------------------------------------------------------------------------------------

router.get('/list', async (req, res) => {
  let user = await User.findOne({ _id: req.body.user_id })
  if (!user) return res.status(404).send({ 'msg': 'User Doesnt Exist' })
  var Favorited = await User.find({ _id: req.body.user_id }, { favorites_novas_IDs: 1, _id: 0 })

  const Length1 = Favorited.length
  if (Length1 === 0) return res.status(200).send({ 'novaFavorited: ': [] })
  if (Length1 <= 20) return res.status(200).send({ 'novaFavorited: ': Favorited })
  var novaFavorited = []
  for (var i = Length1 - 21; i < Length1; i++) {
    novaFavorited.push(Favorited[i])
  }
  return res.status(200).send({ novaFavorited })
})

// ------------------------------------------------------------------------------------------

module.exports = router
