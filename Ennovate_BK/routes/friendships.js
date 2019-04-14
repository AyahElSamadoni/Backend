const Joi = require("joi");
const jwt = require("jsonwebtoken");
const _ = require("lodash");
var pick = require("object.pick");
const winston = require("winston");
const { User } = require("../models/user");
const mongoose = require("mongoose");
const Nova = require("../models/nova");
const express = require("express");
const router = express.Router();
const config = require("config");
const { Following } = require("../models/following");

// ------------------------------------------------------------------------------------------

// The Priority is for the ID

router.post("/create", async (req, res) => {
  const token = req.headers["token"];
  if (!token) return res.status(401).send({ msg: "No token provided." });

  const decoded = jwt.verify(token, config.get("jwtPrivateKey"));
  var user = await User.findOne({ _id: decoded._id });
  if (!user)
    return res
      .status(404)
      .send({ msg: "The user with the given ID was not found." });

  let userID = req.body.user_ID;
  let userSreenName = req.body.screen_name;

  if (!userID && !userSreenName)
    return res.status(404).send({ msg: "NoUsersFound" });

  if (userID) {
    if (mongoose.Types.ObjectId.isValid(userID)) {
      let user2 = await User.findOne({ _id: userID });
      if (user2) {
        let follow = await Following.findOne({
          sourceID: decoded._id,
          friendID: userID
        });
        if (follow) return res.status(403).send({ msg: "Already Followed" });
        let following = new Following({
          sourceID: decoded._id,
          friendID: userID
        });
        await following.save();
      } else {
        return res.status(404).send({ msg: "The ID to follow is not valid" });
      }
    } else {
      return res.status(404).send({ msg: "The ID to follow is not valid" });
    }
  } else {
    let user2 = await User.findOne({ screen_name: userSreenName });
    if (user2) {
      let follow = await Following.findOne({
        sourceID: decoded._id,
        friendID: user2._id
      });
      if (follow) return res.status(403).send({ msg: "Already Followed" });
      let following = new Following({
        sourceID: decoded._id,
        friendID: user2._id
      });
      await following.save();
    } else {
      return res
        .status(404)
        .send({ msg: "The sreen name to follow is not valid" });
    }
  }
  return res.status(200).send({
    msg: "Successfully followed"
  });
});

// ------------------------------------------------------------------------------------------

// Destory Friendship

router.post("/Destroy", async (req, res) => {
  const token = req.headers["token"];
  if (!token) return res.status(401).send({ msg: "No token provided." });

  const decoded = jwt.verify(token, config.get("jwtPrivateKey"));
  var user = await User.findOne({ _id: decoded._id });
  if (!user)
    return res
      .status(404)
      .send({ msg: "The user with the given ID was not found." });

  let userID = req.body.user_ID;
  let userSreenName = req.body.screen_name;

  if (!userID && !userSreenName)
    return res.status(404).send({ msg: "No Users Found" });

  if (userID) {
    if (mongoose.Types.ObjectId.isValid(userID)) {
      let user2 = await User.findOne({ _id: userID });
      if (user2) {
        let follow = await Following.findOne({
          sourceID: decoded._id,
          friendID: user2._id
        });
        if (follow) {
          await Following.deleteOne({
            sourceID: decoded._id,
            friendID: user2._id
          });
        } else
          return res
            .status(404)
            .send({ msg: "you do not follow this person " });
      } else
        return res.status(404).send({ msg: "The ID to unfollow is not found" });
    }
  } else {
    let user2 = await User.findOne({ screen_name: userSreenName });
    if (user2) {
      let follow = await Following.findOne({
        sourceID: decoded._id,
        friendID: user2._id
      });
      if (follow) {
        await Following.deleteOne({
          sourceID: decoded._id,
          friendID: user2._id
        });
      } else
        return res
          .status(404)
          .send({ msg: "The sreen name to unfollow is not valid" });
    } else {
      return res
        .status(404)
        .send({ msg: "The sreen name to unfollow is not valid" });
    }
  }
  return res.status(200).send({ msg: "Successfully unfollowed" });
});

// ------------------------------------------------------------------------------------------

module.exports = router;
