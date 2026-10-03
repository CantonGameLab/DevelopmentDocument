# What we’ve been working on lately.

- **作者**：Jonathan Blow
- **日期**：2014-09-10 18:02 UTC
- **分类**：Development, Engine Tech
- **原文**：http://the-witness.net/news/2014/09/what-weve-been-working-on-lately/
- **来源**：the-witness.net 官方开发博客（文章页全文）

---

We built a DirectX11 rendering backend for our engine, which is likely to be the default when running on Windows. Up until now we had been running on DirectX9, which made sense when we thought the game was going to be done a while ago. But these days, DX9 is getting pretty old and busted. So far the DirectX11 version has been very successful; the engine runs much more smoothly, especially on low-end platforms, due to the drastically lowered CPU overhead of draw calls. There's a little work to do here still -- some of our weirder shaders don't work in DX11 yet and there are a couple of lighting bugs -- but this all should be nailed down soon.

We've been revising the modeling and texturing for areas near the end of the game. There are some nice treats in store!

We've been working on some of the "special effects" in the game, most notably particle effects. Our particle system was old and slow, so we are speeding this up, and then we will make some modifications to help make particle authoring an easier process.

We've been making some baseline functionality smoother. For example, so that you don't need to think about saving your game, The Witness autosaves your progress every minute or so. On a high-end PC, you don't notice the autosave, but on a low-end PC or on a console (because consoles tend to have different memory access properties than PCs), scanning the world for stuff that needs to be saved can be pretty slow, like, it could take 1/10 of a second, which would result in a hitch in the frame rate happening every minute. So we are hammering on this to make it faster, which should also result in saved game files being smaller, since we'll be excluding a lot of things that don't need to be saved.
