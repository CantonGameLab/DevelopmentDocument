# Graphics Tech: Lighting Comparison

- **作者**：Jonathan Blow
- **日期**：2010-03-29
- **分类**：—
- **原文**：http://the-witness.net/news/http://the-witness.net/news/graphics-tech-lighting-comparison/
- **来源**：the-witness.net 官方开发博客（文章页全文，2010–2012 技术帖，RSS 窗口之外）

---

It seems like time to post some images from the in-progress precoputed lighting tech that Ignacio is working on.  See [here](http://the-witness.net/news/?p=50) for a description of the basics behind what we are doing for lighting.  The lightmaps are now 16-bit and these shots use a simple exponential tone mapper.

First, I've taken shots from 3 positions inside a house, with four different lighting settings.  For all four settings, we are computing only the first lighting bounce.  The parameters are:

- 32x32 cube maps, adaptive sampling, quality = 0.5. Time to compute: 197 seconds.

- 32x32 cube maps, non-adaptive sampling. Time to compute: 648 seconds.

- 64x64 cube maps, non-adaptive sampling. Time to compute: 738 seconds.

- 128x128 cube maps, non-adaptive sampling. Time to compute: 1570 seconds.

(Click for full size).

**Front Door:**

****

[![shot1_32_b1_ay](http://the-witness.net/news/wp-content/gallery/precomputed-lighting-2/thumbs/thumbs_shot1_32_b1_ay.jpg)](http://the-witness.net/news/wp-content/gallery/precomputed-lighting-2/shot1_32_b1_ay.jpg)

32x32 adaptive

[![shot1_32_b1_an_sn](http://the-witness.net/news/wp-content/gallery/precomputed-lighting-2/thumbs/thumbs_shot1_32_b1_an_sn.jpg)](http://the-witness.net/news/wp-content/gallery/precomputed-lighting-2/shot1_32_b1_an_sn.jpg)

32x32

[![shot1_64_b1_an_sn](http://the-witness.net/news/wp-content/gallery/precomputed-lighting-2/thumbs/thumbs_shot1_64_b1_an_sn.jpg)](http://the-witness.net/news/wp-content/gallery/precomputed-lighting-2/shot1_64_b1_an_sn.jpg)

64x64

[![shot1_128_b1_ansn](http://the-witness.net/news/wp-content/gallery/precomputed-lighting-2/thumbs/thumbs_shot1_128_b1_ansn.jpg)](http://the-witness.net/news/wp-content/gallery/precomputed-lighting-2/shot1_128_b1_ansn.jpg)

128x128

**Corner:**

[![shot2_32_b1_ay](http://the-witness.net/news/wp-content/gallery/precomputed-lighting-2/thumbs/thumbs_shot2_32_b1_ay.jpg)](http://the-witness.net/news/wp-content/gallery/precomputed-lighting-2/shot2_32_b1_ay.jpg)

32x32 adaptive

[![shot2_32_b1_an_sn](http://the-witness.net/news/wp-content/gallery/precomputed-lighting-2/thumbs/thumbs_shot2_32_b1_an_sn.jpg)](http://the-witness.net/news/wp-content/gallery/precomputed-lighting-2/shot2_32_b1_an_sn.jpg)

32x32

[![shot2_64_b1_an_sn](http://the-witness.net/news/wp-content/gallery/precomputed-lighting-2/thumbs/thumbs_shot2_64_b1_an_sn.jpg)](http://the-witness.net/news/wp-content/gallery/precomputed-lighting-2/shot2_64_b1_an_sn.jpg)

64x64

[![shot2_128_b1_an_sn](http://the-witness.net/news/wp-content/gallery/precomputed-lighting-2/thumbs/thumbs_shot2_128_b1_an_sn.jpg)](http://the-witness.net/news/wp-content/gallery/precomputed-lighting-2/shot2_128_b1_an_sn.jpg)

128x128

**Side Wall:**

[![shot3_32_b1_ay](http://the-witness.net/news/wp-content/gallery/precomputed-lighting-2/thumbs/thumbs_shot3_32_b1_ay.jpg)](http://the-witness.net/news/wp-content/gallery/precomputed-lighting-2/shot3_32_b1_ay.jpg)

32x32 adaptive

[![shot3_32_b1_an_sn](http://the-witness.net/news/wp-content/gallery/precomputed-lighting-2/thumbs/thumbs_shot3_32_b1_an_sn.jpg)](http://the-witness.net/news/wp-content/gallery/precomputed-lighting-2/shot3_32_b1_an_sn.jpg)

32x32

[![shot3_64_b1_an_sn](http://the-witness.net/news/wp-content/gallery/precomputed-lighting-2/thumbs/thumbs_shot3_64_b1_an_sn.jpg)](http://the-witness.net/news/wp-content/gallery/precomputed-lighting-2/shot3_64_b1_an_sn.jpg)

64x64

[![shot3_128_b1_an_sn](http://the-witness.net/news/wp-content/gallery/precomputed-lighting-2/thumbs/thumbs_shot3_128_b1_an_sn.jpg)](http://the-witness.net/news/wp-content/gallery/precomputed-lighting-2/shot3_128_b1_an_sn.jpg)

128x128

The hardware used to compute these timings is an Intel Core i7-860 with an ATI Radeon 5870 (most of the process is GPU-bound).

The non-adaptive sampling renders one cube map for each shadow map texel, whereas the adaptive sampling uses heuristics to place samples and then smoothes the map between them.  At higher quality settings, adaptive sampling provides more-accurate results, but there always seem to be artifacts, so for the time being we are using it as a fast preview mode.  If at some point the quality becomes shippable, then we would switch to adaptive sampling for everything.

We also have a sub-texel sampling mode that improves quality, but I didn't play with that during this run.

This second set of images shows progressive bounces of the lighting with 64x64 cube maps, non-adaptive sampling.  (The first one is the same 64x64 image as above).  The times are: 1 bounce, 738 seconds; 2 bounces, 1438 seconds; 3 bounces, 2481 seconds.  The precompute time is basically linear in the number of bounces, as one might expect (the algorithm is basically just doing the same thing n times.)

[![shot3_64_b1_an_sn](http://the-witness.net/news/wp-content/gallery/precomputed-lighting-2/thumbs/thumbs_shot3_64_b1_an_sn.jpg)](http://the-witness.net/news/wp-content/gallery/precomputed-lighting-2/shot3_64_b1_an_sn.jpg)

1 bounce

[![shot3_64_b2_an_sn](http://the-witness.net/news/wp-content/gallery/precomputed-lighting-2/thumbs/thumbs_shot3_64_b2_an_sn.jpg)](http://the-witness.net/news/wp-content/gallery/precomputed-lighting-2/shot3_64_b2_an_sn.jpg)

2 bounces

[![shot3_64_b3_an_sn](http://the-witness.net/news/wp-content/gallery/precomputed-lighting-2/thumbs/thumbs_shot3_64_b3_an_sn.jpg)](http://the-witness.net/news/wp-content/gallery/precomputed-lighting-2/shot3_64_b3_an_sn.jpg)

3 bounces
