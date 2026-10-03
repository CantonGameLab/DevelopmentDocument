# A pleasant lightmapping update

- **作者**：Jonathan Blow
- **日期**：2011-09-07
- **分类**：—
- **原文**：http://the-witness.net/news/http://the-witness.net/news/a-pleasant-lightmapping-update/
- **来源**：the-witness.net 官方开发博客（文章页全文，2010–2012 技术帖，RSS 窗口之外）

---

It's been a little bit since the last post.  We have been busy doing a lot of good things with the game.  Here's one of them: Ignacio just got back from vacation and implemented a simple lightmap encoding idea that improves the color resolution of our lightmaps, removing banding, like so:

[![](http://the-witness.net/news/wp-content/uploads/2011/09/before_after-300x168.jpg)](http://the-witness.net/news/wp-content/uploads/2011/09/before_after.jpg)

The difference is not too pronounced in this scene, but with smoother-colored textures it becomes a lot more obvious (and I do want to use more smoother-colored textures, art-direction-wise!)

The situation is, the lightmaps are HDR (for some definition of "high"), so we needed a way to encode those values reasonably into a bitmap.  We were using RGBM where M is just an overall brightness factor; you read RGB from the texture then multiply by M to get the output color.  We used to just encode this naively, but the problem is, when M is less than 1 then it actually kills precision in your RGB, so the solution is, well, don't ever let M go below 1; just clamp it.  This is not rocket science and in fact is the kind of thing that is a little funny, as one starts wondering why we didn't think of that a long time ago, but hey, that's how it is sometimes.  The results made me happy, though, so I am posting them.

The improved image quality may enable us to have higher dynamic range throughout the game (this is probably something we will evaluate later on), which would be very nice!
