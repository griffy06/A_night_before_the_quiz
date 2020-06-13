var express = require('express');
var router = express.Router();
let Course=require('../models/course');
let Post=require('../models/post');
let User=require('../models/user');
const bcrypt = require('bcryptjs');
let Comment=require('../models/comment');
const passport = require('passport');
const crypto = require('crypto');
const multer = require('multer');
const GridFsStorage = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');
const methodOverride = require('method-override');
const config = require('../config/database');
var path = require('path');
let metadata;

const storage = new GridFsStorage({
    url: config.database,
    file: (req, file) => {
        return new Promise((resolve, reject) => {
            crypto.randomBytes(16, (err, buf) => {
                if (err) {
                    return reject(err);
                }
                const filename = buf.toString('hex') + path.extname(file.originalname);
                const fileInfo = {
                    filename: filename,
                    bucketName: 'uploads',
                  //  metadata: metadata?metadata:null
                };
                resolve(fileInfo);
            });
        });
    }
});
const upload = multer({ storage });


router.get('/', ensureAuthenticated, function (req,res,next) {
    res.render('main');
})
router.get('/course/:id/view', ensureAuthenticated, function (req,res,next) {
        Post.find({course_id:req.params.id},{},function (err, post){
        if(err){
            console.log('No such entry');
            return;
        }

        else {
             Course.find({course_id:req.params.id},{},function(err1,course1) {
                    console.log(course1);
                    if (err1) {
                        console.log('No such entry');
                        return;
                    } else {
                        Course.find({sem_id:course1[0].sem_id},{},function(err2,course){
                            //console.log(course);
                            if (err2) {
                                console.log('No such entry');
                                return;
                            }
                            else{
                                global.gfs.files.find().toArray(function (err,files) {
                                    if(err) console.log(err);
                                    else
                                    {
                                        //console.log(files);
                                        res.render('posts', {files: files,post: post, course:course, current_course:req.params.id, user:req.user});
                                        return;
                                    }
                                })

                            }
                        });
                    }
                });

        }
        });
});

router.get('/course/:id/create', ensureAuthenticated, function (req,res,next) {
            Course.find({course_id:req.params.id},{},function(err1,course1){
                console.log(course1);
                if (err1) {
                    console.log('No such entry');
                    return;
                }
                else {
                    Course.find({sem_id: course1[0].sem_id}, {}, function (err1, course) {
                        console.log(course);
                        if (err1) {
                            console.log('No such entry');
                            return;
                        } else {
                            res.render('create_post', {course: course, current_course: req.params.id});
                        }
                    });
                }
            });
});

router.post('/course/:id/create', ensureAuthenticated, upload.array('files',50), function (req,res,next) {
        let p= new Post();
        p.no_of_dislikes=0;
        p.no_of_likes=0;
        p.author=req.user.name;
        p.authorid=req.user.username;
        p.no_of_comments=0;
        p.content=req.body.content;
        p.tag = req.body.tags.split(',');
        Course.find({course_id:req.params.id},{},function(err1,course1){
            if (err1) {
                console.log('No such entry');
                return;
            }
            else {
                Course.find({sem_id: course1[0].sem_id}, {}, function (err, course) {
                    if (err) {
                        console.log('No such entry');
                        return;
                    } else {
                        p.course_id=req.params.id;
                        p.sem_id=course1[0].sem_id;
                        req.files.forEach(function (fileobj) {
                          //  console.log(fileobj);
                         //   console.log('----------');
                         //   console.log(fileobj.id);
                            p.fileField.push(fileobj.id);
                        })
                      //  console.log('----------');
                      //  console.log(p.fileField);
                        p.save(function(err2){
                            if(err2){
                                console.log(err2);
                            }
                            else{

                               // console.log(req.files);
                              //  console.log('-----------------');
                              //  metadata = p._id;
                              /*  req.files.forEach(function(file){
                                    global.gfs.files.find().toArray(function (err,files) {
                                        if(err) console.log(err);
                                        else
                                        {
                                            //console.log(files);
                                            files.forEach(function (file2) {
                                                console.log(file2);
                                                if(file2.filename === file.filename)
                                                {
                                                    file2.metadata = metadata;
                                                    file2.save(function (err) {
                                                        if(err) console.log(err);
                                                    });
                                                }
                                            })
                                         //   res.render('posts', {files: files,post: post, course:course, current_course:req.params.id, user:req.user});
                                         //   return;
                                        }
                                    })

                                  /*  file.metadata = metadata;
                                    console.log("what");
                                    console.log(file.metadata);
                                    file.save(function (err) {
                                        if(err) console.log(err);
                                    });
                                })*/
                             /*   console.log('-------------');
                                console.log(p.fileField);
                                console.log('-------------');*/
                                 req.flash('success', 'Post created successfully!');
                                 return res.redirect('/main/course/'+req.params.id+'/view');
                         }
                 });
             }
         });
     }
 });
 });



