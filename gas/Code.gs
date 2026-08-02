const SHEETS = {
  users: "Users",
  questions: "Questions",
  answers: "Answers",
  booths: "Booths",
  boothVisits: "BoothVisits",
  exchangeTokens: "ExchangeTokens",
  exchanges: "Exchanges",
  adminLogs: "AdminLogs",
  analytics: "Analytics",
};

const DEFAULT_HEADERS = {
  Users: [
    "userId",
    "nickname",
    "createdAt",
    "lastLogin",
    "totalPoints",
    "currentPoints",
    "correctCount",
    "answerCount",
    "visitedBooths",
    "lastActivity",
  ],
  Questions: [
    "questionId",
    "boothId",
    "title",
    "difficulty",
    "point",
    "questionText",
    "hint",
    "imageUrl",
    "correctAnswer",
    "options",
    "createdAt",
  ],
  Answers: [
    "answerId",
    "userId",
    "questionId",
    "userAnswer",
    "isCorrect",
    "earnedPoint",
    "timestamp",
  ],
  Booths: ["boothId", "boothName", "description", "location"],
  BoothVisits: ["visitId", "userId", "boothId", "timestamp"],
  ExchangeTokens: [
    "token",
    "prizeName",
    "cost",
    "createdAt",
    "expireAt",
    "used",
    "usedBy",
  ],
  Exchanges: [
    "exchangeId",
    "userId",
    "nickname",
    "prizeName",
    "cost",
    "timestamp",
  ],
  AdminLogs: ["logId", "adminAction", "detail", "timestamp"],
  Analytics: ["date", "visitors", "answers", "correctRate", "exchangeCount"],
};

function doGet(e) {
  const endpoint = (e && e.parameter && e.parameter.endpoint) || "ranking";
  return handleRequest_("GET", endpoint, e ? e.parameter : {}, null);
}

function doPost(e) {
  const body =
    e && e.postData && e.postData.contents
      ? JSON.parse(e.postData.contents)
      : {};
  const endpoint =
    body.endpoint || (e && e.parameter && e.parameter.endpoint) || "";
  return handleRequest_("POST", endpoint, body, e);
}

function handleRequest_(method, endpoint, body, e) {
  ensureSheets_();
  try {
    switch (endpoint) {
      case "login":
        return respond_(adminLogin_(body));
      case "registerUser":
        return respond_(registerUser_(body));
      case "getUser":
        return respond_(getUser_(body));
      case "updateNickname":
        return respond_(updateNickname_(body));
      case "recordVisit":
        return respond_(recordVisit_(body));
      case "getBooths":
        return respond_({
          success: true,
          message: "模擬店一覧を取得しました",
          data: { booths: sheetData_("Booths") },
        });
      case "getQuestions":
        return respond_(getQuestions_(body));
      case "getQuestion":
        return respond_(getQuestion_(body));
      case "submitAnswer":
        return respond_(submitAnswer_(body));
      case "ranking":
        return respond_(getRanking_());
      case "getHistory":
        return respond_(getHistory_(body));
      case "generateExchangeToken":
        return respond_(generateExchangeToken_(body));
      case "redeemExchangeToken":
        return respond_(redeemExchangeToken_(body));
      case "manualPointGrant":
        return respond_(manualPointGrant_(body));
      case "manualPointDeduct":
        return respond_(manualPointDeduct_(body));
      case "recalculateRanking":
        return respond_(recalculateRanking_());
      case "analytics":
        return respond_(analytics_());
      case "searchUsers":
        return respond_(searchUsers_(body));
      case "addQuestion":
        return respond_(addQuestion_(body));
      case "editQuestion":
        return respond_(editQuestion_(body));
      case "deleteQuestion":
        return respond_(deleteQuestion_(body));
      case "addBooth":
        return respond_(addBooth_(body));
      case "editBooth":
        return respond_(editBooth_(body));
      case "exportCsv":
        return respond_(exportCsv_());
      default:
        return respond_(
          {
            success: false,
            message: "Unsupported endpoint: " + endpoint,
            data: null,
          },
          404,
        );
    }
  } catch (error) {
    logAdmin_("error", String(error && error.message ? error.message : error));
    return respond_(
      {
        success: false,
        message: "サーバーエラー",
        data: { detail: String(error) },
      },
      500,
    );
  }
}

