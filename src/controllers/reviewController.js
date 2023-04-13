const dbConnection = require('../database');
const uuid = require('uuid');

// give review
async function giveReview(req, res) {
  console.log(req.body);
  
  try {
    if (!req || !req.body || !req.body.reviewerId || !req.body.revieweeEmail || !req.body.reviewText) {
      res.status(500).json({ message: 'Invalid input' });
      return;
    }
    // check if reviewee exists
    const revieweeResponse = await new Promise((resolve, reject) => {
      dbConnection.query(
        'SELECT * FROM users WHERE email = ?',
        [req.body.revieweeEmail],
        (error, result, field) => {
          if (error) {
            res.status(401).json({ message: error });
            return;
          }
          console.log(result);

          if (result.length === 0) {
            return res.send({
              status: false,
              responseMessage: 'Reviewee does not exist',
            });
          }
          resolve(result[0]);
        }
      );
    });

    // check if reviewer exists
    const reviewerResponse  = await new Promise((resolve, reject) => {
      dbConnection.query(
        'SELECT * FROM users WHERE userId = ?',
        [req.body.reviewerId],
        (error, result, field) => {
          if (error) {
            res.status(401).json({ message: error });
            return;
          }
          console.log(result);

          if (result.length === 0) {
            return res.send({
              status: false,
              responseMessage: 'Reviewer does not exist',
            });
          }
          resolve(result[0]);
        }
      );
    });


    const response = await new Promise((resolve, reject) => {
      reviewId = uuid.v4();
      dbConnection.query(
        'INSERT INTO review (reviewId, reviewerId, revieweeEmail,reviewText,isDeleted) VALUES (?,?,?,?,?)',
        [reviewId, req.body.reviewerId, req.body.revieweeEmail,req.body.reviewText,0],
        (error, result, field) => {
          if (error) {
            res.status(500).json({ message: error.message });
            return;
          }
          resolve(result);
        }
      );
    });
    console.log(response);
    return res.send({
      status: true,
      responseMessage: 'Review given',
      response: response,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: e.message });
  }
}
// get all reviews by a reviewer
async function getAllReviewsByReviewer(req, res) {
  console.log(req.body);
  try{
    if (!req || !req.body || !req.body.reviewerId) {
      res.status(500).json({ message: 'Invalid input' });
      return;
    }
    const response = await new Promise((resolve, reject) => {
      dbConnection.query(
        'SELECT * FROM review WHERE reviewerId = ? AND isDeleted = 0',
        [req.body.reviewerId],
        (error, result, field) => {
          if (error) {
            res.status(500).json({ message: error.message });
            return;
          }
          resolve(result);
        }
      );
    });
    console.log(response);
    return res.send({
      status: true,
      responseMessage: 'All reviews by reviewer',
      response: response,
    });
  }
  catch{
    console.log(e);
    res.status(500).json({ message: e.message });
  }
}
// get reviewId by revieweeEmail and reviewerId
async function getReviewIdByRevieweeEmailAndReviewerId(req, res) {
  console.log(req.body);
  try{
    if (!req || !req.body || !req.body.reviewerId || !req.body.revieweeEmail) {
      res.status(500).json({ message: 'Invalid input' });
      return;
    }
    const response = await new Promise((resolve, reject) => {
      dbConnection.query(
        'SELECT reviewId FROM review WHERE reviewerId = ? AND revieweeEmail = ? AND isDeleted = 0',
        [req.body.reviewerId, req.body.revieweeEmail],
        (error, result, field) => {
          if (error) {
            res.status(500).json({ message: error.message });
            return;
          }
          resolve(result);
        }
      );
    });
    console.log(response);
    return res.send({
      status: true,
      responseMessage: 'Successfull',
      response: response,
    });
  }
  catch{
    console.log(e);
    res.status(500).json({ message: e.message });
  }
}

// update review
async function updateReview(req, res) {
  console.log(req.body);
  try{
    if (!req || !req.body || !req.body.reviewId || !req.body.reviewText) {
      res.status(500).json({ message: 'Invalid input' });
      return;
    }
    const response = await new Promise((resolve, reject) => {
      dbConnection.query(
        'UPDATE review SET reviewText = ? WHERE reviewId = ?',
        [req.body.reviewText, req.body.reviewId],
        (error, result, field) => {
          if (error) {
            res.status(500).json({ message: error.message });
            return;
          }
          resolve(result);
        }
      );
    });
    console.log(response);
    return res.send({
      status: true,
      responseMessage: 'Review updated',
      response: response,
    });
  }
  catch{
    console.log(e);
    res.status(500).json({ message: e.message });
  }
}

// delete review
async function deleteReview(req, res) {
  console.log(req.body);
  try{
    if (!req || !req.body || !req.body.reviewId ) {
      res.status(500).json({ message: 'Invalid input' });
      return;
    }
    const response = await new Promise((resolve, reject) => {
      dbConnection.query(
        'UPDATE review SET isDeleted = 1 WHERE reviewId = ?',
        [req.body.reviewId],
        (error, result, field) => {
          if (error) {
            res.status(500).json({ message: error.message });
            return;
          }
          resolve(result);
        }
      );
    });
    console.log(response);
    return res.send({
      status: true,
      responseMessage: 'Review deleted',
      response: response,
    });
  }
  catch{
    console.log(e);
    res.status(500).json({ message: e.message });
  }
}

module.exports = {
   giveReview,
   getAllReviewsByReviewer,
   getReviewIdByRevieweeEmailAndReviewerId,
    updateReview,
    deleteReview,
  };