router.post('/course/:id/view', ensureAuthenticated, function (req,res,next) {
    //console.log(req.body.searchBy);
    console.log('hello');
    let tags = req.body.searchBy.split(',');
    let arr=[];
    Post.find(function (err,post) {
        if(err) console.log(err);
        else
        {
            post.forEach(function (temp) {
                    tags.forEach(function (tag) {
                            if (temp.tag.indexOf(tag) !== -1) {
                                arr.push(temp);
                            }
                    })
            })
            let arrUnique = [];
            arr.forEach(function (arr_element) {
                if(arrUnique.indexOf(arr_element)===-1)
                    arrUnique.push(arr_element);
            })
          //  console.log(arrUnique);
            Course.find({course_id:req.params.id},{},function(err1,course1) {
                console.log(course1);
                if (err1) {
                    console.log('No such entry');
                    return;
                } else {
                    Course.find({sem_id:course1[0].sem_id},{},function(err2,course){
                        //console.log(course);
                        if (err2) {
                            console.log('No such entry');
                            return;
                        }
                        else{
                            res.render('posts', {post: arrUnique, course:course, current_course:req.params.id, user:req.user});
                            return;
                        }
                    });
                }
            });


        }
    })
});
router.get('/profile', ensureAuthenticated, function (req,res,next) {
        //console.log(req.user);
        res.render('showProfile',{user:req.user,viewer:'me'});
});

router.post('/editProfile', ensureAuthenticated, function (req, res, next) {
    if(req.body.name=='') {
        req.user.name = req.user.name;
    }
    else{
        var name=req.user.name;
        req.user.name = req.body.name;
        Post.find({author:name},{},function(err,post){
            console.log('this is'+post);
            if(err){
                return;
            }
            else{
                post.forEach(function (item) {
                    item.authorid=item.authorid;
                    item.author = req.body.name;
                    item.no_of_likes=item.no_of_likes;
                    item.no_of_dislikes=item.no_of_dislikes;
                    item.no_of_comments=item.no_of_comments;
                    item.content=item.content;
                    item.tag=item.tag;
                    item.save(function (err) {
                        if (err) {
                            console.log(err);
                        }
                    });
                })
            }
        })
    }

    if(req.body.email=='') {
        req.user.email = req.user.email;
    }
    else{
        req.user.email = req.body.email;
    }

    if(req.body.username=='') {
        req.user.username = req.user.username;
    }

    else{
            var username=req.user.username;
            req.user.username = req.body.username;
            console.log(req.body.username);
            Post.find({authorid:username},{},function(err,post){
                console.log('this is'+post);
                if(err){
                    return;
                }
                else{
                    post.forEach(function (item) {
                        console.log(post);
                        item.authorid= req.body.username;
                        item.author = item.author;
                        item.no_of_likes=item.no_of_likes;
                        item.no_of_dislikes=item.no_of_dislikes;
                        item.no_of_comments=item.no_of_comments;
                        item.content=item.content;
                        item.tag=item.tag;
                        item.save(function (err) {
                            if (err) {
                                console.log(err);
                            }
                        });
                    })
                }
            })
    }

    if(req.body.password=='') {
        req.user.save(function (err) {
            if (err) {
                console.log(err);
            } else {
                req.flash('success', 'Successfully Updated Profile!');
                res.redirect('/main/profile');
            }
        });
    }

    else {
        req.user.password = req.body.password;
        bcrypt.genSalt(10, function (err, salt) {
            bcrypt.hash(req.user.password, salt, function (err, hash) {
                if (err) {
                    console.log(err);
                } else {
                    req.user.password = hash;
                    req.user.save(function (err) {
                        if (err) {
                            console.log(err);
                        } else {
                            req.flash('success', 'Successfully Updated Profile!');
                            res.redirect('/main/profile');
                        }
                    });
                }
            });
        });
    }
})

