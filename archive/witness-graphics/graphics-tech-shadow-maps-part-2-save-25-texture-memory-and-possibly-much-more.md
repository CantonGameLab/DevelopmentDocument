# Graphics Tech: Shadow Maps (part 2): Save 25% texture memory, and possibly much more.

- **作者**：Jonathan Blow
- **日期**：2010-04-21
- **分类**：—
- **原文**：http://the-witness.net/news/http://the-witness.net/news/graphics-tech-shadow-maps-part-2-save-25-texture-memory-and-possibly-much-more/
- **来源**：the-witness.net 官方开发博客（文章页全文，2010–2012 技术帖，RSS 窗口之外）

---

In [the previous part](http://the-witness.net/news/?p=77), I talked about my reasons for wanting to use Cascading Shadow Maps (one of the biggest: image stability), then said that we had implemented Michal Valient's version of the algorithm, and mostly liked it, but wanted to reduce the memory usage.

This time I'll show how to reduce the memory usage by 25% on machines that support non-power-of-two textures; or, on machines that don't, how to fit 5 shadow maps in the space previously used for 4.

Valient's shadow system generates very stable shadow maps, but this costs a lot of texture memory.  Recall that so much memory is needed because you are inscribing your frustum slice inside a circle, and then inscribing that circle in the texture map:

[![](http://the-witness.net/news/wp-content/uploads/2010/03/1slice.png)](http://the-witness.net/news/wp-content/uploads/2010/03/1slice.png)

When implementing cascading shadow maps, you will be using more than one frustum slice: say, four or five.  Valient's ShaderX 6 paper suggests a way to sample from four different shadow slices quickly in the shader by packing them into an atlas, perhaps like this:

[![atlas2048x2048](http://the-witness.net/news/wp-content/gallery/shadow-mapping-2-images/thumbs/thumbs_atlas2048x2048.png)](http://the-witness.net/news/wp-content/gallery/shadow-mapping-2-images/atlas2048x2048.png)

This was the way we implemented it at first, but very soon after that I was desiring a little more versatility.  If your graphics hardware will do non-power-of-two textures, then you may wish to have the number of shadow slices be an adjustable property; but if the texture maps are packed into a square like that, it's hard to know where to put a fifth one.  So we changed the atlas layout to this:

![atlas4096x1024](http://the-witness.net/news/wp-content/gallery/shadow-mapping-2-images/atlas4096x1024.png)

This still works on power-of-two hardware (power-of-two textures don't have to be square!), and on more-versatile hardware, we can now easily add new textures onto the end.

When your atlas is laid out in a line like this, and you add some runtime visualization to your game, it becomes very clear how much texture space is going unused.  Here's a shot from *The Witness*'s shadow maps:

![green_frusta_1](http://the-witness.net/news/wp-content/gallery/shadow-mapping-2-images/green_frusta_1_0.png)

The frustum slices are shown in green.  Obviously there is a lot of empty space between them.  (For the purposes of visualization, we have left the pixels in the "empty space" filled with shadow map data, but anything that is not covered by green will never be visible in-game, so the game will run faster if we cull all that stuff!)

Because there's so much empty space, we could move our shadow maps closer together, and use less memory.  But we need to be careful about it, because the whole point of the algorithm is that we need enough shadow map space to handle the worst case.  Indeed, if you turn the camera a bit, you get this:

![green_frusta_2](http://the-witness.net/news/wp-content/gallery/shadow-mapping-2-images/green_frusta_2_0.png)

Now there is very little space between the maps, so you can't squeeze them together.  Instead, all the space is toward the bottom of the atlas, and it is unclear how to use it effectively.

But there's a trick we can apply.  Even though these shadow maps are all packed into one atlas, they are still indexed as separate units in the shader, which means we can transform them as separate units.  So why don't we just rotate each individual shadow map by 90 degrees?  Here's what happens to the image above when you do that:

![green_frusta_3](http://the-witness.net/news/wp-content/gallery/shadow-mapping-2-images/green_frusta_3.png)

Now there is plenty of horizontal space and we can pack the maps all together!  (Of course we don't need to render our shadow maps at the default orientation and then copy-and-rotate them in a post-pass; we can just rotate the up-vector of the camera used to render the shadow maps, so that we get the rotation for free.)

When we rotate the shadow maps like this, in order to render properly, our shader needs to realize that they are rotated; but Valient's system already provided a way to transform the shadow map coordinates based on map index, so rotating the maps fits directly into that scheme.  Furthermore, if we are using any filter offsets to index into our shadow map, we need to ensure that those offsets get rotated (by either rotating the constants before uploading them to the shader, or by adding them before doing the map-to-atlas transform, depending on how your system is implemented).

So how do we figure out how to pack the frustum slices together?  Our implementation slides them to the left as far as we can make them go.  First, we compute bounding rectangles for the frustum slices (bounding rectangles shown in yellow):

![yellow_rectangles](http://the-witness.net/news/wp-content/gallery/shadow-mapping-2-images/yellow_rectangles.png)

These rectangles are all oriented in the same direction, so we can just slide them to the left until they nearly touch:

![yellow_rectangles_packed](http://the-witness.net/news/wp-content/gallery/shadow-mapping-2-images/yellow_rectangles_packed.png)

We figure out the rectangle orientation by performing a brute-force uv-bounding computation on one of the frustum slices, then using that same orientation for all slices.  By "brute-force uv-bounding computation" I mean that we just try a whole bunch of different angles and see which one fits the tightest.  In the current implementation we try 100 different orientations spread over 90 degrees, so we find the best angle to within less than 1 degree of accuracy.  (You only need to try 90 degrees, because at that point every angle has been covered by at least one of the sides of your rectangle).

The initial instinct was to use Shadow Map 0 to compute the rectangle orientation, but this didn't quite work out; because of the extreme pointiness of the first frustum slice, we sometimes end up with bounding rectangles that do not suit the other maps.  Using any of the other shadow maps solves this problem (because their near plane tends to create a coherent bounding edge).

We're not done moving the shadow maps around.  Besides just shifting the later shadow maps leftward, as above, we save some more space by shifting the first shadow map leftward based on the leftmost vertex in its frustum slice.  (We don't do it based on the yellow rectangle, because that rectangle will almost always be poking outside of the atlas already.  We don't need to make sure the whole yellow rectangle is inside the atlas; just the green frustum slice!  Remember that the rectangles are just a tool to help us know how to pack.)  So then we get this:

![yellow_rectangles_packed_left](http://the-witness.net/news/wp-content/gallery/shadow-mapping-2-images/yellow_rectangles_packed_left.png)

And we can shave off even more space by shifting the rightmost map upward or downward, whichever direction will allow it to slide further to the left (in this case, it's downward:)

![yellow_rectangles_packed_right](http://the-witness.net/news/wp-content/gallery/shadow-mapping-2-images/yellow_rectangles_packed_right.png)

Clearly we've saved a lot of space -- about half for this viewing angle.  But we have to allocate enough texture space for the worst case, and the question is, what is that worst case?  Empirically, for our game's FOV, we find that in this worst-case viewing angle we can chop off 25% of the texture map.

If you're on non-power-of-two texture hardware, you can just cut your map down and you are happy.  If you are power-of-two-only, you can't do that, but you could use five frustum slices in the space that previously held only four.

**Dealing with Overlapping**

You can pack these rectangular areas together however you want, as long as they don't overlap -- at scene rendering time, your shader doesn't know or care how close these regions are to each other.  Actually building the shadow maps in the first place has become a bit trickier, though.  When each shadow map was in its own self-contained square region, we would just set up a viewport for that square, erase the contents, and render into it.  But now, suppose we are rendering the shadow maps from left to right: while we are rendering the second shadow map, its viewport is going to inevitably overlap the first shadow map.  We have to be careful not to write into the valid region of that first shadow map, or else we'll mess up the scene.

In our current implementation, we use DirectX9's API-provided clipping planes for this purpose.  (The long sides of the yellow rectangles tell us exactly where to put our clipping planes. )  Clipping planes are deprecated in future versions of the API, so we would either switch to stencil testing or else do the clipping ourselves in the shaders.

Here's what the neighborhood of the worst case looks like:

![worst_case](http://the-witness.net/news/wp-content/gallery/shadow-mapping-2-images/worst_case.png)

It happens when you are looking sort-of in the direction of the light vector, but you are turned enough to the side that the view frustum has rotated to be diagonal relative to the axes of the texture map space.  (If you are pointing directly along the light vector, your view frustum extrema are likely to be parallel to the axes of the texture map space.)

**Deeper Thinking We Have Not Yet Done**

We've saved this texture memory by doing what are essentially image-space operations.  But it seems to me that one could somehow project these operations back to the 3D space that we use to compute the bounding spheres in the first place, and generate smaller spheres.  The operation of rotating our texture maps means that we are folding our output space over on itself, using only half the possible orientations.  The whole point of the bounding sphere is to permit the use of any orientation at all -- which we clearly, in retrospect, do not need.  So it's probably possible to reformulate this algorithm in terms of a bounding hemisphere of some kind (or some shape that is somewhat near a hemisphere but allows frustum corner protrusions to poke out of it).

**Saving Tremendously More Memory, if you are willing to copy your maps or else render them in multiple pieces...**

The reason our system works is that once the shadow maps are packed into an atlas, the shader doesn't know or care where the boundaries of the shadow maps are.  We can address the atlas at will, because in reality it is just one continuous texture map.  This means that we can go even further, and place some of our shadow maps in the atlas in such a way that they cross the boundaries of the atlas and wrap to the other side.  It looks discontinuous, but the shader being run at scene-render time does not care, if the texture is addressed in a wrapping mode.  Here is a messy mock-up (not the output from an actual running version, because we haven't implemented this):

Unwrapped, easy-to-see version of texture space:

![wrap_1](http://the-witness.net/news/wp-content/gallery/shadow-mapping-2-images/wrap_1.jpg)

Wrapped vertically:

![wrap_2](http://the-witness.net/news/wp-content/gallery/shadow-mapping-2-images/wrap_2.jpg)

Wrapped horizontally:

![wrap_3](http://the-witness.net/news/wp-content/gallery/shadow-mapping-2-images/wrap_3.jpg)

In my done-by-hand mockup, the result is 46% the size required by the default packing in Valient's original algorithm.  That's a lot of memory savings.

The catch is that, while it's easy to employ this mapping without additional expense, it's more expensive to generate.  You have to either render a non-wrapped version of each shadow map and then copy it into its multiple destination pieces, or else you have to render each map in multiple passes.  (It's always possible to arrange your maps so that one of them is unsplit, so for 4 frustum slices, you probably need 3 additional passes.  Each pass has fewer objects, though, so maybe it's not too bad.)

If you are using pre-filtered shadow maps, then the filtering step is just a kind of copy anyway, so you would be able to do this packing essentially for free.  We aren't doing any pre-filtering on *The Witness*, but if we do, it is likely we will switch over to this packing scheme.  The memory savings are so huge, how could we not?

But I'd like to reiterate for clarity that at this time we have not implemented this wrapping-shadow-map scheme, so if there are any hidden gotchas, I don't know.  We have only implemented the above 25% savings scheme (sliding the maps around, no wrapping).
