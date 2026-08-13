// const postService = require('../services/postService');

// async function createPost(req, res, next) {
//   try {
//     const post = await postService.createPost(req.companyId, req.user.id, req.body);
//     res.status(201).json({ success: true, data: post });
//   } catch (error) {
//     next(error);
//   }
// }

// async function getPosts(req, res, next) {
//   try {
//     const result = await postService.getPosts(req.companyId, req.query);
//     res.json({ success: true, ...result });
//   } catch (error) {
//     next(error);
//   }
// }

// async function getPost(req, res, next) {
//   try {
//     const post = await postService.getPost(req.params.id, req.companyId);
//     res.json({ success: true, data: post });
//   } catch (error) {
//     next(error);
//   }
// }

// async function updatePost(req, res, next) {
//   try {
//     const post = await postService.updatePost(req.params.id, req.companyId, req.body, req.user.id);
//     res.json({ success: true, data: post });
//   } catch (error) {
//     next(error);
//   }
// }

// async function deletePost(req, res, next) {
//   try {
//     await postService.deletePost(req.params.id, req.companyId, req.user.id);
//     res.json({ success: true, message: 'Post deleted successfully' });
//   } catch (error) {
//     next(error);
//   }
// }

// async function submitForApproval(req, res, next) {
//   try {
//     await postService.submitForApproval(req.params.id, req.companyId, req.user.id);
//     res.json({ success: true, message: 'Post submitted for approval' });
//   } catch (error) {
//     next(error);
//   }
// }

// async function approvePost(req, res, next) {
//   try {
//     await postService.approvePost(req.params.id, req.companyId, req.user.id);
//     res.json({ success: true, message: 'Post approved' });
//   } catch (error) {
//     next(error);
//   }
// }

// async function rejectPost(req, res, next) {
//   try {
//     await postService.rejectPost(req.params.id, req.companyId, req.user.id);
//     res.json({ success: true, message: 'Post rejected' });
//   } catch (error) {
//     next(error);
//   }
// }

// module.exports = {
//   createPost,
//   getPosts,
//   getPost,
//   updatePost,
//   deletePost,
//   submitForApproval,
//   approvePost,
//   rejectPost,
// };


const postService = require('../services/postService');

async function createPost(req, res, next) {
  try {
    const result = await postService.createPost(req.user.id, req.body);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

async function getPosts(req, res, next) {
  try {
    const result = await postService.getPosts(req.companyId, req.query);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

async function getPost(req, res, next) {
  try {
    const post = await postService.getPost(req.params.id, req.companyId);
    res.json({ success: true, data: post });
  } catch (error) {
    next(error);
  }
}

async function updatePost(req, res, next) {
  try {
    const post = await postService.updatePost(req.params.id, req.companyId, req.body, req.user.id);
    res.json({ success: true, data: post });
  } catch (error) {
    next(error);
  }
}

async function deletePost(req, res, next) {
  try {
    await postService.deletePost(req.params.id, req.companyId, req.user.id);
    res.json({ success: true, message: 'Post deleted successfully' });
  } catch (error) {
    next(error);
  }
}

async function submitForApproval(req, res, next) {
  try {
    await postService.submitForApproval(req.params.id, req.companyId, req.user.id);
    res.json({ success: true, message: 'Post submitted for approval' });
  } catch (error) {
    next(error);
  }
}

async function approvePost(req, res, next) {
  try {
    await postService.approvePost(req.params.id, req.companyId, req.user.id);
    res.json({ success: true, message: 'Post approved' });
  } catch (error) {
    next(error);
  }
}

async function rejectPost(req, res, next) {
  try {
    await postService.rejectPost(req.params.id, req.companyId, req.user.id);
    res.json({ success: true, message: 'Post rejected' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createPost,
  getPosts,
  getPost,
  updatePost,
  deletePost,
  submitForApproval,
  approvePost,
  rejectPost,
};