router.get('/:id', ensureAuthenticated, function (req,res,next) {
    Course.find({sem_id:req.params.id},{}, function (err, course) {
        if (err) {
            console.log('No such entry');
            return;
        } else {
            //console.log(course);
            res.render('courses', {course: course, sem:req.params.id});
        }
    });
});


router.get('/profile/myposts', ensureAuthenticated, function (req,res,next) {
    //console.log(req.user.username);
    Post.find({authorid:req.user.username},{},function(err,post){
        console.log(post);
        if(err){
            return;
        }
        else{
            res.render('showMyPosts',{user:req.user,post:post,title:'My Posts',viewer:'me'});
            return;
        }
    })
});
router.get('/profile/myposts/:id/edit', ensureAuthenticated, function (req,res,next) {
    //console.log(req.user.username);
    Post.findById(req.params.id,{},function(err,post){
        console.log(post);
        if(err){
            return;
        }
        else{
            res.render('editPost',{post:post,title:'Edit Post'});
            return;
        }
    })
});
router.post('/profile/myposts/:id/edit', ensureAuthenticated, function (req,res,next) {
    //console.log(req.user.username);
    Post.findById(req.params.id,{},function(err,post){
        post.content=req.body.content;
        post.tag=req.body.tags;
        if(err){
            return;
        }
        else{
            post.save(function(e){
                if(e){
                    console.log(e);
                }
                res.redirect('/main/profile/myposts');
                return;
            })
        }
    })
});
router.get('/profile/myposts/:id/delete', ensureAuthenticated, function (req,res,next) {
    //console.log(req.user.username);
    Post.remove({_id:req.params.id},function(err){
        if(err){
            console.log(err);
            return;
        }
        else{
            let user=req.user;
            user.posts_bookmarked.splice(user.posts_bookmarked.indexOf(req.params.id),1);
            user.posts_liked.splice(user.posts_liked.indexOf(req.params.id),1);
            user.posts_disliked.splice(user.posts_disliked.indexOf(req.params.id),1);
            User.update({_id:req.user._id},user,function(err){
                if (err) {
                    console.log(err);
                } else {
                    res.redirect('/main/profile/myposts');
                    return;
                }
            })
        }
    })

});
router.get('/:id/like', ensureAuthenticated, function (req,res,next) {
    let user=req.user;
    Post.findById(req.params.id,function(err,post) {
        if (user.posts_liked.indexOf(req.params.id) === -1)
        {
            post.no_of_likes = post.no_of_likes + 1;
            user.posts_liked.push(req.params.id);
        }

        if (user.posts_disliked.indexOf(req.params.id) !== -1)
        {
                post.no_of_dislikes = post.no_of_dislikes - 1;
                user.posts_disliked.splice(user.posts_disliked.indexOf(req.params.id),1);
        }

        User.update({_id:req.user._id},user,function(e){
            if (err) {
                console.log(err);
            } else {
                Post.update({_id: req.params.id}, post, function (err) {
                    if (err) {
                        console.log(err);
                    } else {
                        res.redirect('/main/course/' + post.course_id + '/view');
                    }
                })
            }
        })

    })
});

