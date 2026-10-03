# iPad Victory Shot

- **作者**：Jonathan Blow
- **日期**：2012-10-19 16:46 UTC
- **分类**：Development
- **原文**：http://the-witness.net/news/2012/10/ipad-victory-shot/
- **来源**：the-witness.net 官方开发博客（文章页全文）

---

For the past few weeks Andy has been working on the iPad port of the game, and we now have the engine running on that device:

[![](http://the-witness.net/news/wp-content/uploads/2012/10/ipad-286x384.jpg)](http://the-witness.net/news/wp-content/uploads/2012/10/ipad.jpg)

The colors are all funny because we haven't written the shaders for the iPad yet, so what you are seeing is the surface normals of the objects in the scene.

We haven't written the shaders yet because they need to be OpenGL ES shaders, and the shaders we have right now are HLSL shaders all written for medium-to-high-end PCs. As the first part of the porting work, Andy made the engine work on OpenGL on the PC, and for that we converted our HLSL shaders to GLSL automatically. But the jump to ES on an embedded device is big enough that it doesn't make sense to try and use the same shaders. Instead we'll have to have some simpler shaders that we substitute.

As you can see from my previous post, I have been working on touch controls (not on the iPad, but on a touchscreen Windows PC). A very rough first cut of that is now working. It's nice to play the game with touch controls, as it feels more immediate than mouse and keyboard (and I have been a first-person shooter player forever!)

So in order to have the game fully interactive on the iPad, we just need to write the bit that translates iPad touch controls to feed them into the rest of the gameplay code, which should not take long.

Then, after that, we have to work out exactly how we are going to crunch all the graphical assets down to portable versions and do the streaming in an appropriate way... which is going to be a bit of work. Salvador built a streaming asset system a while back, and we have been using that daily on the PC, but we haven't tried to set it up on a lighter-weight portable system like the iPad yet. We'll see how it goes!
