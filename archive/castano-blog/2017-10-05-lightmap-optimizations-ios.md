# Lightmap optimizations for iOS

- **作者**：Ignacio Castaño
- **日期**：2017-10-05（更新于 2022-08-23）
- **原文**：https://www.ludicon.com/castano/blog/2017/10/lightmap-optimizations-ios/
- **来源**：ludicon.com/castano/blog（WordPress REST API 全文）

---

![](http://www.ludicon.com/castano/blog/wp-content/uploads/2017/10/File-Oct-05-10-44-34-PM-700x525.png)

One of the main challenges of porting The Witness to iOS was reducing the app memory footprint. The lightmaps that we used in the PC version simply did not fit in the memory budget that we had for iOS.

As described in my [previous article](http://www.ludicon.com/castano/blog/2016/09/lightmap-compression-in-the-witness/), on PC we compress our lightmaps using DXT5-RGBM. The DXT5 texture compression format is not available in iOS, so the first problem was to find a suitable alternative.

PVR is the most popular texture compression format on iOS, but it was not a particularly good choice. It has some annoying size constrains and doesn’t support an independent alpha channel; using a RGBM scheme would require sampling multiple textures.

Since we require metal for rendering, all the devices we care about also support ETC2, which has a mode analogous to DXT5 with one block representing the RGB colors and another block representing the alpha. This was a much better fit for our RGBM lightmap representation.

For the RGB components I simply used Rich Geldreich’s ETC compressor ([rg-etc1](https://github.com/richgel999/rg-etc1)). This only supports ETC1 block mode, without the ETC2 extensions. Lightmaps are often fairly smooth, and I was hoping ETC2’s planar mode would be very effective at representing them. I wrote a nearly optimal planar compressor using least squares fitting, but interestingly the standard ETC1 mode was able to achieve lower errors in most cases, only 4% of the blocks ended up using the planar mode.

![](http://www.ludicon.com/castano/blog/wp-content/uploads/2017/10/etc-rgbm-chart-2.png)

As you can see in this graph, the quality of ETC2-RGBM is slightly lower than DXT5-RGBM, but in practice it’s almost impossible to appreciate any difference despite the higher error. Adding support for T and H modes may help reduce the gap between DXT5-RGBM and ETC2-RGBM, but it did not seem worth the effort and I had more important issues to address.

With these changes the size of the lightmaps on mobile was now the same as on PC, but our goal was to reduce it further. One of the simplest solutions is to simply reduce the resolution of the lightmaps. This works to some extent, but due to inefficiencies in lightmap packing, the size of the lightmaps is not directly proportional to the resolution. The lower the resolution, the higher these inefficiencies, so this approach alone provides diminishing returns. For example, in the image below the lightmap area on the right side is one quarter of the left, but the number of texels is only halved.

![](http://www.ludicon.com/castano/blog/wp-content/uploads/2017/10/charts.png)

To overcome that we used a slightly more aggressive packing scheme, but the most effective approach was to use per-vertex lightmaps computed using [least squares vertex baking](http://www.jarmilakavanova.cz/ladislav/papers/vb-egsr11/vb-egsr11.htm).

- ![](https://www.ludicon.com/castano/blog/wp-content/uploads/2017/10/File-Oct-05-11-13-20-PM.png)

- ![](https://www.ludicon.com/castano/blog/wp-content/uploads/2017/10/File-Oct-05-11-12-45-PM.png)

- ![](https://www.ludicon.com/castano/blog/wp-content/uploads/2017/10/File-Oct-05-11-12-03-PM.png)

Least squares vertex baking was specially effective on small meshes that are instanced numerous times, such as pebbles and small rocks. However, it also introduced some new problems.

In [one of my first articles about the lightmap tech of The Witness](http://www.ludicon.com/castano/blog/articles/hemicube-rendering-and-integration/) I described the method used to identify invalid samples: when rendering hemicubes I counted the number of back facing texels. When that number was above a certain threshold the sample was considered invalid and its color would be extrapolated by the surrounding samples instead. This worked well, but the threshold we used was somewhat conservative, because many of our meshes were not perfectly watertight or not correctly closed. This resulted in some false positives, that is, some invalid samples were considered valid. This was generally not a problem, because these samples were usually not visible from the player point of view, but hidden behind other geometry (for example, under the ground). However, when using least squares vertex baking, the contribution of these samples would influence the vertices of the triangle it belonged to, and often these vertices were visible by the player.

The only solution that I could come up with was to tighten the validation threshold, but this resulted in many new artifacts resulting from sloppy geometry, that then had to be cleaned up, consuming valuable artist time.

Despite the extra work, I think the results justified the effort. At the most expensive location, the lightmap memory use was reduced to a 25% of the original:

```
PC: 234 MB
iOS: 60 MB
```

And in the redistributable package, the lightmap assets were reduced to a mere 17%:

```
PC: 1781 MB
iOS: 304 MB
```
