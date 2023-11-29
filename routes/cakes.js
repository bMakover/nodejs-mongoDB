const express= require("express");
const { auth } = require("../middlewares/auth");
const {CakesModel,validateCake} = require("../models/cakeModel")
const router = express.Router();

router.get("/" , async(req,res)=> {
  let perPage = req.query.perPage || 5;
  let page = req.query.page || 1;

  try{
    let data = await CakesModel.find({})
    .limit(perPage)
    .skip((page - 1) * perPage)
    .sort({_id:-1})
    res.json(data);
  }
  catch(err){
    console.log(err);
    res.status(500).json({msg:"there error try again later",err})
  }
})

router.get("/search",async(req,res) => {
  try{
    let queryS = req.query.s;
  
    let searchReg = new RegExp(queryS,"i")
    let data = await CakesModel.find({name:searchReg})
    .limit(50)
    res.json(data);
  }
  catch(err){
    console.log(err);
    res.status(500).json({msg:"there error try again later",err})
  }
})

router.post("/", auth,async(req,res) => {
  let validBody = validateCake(req.body);
  if(validBody.error){
    return res.status(400).json(validBody.error.details);
  }
  try{
    let cake = new CakesModel(req.body);
    cake.user_id = req.tokenData._id;
    await cake.save();
    res.status(201).json(cake);
  }
  catch(err){
    console.log(err);
    res.status(500).json({msg:"there error try again later",err})
  }
})

router.put("/:editId",auth, async(req,res) => {
  let validBody = validateCake(req.body);
  if(validBody.error){
    return res.status(400).json(validBody.error.details);
  }
  try{
    let editId = req.params.editId;
    let data;
    if(req.tokenData.role == "admin"){
      data = await CakesModel.updateOne({_id:editId},req.body)
    }
    else{
       data = await CakesModel.updateOne({_id:editId,user_id:req.tokenData._id},req.body)
    }
    res.json(data);
  }
  catch(err){
    console.log(err);
    res.status(500).json({msg:"there error try again later",err})
  }
})



router.delete("/:delId",auth, async(req,res) => {
  try{
    let delId = req.params.delId;
    let data;
   
    if(req.tokenData.role == "admin"){
      data = await CakesModel.deleteOne({_id:delId})
    }
    else{
      data = await CakesModel.deleteOne({_id:delId,user_id:req.tokenData._id})
    }
    res.json(data);
  }
  catch(err){
    console.log(err);
    res.status(500).json({msg:"there error try again later",err})
  }
})

module.exports = router;