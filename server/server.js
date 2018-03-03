// database is let instead of const to allow us to modify it in test.js
let database = {
  users: {},
  articles: {},
  nextArticleId: 1,
  comments: {},
  nextCommentId: 1
};


//write code here for the needed routes
const routes = {
  '/users': {
    'POST': getOrCreateUser
  },
  '/users/:username': {
    'GET': getUser
  },
  '/articles': {
    'GET': getArticles,
    'POST': createArticle
  },
  '/articles/:id': {
    'GET': getArticle,
    'PUT': updateArticle,
    'DELETE': deleteArticle
  },
  '/articles/:id/upvote': {
    'PUT': upvoteArticle
  },
  '/articles/:id/downvote': {
    'PUT': downvoteArticle
  },
  '/comments': {
    'POST': postComment
  },
  '/comments/:id': {
    'PUT': putCommentId,
    'DELETE': deleteCommentId
  },
  '/comments/:id/upvote': {
    'PUT': upvoteComment
  },
  '/comments/:id/downvote': {
    'PUT': downvoteComment
  }
};

/*Receives comment information from comment property of request body
Creates new comment and adds it to database, returns a 201 response with comment on comment property of response body
If body isn't supplied, user with supplied username doesn't exist, or article with supplied article ID doesn't exist, returns a 400 response
*/

const ppObject = obj => JSON.stringify(obj, null, 2);

function postComment(url, request) {

//console.log(`>>> POST COMMENT: ${ppObject(request)}`);

const response = {};

  if (!request.body || !request.body.comment) {
    response.status = 400;
  } else {

  const reqComment = request.body.comment;
  const reqUser = reqComment.username;
  const existUser = database.users[reqUser];
  const commentBody = reqComment.body;
  const article = reqComment.articleId;
  const existArticle = database.articles[article];
//console.log(`>>> var = ${reqUser}`);

  if (!commentBody || !existUser || !existArticle) {
    //console.log(`>>> Missing Field - returning 400`);
    response.status = 400;
  } else {
    //console.log(`>>> got fields - building response`);
    const comment = {
      id: database.nextCommentId++,
      body: commentBody,
      username: reqUser,
      articleId: article,
      upvotedBy: [],
      downvotedBy: []
    }

    database.comments[comment.id] = comment;
    database.articles[article].commentIds.push(comment.id);
    database.users[reqUser].commentIds.push(comment.id);

    response.body = {comment: comment};
    response.status = 201;
  }
}
  //console.log(`>>> Returning this response: ${ppObject(response)}`);
  //console.log(`>>> var = ${reqUser}`);
  return response;
  //, existUser, useComment, article, existArticle, response);
};

/*
  PUT
      Receives comment ID from URL parameter and updated comment from comment property of request body
      Updates body of corresponding comment in database, returns a 200 response with the updated comment on comment property of the response body
      If comment with given ID does not exist, returns 404 response
      If no ID or updated comment is supplied, returns 200 response
*/
function putCommentId(url, request) {

//console.log(`>>> PUT COMMENT: ${ppObject(request)}`);
  const response = {};

  if (!request.body || !request.body.comment) {
    response.status = 400;
  } else {

  const reqCommentId = Number(url.split('/').filter(segment => segment)[1]);
  const savedComment = database.comments[reqCommentId];
  const reqComment = request.body.comment;
  const updatedComm  = reqComment.body;


    if (!savedComment) {
      response.status = 404;
      console.log('yes');
    } else if (!reqCommentId || !updatedComm) {
      console.log('no');
      response.status = 400;
    } else {
      console.log('else');
      savedComment.body = updatedComm;

      response.body = updatedComm;
      response.status = 200;
    }
  }
    return response;
};

/*
  DELETE
      Receives comment ID from URL parameter
      Deletes comment from database and removes all references to its ID from corresponding user and article models, returns 204 response
      If no ID is supplied or comment with supplied ID doesn't exist, returns 400 response
      */

function deleteCommentId(url, request) {

  //console.log(`>>> DELETE COMMENT: ${ppObject(url)}`);

  const reqCommentId = Number(url.split('/').filter(segment => segment)[1]);
  const savedComment = database.comments[reqCommentId];
  const articleId = savedComment.articleId;
  const articleComment = database.articles[articleId];
  const userId = savedComment.username;
  const response = {};

  if(!reqCommentId || !savedComment || !userId || !articleComment || !articleId) {
    response.status = 404;
  } else {
    database.comments[reqCommentId] = null;
    const deleteArticle = database.articles[articleId].commentIds;
    deleteArticle.splice(deleteArticle.indexOf(reqCommentId), 1);
    const deleteUser = database.users[userId].commentIds
    deleteUser.splice(deleteUser.indexOf(reqCommentId), 1);
    response.status = 204;
  }

  return response;

};

