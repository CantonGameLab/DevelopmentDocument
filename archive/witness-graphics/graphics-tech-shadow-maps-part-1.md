# Graphics Tech: Shadow Maps (part 1)

- **作者**：Jonathan Blow
- **日期**：2010-03-03
- **分类**：—
- **原文**：http://the-witness.net/news/http://the-witness.net/news/graphics-tech-shadow-maps-part-1/
- **来源**：the-witness.net 官方开发博客（文章页全文，2010–2012 技术帖，RSS 窗口之外）

---

*The Witness* contains a mixture of indoor and outdoor scenes, but much of the game takes place outdoors with a very long view distance (you can see the entire island at once if you have a good vantage point).  So I wanted to implement a shadow system that would work robustly, provide high visual quality, and allow the player to see everything at once.  I have some experience with shadow systems of this type, but the last one I designed was for computers and graphics cards circa 2004, so I was interested to see how much more would be possible today.

We've implemented such a modern shadow map system for *The Witness*.  In the process, we've made some improvements to shadow mapping algorithms beyond anything we've seen published, so we are going to detail the improvements here.  Also, our shadow map system is still being improved, so I'll talk about what we have yet to try and why we think it's a good idea.

Before we get to those details, though, I'd like to establish some context so that the motivation for these design decisions is clearly explained.

**The Literature**

I have a somewhat cynical attitude toward graphics research literature: most of it describes techniques that don't generally work, but the authors of the papers do the best they can to "sell" the technique to you anyway (using cherry-picked examples, glossing over or completely ignoring failure cases that would be obvious to anyone who understands the algorithm, etc).  As the reader, eventually you come to understand all the problems, but not after investing a lot of your time and energy (possibly months) implementing and understanding an algorithm that behaves so poorly that you never would have bothered if you had known the truth from the outset.

I've had this experience many times, with many different techniques.  Shadow maps, though, have been one of the big ones.  There are many published shadow map techniques that simply don't work well enough to be taken seriously.  And often when I've heard someone say "so-and-so shadow technique is good," it usually turns out they haven't tried it themselves, so it's just hearsay, or else that person has low quality standards.

So I'd like to put forth the statement that I have high quality standards and will only endorse things that have been found to robustly function; I will be open and honest about the degree to which things don't work, and what the specific problems are.  In an ideal world this would not be necessary to say, but the situation in the literature today makes it otherwise.

**Quality Goals; Previous System**

Many shadow map schemes have been developed that try to maximize the effective resolution of shadows in the scene by performing transformations that are heavily view-dependent.  An extreme example of this is Perspective Shadow Maps.  I have learned through experience not to use these techniques.  They cause shadows to swim and flicker in annoying ways, and many of the algorithms break down severely as the player approaches certain viewing angles.

