const uuid = require('uuid');
const bcrypt = require('bcrypt');
const fs = require('fs');
const readline = require('readline');
const dbConnection = require('../database');
const { ServerEnum } = require('../../ServerEnum');
const { sendMail } = require('./mail');

async function login(req, res) {
  console.log(req.body);
  try {
    const { email, password } = req.body;

    const user = await new Promise((resolve, reject) => {
      dbConnection.query(
        'SELECT * FROM users WHERE email = ?',
        [email],
        (error, result, field) => {
          if (error) {
            res.status(401).json({ message: error });
            return;
          }
          console.log(result);

          if (result.length === 0) {
            return res.send({
              status: false,
              responseMessage: 'email does not exist',
            });
          }
          if (result[0].status === ServerEnum.STATUS_INACTIVE) {
            console.log('User Inactive');
            return res.send({
              status: false,
              responseMessage: 'User Inactive',
            });
          }
          resolve(result[0]);
        }
      );
    });

    if (user.type === ServerEnum.STUDENT) {
      const data = await new Promise((resolve, reject) => {
        dbConnection.query(
          'SELECT score, questions FROM classroom WHERE studentId = ?',
          [user.userId],
          (error, result, field) => {
            if (error) {
              res.status(401).json({ message: error });
              return;
            }
            console.log(result);

            if (result.length === 0) {
              return res.send({
                status: false,
                responseMessage: 'Something went wrong',
              });
            }
            resolve(result[0]);
          }
        );
      });
      user.score = data.score;
      user.questions = data.questions;
    }

    bcrypt.compare(password, user.password, (err, result) => {
      if (result) {
        delete user.password;
        return res.send({
          user,
          status: true,
          responseMessage: 'Login Successful',
        });
      }
      return res.send({
        status: false,
        responseMessage: 'Password is incorrect',
      });
    });
  } catch (e) {
    console.log(e);
  }
}

async function forgotPassword(req, res) {
  console.log(req.body);
  try {
    const { email } = req.body;

    const response = await new Promise((resolve, reject) => {
      dbConnection.query(
        'SELECT * FROM users WHERE email = ?',
        [email],
        (error, result, field) => {
          if (error) {
            res.status(401).json({ message: error });
            return;
          }
          console.log(result);

          if (result.length === 0) {
            return res.send({
              status: false,
              responseMessage: 'User does not exist',
            });
          }
          resolve(result[0]);
        }
      );
    });

    const password = Math.random().toString(36).slice(-8);
    console.log(password);

    await new Promise((resolve, reject) => {
      bcrypt.hash(password, 10, (err, hash) => {
        dbConnection.query(
          'UPDATE users SET password = ? WHERE email = ? ',
          [hash, email],
          (error, result, field) => {
            if (error) {
              res.status(401).json({
                message: error,
              });
              return;
            }
            resolve();
          }
        );
      });

      sendMail(
        email,
        'Password reset',
        `Your password has been reset.\nNew password is: ${
					 password
					 }\nKindly ensure to change your password once you login.\n `
      );

      return res.send({
        status: true,
        responseMessage: 'Password Reset Successfully',
      });
    });
  } catch (e) {
    console.log(e);
  }
}

async function changePassword(req, res) {
  console.log(req.body);
  try {
    const { userId, oldPassword, newPassword } = req.body;

    const response = await new Promise((resolve, reject) => {
      dbConnection.query(
        'SELECT * FROM users WHERE userId = ?',
        [userId],
        (error, result, field) => {
          if (error) {
            res.status(401).json({ message: error });
            return;
          }
          console.log(result);

          if (result.length === 0) {
            return res.send({
              status: false,
              responseMessage: 'User does not exist',
            });
          }
          resolve(result[0]);
        }
      );
    });

    bcrypt.compare(oldPassword, response.password, async (err, result) => {
      if (result) {
        await new Promise((resolve, reject) => {
          bcrypt.hash(newPassword, 10, (err, hash) => {
            dbConnection.query(
              'UPDATE users SET password = ? WHERE userId = ? ',
              [hash, userId],
              (error, result, field) => {
                if (error) {
                  res.status(401).json({
                    message: error,
                  });
                  return;
                }
                resolve();
              }
            );
          });
          return res.send({
            status: true,
            responseMessage: 'Password Changed Successfully',
          });
        });
      } else {
        return res.send({
          status: false,
          responseMessage: 'Password does not match.',
        });
      }
    });
  } catch (e) {
    console.log(e);
  }
}

