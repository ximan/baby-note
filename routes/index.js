var crypto = require('crypto'),
    User = require('../models/user.js'),
    Post = require('../models/post.js'),
    Comment = require('../models/comment.js');

module.exports = function(app) {
    // 首页
    app.get('/', function (req, res) {
        var name = null;
        if(req.session.user !== null && req.session.user !== undefined){
            name = req.session.user.name;
        }
        Post.getAll(name, function (err, babyList) {
            if (err) {
                babyList = [];
            } 
            res.render('index', {
                title: '主页',
                user: req.session.user,
                babyList: babyList,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });

    // 注册
    app.get('/reg', checkNotLogin);
    app.get('/reg', function (req, res) {
        res.render('reg', {
            title: '注册',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
    app.post('/reg', checkNotLogin);
    app.post('/reg', function (req, res) {
        var name = req.body.name,
            password = req.body.password,
            password_re = req.body['password-repeat'];
        //检验用户两次输入的密码是否一致
        if (password_re != password) {
            req.flash('error', '两次输入的密码不一致!'); 
            return res.redirect('/reg');//返回注册页
        }
        //生成密码的 md5 值
        var md5 = crypto.createHash('md5'),
            password = md5.update(req.body.password).digest('hex');
        var newUser = new User({
            email: req.body.email,
            name: name,
            password: password
        });
        //检查email是否已经存在 
        User.get(newUser.email, function (err, user) {
            if (err) {
              req.flash('error', err);
              return res.redirect('/');
            }
            if (user) {
                req.flash('error', 'email存在!');
                return res.redirect('/reg');//返回注册页
            }else{
                //如果不存在则新增用户
                newUser.save(function (err, user) {
                  if (err) {
                    req.flash('error', err);
                    return res.redirect('/reg');//注册失败返回主册页
                  }
                  req.session.user = user;//用户信息存入 session
                  req.flash('success', '注册成功!');
                  res.redirect('/');//注册成功后返回主页
                });
            }
        });
    });

    // 登录
    app.get('/login', checkNotLogin);
    app.get('/login', function (req, res) {
        res.render('login', {
            title: '登录',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()});
    });
    app.post('/login', checkNotLogin);
    app.post('/login', function (req, res) {
        //生成密码的 md5 值
        var md5 = crypto.createHash('md5'),
          password = md5.update(req.body.password).digest('hex');
        //检查用户是否存在
        User.get(req.body.email, function (err, user) {
            if (!user) {
              req.flash('error', 'email不存在!'); 
              return res.redirect('/login');//用户不存在则跳转到登录页
            }
            //检查密码是否一致
            if (user.password != password) {
              req.flash('error', '密码错误!'); 
              return res.redirect('/login');//密码错误则跳转到登录页
            }
            //用户名密码都匹配后，将用户信息存入 session
            req.session.user = user;
            req.flash('success', '登陆成功！欢迎：'+user.name);
            res.redirect('/');//登陆成功后跳转到主页
        });
    });

    // 登出
    app.get('/logout', checkLogin);
    app.get('/logout', function (req, res) {
        req.session.user = null;
        req.flash('success', '登出成功!');
        res.redirect('/');//登出成功后跳转到主页
    });

    // 新增宝宝
    app.get('/post', checkLogin);
    app.get('/post', function (req, res) {
        res.render('post', {
            title: '新增宝宝',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
    app.post('/post', checkLogin);
    app.post('/post', function (req, res) {
        var currentUser = req.session.user,
        post = new Post(currentUser.name, req.body['baby-name']);
        post.save(function (err) {
            if (err) {
                req.flash('error', err); 
                return res.redirect('/');
            }
            req.flash('success', '新增宝宝成功!');
            res.redirect('/');//发表成功跳转到主页
        });
    });

    // 宝宝详情页
    app.get('/article/:_id', function (req, res) {
        var date = new Date();
        var d = date.getFullYear() + "-" + ((date.getMonth() + 1) < 10 ? '0' + (date.getMonth() + 1) : (date.getMonth() + 1)) + "-" + (date.getDate() < 10 ? '0' + date.getDate() : date.getDate());
        var time = (date.getHours() < 10 ? '0' + date.getHours() : date.getHours()) + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes());
        var name = null;
        if(req.session.user !== null && req.session.user !== undefined){
            name = req.session.user.name;
        }
        Post.getOne(req.params._id, name, function (err, post, comments) {
            if (err) {
                req.flash('error', err); 
                return res.redirect('/');
            }
            if(post === null){
                req.flash('error', '那是人家的宝宝');
                return res.redirect('/');
            }
            res.render('article', {
                title: post.babyName + '的主页',
                post: post,
                comments: comments,
                date: d,
                time: time,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });

    // 增加评论
    app.post('/article/:_id', function (req, res) {
        var date = req.body.date;
        var time = req.body.time;
        var datetime = date + ' ' + time;
        console.log('datetime:'+datetime);
        var newComment = new Comment(req.params._id, req.session.user.name, datetime, req.body.content);
        newComment.save(function (err) {
            if (err) {
                req.flash('error', err); 
                return res.redirect('back');
            }
            req.flash('success', '添加成功!');
            res.redirect('back');
        });
    });

    // 编辑详情页
    app.get('/edit/:_id', checkLogin);
    app.get('/edit/:_id', function (req, res) {
        Post.edit(req.params._id, req.session.user.name, function (err, post) {
            if (err) {
                req.flash('error', err); 
                return res.redirect('back');
            }
            if(post === null){
                req.flash('error', '那是人家的宝宝');
                return res.redirect('/');
            }
            res.render('edit', {
                title: '编辑',
                post: post,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });
    app.post('/edit/:_id', checkLogin);
    app.post('/edit/:_id', function (req, res) {
        Post.update(req.params._id, req.session.user.name, req.body['baby-name'], function (err) {
            var url = encodeURI('/article/' + req.params._id);
            if (err) {
                req.flash('error', err); 
                return res.redirect(url);//出错！返回文章页
            }
            req.flash('success', '修改成功!');
            res.redirect(url);//成功！返回文章页
        });
    });

    // 删除详情页
    app.get('/remove/:_id', checkLogin);
    app.get('/remove/:_id', function (req, res) {
        Post.remove(req.params._id, req.session.user.name, function (err, state) {
            if (err) {
                req.flash('error', err); 
                return res.redirect('back');
            }
            if(state === 0){
                req.flash('error', '删除失败!');
            }else if(state === 1){
                req.flash('success', '删除成功!');
            }
            res.redirect('back');
        });
    });

    // 编辑评论
    app.get('/editComment/:_id', checkLogin);
    app.get('/editComment/:_id', function (req, res) {
        Comment.edit(req.params._id, req.session.user.name, function (err, comment) {
            var date = 0;
            var time = 0;
            if (err) {
                req.flash('error', err); 
                return res.redirect('back');
            }
            if(comment === null){
                req.flash('error', '那是人家的宝宝');
                return res.redirect('back');
            }else{
                var arr = comment.time.split(' ');
                date = arr[0];
                time = arr[1];
            }
            res.render('editComment', {
                title: '编辑',
                comment: comment,
                date: date,
                time: time,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });
    app.post('/editComment/:_id', checkLogin);
    app.post('/editComment/:_id', function (req, res) {
        var date = req.body.date;
        var time = req.body.time;
        var datetime = date + ' ' + time;
        Comment.update(req.params._id, req.session.user.name, datetime, req.body.content, function (err) {
            var url = encodeURI('/article/' + req.session.user._id);
            if (err) {
                req.flash('error', err); 
                return res.redirect('back');//出错！返回文章页
            }
            req.flash('success', '修改成功!');
            res.redirect('back');//成功！返回文章页
        });
    });

    // 删除评论
    app.get('/removeComment/:_id', checkLogin);
    app.get('/removeComment/:_id', function (req, res) {
        console.log(req.params._id);
        Comment.remove(req.params._id, req.session.user.name, function (err, state) {
            if (err) {
                req.flash('error', err); 
                return res.redirect('back');
            }
            if(state === 0){
                req.flash('error', '删除失败!');
            }else if(state === 1){
                req.flash('success', '删除成功!');
            }
            res.redirect('back');
        });
    });

    // 404
    app.use(function (req, res) {
        res.render("404");
    });

    // 权限控制
    function checkLogin(req, res, next) {
        if (!req.session.user) {
        req.flash('error', '未登录!'); 
            res.redirect('/login');
        }
        next();
    }
    function checkNotLogin(req, res, next) {
        if (req.session.user) {
            req.flash('error', '已登录!'); 
            res.redirect('back');//返回之前的页面
        }
        next();
    }
};