router.get('/:id/dislike', ensureAuthenticated, function (req,res,next) {
    let user=req.user;
    Post.findById(req.params.id,function(err,post) {
        if (user.posts_disliked.indexOf(req.params.id) === -1)
        {
            post.no_of_dislikes = post.no_of_dislikes + 1;
            user.posts_disliked.push(req.params.id);
        }

        if (user.posts_liked.indexOf(req.params.id) !== -1)
        {
            post.no_of_likes = post.no_of_likes - 1;
            user.posts_liked.splice(user.posts_liked.indexOf(req.params.id),1);
        }

        User.update({_id:req.user._id},user,function(e){
            if (err) {
                console.log(err);
            } else {
                Post.update({_id: req.params.id}, post, function (err) {
                    if (err) {
                        console.log(err);
                    } else {
                        res.redirect('/main/course/' + post.course_id + '/view');
                    }
                })
            }
        })

    })
})
router.get('/:id/bookmark', ensureAuthenticated, function (req,res,next) {
    let user=req.user;
    Post.findById(req.params.id,function(err,post) {
        if (user.posts_bookmarked.indexOf(req.params.id) === -1)
        {
            console.log('here');
            user.posts_bookmarked.push(req.params.id);
        }

        else
        {
            user.posts_bookmarked.splice(user.posts_bookmarked.indexOf(req.params.id),1);
        }
        User.update({_id:req.user._id},user,function(e){
            if (err) {
                console.log(err);
            } else {
                Post.update({_id: req.params.id}, post, function (err) {
                    if (err) {
                        console.log(err);
                    } else {
                        res.redirect('/main/course/' + post.course_id + '/view');
                    }
                })
            }
        })

    })
});
router.get('/profile/bookmarks', ensureAuthenticated, function (req,res) {
    //console.log(req.user.username);
    var arr=[];
    Post.find(function(err,post){
        post.forEach(function(item){
            req.user.posts_bookmarked.forEach(function(item1){
                    if(item1==item._id)
                    arr.push(item);
                })
            })
        res.render('showMyPosts',{user:req.user,viewer:'me',post:arr,title:'Favourite Posts'});
        return;
        })
});

router.get('/profile/bookmarks/:id/delete', ensureAuthenticated, function (req,res) {
    let user=req.user;
    user.posts_bookmarked.splice(user.posts_bookmarked.indexOf(req.params.id),1);
    User.update({_id:req.user._id},user,function(err){
        if (err) {
            console.log(err);
        } else {
            res.redirect('/main/profile/bookmarks');
        }
    })
});

router.get('/:id/viewAuthor', ensureAuthenticated, function (req,res) {
    User.find({username:req.params.id},function (err,user) {
        if(err)
        {
            console.log(err);
        }
        else {
            res.render('showProfile',{user:user[0], viewer:'other'});
        }
    })
});

router.get('/:id/AllPosts', ensureAuthenticated, function (req,res) {
    User.find({username:req.params.id},function (err,user) {
        if(err)
        {
            console.log(err);
        }
        else {
            Post.find({authorid:user[0].username},{},function(err,post){
                console.log(post);
                if(err){
                    return;
                }
                else{
                    res.render('showMyPosts',{user:user[0],post:post,title:'All Posts by '+user[0].name,viewer:'other'});
                    return;
                }
            })
        }
    })
});
router.get('/:id/comments', ensureAuthenticated, function (req,res) {
    Comment.find({post_id: req.params.id},{},function(err,comments){
        //console.log(comments);
        Post.find({_id:req.params.id},{},function(err,post){
            res.render('comments',{courseid:post[0].course_id,postid:req.params.id,user:req.user,comments:comments});
        })
    })
});