async function updateInfo(req, res) {
  console.log(req.body);
  try {
    const {
      userId, firstName, lastName, country, mobile, parentEmail
    } =			req.body;

    const response = await new Promise((resolve, reject) => {
      dbConnection.query(
        'SELECT * FROM users WHERE userId = ?',
        [userId],
        (error, result, field) => {
          if (error) {
            res.status(401).json({ message: error });
            return;
          }
          console.log(result);

          if (result.length === 0) {
            return res.send({
              status: false,
              responseMessage: 'User does not exist',
            });
          }
          resolve(result[0]);
        }
      );
    });

    await new Promise((resolve, reject) => {
      dbConnection.query(
        'UPDATE users SET firstName = ?, lastName = ?, country = ?, mobile = ?, parentEmail = ? WHERE userId = ? ',
        [
          firstName,
          lastName,
          country,
          mobile,
          parentEmail || '',
          userId,
        ],
        (error, result, field) => {
          if (error) {
            res.status(401).json({
              message: error,
            });
            return;
          }
          resolve();
        }
      );
      return res.send({
        status: true,
        responseMessage: 'Update Successful',
      });
    });
  } catch (e) {
    console.log(e);
  }
}

async function sendScore(req, res) {
  try {
    const {
      userId,
      score,
      questions,
      numberPerQuestion,
      formula,
      practiceType,
      speed,
      digits,
      operator,
      startTime,
      endTime,
      date,
    } = req.body;

    console.log('send score');

    let speedText = 'Very Slow';

    if (speed == ServerEnum.SPEED_VERY_SLOW) speedText = 'Very Slow';
    if (speed == ServerEnum.SPEED_SLOW) speedText = 'Slow';
    if (speed == ServerEnum.SPEED_MEDIUM) speedText = 'Medium';
    if (speed == ServerEnum.SPEED_FAST) speedText = 'Fast';

    const response = await new Promise((resolve, reject) => {
      dbConnection.query(
        'SELECT * FROM classroom WHERE studentId = ?',
        [userId],
        (error, result, field) => {
          if (error) {
            res.status(401).json({ message: error });
            return;
          }

          if (result.length === 0) {
            return res.send({
              status: false,
              responseMessage: 'User does not exist',
            });
          }
          resolve(result[0]);
        }
      );
    });

    const quizId = uuid.v1();

    await new Promise((resolve, reject) => {
      dbConnection.query(
        `INSERT INTO quiz 
            (quizId, studentId, date, startTime, endTime, practiceType, operator, formula, digits, numberPerQuestion, numberOfQuestions, speed, score)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?) `,
        [
          quizId,
          userId,
          date,
          startTime,
          endTime,
          practiceType,
          operator,
          formula,
          digits,
          numberPerQuestion,
          questions,
          speedText,
          score,
        ],
        (error, result, field) => {
          if (error) {
            console.log(error);
            return res.status(401).json({ message: error });
          }
          resolve();
        }
      );
    });

    await new Promise((resolve, reject) => {
      dbConnection.query(
        'UPDATE classroom SET score = ?, questions = ? WHERE studentId = ? ',
        [
          response.score + score,
          response.questions + questions,
          userId,
        ],
        (error, result, field) => {
          if (error) {
            res.status(401).json({
              message: error,
            });
            return;
          }
          resolve();
        }
      );
      return res.send({
        score: response.score + score,
        questions: response.questions + questions,
        status: true,
        responseMessage: 'Update Successful',
      });
    });
  } catch (e) {
    console.log(e);
  }
}