/*
PUT
    Receives comment ID from URL parameter and username from username property of request body
    Adds supplied username to upvotedBy of corresponding comment if user hasn't already upvoted the comment, removes username from downvotedBy if that user had previously
    downvoted the comment,
    returns 200 response with comment on comment property of response body
    If no ID is supplied, comment with supplied ID doesn't exist, or user with supplied username doesn't exist, returns 400 response
*/

function upvoteComment(url, request) {

//console.log(`>>> UPVOTE COMMENT: ${ppObject(request)}`);
//console.log(`>>> UPVOTE COMMENT: ${ppObject(url)}`);

  response = {};

  if (!request.body || !request.body.username) {
    response.status = 400;
    return response;
  } else {

  const commentId = Number(url.split('/').filter(segment => segment)[1]);
  const user = request.body.username;
  const existUser = database.users[user];
  const savedComment = database.comments[commentId];

  if(!savedComment || !existUser || !user || !commentId) {
    response.status = 400;
  } else {
    upvote(savedComment, user);
    response.status = 200;
    response.body = {comment: savedComment};
    console.log(savedComment + ' ' + user);
  }
    return response;
  }
};

/*
PUT
    Receives comment ID from URL parameter and username from username property of request body
    Adds supplied username to downvotedBy of corresponding comment if user hasn't already downvoted the comment, remove username from upvotedBy if that user had previously upvoted the comment,
    returns 200 response with comment on comment property of response body
    If no ID is supplied, comment with supplied ID doesn't exist, or user with supplied username doesn't exist, returns 400 response
*/

function downvoteComment(url, request) {

  response = {};

  if (!request.body) {
    response.status = 400;
  } else {

  const id = Number(url.split('/').filter(segment => segment)[1]);
  const user = request.body.username;
  const existUser = database.users[user];
  const savedComment = database.comments[id];

  if (!id || !savedComment || !existUser) {
    response.status = 400;
    } else {
      downvote(savedComment, user);
      response.status = 200;
      response.body = {comment: savedComment};
    }
  }
  return response;
};
/*
function upvote(item, username) {
  if (item.downvotedBy.includes(username)) {
    item.downvotedBy.splice(item.downvotedBy.indexOf(username), 1);
  }
  if (!item.upvotedBy.includes(username)) {
    item.upvotedBy.push(username);
  }
  return item;
}
*/
//added code are all above this line

function getUser(url, request) {
  const username = url.split('/').filter(segment => segment)[1];
  const user = database.users[username];
  const response = {};

  if (user) {
    const userArticles = user.articleIds.map(
        articleId => database.articles[articleId]);
    const userComments = user.commentIds.map(
        commentId => database.comments[commentId]);
    response.body = {
      user: user,
      userArticles: userArticles,
      userComments: userComments
    };
    response.status = 200;
  } else if (username) {
    response.status = 404;
  } else {
    response.status = 400;
  }

  return response;
}

function getOrCreateUser(url, request) {
  const username = request.body && request.body.username;
  const response = {};

  if (database.users[username]) {
    response.body = {user: database.users[username]};
    response.status = 200;
  } else if (username) {
    const user = {
      username: username,
      articleIds: [],
      commentIds: []
    };
    database.users[username] = user;

    response.body = {user: user};
    response.status = 201;
  } else {
    response.status = 400;
  }

  return response;
}

function getArticles(url, request) {
  const response = {};

  response.status = 200;
  response.body = {
    articles: Object.keys(database.articles)
        .map(articleId => database.articles[articleId])
        .filter(article => article)
        .sort((article1, article2) => article2.id - article1.id)
  };

  return response;
}

function getArticle(url, request) {
  const id = Number(url.split('/').filter(segment => segment)[1]);
  const article = database.articles[id];
  const response = {};

  if (article) {
    article.comments = article.commentIds.map(
      commentId => database.comments[commentId]);

    response.body = {article: article};
    response.status = 200;
  } else if (id) {
    response.status = 404;
  } else {
    response.status = 400;
  }

  return response;
}

function createArticle(url, request) {
  const requestArticle = request.body && request.body.article;
  const response = {};

  if (requestArticle && requestArticle.title && requestArticle.url &&
      requestArticle.username && database.users[requestArticle.username]) {
    const article = {
      id: database.nextArticleId++,
      title: requestArticle.title,
      url: requestArticle.url,
      username: requestArticle.username,
      commentIds: [],
      upvotedBy: [],
      downvotedBy: []
    };

    database.articles[article.id] = article;
    database.users[article.username].articleIds.push(article.id);

    response.body = {article: article};
    response.status = 201;
  } else {
    response.status = 400;
  }

  return response;
}

function updateArticle(url, request) {
  const id = Number(url.split('/').filter(segment => segment)[1]);
  const savedArticle = database.articles[id];
  const requestArticle = request.body && request.body.article;
  const response = {};

  if (!id || !requestArticle) {
    response.status = 400;
  } else if (!savedArticle) {
    response.status = 404;
  } else {
    savedArticle.title = requestArticle.title || savedArticle.title;
    savedArticle.url = requestArticle.url || savedArticle.url;

    response.body = {article: savedArticle};
    response.status = 200;
  }

  return response;
}

