# Fun with in-engine color grading

- **作者**：Jonathan Blow
- **日期**：2012-08-03
- **分类**：—
- **原文**：http://the-witness.net/news/http://the-witness.net/news/fun-with-in-engine-color-grading/
- **来源**：the-witness.net 官方开发博客（文章页全文，2010–2012 技术帖，RSS 窗口之外）

---

Quite some time ago, Ignacio put some color grading features into the engine, so that you could tell the postprocessor to tweak colors in particular ways. For a while these features were very experimental; we just had them on a debug menu and there wasn't a way to save the settings. We didn't really use the features (in part because we were pretty busy just getting the basic parts of the game together).

Lately, Ignacio and Salvador took the features all the way so that we can use them easily in normal workflow. (This happened over some period of time, but the last parts came together this week). Now you can take a screenshot, screw around with the colors in Photoshop, and load it back into the game to control the grading. I am pretty sure this is not our idea, and we got it from the Uncharted guys or someone like that (Update: The idea was developed by Naty Hoffman and others; see the comments to this article).

Here's how it goes. First, I find an area the look of which I would like to change:

[![](http://the-witness.net/news/wp-content/uploads/2012/08/shot_2012.08.03__time_16_13_n02-512x288.png)](http://the-witness.net/news/wp-content/uploads/2012/08/shot_2012.08.03__time_16_13_n02.png)

Next I hold down the control key while taking the screenshot, causing it to be saved with a special color bar along the top of the image:

[![](http://the-witness.net/news/wp-content/uploads/2012/08/shot_2012.08.03__time_16_13_n03-512x288.png)](http://the-witness.net/news/wp-content/uploads/2012/08/shot_2012.08.03__time_16_13_n03.png)

Then I go into Photoshop and screw around with the colors. Here I am using the Hue/Saturation tool to shift the palette away from red:

[![](http://the-witness.net/news/wp-content/uploads/2012/08/lut_test_1-512x288.jpg)](http://the-witness.net/news/wp-content/uploads/2012/08/lut_test_1.jpg)

Or, instead, I may wish to shape the histogram of the image:

[![](http://the-witness.net/news/wp-content/uploads/2012/08/lut_test_2-512x288.jpg)](http://the-witness.net/news/wp-content/uploads/2012/08/lut_test_2.jpg)

That color bar at the top of the screen acts as a look-up table. The game doesn't need to understand what operations we have performed in Photoshop; it just knows what that color bar looked like when the screenshot was saved out, and, by comparing it to the colors in the result, knows how to transform any color in the rendered scene.

In the game, you can now attach these grading operations to spatial markers, so that color grading kicks in when you are inside specific areas. Here I am setting up some markers in the editor (the marker is the big white box):

[![](http://the-witness.net/news/wp-content/uploads/2012/08/shot_2012.08.03__time_16_23_n01-512x288.png)](http://the-witness.net/news/wp-content/uploads/2012/08/shot_2012.08.03__time_16_23_n01.png)

After setting up two of these boxes, one for each of the two weird color operations I created, then I can walk around in the game and have these operations apply to everything:

[![](http://the-witness.net/news/wp-content/uploads/2012/08/shot_2012.08.03__time_16_28_n04-512x288.png)](http://the-witness.net/news/wp-content/uploads/2012/08/shot_2012.08.03__time_16_28_n04.png)

[![](http://the-witness.net/news/wp-content/uploads/2012/08/shot_2012.08.03__time_16_27_n03-512x288.png)](http://the-witness.net/news/wp-content/uploads/2012/08/shot_2012.08.03__time_16_27_n03.png)

This gives us a really nice degree of control over how the game looks. We plan to use it to help with the color theming that will tie together specific areas.