function respond_(payload, statusCode) {
  const output = ContentService.createTextOutput(JSON.stringify(payload));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

function apiSuccess_(message, data) {
  return { success: true, message: message, data: data || null };
}
function apiError_(message, data) {
  return { success: false, message: message, data: data || null };
}

function ensureSheets_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(DEFAULT_HEADERS).forEach(function (name) {
    let sheet = ss.getSheetByName(name);
    if (!sheet) sheet = ss.insertSheet(name);
    const headers = DEFAULT_HEADERS[name];
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }
  });
}

function sheet_(name) {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
}
function headers_(name) {
  return DEFAULT_HEADERS[name];
}
function rows_(name) {
  const values = sheet_(name).getDataRange().getValues();
  const head = values.shift() || [];
  return values
    .filter(function (row) {
      return row.some(function (cell) {
        return cell !== "";
      });
    })
    .map(function (row) {
      const obj = {};
      head.forEach(function (key, index) {
        obj[key] = row[index];
      });
      return obj;
    });
}
function appendRow_(name, values) {
  sheet_(name).appendRow(values);
}
function updateRowById_(name, key, id, updater) {
  const range = sheet_(name).getDataRange().getValues();
  const head = range[0] || [];
  for (let i = 1; i < range.length; i++) {
    if (String(range[i][head.indexOf(key)]) === String(id)) {
      const current = {};
      head.forEach(function (h, idx) {
        current[h] = range[i][idx];
      });
      const next = updater(current);
      const row = head.map(function (h) {
        return next[h];
      });
      sheet_(name)
        .getRange(i + 1, 1, 1, row.length)
        .setValues([row]);
      return next;
    }
  }
  return null;
}

