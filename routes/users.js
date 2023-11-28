const express = require("express");
const bcrypt = require("bcrypt");

const { auth } = require("../middlewares/auth");
const { UserModel, validUser, validLogin, createToken } = require("../models/userModel")
const jwt = require("jsonwebtoken");

const router = express.Router();

router.get("/", async (req, res) => {
  res.json({ msg: "Users work" })
})

// 2
// בראוטר ניתן להעביר בשרשור המון פונקציות שכדי לעבור אחד מהשני
// אנחנו צריכים להשתמש בפקודת נקסט שנעביר לפונקציית מידל וואר
router.get("/myEmail", auth, async (req, res) => {
  try {
    // req.tokenData._id -> מגיע מפונקציית האוט שנמצאת בשרשור
    let user = await UserModel.findOne({ _id:
       req.tokenData._id }, { email: 1 })
    // אומר  להציג  רק את האיימיל מתוך המאפיינים
    res.json(user);
    //  res.json({msg:"all good 3333" , data:req.tokenData })
  }
  catch (err) {
    console.log(err)
    res.status(500).json({ msg: "err", err })
  }
})

// 3
// אזור שמחזיר למשתמש את הפרטים שלו לפי הטוקן שהוא שולח
router.get("/myInfo", async (req, res) => {
  // בדיקה אם המשתמש בכלל שלח טוקן בהידר
  // הסיבה שעובדים מול הידר, שהוא גם מאובטח וגם נותן לשלוח עד 600 תווים
  // וגם עובד בבקשת גט לעומת באדי שלא עובד
  // req.query, req.params, req.body, req.header
  let token = req.header("x-api-key");
  if (!token) {
    return res.status(401).json({ msg: "You need to send token to this endpoint url" })
  }
  try {
    // מנסה לפענח את הטוקן ויכיל את כל המטען/מידע שבתוכו
    let tokenData = jwt.verify(token, "MaorSecret");
    console.log(tokenData);


    // עושה שאילתא של שליפת המידע מהמסד לפי האיי די שפוענח בטוקן
    // {password:0} -> יציג את כל המאפיינים חוץ מהסיסמא ואם זה 1
    // דווקא יציג רק אותו ולא יציג אחרים
    // 
    let user = await UserModel.findOne({ _id: tokenData._id },
       { password: 0 });
    // אומר לא להציג את הסיסמא מתוך המאפיינים
    res.json(user);
  }
  catch (err) {
    return res.status(401).json({ msg: "Token not valid or expired" })
  }

})

router.post("/", async (req, res) => {
  let validBody = validUser(req.body);
  // במידה ויש טעות בריק באדי שהגיע מצד לקוח
  // יווצר מאפיין בשם אירור ונחזיר את הפירוט של הטעות
  if (validBody.error) {
    return res.status(400).json(validBody.error.details);
  }
  try {
    let user = new UserModel(req.body);
    // נרצה להצפין את הסיסמא בצורה חד כיוונית
    // 10 - רמת הצפנה שהיא מעולה לעסק בינוני , קטן
    user.password = await bcrypt.hash(user.password, 10);

    await user.save();
    user.password = "******";
    res.status(201).json(user);
  }
  catch (err) {
    if (err.code == 11000) {
      return res.status(500).json({ msg: "Email already in system, try log in", code: 11000 })

    }
    console.log(err);
    res.status(500).json({ msg: "err", err })
  }
})

// 1
router.post("/login", async (req, res) => {
  let validBody = validLogin(req.body);
  if (validBody.error) {
    // .details -> מחזיר בפירוט מה הבעיה צד לקוח
    return res.status(400).json(validBody.error.details);
  }
  try {
    // קודם כל לבדוק אם המייל שנשלח קיים  במסד
    let user = await UserModel.findOne({ email: req.body.email })
    if (!user) {
      return res.status(401).json({ msg: "Password or email is worng ,code:1" })
    }
    // אם הסיסמא שנשלחה בבאדי מתאימה לסיסמא המוצפנת במסד של אותו משתמש
    let authPassword = await bcrypt.compare(req.body.password, user.password);
    if (!authPassword) {
      return res.status(401).json({ msg: "Password or email is worng ,code:2" });
    }
    // מייצרים טוקן שמכיל את האיידי של המשתמש
    let newToken = createToken(user._id);
    res.json({ token: newToken });
  }
  catch (err) {
    console.log(err)
    res.status(500).json({ msg: "err", err })
  }
})

module.exports = router;