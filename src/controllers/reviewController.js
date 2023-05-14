const dbConnection = require("../database");
const uuid = require("uuid");
const {
  encryptAES,
  decryptAES,
  decryptMessageOfReview,
} = require("../Security/encryption");
const { getSharedSecretKey } = require("../Security/diffieHelman");
const {
  getUserByEmail,
  getUserById,
} = require("../controllers/userController");
const { ServerEnum } = require("../../ServerEnum");
// give review
async function giveReview(req, res) {
  try {
    if (
      !req ||
      !req.body ||
      !req.body.reviewerId ||
      !req.body.revieweeEmail ||
      !req.body.reviewText ||
      !req.body.reviewerPrivateKey ||
      !req.body.isAnonymous
    ) {
      res.status(500).json({ message: "Invalid input" });
      return;
    }

    // check if reviewee exists
    const revieweeResponse = await getUserByEmail(req.body.revieweeEmail);
    if (!revieweeResponse) {
      res.status(500).json({
        status: false,
        message: "User Does not exist",
      });
      return;
    }
    revieweePublicKey = revieweeResponse.publickey;
    // check if reviewer exists
    const reviewerResponse = await getUserById(req.body.reviewerId);
    if (!reviewerResponse) {
      res.status(500).json({ message: "User Does not exist" });
      return;
    }

    reviewerPrivateKey = req.body.reviewerPrivateKey;

    // get shared secret
    const sharedSecret = getSharedSecretKey(
      reviewerPrivateKey,
      revieweePublicKey
    );
    // encrypt review text
    const encryptedReviewText = encryptAES(req.body.reviewText, sharedSecret);
    const currentDate = new Date();
    const options = { month: "short", day: "numeric", year: "numeric" };
    const formattedDate = currentDate.toLocaleDateString("en-US", options);

    const response = await new Promise((resolve, reject) => {
      reviewId = uuid.v4();
      dbConnection.query(
        "INSERT INTO review (reviewId, reviewerId, revieweeEmail, reviewText, isDeleted , isAnonymous,date) VALUES ($1, $2, $3, $4, $5, $6 , $7)",
        [
          reviewId,
          req.body.reviewerId,
          req.body.revieweeEmail,
          encryptedReviewText,
          0,
          req.body.isAnonymous,
          formattedDate,
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
    res.status(500).json({ message: e.message });
  }
}
// get all reviews by a reviewer
async function getAllReviewsByReviewer(req, res) {
  try {
    if (!req || !req.body || !req.body.reviewerId || !req.body.privatekey) {
      res.status(500).json({ message: "Invalid input" });
      return;
    }
    const userById = await getUserById(req.body.reviewerId);
    if (!userById) {
      return res.send(ServerEnum.USER_DOES_NOT_EXIST);
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
          resolve(result.rows);
        }
      );
    });
    // decrypt every message
    for (let i = 0; i < response.length; i++) {
      const userByEmail = await getUserByEmail(response[i].revieweeemail);
      if (!userByEmail) {
        res.send({
          status: false,
          responseMessage: "User does not exist",
        });
      }
      response[i].revieweeName =
        userByEmail.firstname + " " + userByEmail.lastname;
      response[i].designation = userByEmail.designation;

      const decryptedReviewText = await decryptMessageOfReview(
        response[i].reviewtext,
        userByEmail.publickey,
        req.body.privatekey
      );
      response[i].reviewtext = decryptedReviewText;
    }

    return res.send({
      status: true,
      responseMessage: "All reviews by reviewer",
      response: response,
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}

async function getAllReviewsAndRatingByReviewer(req, res) {
  try {
    if (!req || !req.body || !req.body.reviewerId || !req.body.privatekey) {
      res.status(500).json({ message: "Invalid input" });
      return;
    }
    const userById = await getUserById(req.body.reviewerId);
    if (!userById) {
      return res.send(ServerEnum.USER_DOES_NOT_EXIST);
    }

    const response = await new Promise((resolve, reject) => {
      // join rating and review table
      dbConnection.query(
        "SELECT *  ,   COALESCE(review.revieweeemail, rating.revieweeemail) AS revieweeemail, COALESCE(review.reviewerId, rating.reviewerId) AS reviewerId FROM review FULL OUTER JOIN rating ON review.reviewerId = rating.reviewerId AND review.revieweeemail = rating.revieweeemail WHERE review.reviewerId = $1 AND review.isDeleted = '0'",

        [req.body.reviewerId],
        (error, result, field) => {
          if (error) {
            res.status(500).json({ message: error.message });
            return;
          }
          resolve(result.rows);
        }
      );
    });
    for (let i = 0; i < response.length; i++) {
      // user by email
      const userByEmail = await getUserByEmail(response[i].revieweeemail);
      if (!userByEmail) {
        res.send({
          status: false,
          responseMessage: "User does not exist",
        });
      }
      response[i].firstname = userByEmail.firstname;
      response[i].lastname = userByEmail.lastname;
      response[i].designation = userByEmail.designation;
      response[i].department = userByEmail.department;

      const decryptedReviewText = await decryptMessageOfReview(
        response[i].reviewtext,
        userByEmail.publickey,
        req.body.privatekey
      );
      const sharedKey = getSharedSecretKey(
        req.body.privatekey,
        userByEmail.publickey
      );
      response[i].sharedKey = sharedKey;
      response[i].reviewtext = decryptedReviewText;
    }

    return res.send({
      status: true,
      responseMessage: "All reviews by reviewer",
      response: response,
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}

async function getAllReviewsAndRatingOfReviewee(req, res) {
  if (!req || !req.body || !req.body.revieweeemail || !req.body.privatekey) {
    res.send(ServerEnum.INVALID_INPUT);
    return;
  }
  try {
    const userByEmail = await getUserByEmail(req.body.revieweeemail);
    if (!userByEmail) {
      res.send(ServerEnum.USER_DOES_NOT_EXIST);
      return;
    }
    const response = await new Promise((resolve, reject) => {
      // join rating and review table
      dbConnection.query(
        "SELECT *  ,   COALESCE(review.revieweeemail, rating.revieweeemail) AS revieweeemail, COALESCE(review.reviewerId, rating.reviewerId) AS reviewerId FROM review FULL OUTER JOIN rating ON review.reviewerId = rating.reviewerId AND review.revieweeemail = rating.revieweeemail WHERE review.revieweeemail = $1 AND review.isDeleted = '0'",

        [req.body.revieweeemail],
        (error, result, field) => {
          if (error) {
            res.status(500).json({ message: error.message });
            return;
          }
          resolve(result.rows);
        }
      );
    });
    for (let i = 0; i < response.length; i++) {
      const userById = await getUserById(response[i].reviewerid);

      if (!userById) {
        res.send({
          status: false,
          responseMessage: "User does not exist",
        });
      }
      response[i].reviewerName = userById.firstname + " " + userById.lastname;

      const decryptedReviewText = await decryptMessageOfReview(
        response[i].reviewtext,
        userById.publickey,
        req.body.privatekey
      );
      response[i].reviewtext = decryptedReviewText;
    }

    return res.send({
      status: true,
      responseMessage: "All reviews of revieweee",
      response: response,
    });
  } catch (e) {
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
    const userByEmail = await getUserByEmail(req.body.reveiweeemail);
    if (!userByEmail) {
      return res.send({
        status: false,
        responseMessage: "User does not exist",
      });
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
          resolve(result.rows);
        }
      );
    });
    // decrypt every message
    for (let i = 0; i < response.length; i++) {
      const userById = await getUserById(response[i].reviewerid);
      if (!userById) {
        return res.send({
          status: false,
          responseMessage: "User does not exist",
        });
      }
      response[i].reviewerName = userById.firstname + " " + userById.lastname;
      response[i].designation = userById.designation;

      const decryptedReviewText = await decryptMessageOfReview(
        response[i].reviewtext,
        userById.publickey,
        req.body.privatekey
      );
      response[i].reviewtext = decryptedReviewText;
    }
    return res.send({
      status: true,
      responseMessage: "All reviews of reveiwee",
      response: response,
    });
  } catch (e) {
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

    const reviewerResponse = await getUserById(req.body.reviewerId);
    if (!reviewerResponse) {
      return res.send(ServerEnum.USER_DOES_NOT_EXIST);
    }
    const reveiweeResponse = await getUserByEmail(req.body.revieweeEmail);
    if (!reveiweeResponse) {
      return res.send(ServerEnum.USER_DOES_NOT_EXIST);
    }
    let publickey = "";
    if (req.body.isReviewer === false) {
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
          resolve(result.rows);
        }
      );
    });
    if (response.length === 0) {
      return res.send({
        status: false,
        responseMessage: ServerEnum.RESPONSE_NO_REVIEW_FOUND,
        response: {},
        sharedkey: null,
      });
    }

    let sharedkey = getSharedSecretKey(req.body.privatekey, publickey);

    // decrypt review text
    try {
      response[0].reviewtext = decryptAES(response[0].reviewtext, sharedkey);
      response[0].sharedkey = sharedkey;
      return res.send({
        status: true,
        responseMessage: "Successfull",
        response: response[0],
      });
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  } catch (e) {}
}
async function getReviewAndRatingByReviewerIdAndRevieweeEmail(req, res) {
  if (
    !req ||
    !req.body ||
    !req.body.reviewerId ||
    !req.body.revieweeEmail ||
    !req.body.privatekey ||
    !req.body.isReviewer
  ) {
    res.send(ServerEnum.INVALID_INPUT);
    return;
  }
  try {
    const reviewerResponse = await getUserById(req.body.reviewerId);
    if (!reviewerResponse) {
      return res.send(ServerEnum.USER_DOES_NOT_EXIST);
    }
    const reveiweeResponse = await getUserByEmail(req.body.revieweeEmail);
    if (!reveiweeResponse) {
      return res.send(ServerEnum.USER_DOES_NOT_EXIST);
    }
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
        "SELECT *  ,   COALESCE(review.revieweeemail, rating.revieweeemail) AS revieweeemail, COALESCE(review.reviewerId, rating.reviewerId) AS reviewerId FROM review FULL OUTER JOIN rating ON review.reviewerId = rating.reviewerId AND review.revieweeemail = rating.revieweeemail WHERE review.revieweeemail = $1 AND review.reviewerId = $2 AND review.isDeleted = '0'",
        [req.body.revieweeEmail, req.body.reviewerId],
        (error, result, field) => {
          if (error) {
            res.status(500).json({ message: error.message });
            return;
          }
          resolve(result.rows);
        }
      );
    });

    let sharedkey = getSharedSecretKey(req.body.privatekey, publickey);

    // decrypt review text
    try {
      response[0].reviewtext = decryptAES(response[0].reviewtext, sharedkey);
      response[0].revieweeName =
        reveiweeResponse.firstname + " " + reveiweeResponse.lastname;
      response[0].designation = reveiweeResponse.designation;

      return res.send({
        status: true,
        responseMessage: "Successfull",
        response: response[0],
        sharedkey: sharedkey,
      });
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}

// update review
async function updateReview(req, res) {
  console.log("updateReview", req.body);
  try {
    if (
      !req ||
      !req.body ||
      !req.body.reviewId ||
      !req.body.reviewText ||
      !req.body.sharedKey ||
      !req.body.isAnonymous
    ) {
      res.status(500).json({ message: "Invalid input" });
      return;
    }
    const currentDate = new Date();
    const options = { month: "short", day: "numeric", year: "numeric" };
    const formattedDate = currentDate.toLocaleDateString("en-US", options);

    encryptedReviewText = encryptAES(req.body.reviewText, req.body.sharedKey);
    const response = await new Promise((resolve, reject) => {
      dbConnection.query(
        "UPDATE review SET reviewText = $1, isAnonymous = $2 , date = $3 WHERE reviewId = $4",
        [
          encryptedReviewText,
          req.body.isAnonymous,
          formattedDate,
          req.body.reviewId,
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
      responseMessage: "Review updated",
      response: response,
    });
  } catch {
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
  getAllReviewsAndRatingByReviewer,
  getAllReviewsAndRatingOfReviewee,
  getReviewAndRatingByReviewerIdAndRevieweeEmail,
};
