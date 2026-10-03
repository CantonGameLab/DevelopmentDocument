# The Shipwreck

- **作者**：Orsi Spanyol
- **日期**：2013-09-12 18:25 UTC
- **分类**：Uncategorized
- **原文**：http://the-witness.net/news/2013/09/the-shipwreck/
- **来源**：the-witness.net 官方开发博客（文章页全文）

---

The shipwreck is an area of the island that has not been shown before, because up until recently it was one of the barest, most undeveloped areas we had. It grew bigger and bigger over the years (like most things on the island), from a little slab mockup Jon had by the shore, into a massive freighter with the usual,  intricate gameplay requirements.

[![shot_2013.09.12__time_09_59_n02](http://the-witness.net/news/wp-content/uploads/2013/09/shot_2013.09.12__time_09_59_n02-512x288.png)](http://the-witness.net/news/wp-content/uploads/2013/09/shot_2013.09.12__time_09_59_n02.png)

The process for building this ship was interesting. We have architects helping us with building designs, but even the architects were not entirely familiar with the structures of ships. We spent a lot of time looking at reference images, talking about the materials and how the entire structure would decay over time. They gave me a base design for the hull, deck, bridge, and the inner beams of the ship. I modeled that whole, then split it up into five pieces.

[![shipwreckpieces](http://the-witness.net/news/wp-content/uploads/2013/09/shipwreckpieces-512x258.jpg)](http://the-witness.net/news/wp-content/uploads/2013/09/shipwreckpieces.jpg)

The front, middle, and back pieces were kept somewhat intact, the rest was split into scattered rubble to dress the scene. Next, it was time to figure out the gameplay and decide what parts of the ship would be accessible and what parts would be rotten away. Because the ship was so huge and I was modeling it alone, I had to be careful about limiting what would be navigable and what would be seen, since I wanted to keep my workload to a minimum while still having very interesting, believable areas. I spent a long time cutting holes, bending floors and ripping out beams.

[![shot_2013.09.12__time_11_10_n04](http://the-witness.net/news/wp-content/uploads/2013/09/shot_2013.09.12__time_11_10_n04-512x288.png)](http://the-witness.net/news/wp-content/uploads/2013/09/shot_2013.09.12__time_11_10_n04.png)

Then, I had to figure out how to make a decaying heap of metal with our simple, clean style, as described by Eric in the last post. My first attempts had minimal detail in the geometry, with a lot of noise and contrast in the textures. It was exactly the opposite of what we usually do, but I was trying to develop a process for detailing the entire ship quickly, and it's a lot faster to use blendmaps to add noise than to tediously cut and shape geometry. It looked terrible, but I was at a loss for how to make it better quickly. Fortunately, Luis and Eric encouraged me to just reduce the contrast in the textures, and let the small details in the modeling stand on their own. It took ten seconds to lighten some textures, and all of a sudden I had something I was finally happy with. At first it felt wrong to leave large surfaces so plain, but the other artists were right. With our beautiful lightmaps and simple style, a little detail and a few modular rubble and rust pieces were all that was needed to make the space feel like it belonged to our game.

[![shot_2013.09.12__time_11_09_n03](http://the-witness.net/news/wp-content/uploads/2013/09/shot_2013.09.12__time_11_09_n03-512x288.png)](http://the-witness.net/news/wp-content/uploads/2013/09/shot_2013.09.12__time_11_09_n03.png)

This shipwreck is still not quite finished, but it is the last huge project on my plate before moving on to the many smaller projects and tasks we still need to complete to ship the game.
