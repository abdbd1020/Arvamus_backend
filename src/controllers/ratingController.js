const dbConnection = require("../database");
const uuid = require("uuid");

// `ratingId` char(36) PRIMARY KEY NOT NULL,`reviewerId` char(36) NOT NULL,`revieweeEmail` char(36) NOT NULL,`responsibility` char(36) NOT NULL, `behaviour` char(36) NULL,`professionalism` char(36) NOT NULL,`proficiency` char(36) NOT NULL,`management` char(36) NOT NULL,`isDeleted` char(2) NOT NULL,
//
// give review
async function giveRating(req, res) {
  console.log(req.body);

  try {
    if (
      !req.body.reviewerId ||
      !req.body.revieweeEmail ||
      !req.body.responsibility ||
      !req.body.professionalism ||
      !req.body.proficiency ||
      !req.body.management ||
      !req.body.behaviour
    ) {
      return res.send({
        status: false,
        responseMessage: "Please fill all fields",
      });
    }
    // check if reviewee exists
    const revieweeResponse = await new Promise((resolve, reject) => {
      dbConnection.query(
        "SELECT * FROM users WHERE email = $1",
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
              responseMessage: "Reviewee does not exist",
            });
          }
          resolve(result.rows[0]);
        }
      );
    });

    // check if reviewer exists
    const reviewerResponse = await new Promise((resolve, reject) => {
      dbConnection.query(
        "SELECT * FROM users WHERE userId = $1",
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
              responseMessage: "Reviewer does not exist",
            });
          }
          resolve(result.rows[0]);
        }
      );
    });

    const {
      reviewerId,
      revieweeEmail,
      responsibility,
      behaviour,
      professionalism,
      proficiency,
      management,
      isDeleted,
    } = req.body;

    // get average review
    const averageReview =
      (Number(responsibility) +
        Number(behaviour) +
        Number(professionalism) +
        Number(proficiency) +
        Number(management)) /
      5;

    const response = await new Promise((resolve, reject) => {
      ratingId = uuid.v4();
      dbConnection.query(
        "INSERT INTO rating (ratingId, reviewerId, revieweeEmail, responsibility, behaviour, professionalism, proficiency, management,average, isDeleted) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)",
        [
          ratingId,
          reviewerId,
          revieweeEmail,
          responsibility,
          behaviour,
          professionalism,
          proficiency,
          management,
          averageReview,
          0,
        ],
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
      responseMessage: "Rating given",
      response: response,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: e.message });
  }
}
// get all reviews by a reviewer
async function getAllRatingsbyReviewer(req, res) {
  console.log(req.body);
  try {
    if (!req || !req.body || !req.body.reviewerId) {
      res.status(500).json({ message: "Invalid input" });
      return;
    }
    const response = await new Promise((resolve, reject) => {
      dbConnection.query(
        "SELECT * FROM rating WHERE reviewerId = $1 AND isDeleted = '0'",
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
      responseMessage: "All rating by reviewer",
      response: response,
    });
  } catch {
    console.log(e);
    res.status(500).json({ message: e.message });
  }
}
// get reviewId by revieweeEmail and reviewerId
async function getRatingIdByRevieweeEmailAndReviewerId(req, res) {
  console.log(req.body);
  try {
    if (!req || !req.body || !req.body.reviewerId || !req.body.revieweeEmail) {
      res.status(500).json({ message: "Invalid input" });
      return;
    }
    const response = await new Promise((resolve, reject) => {
      dbConnection.query(
        "SELECT ratingId FROM rating WHERE reviewerId = $1 AND revieweeEmail = $2 AND isDeleted = '0'",
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
      responseMessage: "Successfull",
      response: response,
    });
  } catch {
    console.log(e);
    res.status(500).json({ message: e.message });
  }
}

// update review
async function updateRating(req, res) {
  console.log(req.body);
  try {
    if (
      !req ||
      !req.body ||
      !req.body.ratingId ||
      !req.body.responsibility ||
      !req.body.professionalism ||
      !req.body.proficiency ||
      !req.body.management ||
      !req.body.behaviour
    ) {
      return res.send({
        status: false,
        responseMessage: "Invalid input",
      });
    }

    const {
      ratingId,
      revieweeEmail,
      responsibility,
      behaviour,
      professionalism,
      proficiency,
      management,
      isDeleted,
    } = req.body;

    // get average review
    const averageReview =
      (Number(responsibility) +
        Number(behaviour) +
        Number(professionalism) +
        Number(proficiency) +
        Number(management)) /
      5.0;

    const response = await new Promise((resolve, reject) => {
      dbConnection.query(
        "UPDATE rating SET responsibility = $1, behaviour = $2, professionalism = $3, proficiency = $4, management = $5,average = $6 WHERE ratingId = $7",
        [
          responsibility,
          behaviour,
          professionalism,
          proficiency,
          management,
          averageReview,
          ratingId,
        ],
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
      responseMessage: "Rating updated",
      response: response,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: e.message });
  }
}

// delete review
async function deleteRating(req, res) {
  console.log(req.body);
  try {
    if (!req || !req.body || !req.body.ratingId) {
      res.status(500).json({ message: "Invalid input" });
      return;
    }
    const response = await new Promise((resolve, reject) => {
      dbConnection.query(
        "UPDATE rating SET isDeleted = '1'  WHERE ratingId = $1",
        [req.body.ratingId],
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
      responseMessage: "Rating deleted",
      response: response,
    });
  } catch {
    console.log(e);
    res.status(500).json({ message: e.message });
  }
}

module.exports = {
  giveRating,
  getAllRatingsbyReviewer,
  getRatingIdByRevieweeEmailAndReviewerId,
  updateRating,
  deleteRating,
};
