var mongodb = require('./db');
var ObjectID = require('mongodb').ObjectID;

function Post(name, babyName) {
  this.name = name;
  this.babyName = babyName;
}

module.exports = Post;

//存储一篇文章及其相关信息
Post.prototype.save = function(callback) {
  var date = new Date();
  //存储各种时间格式，方便以后扩展
  var time = {
      date: date,
      year : date.getFullYear(),
      month : date.getFullYear() + "-" + (date.getMonth() + 1),
      day : date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(),
      minute : date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + 
      date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()) 
  };
  //要存入数据库的文档
  var post = {
      name: this.name,
      time: time,
      babyName: this.babyName
  };
  //打开数据库
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    //读取 posts 集合
    db.collection('posts', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      //将文档插入 posts 集合
      collection.insert(post, {
        safe: true
      }, function (err) {
        mongodb.close();
        if (err) {
          return callback(err);//失败！返回 err
        }
        callback(null);//返回 err 为 null
      });
    });
  });
};

//读取文章及其相关信息
Post.getAll = function(name, callback) {
  //打开数据库
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    //读取 posts 集合
    db.collection('posts', function(err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      var query = {};
      if (name) {
        query.name = name;
      }
      //根据 query 对象查询文章
      collection.find(query).sort({
        time: -1
      }).toArray(function (err, docs) {
        mongodb.close();
        if (err) {
          return callback(err);//失败！返回 err
        }
        callback(null, docs);//成功！以数组形式返回查询的结果
      });
    });
  });
};
//获取一篇文章
Post.getOne = function(_id, name, callback) {
  // var post = null;
  // var comment = null;
  //打开数据库
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    //读取 posts 集合
    db.collection('posts', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      //根据id进行查询
      collection.findOne({
        "_id": new ObjectID(_id),
        "name": name
      }, function (err, post) {
        // mongodb.close();
        if (err) {
          return callback(err);
        }
        //读取 comments 集合
        db.collection('comments', function(err, collection) {
          if (err) {
            mongodb.close();
            return callback(err);
          }
          var query = {};
          if (_id) {
            query.id = _id;
          }
          //根据 query 对象查询文章
          collection.find(query).sort({
            'time': -1
          }).toArray(function (err, comments) {
            mongodb.close();
            if (err) {
              return callback(err);//失败！返回 err
            }
            callback(null, post, comments);//返回查询的一篇文章，和评论数组
          });
        });
      });
    });
  });
};
//查看编辑文章
Post.edit = function(_id, name, callback) {
  //打开数据库
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    //读取 posts 集合
    db.collection('posts', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      //根据id进行查询
      collection.findOne({
        "_id": new ObjectID(_id),
        "name": name
      }, function (err, doc) {
        mongodb.close();
        if (err) {
          return callback(err);
        }
        callback(null, doc);//返回查询的一篇文章
      });
    });
  });
};
//更新一篇文章及其相关信息
Post.update = function(_id, name, babyName, callback) {
  //打开数据库
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    //读取 posts 集合
    db.collection('posts', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      //更新文章内容
      collection.update({
        "_id": new ObjectID(_id),
        "name": name
      }, {
        $set: {babyName: babyName}
      }, function (err) {
        mongodb.close();
        if (err) {
          return callback(err);
        }
        callback(null);
      });
    });
  });
};
//删除一篇文章
Post.remove = function(_id, name, callback) {
  //打开数据库
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    //读取 posts 集合
    db.collection('posts', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      //根据用户名、宝宝名查找并删除一篇文章
      collection.remove({
        "_id": new ObjectID(_id),
        "name": name
      }, {
        w: 1
      }, function (err, r) {
        mongodb.close();
        if (err) {
          return callback(err);
        }
        callback(null, r.result.n); // r是删除返回值，r.result.n=0为删除失败，1为成功
      });
    });
  });
};