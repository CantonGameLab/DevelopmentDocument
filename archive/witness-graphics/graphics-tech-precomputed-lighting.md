# Graphics Tech: Precomputed Lighting

- **作者**：Jonathan Blow
- **日期**：2010-03-01
- **分类**：—
- **原文**：http://the-witness.net/news/http://the-witness.net/news/graphics-tech-precomputed-lighting/
- **来源**：the-witness.net 官方开发博客（文章页全文，2010–2012 技术帖，RSS 窗口之外）

---

For the past 15 years or so, graphics technology in games has been driven by shooters.  Most shooters generate visual interest in their scenes by having lots of dynamic lights, with extreme use of bump mapping, and moving shadows, and particle effects.

For *The Witness*, I wanted to develop a graphical style that values simplicity.   It would be suited to mellower environments, with both indoor and outdoor settings.  Some kind of global illumination solution seemed like the right idea here.  (Global illumination is when you simulate light bouncing around in a scene; the resulting look is usually much richer and subtler than the direct lighting that games usually do.)

Clearly, full real-time global illumination would be the most versatile solution.  I investigated some licensable packages that provide this, such as [Geomerics' SDK](http://geomerics.com/).  However, these solutions will invariably use a lot of texture space, and consume a bunch of processing time, and they seem like overkill for this game (*The Witness* does not have many moving light sources, relative to other types of games).

So, some form of precomputed global illumination seemed like the right thing.  3D modeling packages have plugins to compute global illumination, but they are very difficult to interface with, and they could not even come close to handling a full game scene.   The only thing that knows where all the objects in the world are at once is the game itself (and the in-game editor), so it seemed appropriate to develop our own in-game system for global illumination.  It could have been radiosity, could have been something like Monte Carlo Path Tracing, but [Charles Bloom](http://www.cbloom.com/) suggested the very simple solution of just rendering the scene for every pixel in a lightmap, and that seemed like a good idea.  With an approach like that, you don't have to do a bunch of monkeying around to make radiosity or ray tracing match the completely different algorithm that is used to render your realtime game scene; light transport is computed by that same algorithm, so it will automatically match unless you mess things up.

For several months, [Ignacio Castaño](http://castano.ludicon.com/blog/) has been working on this system.  He is writing up a highly technical explanation of how the system works, which I think he'll be done with in a few days, but in the meantime, here is a lighter-weight overview.

At preprocess time, we just walk a camera over every surface, pointing the camera away from the surface and rendering the game scene into a hemicube in video memory.  The render target textures of a hemicube are packed together into an atlas, and when the atlas fills up, we download it into system memory, integrate the values in each hemicube to find an average light value, and then store that value in the lightmap.  Most of the shots below were generated using 128x128 cube maps and multiple samples per texel.

Because we are just using our regular rendering code, this precomputation process is hardware-accelerated by default.

Note: *In the images below, all geometry and textures are placeholders.* As with Braid, we are using rough-draft versions of all these things while the core gameplay is built.  Bloggers, **these are not to be considered screenshots of the game**.  They aren't supposed to look good yet -- they are just supposed to show the precomputed lighting.

First, some shots of the house.  The precomputed lighting is responsible for most of the light in the room.  The places where you see sunlight hitting surfaces directly are dynamic; everything else is a static precompute.  (Without the precomputed lighting, the entire room would be black except for the patches of sunlight).

[![house1](http://the-witness.net/news/wp-content/gallery/lighting/thumbs/thumbs_house1.jpg)](http://the-witness.net/news/wp-content/gallery/lighting/house1.jpg)

[![house2](http://the-witness.net/news/wp-content/gallery/lighting/thumbs/thumbs_house2.jpg)](http://the-witness.net/news/wp-content/gallery/lighting/house2.jpg)

[![house3](http://the-witness.net/news/wp-content/gallery/lighting/thumbs/thumbs_house3.jpg)](http://the-witness.net/news/wp-content/gallery/lighting/house3.jpg)

Note the ambient occlusion, soft shadows, and other nice effects that all come naturally from this system.  (In the third image, the picture on the wall hasn't been lightmapped yet, which is why it sticks out so brightly.)

Here's a simple bunker interior consisting mostly of a single material and color.

[![bunker1](http://the-witness.net/news/wp-content/gallery/lighting/thumbs/thumbs_bunker1.jpg)](http://the-witness.net/news/wp-content/gallery/lighting/bunker1.jpg)

[![bunker2](http://the-witness.net/news/wp-content/gallery/lighting/thumbs/thumbs_bunker2.jpg)](http://the-witness.net/news/wp-content/gallery/lighting/bunker2.jpg)

[![bunker3](http://the-witness.net/news/wp-content/gallery/lighting/thumbs/thumbs_bunker3.jpg)](http://the-witness.net/news/wp-content/gallery/lighting/bunker3.jpg)

Lastly, the tower:

[![tower1](http://the-witness.net/news/wp-content/gallery/lighting/thumbs/thumbs_tower1.jpg)](http://the-witness.net/news/wp-content/gallery/lighting/tower1.jpg)

[![tower2](http://the-witness.net/news/wp-content/gallery/lighting/thumbs/thumbs_tower2.jpg)](http://the-witness.net/news/wp-content/gallery/lighting/tower2.jpg)

[![tower3](http://the-witness.net/news/wp-content/gallery/lighting/thumbs/thumbs_tower3.jpg)](http://the-witness.net/news/wp-content/gallery/lighting/tower3.jpg)

There are lots of caveats on these images.  The game renders in HDR, but we haven't balanced our lighting constants or done tone mapping yet, so I have gamma-corrected the output images by various amounts.  For now, we are computing only the first lighting bounce.  We'll probably do at least 2 or 3 bounces for the final game, and when we have that running I'll post some comparison images.  I believe our model of sky illumination is still overly simple and wrong (though I'd need to check with Ignacio on that, maybe he has fixed it up).  I haven't played around with the results of the current system in outdoor areas (e.g. lots of small branches and leaves), though if we find that we have too many aliasing problems, we can always make the lightmaps higher-resolution in those areas.

In areas that have doors or windows that open and close, we are planning on layering a supplemental lightmap that gets scaled by the openness of that light aperture, then added to the base lightmap.  This will provide a pretty good approximation for the way the indirect light in the room changes as the aperture opens and closes.  Direct light will be completely correct since it uses the fully dynamic shadow system.  I'll do a post about that shadow system sometime in the future.
