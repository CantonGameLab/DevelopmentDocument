# Graphics Tech: Multi-lightmaps

- **作者**：Jonathan Blow
- **日期**：2010-04-12
- **分类**：—
- **原文**：http://the-witness.net/news/http://the-witness.net/news/graphics-tech-multi-lightmaps/
- **来源**：the-witness.net 官方开发博客（文章页全文，2010–2012 技术帖，RSS 窗口之外）

---

Ignacio has implemented the first version of the handling for light sources that change (doors that open or close, lights that can be switched on or off, etc).  The idea is that we just precompute different lightmaps for each of these cases and blend between them at runtime.  In the future (not the future of this game, but the general computer graphics future) when we have realtime global illumination, this would not be necessary; but for now this is much faster to compute and much easier to implement.  The drawback is that we have to think about the different cases in advance (things can't be *too* dynamic) and the amount of lightmap storage space grows rapidly as the number of variables grows.

We don't yet smoothly interpolate between the maps in the shader; we just switch the maps outright.  Interpolation is coming soon.  But in screenshots you can't see changing conditions anyway, so it's time for some screenshots.

First is the house with the door closed, then with the door open.  After that comes the sculpture room, with two light sources toggled in various ways (see the captions on each picture).  For now you'll have to forgive the light leaking in the corners and the shadow speckles on the walls; they are due to issues with the dynamic shadow system (which is not really related to what is being shown here) and those issues have yet to be resolved!

        [[Show as slideshow]](http://the-witness.net/news/2010/04/graphics-tech-multi-lightmaps/nggallery/slideshow)

            [![witness_shot_2010_04_11_16_06__1](http://the-witness.net/news/wp-content/gallery/multi-lightmaps-1/thumbs/thumbs_witness_shot_2010_04_11_16_06__1.jpg)](http://the-witness.net/news/wp-content/gallery/multi-lightmaps-1/witness_shot_2010_04_11_16_06__1.jpg)

            [![witness_shot_2010_04_11_16_07__2](http://the-witness.net/news/wp-content/gallery/multi-lightmaps-1/thumbs/thumbs_witness_shot_2010_04_11_16_07__2.jpg)](http://the-witness.net/news/wp-content/gallery/multi-lightmaps-1/witness_shot_2010_04_11_16_07__2.jpg)

            [![witness_shot_2010_04_11_16_26__1](http://the-witness.net/news/wp-content/gallery/multi-lightmaps-1/thumbs/thumbs_witness_shot_2010_04_11_16_26__1.jpg)](http://the-witness.net/news/wp-content/gallery/multi-lightmaps-1/witness_shot_2010_04_11_16_26__1.jpg)

            [![witness_shot_2010_04_11_16_27__3](http://the-witness.net/news/wp-content/gallery/multi-lightmaps-1/thumbs/thumbs_witness_shot_2010_04_11_16_27__3.jpg)](http://the-witness.net/news/wp-content/gallery/multi-lightmaps-1/witness_shot_2010_04_11_16_27__3.jpg)

            [![witness_shot_2010_04_11_16_26__2](http://the-witness.net/news/wp-content/gallery/multi-lightmaps-1/thumbs/thumbs_witness_shot_2010_04_11_16_26__2.jpg)](http://the-witness.net/news/wp-content/gallery/multi-lightmaps-1/witness_shot_2010_04_11_16_26__2.jpg)

            [![witness_shot_2010_04_11_16_27__4](http://the-witness.net/news/wp-content/gallery/multi-lightmaps-1/thumbs/thumbs_witness_shot_2010_04_11_16_27__4.jpg)](http://the-witness.net/news/wp-content/gallery/multi-lightmaps-1/witness_shot_2010_04_11_16_27__4.jpg)