function uuid_() {
  return Utilities.getUuid();
}
function nowIso_() {
  return new Date().toISOString();
}
function normalize_(value) {
  return String(value || "")
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function getUserById_(userId) {
  return (
    rows_("Users").find(function (row) {
      return String(row.userId) === String(userId);
    }) || null
  );
}
function getQuestionById_(questionId) {
  return (
    rows_("Questions").find(function (row) {
      return String(row.questionId) === String(questionId);
    }) || null
  );
}
function getBoothById_(boothId) {
  return (
    rows_("Booths").find(function (row) {
      return String(row.boothId) === String(boothId);
    }) || null
  );
}

function ensureUser_(userId, nickname) {
  let user = getUserById_(userId);
  if (!user) {
    user = {
      userId: userId,
      nickname: nickname || "",
      createdAt: nowIso_(),
      lastLogin: nowIso_(),
      totalPoints: 0,
      currentPoints: 0,
      correctCount: 0,
      answerCount: 0,
      visitedBooths: "",
      lastActivity: nowIso_(),
    };
    appendRow_(
      "Users",
      headers_("Users").map(function (key) {
        return user[key] || "";
      }),
    );
  } else if (nickname && !user.nickname) {
    updateRowById_("Users", "userId", userId, function (current) {
      current.nickname = nickname;
      current.lastLogin = nowIso_();
      current.lastActivity = nowIso_();
      return current;
    });
    user.nickname = nickname;
  }
  return user;
}

function registerUser_(body) {
  const user = ensureUser_(body.userId || uuid_(), body.nickname || "");
  updateRowById_("Users", "userId", user.userId, function (current) {
    current.lastLogin = nowIso_();
    current.lastActivity = nowIso_();
    return current;
  });
  logAdmin_("registerUser", user.userId);
  return apiSuccess_("ユーザーを登録しました", {
    user: getUserById_(user.userId),
  });
}

function getUser_(body) {
  const user = getUserById_(body.userId || "");
  if (!user)
    return apiSuccess_("ユーザーが見つかりません", {
      user: null,
      stats: { answerCount: 0, solvedCount: 0, visitedBooths: 0, rank: 0 },
    });
  const ranking = buildRanking_();
  return apiSuccess_("ユーザー情報を取得しました", {
    user: user,
    stats: {
      answerCount: user.answerCount,
      solvedCount: rows_("Answers").filter(function (row) {
        return row.userId === user.userId && String(row.isCorrect) === "true";
      }).length,
      answeredQuestionCount: rows_("Answers").filter(function (row) {
        return row.userId === user.userId;
      }).length,
      visitedBooths: String(user.visitedBooths || "")
        .split("|")
        .filter(Boolean).length,
      openedQuestionCount: rows_("Answers").filter(function (row) {
        return row.userId === user.userId;
      }).length,
      rank:
        ranking.findIndex(function (row) {
          return row.userId === user.userId;
        }) + 1,
    },
  });
}

function updateNickname_(body) {
  const nickname = String(body.nickname || "").trim();
  if (!nickname) return apiError_("ニックネームが空です");
  const userId = String(body.userId || "");
  ensureUser_(userId, nickname);
  updateRowById_("Users", "userId", userId, function (current) {
    current.nickname = nickname.slice(0, 24);
    current.lastActivity = nowIso_();
    return current;
  });
  logAdmin_("updateNickname", userId + " -> " + nickname);
  return apiSuccess_("ニックネームを更新しました", {
    user: getUserById_(userId),
  });
}

function recordVisit_(body) {
  const userId = String(body.userId || "");
  const boothId = String(body.boothId || "");
  const booth = getBoothById_(boothId);
  if (!booth) return apiError_("模擬店が見つかりません");
  const user = ensureUser_(userId, body.nickname || "");
  const current = String(user.visitedBooths || "")
    .split("|")
    .filter(Boolean);
  if (current.indexOf(boothId) === -1) current.push(boothId);
  updateRowById_("Users", "userId", userId, function (row) {
    row.visitedBooths = current.join("|");
    row.lastActivity = nowIso_();
    return row;
  });
  appendRow_("BoothVisits", [uuid_(), userId, boothId, nowIso_()]);
  logAdmin_("recordVisit", userId + " " + boothId);
  return apiSuccess_("来場記録を保存しました", { boothVisitId: uuid_() });
}

function getQuestions_(body) {
  const boothId = String(body.boothId || "");
  const questions = rows_("Questions").filter(function (row) {
    return !boothId || row.boothId === boothId;
  });
  return apiSuccess_("問題一覧を取得しました", { questions: questions });
}

function getQuestion_(body) {
  return apiSuccess_("問題を取得しました", {
    question: getQuestionById_(body.questionId || ""),
  });
}

function submitAnswer_(body) {
  const userId = String(body.userId || "");
  const questionId = String(body.questionId || "");
  const answer = String(body.answer || "");
  const user = ensureUser_(userId, body.nickname || "");
  const question = getQuestionById_(questionId);
  if (!question) return apiError_("問題が見つかりません");
  const isCorrect = normalize_(answer) === normalize_(question.correctAnswer);
  const alreadySolved = rows_("Answers").some(function (row) {
    return (
      row.userId === userId &&
      row.questionId === questionId &&
      String(row.isCorrect) === "true"
    );
  });
  const earnedPoint = isCorrect && !alreadySolved ? Number(question.point) : 0;
  appendRow_("Answers", [
    uuid_(),
    userId,
    questionId,
    String(answer).slice(0, 120),
    isCorrect,
    earnedPoint,
    nowIso_(),
  ]);
  updateRowById_("Users", "userId", userId, function (row) {
    row.answerCount = Number(row.answerCount || 0) + 1;
    if (earnedPoint > 0) {
      row.totalPoints = Number(row.totalPoints || 0) + earnedPoint;
      row.currentPoints = Number(row.currentPoints || 0) + earnedPoint;
      row.correctCount = Number(row.correctCount || 0) + 1;
    }
    row.lastActivity = nowIso_();
    return row;
  });
  logAdmin_("submitAnswer", userId + " " + questionId + " " + isCorrect);
  return apiSuccess_(isCorrect ? "正解です" : "回答を受け付けました", {
    answerId: uuid_(),
    isCorrect: isCorrect,
    earnedPoint: earnedPoint,
    solved: alreadySolved || isCorrect,
  });
}

function buildRanking_() {
  return rows_("Users")
    .sort(function (left, right) {
      if (Number(right.totalPoints) !== Number(left.totalPoints))
        return Number(right.totalPoints) - Number(left.totalPoints);
      return Number(right.correctCount) - Number(left.correctCount);
    })
    .map(function (user, index) {
      return {
        rank: index + 1,
        userId: user.userId,
        nickname: user.nickname || "名無し",
        totalPoints: Number(user.totalPoints || 0),
        currentPoints: Number(user.currentPoints || 0),
        correctCount: Number(user.correctCount || 0),
        answerCount: Number(user.answerCount || 0),
        visitedBooths: String(user.visitedBooths || "")
          .split("|")
          .filter(Boolean).length,
        lastActivity: user.lastActivity,
      };
    });
}

function getRanking_() {
  return apiSuccess_("ランキングを取得しました", {
    ranking: buildRanking_(),
    top100: buildRanking_().slice(0, 100),
  });
}

function getHistory_(body) {
  const userId = String(body.userId || "");
  return apiSuccess_("履歴を取得しました", {
    history: {
      answers: rows_("Answers").filter(function (row) {
        return row.userId === userId;
      }),
      exchanges: rows_("Exchanges").filter(function (row) {
        return row.userId === userId;
      }),
      boothVisits: rows_("BoothVisits").filter(function (row) {
        return row.userId === userId;
      }),
    },
  });
}

function generateExchangeToken_(body) {
  const token = uuid_();
  const prizeName = String(body.prizeName || "").trim();
  const cost = Math.max(1, Number(body.cost || 0));
  if (!prizeName) return apiError_("景品名が空です");
  appendRow_("ExchangeTokens", [
    token,
    prizeName,
    cost,
    nowIso_(),
    new Date(Date.now() + 60000).toISOString(),
    false,
    "",
  ]);
  logAdmin_("generateExchangeToken", prizeName + " cost=" + cost);
  return apiSuccess_("交換用QRトークンを発行しました", {
    token: token,
    expireAt: new Date(Date.now() + 60000).toISOString(),
  });
}

function redeemExchangeToken_(body) {
  const userId = String(body.userId || "");
  const tokenValue = String(body.token || "");
  const user = getUserById_(userId) || ensureUser_(userId, "");
  const tokenRow = rows_("ExchangeTokens").find(function (row) {
    return String(row.token) === tokenValue;
  });
  if (!tokenRow) return apiError_("交換トークンが無効です");
  if (String(tokenRow.used) === "true")
    return apiError_("交換トークンは使用済みです");
  if (new Date(tokenRow.expireAt).getTime() < Date.now())
    return apiError_("交換トークンの期限が切れています");
  if (Number(user.currentPoints || 0) < Number(tokenRow.cost || 0))
    return apiError_("ポイントが不足しています");
  updateRowById_("Users", "userId", userId, function (row) {
    row.currentPoints =
      Number(row.currentPoints || 0) - Number(tokenRow.cost || 0);
    row.lastActivity = nowIso_();
    return row;
  });
  updateRowById_("ExchangeTokens", "token", tokenValue, function (row) {
    row.used = true;
    row.usedBy = userId;
    return row;
  });
  appendRow_("Exchanges", [
    uuid_(),
    userId,
    user.nickname || "名無し",
    tokenRow.prizeName,
    tokenRow.cost,
    nowIso_(),
  ]);
  logAdmin_("redeemExchangeToken", userId + " " + tokenRow.prizeName);
  return apiSuccess_("景品交換が完了しました", {
    exchangeId: uuid_(),
    currentPoints: Number(user.currentPoints || 0) - Number(tokenRow.cost || 0),
  });
}

function manualPointGrant_(body) {
  const userId = String(body.userId || "");
  const point = Math.max(1, Math.abs(Number(body.point || 0)));
  ensureUser_(userId, "");
  updateRowById_("Users", "userId", userId, function (row) {
    row.totalPoints = Number(row.totalPoints || 0) + point;
    row.currentPoints = Number(row.currentPoints || 0) + point;
    row.lastActivity = nowIso_();
    return row;
  });
  logAdmin_("manualPointGrant", userId + " +" + point);
  return apiSuccess_("ポイントを付与しました", { user: getUserById_(userId) });
}

function manualPointDeduct_(body) {
  const userId = String(body.userId || "");
  const point = Math.max(1, Math.abs(Number(body.point || 0)));
  ensureUser_(userId, "");
  updateRowById_("Users", "userId", userId, function (row) {
    row.totalPoints = Math.max(0, Number(row.totalPoints || 0) - point);
    row.currentPoints = Math.max(0, Number(row.currentPoints || 0) - point);
    row.lastActivity = nowIso_();
    return row;
  });
  logAdmin_("manualPointDeduct", userId + " -" + point);
  return apiSuccess_("ポイントを減算しました", { user: getUserById_(userId) });
}

function recalculateRanking_() {
  rows_("Users").forEach(function (user) {
    const earned = rows_("Answers")
      .filter(function (answer) {
        return (
          answer.userId === user.userId && String(answer.isCorrect) === "true"
        );
      })
      .reduce(function (sum, answer) {
        return sum + Number(answer.earnedPoint || 0);
      }, 0);
    const spent = rows_("Exchanges")
      .filter(function (exchange) {
        return exchange.userId === user.userId;
      })
      .reduce(function (sum, exchange) {
        return sum + Number(exchange.cost || 0);
      }, 0);
    updateRowById_("Users", "userId", user.userId, function (row) {
      row.totalPoints = earned;
      row.currentPoints = Math.max(0, earned - spent);
      return row;
    });
  });
  logAdmin_("recalculateRanking", "ranking rebuilt");
  return apiSuccess_("ランキングを再計算しました", {
    ranking: buildRanking_(),
  });
}

function analytics_() {
  const visitors = rows_("BoothVisits").reduce(function (set, row) {
    set[row.userId] = true;
    return set;
  }, {});
  const answers = rows_("Answers").length;
  const correct = rows_("Answers").filter(function (row) {
    return String(row.isCorrect) === "true";
  }).length;
  return apiSuccess_("分析データを取得しました", {
    visitors: Object.keys(visitors).length,
    uniqueUsers: rows_("Users").length,
    answers: answers,
    correctRate: answers ? Math.round((correct / answers) * 100) : 0,
    exchangeCount: rows_("Exchanges").length,
    totalDistributedPoints: rows_("Answers").reduce(function (sum, row) {
      return sum + Number(row.earnedPoint || 0);
    }, 0),
    totalSpentPoints: rows_("Exchanges").reduce(function (sum, row) {
      return sum + Number(row.cost || 0);
    }, 0),
  });
}

function adminLogin_(body) {
  const password = String(body.password || "");
  const expected = PropertiesService.getScriptProperties().getProperty(
    "ADMIN_PASSWORD",
  );
  if (!expected || password !== expected) {
    return apiError_("管理者パスワードが一致しません");
  }
  logAdmin_("login", "success");
  return apiSuccess_("ログインしました", { loggedIn: true });
}

function searchUsers_(body) {
  const query = normalize_(body.query || "");
  return apiSuccess_("ユーザー検索完了", {
    users: rows_("Users").filter(function (user) {
      return (
        normalize_(user.userId).indexOf(query) >= 0 ||
        normalize_(user.nickname).indexOf(query) >= 0
      );
    }),
  });
}

function addQuestion_(body) {
  const questionId =
    "q-" + String(rows_("Questions").length + 1).padStart(3, "0");
  appendRow_("Questions", [
    questionId,
    String(body.boothId || ""),
    String(body.title || ""),
    Number(body.difficulty || 1),
    Number(body.point || 1),
    String(body.questionText || ""),
    String(body.hint || ""),
    String(body.imageUrl || ""),
    String(body.correctAnswer || ""),
    JSON.stringify(Array.isArray(body.options) ? body.options : []),
    nowIso_(),
  ]);
  logAdmin_("addQuestion", questionId);
  return apiSuccess_("問題を追加しました", { questionId: questionId });
}

function editQuestion_(body) {
  const questionId = String(body.questionId || "");
  const updated = updateRowById_(
    "Questions",
    "questionId",
    questionId,
    function (row) {
      row.title = body.title !== undefined ? String(body.title) : row.title;
      row.difficulty =
        body.difficulty !== undefined
          ? Number(body.difficulty)
          : row.difficulty;
      row.point = body.point !== undefined ? Number(body.point) : row.point;
      row.questionText =
        body.questionText !== undefined
          ? String(body.questionText)
          : row.questionText;
      row.hint = body.hint !== undefined ? String(body.hint) : row.hint;
      row.imageUrl =
        body.imageUrl !== undefined ? String(body.imageUrl) : row.imageUrl;
      row.correctAnswer =
        body.correctAnswer !== undefined
          ? String(body.correctAnswer)
          : row.correctAnswer;
      row.options =
        body.options !== undefined ? JSON.stringify(body.options) : row.options;
      return row;
    },
  );
  if (!updated) return apiError_("問題が見つかりません");
  logAdmin_("editQuestion", questionId);
  return apiSuccess_("問題を更新しました", { questionId: questionId });
}

function deleteQuestion_(body) {
  const questionId = String(body.questionId || "");
  const sheet = sheet_("Questions");
  const values = sheet.getDataRange().getValues();
  const head = values[0] || [];
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][head.indexOf("questionId")]) === questionId) {
      sheet.deleteRow(i + 1);
      logAdmin_("deleteQuestion", questionId);
      return apiSuccess_("問題を削除しました", { deleted: true });
    }
  }
  return apiError_("問題が見つかりません");
}

