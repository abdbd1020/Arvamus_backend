const dbConnection = require("../database");
const uuid = require("uuid");
const { ServerEnum } = require("../../ServerEnum");
const { getUserById, getUserByEmail } = require("./userController");
// `ratingId` char(36) PRIMARY KEY NOT NULL,`reviewerId` char(36) NOT NULL,`revieweeEmail` char(36) NOT NULL,`responsibility` char(36) NOT NULL, `behaviour` char(36) NULL,`professionalism` char(36) NOT NULL,`proficiency` char(36) NOT NULL,`management` char(36) NOT NULL,`isDeleted` char(2) NOT NULL,
//
// give review
async function giveRating(req, res) {
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
    const revieweeResponse = getUserByEmail(req.body.revieweeEmail);
    if (!revieweeResponse) {
      return res.send(ServerEnum.USER_NOT_FOUND);
    }
    // check if reviewer exists
    const reviewerResponse = getUserById(req.body.reviewerId);
    if (!reviewerResponse) {
      return res.send(ServerEnum.USER_NOT_FOUND);
    }

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
    const ratingCount = revieweeResponse.ratingCount + 1;
    const averageRating =
      (revieweeResponse.averageRating + averageReview) / ratingCount;
    // update reviewee average review
    const updateRevieweeAverageReview = await new Promise((resolve, reject) => {
      dbConnection.query(
        "UPDATE users SET averageRating = $1 , ratingCount = $2   WHERE email = $3",
        [averageRating, ratingCount, revieweeEmail],
        (error, result, field) => {
          if (error) {
            res.status(500).json({ message: error.message });
            return;
          }
          resolve(result);
        }
      );
    });

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
async function getRatingByRevieweeEmailAndReviewerId(req, res) {
  try {
    if (!req || !req.body || !req.body.reviewerId || !req.body.revieweeEmail) {
      res.status(500).json({ message: "Invalid input" });
      return;
    }
    const response = await new Promise((resolve, reject) => {
      dbConnection.query(
        "SELECT * FROM rating WHERE reviewerId = $1 AND revieweeEmail = $2 AND isDeleted = '0'",
        [req.body.reviewerId, req.body.revieweeEmail],
        (error, result, field) => {
          if (error) {
            res.status(500).json({ message: error.message });
            return;
          }
          resolve(result.rows);
        }
      );
    });

    if (response.length === 0) {
      return res.send({
        status: false,
        responseMessage: ServerEnum.RESPONSE_NO_RATING_FOUND,
        response: {},
        sharedkey: null,
      });
    }

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

    // get reviewww email from rating id
    const revieweeEmailResponse = await new Promise((resolve, reject) => {
      dbConnection.query(
        "SELECT * FROM rating WHERE ratingId = $1",
        [req.body.ratingId],
        (error, result, field) => {
          if (error) {
            res.status(500).json({ message: error.message });
            return;
          }
          resolve(result.rows[0]);
        }
      );
    });
    const revieweeEmail = revieweeEmailResponse.revieweeEmail;

    // get reviewee details
    const revieweeResponse = await getUserByEmail(revieweeEmail);

    const {
      ratingId,
      responsibility,
      behaviour,
      professionalism,
      proficiency,
      management,
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
          resolve(result.rows);
        }
      );
    });
    const averageRating =
      (revieweeResponse.averageRating + averageReview) / ratingCount;
    // update reviewee average review
    const updateRevieweeAverageReview = await new Promise((resolve, reject) => {
      dbConnection.query(
        "UPDATE users SET averageRating = $1   WHERE email = $3",
        [averageRating, revieweeEmail],
        (error, result, field) => {
          if (error) {
            res.status(500).json({ message: error.message });
            return;
          }
          resolve(result);
        }
      );
    });
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
  getRatingByRevieweeEmailAndReviewerId,
  updateRating,
  deleteRating,
};