function deleteArticle(url, request) {
  const id = Number(url.split('/').filter(segment => segment)[1]);
  const savedArticle = database.articles[id];
  const response = {};

  if (savedArticle) {
    database.articles[id] = null;
    savedArticle.commentIds.forEach(commentId => {
      const comment = database.comments[commentId];
      database.comments[commentId] = null;
      const userCommentIds = database.users[comment.username].commentIds;
      userCommentIds.splice(userCommentIds.indexOf(id), 1);
    });
    const userArticleIds = database.users[savedArticle.username].articleIds;
    userArticleIds.splice(userArticleIds.indexOf(id), 1);
    response.status = 204;
  } else {
    response.status = 400;
  }

  return response;
}

function upvoteArticle(url, request) {
  const id = Number(url.split('/').filter(segment => segment)[1]);
  const username = request.body && request.body.username;
  let savedArticle = database.articles[id];
  const response = {};

  if (savedArticle && database.users[username]) {
    savedArticle = upvote(savedArticle, username);

    response.body = {article: savedArticle};
    response.status = 200;
  } else {
    response.status = 400;
  }

  return response;
}

function downvoteArticle(url, request) {
  const id = Number(url.split('/').filter(segment => segment)[1]);
  const username = request.body && request.body.username;
  let savedArticle = database.articles[id];
  const response = {};

  if (savedArticle && database.users[username]) {
    savedArticle = downvote(savedArticle, username);

    response.body = {article: savedArticle};
    response.status = 200;
  } else {
    response.status = 400;
  }

  return response;
}

function upvote(item, username) {
  if (item.downvotedBy.includes(username)) {
    item.downvotedBy.splice(item.downvotedBy.indexOf(username), 1);
  }
  if (!item.upvotedBy.includes(username)) {
    item.upvotedBy.push(username);
  }
  return item;
}

function downvote(item, username) {
  if (item.upvotedBy.includes(username)) {
    item.upvotedBy.splice(item.upvotedBy.indexOf(username), 1);
  }
  if (!item.downvotedBy.includes(username)) {
    item.downvotedBy.push(username);
  }
  return item;
}

// Write all code above this line.

const http = require('http');
const url = require('url');

const port = process.env.PORT || 4000;
const isTestMode = process.env.IS_TEST_MODE;

const requestHandler = (request, response) => {
  const url = request.url;
  const method = request.method;
  const route = getRequestRoute(url);

  if (method === 'OPTIONS') {
    var headers = {};
    headers["Access-Control-Allow-Origin"] = "*";
    headers["Access-Control-Allow-Methods"] = "POST, GET, PUT, DELETE, OPTIONS";
    headers["Access-Control-Allow-Credentials"] = false;
    headers["Access-Control-Max-Age"] = '86400'; // 24 hours
    headers["Access-Control-Allow-Headers"] = "X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept";
    response.writeHead(200, headers);
    return response.end();
  }

  response.setHeader('Access-Control-Allow-Origin', null);
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.setHeader(
      'Access-Control-Allow-Headers', 'X-Requested-With,content-type');

  if (!routes[route] || !routes[route][method]) {
    response.statusCode = 400;
    return response.end();
  }

  if (method === 'GET' || method === 'DELETE') {
    const methodResponse = routes[route][method].call(null, url);
    !isTestMode && (typeof saveDatabase === 'function') && saveDatabase();

    response.statusCode = methodResponse.status;
    response.end(JSON.stringify(methodResponse.body) || '');
  } else {
    let body = [];
    request.on('data', (chunk) => {
      body.push(chunk);
    }).on('end', () => {
      body = JSON.parse(Buffer.concat(body).toString());
      const jsonRequest = {body: body};
      const methodResponse = routes[route][method].call(null, url, jsonRequest);
      !isTestMode && (typeof saveDatabase === 'function') && saveDatabase();

      response.statusCode = methodResponse.status;
      response.end(JSON.stringify(methodResponse.body) || '');
    });
  }
};

const getRequestRoute = (url) => {
  const pathSegments = url.split('/').filter(segment => segment);

  if (pathSegments.length === 1) {
    return `/${pathSegments[0]}`;
  } else if (pathSegments[2] === 'upvote' || pathSegments[2] === 'downvote') {
    return `/${pathSegments[0]}/:id/${pathSegments[2]}`;
  } else if (pathSegments[0] === 'users') {
    return `/${pathSegments[0]}/:username`;
  } else {
    return `/${pathSegments[0]}/:id`;
  }
}

if (typeof loadDatabase === 'function' && !isTestMode) {
  const savedDatabase = loadDatabase();
  if (savedDatabase) {
    for (key in database) {
      database[key] = savedDatabase[key] || database[key];
    }
  }
}

const server = http.createServer(requestHandler);

server.listen(port, (err) => {
  if (err) {
    return console.log('Server did not start succesfully: ', err);
  }

  console.log(`Server is listening on ${port}`);
});
