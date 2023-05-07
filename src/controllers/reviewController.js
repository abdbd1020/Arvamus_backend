const dbConnection = require("../database");
const uuid = require("uuid");
const { encryptAES, decryptAES } = require("../Security/encryption");
const { getSharedSecretKey } = require("../Security/diffieHelman");
// give review
async function giveReview(req, res) {
  try {
    if (
      !req ||
      !req.body ||
      !req.body.reviewerId ||
      !req.body.revieweeEmail ||
      !req.body.reviewText ||
      !req.body.reviewerPrivateKey
    ) {
      res.status(500).json({ message: "Invalid input" });
      return;
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
    revieweePublicKey = revieweeResponse.publickey;
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

    reviewerPrivateKey = req.body.reviewerPrivateKey;

    // get shared secret
    const sharedSecret = getSharedSecretKey(
      reviewerPrivateKey,
      revieweePublicKey
    );
    const sharedSecretHex = sharedSecret.toString("hex");
    // encrypt review text
    const encryptedReviewText = encryptAES(
      req.body.reviewText,
      sharedSecretHex
    );

    const response = await new Promise((resolve, reject) => {
      reviewId = uuid.v4();
      dbConnection.query(
        "INSERT INTO review (reviewId, reviewerId, revieweeEmail, reviewText, isDeleted) VALUES ($1, $2, $3, $4, $5)",
        [
          reviewId,
          req.body.reviewerId,
          req.body.revieweeEmail,
          encryptedReviewText,
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
    return res.send({
      status: true,
      responseMessage: "Review given",
      response: response,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: e.message });
  }
}
// get all reviews by a reviewer
async function getAllReviewsByReviewer(req, res) {
  try {
    if (!req || !req.body || !req.body.reviewerId) {
      res.status(500).json({ message: "Invalid input" });
      return;
    }
    const response = await new Promise((resolve, reject) => {
      dbConnection.query(
        "SELECT * FROM review WHERE reviewerId = $1 AND isDeleted = '0'",
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
    return res.send({
      status: true,
      responseMessage: "All reviews by reviewer",
      response: response,
    });
  } catch {
    console.log(e);
    res.status(500).json({ message: e.message });
  }
}

// get all review of reviewee
async function getAllReviewsOfReveiwee(req, res) {
  try {
    if (!req || !req.body || !req.body.reveiweeemail) {
      res.status(500).json({ message: "Invalid input" });
      return;
    }
    const response = await new Promise((resolve, reject) => {
      dbConnection.query(
        "SELECT * FROM review WHERE revieweeEmail = $1 AND isDeleted = '0'",
        [req.body.reveiweeemail],
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
      responseMessage: "All reviews of reveiwee",
      response: response,
    });
  } catch {
    console.log(e);
    res.status(500).json({ message: e.message });
  }
}

// get reviewId by revieweeEmail and reviewerId
async function getReviewByRevieweeEmailAndReviewerId(req, res) {
  try {
    if (
      !req ||
      !req.body ||
      !req.body.reviewerId ||
      !req.body.revieweeEmail ||
      !req.body.isReviewer ||
      !req.body.privatekey
    ) {
      res.status(500).json({ message: "Invalid input" });
      return;
    }

    const reviewerResponse = await new Promise((resolve, reject) => {
      dbConnection.query(
        "SELECT * FROM users WHERE userId = $1",
        [req.body.reviewerId],
        (error, result, field) => {
          if (error) {
            res.status(401).json({ message: error });
            return;
          }

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

    const reveiweeResponse = await new Promise((resolve, reject) => {
      dbConnection.query(
        "SELECT * FROM users WHERE email = $1",
        [req.body.revieweeEmail],
        (error, result, field) => {
          if (error) {
            res.status(401).json({ message: error });
            return;
          }

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
    let publickey = "";
    if (req.body.isReviewer === "0") {
      // get reviewer public key
      publickey = reviewerResponse.publickey;
    } else {
      // get reveiwee public key
      publickey = reveiweeResponse.publickey;
    }

    const response = await new Promise((resolve, reject) => {
      dbConnection.query(
        "SELECT * FROM review WHERE reviewerId = $1 AND revieweeEmail = $2 AND isDeleted = '0'",
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

    let sharedkey = getSharedSecretKey(req.body.privatekey, publickey);
    // convert shared key to string
    sharedkey = sharedkey.toString("hex");
    // decrypt review text
    response.rows.forEach((element) => {
      element.reviewtext = decryptAES(element.reviewtext, sharedkey);
    });

    return res.send({
      status: true,
      responseMessage: "Successfull",
      response: response,
      sharedkey: sharedkey,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: e.message });
  }
}

// update review
async function updateReview(req, res) {
  try {
    if (
      !req ||
      !req.body ||
      !req.body.reviewId ||
      !req.body.reviewText ||
      !req.body.sharedKey
    ) {
      res.status(500).json({ message: "Invalid input" });
      return;
    }
    encryptedReviewText = encryptAES(req.body.reviewText, req.body.sharedKey);
    const response = await new Promise((resolve, reject) => {
      dbConnection.query(
        "UPDATE review SET reviewText = $1 WHERE reviewId = $2",
        [encryptedReviewText, req.body.reviewId],
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
      responseMessage: "Review updated",
      response: response,
    });
  } catch {
    console.log(e);
    res.status(500).json({ message: e.message });
  }
}

// delete review
async function deleteReview(req, res) {
  try {
    if (!req || !req.body || !req.body.reviewId) {
      res.status(500).json({ message: "Invalid input" });
      return;
    }
    const response = await new Promise((resolve, reject) => {
      dbConnection.query(
        "UPDATE review SET isDeleted = '1' WHERE reviewId = $1",
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
    return res.send({
      status: true,
      responseMessage: "Review deleted",
      response: response,
    });
  } catch {
    console.log(e);
    res.status(500).json({ message: e.message });
  }
}

module.exports = {
  giveReview,
  getAllReviewsByReviewer,
  getReviewByRevieweeEmailAndReviewerId,
  updateReview,
  getAllReviewsOfReveiwee,
  deleteReview,
};
