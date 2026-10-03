# Regarding Water

- **作者**：Jonathan Blow
- **日期**：2012-08-24
- **分类**：—
- **原文**：http://the-witness.net/news/http://the-witness.net/news/regarding-water/
- **来源**：the-witness.net 官方开发博客（文章页全文，2010–2012 技术帖，RSS 窗口之外）

---

*(Here's an internal email that Ignacio sent today that may provide some flavor on what we're doing lately.)*

From: Ignacio Castaño

Date: 24 August 2012

I just checked in a few changes to the water shader. Note that this is still work in progress, there are some artifacts and unfinished features.

From the art point of view, the main change is that there's now a water_color_map and a water_flow_map that you can use to change the behavior of the shader.

The RGB channels of the color map control the water extinction color and the alpha controls the opacity factor. The previous underwater shading model was simply wrong, the new one works nicely and is easy to tweak. Note that I assume the water color changes very smoothly, avoid sharp color changes!

The flow_map is intended to contain additional water attributes. Right now it's only used for the stillness, but I will certainly add more in the future.

You will also notice that the shoreline now also has a foam layer:

[![](http://the-witness.net/news/wp-content/uploads/2012/08/a-512x287.png)](http://the-witness.net/news/wp-content/uploads/2012/08/a.png)

The way it's computed is by comparing the screenspace depth difference. This is not very correct, it looks OK from some angles, but it breaks badly when the underwater geometry has screen-space depth discontinuities:

[![](http://the-witness.net/news/wp-content/uploads/2012/08/b-512x287.png)](http://the-witness.net/news/wp-content/uploads/2012/08/b.png)

If the foam is a desirable feature, I'm considering modifying the print_map command to render a foam map, or maybe this is something that can be painted manually and added to the water_flow_map. One of my concerns is that this map may not have enough resolution.

Just Cause 2 seems to use this method to render foam, but they apply a big screenspace distortion to hide the artifacts, I found it sickening when you stare at it closely...

The way the water is shaded has also changed somewhat. First, I now approximate the specular exponent based on the position of the camera with respect to the water and the water roughness. Somewhat like the LEAN paper does, but assuming the roughness of the water is the same for the whole texture. Depending on the value of the exponent I either sample the mirrored reflection map, a filtered environment map, or blend between the two. My goal was to be able to use the mirrored reflection map only on a small subset of the lake entities. The physically based approach does not allow us to cull many, so I'll probably have to introduce some hacks. BTW, I'm doing all these work not just an optimization, but also so that we can use the light probe reflection model in the river and lakes inside the island, where the mirrored reflection map is not available.

The main problem with the filtered environment map is that it does not take local reflections and occlusion from the environment into account. I have two ideas to work around this, one is to store an ambient occlusion map in the lightmaps, this may be a bit too smooth and will lack directional information. The other is to do screenspace raycasting of the depth buffer to decide whether the environment map is occluded or not.

This is somewhat like what Crysis 2 does. Insomniac also uses a similar approach with just a single sample:

[http://www.insomniacgames.com/tech/articles/0409/files/water.pdf](http://www.insomniacgames.com/tech/articles/0409/files/water.pdf)

I'm hoping we can get away with a crude approximation too. I did a quick test, where the maths are not exactly right, with only 4 samples and no smoothing, and it was starting to look promising:

[![](http://the-witness.net/news/wp-content/uploads/2012/08/c-512x287.png)](http://the-witness.net/news/wp-content/uploads/2012/08/c.png)

This won't allow us to use the filtered environment maps closer to the camera, but if the screenspace raycasting works well, I'm thinking about using non-filtered environment maps in place of the mirrored reflection map, whenever those are not available.

Finally, I've also been playing with Valve's water flow model, I have the basic implementation working, but I haven't yet been able to reproduce the workaround for the pulsing and repetition artifacts that Alex proposes.

[http://www.valvesoftware.com/publications/2010/siggraph2010_vlachos_waterflow.pdf](http://www.valvesoftware.com/publications/2010/siggraph2010_vlachos_waterflow.pdf)