For [the 2004 system](http://www.number-none.com/happycake/notes_8/index.html), I took as a core design goal that shadows should appear rock-solid on nonmoving objects, regardless of any viewpoint motion.  The clearest way to achieve this was to center the shadow map on the viewpoint at all times, never letting the shadow map scale or rotate.  Because a single shadow map cannot cover the world at high resolution within memory and fill constraints, I used a scheme where 4 or more shadow maps of increasing worldspace size were centered on the viewpoint like square doughnuts.  In order to prevent crawling or shimmering, one just ensures that shadow map worldspace positions are snapped to integer multiples of their texel size.  (A family of related techniques, but which don't necessarily center the maps on the viewpoint, soon came into more-common use and took on the moniker Cascaded Shadow Maps.)

On fixed-function pipeline hardware, this scheme was never quite satisfying (I had to use clip planes to render the scene in many slices, and there were small 1-pixel artifacts due to the resulting imprecision; rendering all the slices was a bit slow).  Modern hardware is able to do this kind of thing much  better.  Also, this scheme wastes a large amount of shadow map memory, because with all the shadow maps centered on the viewpoint, most of the map texels are going to be out of view at any given time.

Despite the drawbacks, the visual stability of this technique, and its ability to reach across the entire game world, were extremely appealing to me.  Having seen how nicely shadow mapping could behave in practice, this visual stability became a very-high-priority goal in my mind for any future shadow systems.

So, going into this new system, the goals were (listed in approximate order of importance):

- High performance

- Complete stability under camera motion

- Long view distance

- Visuals can be controlled to suit the style of the game

- Efficient use of texture memory

**The New System**

I started working on the new system by looking at the 2004 system and trying to make it more memory-efficient.  Most likely this would involve moving the shadow maps around in world space, but it wasn't initially clear to me how to do this without introducing problems.  Ignacio pointed me at Michal Valient's article "Stable Rendering of Cascaded Shadow Maps" in [ShaderX 6](http://www.shaderx6.com/), which was exactly what I wanted.  Valient computes bounding spheres around the slices of the view frustum that tell him how much he can move the shadow maps in world space without introducing gaps.

To illustrate, here are a couple of figures reproduced from his article.  I don't want to unduly step on anyone's copyright, so if you are interested in cutting-edge shadow map techniques, buy ShaderX 6!  *(Click for full size.)*

[![figure_411](http://the-witness.net/news/wp-content/gallery/valient-shaderx6-figures/thumbs/thumbs_figure_411.png)](http://the-witness.net/news/wp-content/gallery/valient-shaderx6-figures/figure_411.png)

[![figure_412](http://the-witness.net/news/wp-content/gallery/valient-shaderx6-figures/thumbs/thumbs_figure_412.png)](http://the-witness.net/news/wp-content/gallery/valient-shaderx6-figures/figure_412.png)

So basically, you take the a frustum slice in worldspace, ensure that it is completely enclosed in a sphere, and then ensure that the sphere is completely enclosed in a square cylinder; the square is your shadow map.

You can render multiple frustum slices for multiple shadow maps, so long as the bounding spheres overlap enough to cover the whole frustum when put together (see 4.1.2 c and d).

The reason they are spheres is: because the shadow map is never allowed to change size (we voluntarily imposed that constraint in order to get solid shadows!), then we need to find a shape that conservatively encloses any possible orientation that a frustum slice could occupy as the camera rotates in space.  That's a sphere.  Then we make sure that our shadow map covers that entire sphere, and we have then guaranteed that every point in the view frustum is covered by a valid shadow map  texel.

On top of this, Valient suggests the very helpful optimization of packing all your shadow maps into one atlas texture, so that when it's time to render the scene, you can draw all your shadowed objects in one pass without having to sample multiple textures; you just figure out which frustum slice each pixel lands in, then use that information to determine the offset into the atlas, add that offset to your texture coordinates, and sample the texture.  This works great.  Valient suggests a 2x2 arrangement of textures, as this is convenient on a wide variety of hardware, for example, GPUs that only support power-of-two textures.  So if a single shadow map would be 1024x1024, then you can create a 2048x2048 texture map that contains 4 shadow maps packed in a 2x2 array:

[![](http://the-witness.net/news/wp-content/uploads/2010/03/4maps-251x300.png)](http://the-witness.net/news/wp-content/uploads/2010/03/4maps.png)

So my first shot at a new system was basically a reimplementation of everything Valient describes.  It didn't take too long, and when it was done, I was very happy with it -- it was clearly much better than the 2004 system.

But...

**Memory Usage**

This technique is still a memory hog.  The image stability constraints, which result in us wrapping the frustum slice in a sphere and then the sphere in a box, add margins of unused and barely-used texture space at each step.  Looking at Figure 4.1.2, you can see that a frustum slice only occupies about 50% or 60% of the area of the square that represents your shadow texture.  This implies that half the square is wasted.  **However, the actual situation is worse than this, because the diagram is misleading.**

The problem is that the view frustum represented in the diagram is much narrower than the view frustum used in an actual game, and if you re-draw the diagram in realistic proportions, it looks very different.  For an accurate 2D diagram, you are finding a circle that encloses the widest part of your view frustum, which is the 2D trapezoid you get by cutting your frustum in half diagonally (Valient discusses this in his paper as well).  Suppose your game is rendering at a 16:9 aspect ratio, and your field of view is 90 degrees horizontally (this is what we use for *The Witness*currently.)  The vertical field of view is then going to be about 59 degrees, and the diagonal field of view will be about **98 degrees** (click on image below for explanation).

[![](http://the-witness.net/news/wp-content/uploads/2010/03/diagonal_fov-300x213.png)](http://the-witness.net/news/wp-content/uploads/2010/03/diagonal_fov.png)

The frustum slice in Valient's diagram is only about 30 degrees, a huge difference!  So if we have a 98 degree frustum slice, and inscribe that in a circle, and inscribe that circle in a square, what does that look like?  Something like this:

![](http://the-witness.net/news/wp-content/uploads/2010/03/1slice-300x295.png)

Recall that the square is your shadow map texture and the innermost trapezoid is your frustum slice (the texels of your texture that may potentially be used).  It covers only a small  area of that square -- and there's no way to make it bigger!  The reason is that for wide frusta like this, the diagonal at the far plane is so long that it dominates the bounding sphere computation, and so the center of the circle has to land on that diagonal so that its diameter can be just barely large enough to enclose it.  (In *The Witness*, our frustum slices are not proportional, and the way we divided them up, this isn't exactly true for the first 2 shadow maps -- but it is very close to true).  The fact that the circle is centered on the far plane means that automatically half the map is wasted at this orientation -- but the wide angle ensures that much of the other half is wasted too!

You can rotate the view frustum to other orientations and make it look like you are covering more of the shadow map... for example, if you orient the frustum so that the view vector is going straight down into the page, then the frustum's projection onto the paper will be a rectangle, and it will appear to cover much more of the square.  But then you have to keep in mind that some of this coverage is worth a lot more than other coverage in terms of impact on the scene: think about how much space is covered by the texels toward the middle of the frustum projection, versus how much is covered toward the edges (almost none!)

If I add two more frustum slices, so that the total is 3 slices as in 4.1.2, it looks like this:

[![](http://the-witness.net/news/wp-content/uploads/2010/03/3slices-300x295.png)](http://the-witness.net/news/wp-content/uploads/2010/03/3slices.png)

That innermost shadow map is just a tiny smudge (now you know why Valient chose a narrow field of view -- for clarity of his figures!)  But notice what else is going on: each shadow map is fully contained within the next-larger shadow map, as with the concentric-square-doughnut system from 2004!  Valient's scheme is better since it gives you more view distance (the squares are not concentric) -- but it can't give you nearly as much view distance as it would like, due to the wide angle of the frustum.

**For Next Time**

So, whereas on one level I was very happy with this shadow system's performance and visual quality, it still seemed somewhat wasteful in terms of memory usage.   Next time I'll talk about how we addressed that problem.  Subsequent postings after that will talk about issues like softening the shadow border, blending between slices, and various other implementation tricks.

****

**To be continued.**