async function getAddQuiz(req, res) {
  try {
    const {
      formula,
      practiceType,
      digits,
      questionNumber,
      number,
      speed,
      showAnswer,
    } = req.body;

    const quiz = {
      questions: [],
      showAnswer,
      practiceType,
      formula,
      digits,
      questionNumber,
      number,
      speed,
    };

    if (speed == 1) quiz.speed = ServerEnum.ADD_SPEED_VERY_SLOW;
    if (speed == 2) quiz.speed = ServerEnum.ADD_SPEED_SLOW;
    if (speed == 3) quiz.speed = ServerEnum.ADD_SPEED_MEDIUM;
    if (speed == 4) quiz.speed = ServerEnum.ADD_SPEED_FAST;

    let path = '';
    const lower = 10 ** (digits - 1);
    const upper = 10 ** digits - 1;

    if (formula === ServerEnum.BIG_FRIENDS) path = '/data/big.csv';
    else if (formula === ServerEnum.SMALL_FRIENDS) path = '/data/small.csv';
    else if (formula === ServerEnum.WITHOUT_FORMULA) path = '/data/without.csv';
    else {
      let qnumber = questionNumber;

      while (qnumber--) {
        const question = {
          text: [],
          answer: 0,
        };

        let num = number;
        while (num--) {
          const ranDigit = getRandomArbitrary(lower, upper);
          question.text.push(ranDigit.toString());
          question.answer += ranDigit;
        }
        quiz.questions.push(question);
      }
      return res.send({
        quiz,
        status: true,
        responseMessage: 'Update Successful',
      });
    }

    const stream = fs.createReadStream(__dirname + path);

    const rl = readline.createInterface({ input: stream });
    const data = [];

    rl.on('line', (row) => {
      const arr = row
        .split(',')
        .filter((e) => e !== '')
        .slice(1);
      data.push(arr);
    });

    rl.on('close', () => {
      let qnumber = questionNumber;
      console.log(`from ${formula}`);

      while (qnumber--) {
        const question = {
          text: [],
          answer: 0,
        };
        var ranDigit = getRandomArbitrary(lower, upper);

        question.text.push(ranDigit.toString());
        question.answer += ranDigit;
        let num = number - 1;
        while (num--) {
          var ranDigit =						data[question.answer][
						  getRandomArbitrary(
						    0,
						    data[question.answer].length - 1
						  )
          ];
          question.text.push(ranDigit);
          question.answer += parseInt(ranDigit);
        }
        quiz.questions.push(question);
      }
      return res.send({
        quiz,
        status: true,
        responseMessage: 'Update Successful',
      });
    });
  } catch (e) {
    console.log(e);
  }
}

async function getSubQuiz(req, res) {
  try {
    const {
      formula,
      practiceType,
      digits,
      questionNumber,
      number,
      speed,
      showAnswer,
    } = req.body;

    const quiz = {
      questions: [],
      showAnswer,
      practiceType,
      formula,
      digits,
      questionNumber,
      number,
      speed,
    };

    if (speed == 1) quiz.speed = ServerEnum.SUB_SPEED_VERY_SLOW;
    if (speed == 2) quiz.speed = ServerEnum.SUB_SPEED_SLOW;
    if (speed == 3) quiz.speed = ServerEnum.SUB_SPEED_MEDIUM;
    if (speed == 4) quiz.speed = ServerEnum.SUB_SPEED_FAST;

    let path = '';
    const lower = 10 ** (digits - 1);
    const upper = 10 ** digits - 1;

    if (formula === ServerEnum.BIG_FRIENDS) path = '/data/big_sub.csv';
    else if (formula === ServerEnum.SMALL_FRIENDS) path = '/data/small_sub.csv';
    else if (formula === ServerEnum.WITHOUT_FORMULA) path = '/data/without_sub.csv';
    else {
      let qnumber = questionNumber;

      while (qnumber--) {
        const question = {
          text: [],
          answer: 0,
        };
        let ranDigit = getRandomArbitrary(lower, upper);
        question.text.push(ranDigit.toString());
        question.answer += ranDigit;
        let num = number - 1;
        while (num--) {
          if (num === 0) {
            if (
              question.answer / 10 ** (digits - 1) > 1
							|| question.answer < 0
            ) {
              ranDigit =								getRandomArbitrary(lower, question.answer) * -1;
            } else {
              ranDigit = getRandomArbitrary(
                question.answer > 0
                  ? lower + question.answer
                  : lower - question.answer,
                upper
              );
            }
          } else if (
            question.answer / 10 ** (digits - 1) > 1
						|| question.answer < 0
          ) {
            ranDigit =							getRandomArbitrary(lower, question.answer) * -1;
          } else {
            ranDigit = getRandomArbitrary(
              lower,
              upper - question.answer
            );
          }
          question.text.push(ranDigit.toString());
          question.answer += ranDigit;
        }
        quiz.questions.push(question);
      }
      return res.send({
        quiz,
        status: true,
        responseMessage: 'Update Successful',
      });
    }

    const stream = fs.createReadStream(__dirname + path);

    const rl = readline.createInterface({ input: stream });
    const data = [];

    rl.on('line', (row) => {
      const arr = row
        .split(',')
        .filter((e) => e !== '')
        .slice(1);
      data.push(arr);
    });

    rl.on('close', () => {
      let qnumber = questionNumber;
      console.log(`from ${formula}`);

      while (qnumber--) {
        const question = {
          text: [],
          answer: 0,
        };
        var ranDigit = getRandomArbitrary(lower, upper);

        question.text.push(ranDigit.toString());
        question.answer += ranDigit;
        let num = number - 1;
        while (num--) {
          var ranDigit =						data[question.answer][
						  getRandomArbitrary(
						    0,
						    data[question.answer].length - 1
						  )
          ];
          question.text.push(ranDigit);
          question.answer += parseInt(ranDigit);
        }
        quiz.questions.push(question);
      }
      return res.send({
        quiz,
        status: true,
        responseMessage: 'Update Successful',
      });
    });
  } catch (e) {
    console.log(e);
  }
}

