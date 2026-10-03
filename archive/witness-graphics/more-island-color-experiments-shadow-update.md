# More island color experiments; shadow update

- **作者**：Jonathan Blow
- **日期**：2011-05-18
- **分类**：—
- **原文**：http://the-witness.net/news/http://the-witness.net/news/more-island-color-experiments-shadow-update/
- **来源**：the-witness.net 官方开发博客（文章页全文，2010–2012 技术帖，RSS 窗口之外）

---

Until now, we had been using Uncharted-2-style blend mapping to color our terrain.  This is a way of using a low-resolution texture map to control the blending of high-resolution textures; this gives you the ability to maintain fine pixel-by-pixel detail while also blending between multiple textures in order to create larger-scale patterns.  (This method is in effect in earlier screenshots like [this one](http://the-witness.net/news/?p=835), though keep in mind that we were not using it very seriously in a whole-island kind of way yet.  For some idea of what the blend mapping looks like closer-in, see [this](http://the-witness.net/news/?p=807) or [this](http://the-witness.net/news/?p=784).)

But now we are thinking about how to create colorful scenes, like in [the previous post](http://the-witness.net/news/?p=852), and this style of blend-mapping did not seem like a very good idea.  In order to create gradients across the scene, we would need to have a lot of blend layers; this would be slow and use a lot of texture memory (since now we are storing a lot of individual blend maps). Even once we did that, it would be laborious to control, and it's unclear that it would look good.

Ignacio mentioned that the Wolfire guys were just dropping one color map across their whole terrain.  That seemed like a good idea to me -- I have done that before, but in contexts where we were trying to really crank up the resolution to levels that were ridiculous at the time, like 8192x8192 texture maps back in 2001.  Rather than doing that, the idea now is to just use what is a reasonable-sized texture on a modern machine, and see what it looks like.  So Shannon painted a 2048x2048 texture of the island (of which we are only really using less than half right now) and here's how it looks from up high:

[![](http://the-witness.net/news/wp-content/uploads/2011/05/shot_2011.05.18__time_12_39_n01-300x168.png)](http://the-witness.net/news/wp-content/uploads/2011/05/shot_2011.05.18__time_12_39_n01.png)

Immediately this strikes me as much nicer, and much more in-tune with the art direction we want for the game.  The buildings and other meshes now stick out like sore thumbs, but that is just what happens when you improve only a part of the scene.  We'll be working on this.

Here's a scene from closer in:

[![](http://the-witness.net/news/wp-content/uploads/2011/05/shot_2011.05.18__time_12_40_n02-300x168.png)](http://the-witness.net/news/wp-content/uploads/2011/05/shot_2011.05.18__time_12_40_n02.png)

As you can see, we have less detail close-up on the ground; things look a bit blurry.  However, the colors are a lot better, and I think if we can adapt this scheme into something that permits sharper details up close, we will be able to make something that has a lot of character and looks special.  In these shots, we are still using the old blend map system to tile high-detail normal maps across the terrain; that helps, but by itself it's not enough.  (In recent videos for Overgrowth, [like this one](http://blog.wolfire.com/2011/05/Overgrowth-a131-video-changelog), you can see that they are doing something that provides close-up details, maybe just intensity maps that are being modulated by the color map).  So we'll keep working on this and see how it goes.

Meanwhile, Ignacio has been revising the shadow map rendering.  We used to have very speckly shadow maps, as I was using a 4-sample Poisson disc to sample the shadow map.  Ignacio recently switched this to a Gaussian that has more taps, then applied some math tricks to reduce the number of taps.  This results in softer shadows:

[![](http://the-witness.net/news/wp-content/uploads/2011/05/shot_2011.05.18__time_12_42_n03-300x168.png)](http://the-witness.net/news/wp-content/uploads/2011/05/shot_2011.05.18__time_12_42_n03.png)

At some angles, shadow map jaggies still show up pretty clearly:

[![](http://the-witness.net/news/wp-content/uploads/2011/05/shot_2011.05.18__time_12_42_n04-300x168.png)](http://the-witness.net/news/wp-content/uploads/2011/05/shot_2011.05.18__time_12_42_n04.png)

This is something we might work around in the final game by changing the scene when this happens!  Or, it's possible the shadows will be modified further so that they look smoother in cases like this.  Who can say?