function addBooth_(body) {
  const boothId = "b-" + String(rows_("Booths").length + 1).padStart(2, "0");
  appendRow_("Booths", [
    boothId,
    String(body.boothName || ""),
    String(body.description || ""),
    String(body.location || ""),
  ]);
  logAdmin_("addBooth", boothId);
  return apiSuccess_("模擬店を追加しました", { boothId: boothId });
}

function editBooth_(body) {
  const boothId = String(body.boothId || "");
  const updated = updateRowById_("Booths", "boothId", boothId, function (row) {
    if (body.boothName !== undefined) row.boothName = String(body.boothName);
    if (body.description !== undefined)
      row.description = String(body.description);
    if (body.location !== undefined) row.location = String(body.location);
    return row;
  });
  if (!updated) return apiError_("模擬店が見つかりません");
  logAdmin_("editBooth", boothId);
  return apiSuccess_("模擬店を更新しました", { boothId: boothId });
}

function exportCsv_() {
  return apiSuccess_("CSV を出力しました", {
    users: rows_("Users")
      .map(function (row) {
        return JSON.stringify(row);
      })
      .join("\n"),
    answers: rows_("Answers")
      .map(function (row) {
        return JSON.stringify(row);
      })
      .join("\n"),
    exchanges: rows_("Exchanges")
      .map(function (row) {
        return JSON.stringify(row);
      })
      .join("\n"),
  });
}

function logAdmin_(action, detail) {
  appendRow_("AdminLogs", [uuid_(), action, detail, nowIso_()]);
}