router.post('/:id/post', ensureAuthenticated, function (req,res) {
    let c=new Comment();
    c.post_id=req.params.id;
    c.no_of_likes=0;
    c.no_of_dislikes=0;
    c.authorid=req.user.username;
    c.author=req.user.name;
    c.content=req.body.content;
    Post.find({_id:req.params.id},{},function(err,post) {
        if (err) {
            console.log(err)
        } else {
            post[0].no_of_comments += 1;
            post[0].save(function (err1) {
                if (err1) {
                    console.log(err1);
                } else {
                    c.save(function (err2) {
                        if (err2) {
                            console.log(err2);
                        } else {
                            res.redirect('/main/' + req.params.id + '/comments');
                        }
                    })
                }
            })
        }
    })

});

router.get('/:id/commentLike', ensureAuthenticated, function (req,res,next) {
    let user=req.user;
    Comment.findById(req.params.id,function(err,post) {
        if (user.comments_liked.indexOf(req.params.id) === -1)
        {
            post.no_of_likes = post.no_of_likes + 1;
            user.comments_liked.push(req.params.id);
        }

        if (user.comments_disliked.indexOf(req.params.id) !== -1)
        {
            post.no_of_dislikes = post.no_of_dislikes - 1;
            user.comments_disliked.splice(user.comments_disliked.indexOf(req.params.id),1);
        }

        User.update({_id:req.user._id},user,function(e){
            if (e) {
                console.log(e);
            } else {
                Comment.update({_id: req.params.id}, post, function (err1) {
                    if (err1) {
                        console.log(err1);
                    } else {
                        res.redirect('/main/' + post.post_id + '/comments');
                    }
                })
            }
        })
    })
});

router.get('/:id/commentDislike', ensureAuthenticated, function (req,res,next) {
    let user=req.user;
    Comment.findById(req.params.id,function(err,post) {
        if (user.comments_disliked.indexOf(req.params.id) === -1)
        {
            post.no_of_dislikes = post.no_of_dislikes + 1;
            user.comments_disliked.push(req.params.id);
        }

        if (user.comments_liked.indexOf(req.params.id) !== -1)
        {
            post.no_of_likes = post.no_of_likes - 1;
            user.comments_liked.splice(user.comments_liked.indexOf(req.params.id),1);
        }

        User.update({_id:req.user._id},user,function(e){
            if (err) {
                console.log(err);
            } else {
                Comment.update({_id: req.params.id}, post, function (err) {
                    if (err) {
                        console.log(err);
                    } else {
                        res.redirect('/main/' + post.post_id + '/comments');
                    }
                })
            }
        })

    })
})
function ensureAuthenticated(req,res,next)
{
    if(req.isAuthenticated()) {
        return next();
    }
    else {
        req.flash('danger','Not logged in!');
        res.redirect('/login');
    }
}

router.get('/image/:filename', function (req,res) {
    gfs.files.findOne({filename: req.params.filename}, function (err,file) {
        if(!file || file.length===0){
            return res.status(404).json({
                err:'No file exists'
            })
        }

        //check if image
        if(file.contentType==='image/jpeg' || file.contentType==='image/jpg' || file.contentType==='image/png')
        {
            //read output to browser
            const readStream = gfs.createReadStream(file.filename);
            readStream.pipe(res);
        }
        else
        {
            return res.status(404).json({
                err:'Not an image'
            })
        }
    })


})

router.get('/video/:filename', function (req,res) {
    gfs.files.findOne({filename: req.params.filename}, function (err,file) {
        if(!file || file.length===0){
            return res.status(404).json({
                err:'No file exists'
            })
        }

        //check if image
        if(file.contentType==='video/mp4' || file.contentType==='video/ogg' || file.contentType==='video/webm')
        {
            //read output to browser
            const readStream = gfs.createReadStream(file.filename);
            readStream.pipe(res);
        }
        else
        {
            return res.status(404).json({
                err:'Not a video'
            })
        }
    })


})

module.exports = router;