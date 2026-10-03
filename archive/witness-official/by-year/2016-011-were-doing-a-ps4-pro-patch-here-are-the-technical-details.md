# We’re doing a PS4 Pro patch! Here are the technical details.

- **作者**：Jonathan Blow
- **日期**：2016-09-08 18:41 UTC
- **分类**：Uncategorized
- **原文**：http://the-witness.net/news/2016/09/were-doing-a-ps4-pro-patch-here-are-the-technical-details/
- **来源**：the-witness.net 官方开发博客（文章页全文）

---

Now that the PlayStation 4 Pro has been announced, we can tell you that we are working on a PS4 Pro patch for The Witness.

The Witness already runs at a consistent 60fps on the base PlayStation 4, so rather than increasing frame rate, our patch is about visual quality. Please don't take the specifics mentioned here as absolute promises; things might change by release. But here's what we are aiming for:

When you start up the game on a PS4 Pro, it will go into one of two modes, depending on the current display device:

* When using PS4 Pro with a 4k display, we will render at 1440p or possibly higher, all while keeping a consistent 60 frames per second. This image will then be upscaled to 4k, and we will draw text, menus, and other UI at native 4k resolution. (This is similar to what happens on the base PS4, where we render the 3D scene at 900p, then upscale to 1080p and draw UI at 1080p). We might be able to achieve resolutions higher than 1440p based on various engineering tradeoffs (for example, if we boost the resolution of the main scene to a greater degree than we boost the resolution of the reflections in water, which tend to be distorted anyway. Also, we'll evaluate checkerboard rendering -- we're not sure if it's the right way to go for this game, but we'll see.) We'll post again when we finalize these specs.

* When using PS4 Pro with a display that is 1080p or lower, we will render the scene at 1080p (instead of the old 900p), and increase antialiasing quality from 2x to 4x MSAA, again while keeping a solid 60 frames per second. We are exploring additional visual quality increases, like increased streaming distance for high-resolution meshes, or decreasing the noticeability of the fade-in between faraway LODs and high-res close-up meshes. Again, we'll post details when this is finalized!

We're also working on HDR support. Here in the office we just got a new LG B6P television, which is very bright and has low black levels, providing a lot of dynamic range, and it's been fun so far tweaking the look of the game on HDR displays like this.

We thought we were working on HDR support only for the PS4 Pro, but yesterday Sony announced that they will be enabling HDR support on all PS4s via a firmware update. Sometimes Sony even surprises developers! (Back when the PS4 was originally announced, we were surprised by some of the final specs too ... and I was on stage in that show!)

We think it's great that Sony are doing this. We don't know the technical details of how it will work, yet, but provided that nothing prevents us, the Witness patch will use HDR on all PS4s when available. (You will, of course, need an HDR TV or monitor for HDR mode to kick in!)

If all goes well, this patch will be downloadable on November 10 when the PlayStation 4 Pro is released.

We'll keep you posted as we continue work on this patch!
