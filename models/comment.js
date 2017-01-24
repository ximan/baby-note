var mongodb = require('./db');
var ObjectID = require('mongodb').ObjectID;

function Comment(_id, name, time, content) {
  this._id = _id;
  this.name = name;
  this.time = time;
  this.content = content;
}

module.exports = Comment;

//存储一条留言信息
Comment.prototype.save = function(callback) {
    //要存入数据库的文档
    var comments = {
      id: this._id,
      name: this.name,
      time: this.time,
      content: this.content
    };
  //打开数据库
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    //读取 comments 集合
    db.collection('comments', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      //将文档插入 comments 集合
      collection.insert(comments, {
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
//查看编辑留言
Comment.edit = function(_id, name, callback) {
  //打开数据库
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    //读取 comments 集合
    db.collection('comments', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      //根据id进行查询
      collection.findOne({
        "_id": new ObjectID(_id),
        "name": name
      }, function (err, comment) {
        mongodb.close();
        if (err) {
          return callback(err);
        }
        callback(null, comment);
      });
    });
  });
};
//更新留言
Comment.update = function(_id, name, time, content, callback) {
  //打开数据库
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    //读取 comments 集合
    db.collection('comments', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      //更新文章内容
      collection.update({
        "_id": new ObjectID(_id),
        "name": name
      }, {
        $set: {
            time: time,
            content: content
        }
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
//删除留言
Comment.remove = function(_id, name, callback) {
  //打开数据库
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    //读取 comments 集合
    db.collection('comments', function (err, collection) {
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