async function getMulQuiz(req, res) {
  try {
    const {
      practiceType, digits, questionNumber, speed, showAnswer
    } =			req.body;

    const quiz = {
      questions: [],
      showAnswer,
      practiceType,
      digits,
      questionNumber,
      speed,
    };

    if (speed == 1) quiz.speed = ServerEnum.MUL_SPEED_VERY_SLOW;
    if (speed == 2) quiz.speed = ServerEnum.MUL_SPEED_SLOW;
    if (speed == 3) quiz.speed = ServerEnum.MUL_SPEED_MEDIUM;
    if (speed == 4) quiz.speed = ServerEnum.MUL_SPEED_FAST;

    let dig1; let
      dig2;
    if (digits == 1) {
      dig1 = 1;
      dig2 = 1;
    }
    if (digits == 2) {
      dig1 = 2;
      dig2 = 1;
    }
    if (digits == 3) {
      dig1 = 3;
      dig2 = 1;
    }
    if (digits == 4) {
      dig1 = 4;
      dig2 = 1;
    }
    if (digits == 5) {
      dig1 = 2;
      dig2 = 2;
    }
    if (digits == 6) {
      dig1 = 3;
      dig2 = 2;
    }

    if (dig1 == 1) var lower1 = 2;
    else var lower1 = 10 ** (dig1 - 1);
    const upper1 = 10 ** dig1 - 1;

    if (dig2 == 1) var lower2 = 2;
    else var lower2 = 10 ** (dig2 - 1);
    const upper2 = 10 ** dig2 - 1;

    let qnumber = questionNumber;

    while (qnumber--) {
      const question = {
        text: [],
        answer: 0,
      };

      const ranDigit1 = getRandomArbitrary(lower1, upper1);
      const ranDigit2 = getRandomArbitrary(lower2, upper2);
      question.text.push(`${ranDigit1} x ${ranDigit2}`);
      question.answer = ranDigit1 * ranDigit2;

      quiz.questions.push(question);
    }
    return res.send({
      quiz,
      status: true,
      responseMessage: 'Update Successful',
    });
  } catch (e) {
    console.log(e);
  }
}

async function getDivQuiz(req, res) {
  try {
    const {
      practiceType, digits, questionNumber, speed, showAnswer
    } =			req.body;

    const quiz = {
      questions: [],
      showAnswer,
      practiceType,
      digits,
      questionNumber,
      speed,
    };

    if (speed == 1) quiz.speed = ServerEnum.DIV_SPEED_VERY_SLOW;
    if (speed == 2) quiz.speed = ServerEnum.DIV_SPEED_SLOW;
    if (speed == 3) quiz.speed = ServerEnum.DIV_SPEED_MEDIUM;
    if (speed == 4) quiz.speed = ServerEnum.DIV_SPEED_FAST;

    let dig1; let
      dig2;
    if (digits == 1) {
      dig1 = 2;
      dig2 = 1;
    }
    if (digits == 2) {
      dig1 = 3;
      dig2 = 1;
    }
    if (digits == 3) {
      dig1 = 3;
      dig2 = 2;
    }
    if (digits == 4) {
      dig1 = 4;
      dig2 = 1;
    }
    if (digits == 5) {
      dig1 = 3;
      dig2 = 2;
    }

    if (dig1 == 1) var lower1 = 2;
    else var lower1 = 10 ** (dig1 - 1);
    const upper1 = 10 ** dig1 - 1;

    if (dig2 == 1) var lower2 = 2;
    else var lower2 = 10 ** (dig2 - 1);
    const upper2 = 10 ** dig2 - 1;

    let qnumber = questionNumber;

    while (qnumber--) {
      const question = {
        text: [],
        answer: 0,
        remainder: 0,
      };

      const ranDigit1 = getRandomArbitrary(lower1, upper1);
      const ranDigit2 = getRandomArbitrary(lower2, upper2);
      question.text.push(`${ranDigit1} / ${ranDigit2}`);
      question.answer = Math.floor(ranDigit1 / ranDigit2);
      question.remainder = ranDigit1 % ranDigit2;

      quiz.questions.push(question);
    }
    return res.send({
      quiz,
      status: true,
      responseMessage: 'Update Successful',
    });
  } catch (e) {
    console.log(e);
  }
}

function getRandomArbitrary(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

module.exports = {
  login,
  changePassword,
  updateInfo,
  sendScore,
  getAddQuiz,
  getSubQuiz,
  getMulQuiz,
  getDivQuiz,
  forgotPassword,
};
