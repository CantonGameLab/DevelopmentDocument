# D3DX UVAtlas released

- **作者**：Ignacio Castaño
- **日期**：2014-12-05
- **原文**：https://www.ludicon.com/castano/blog/2014/12/d3dx-uvatlas-released/
- **来源**：ludicon.com/castano/blog（WordPress REST API 全文）

---

I think it’s really awesome that Microsoft and Xin Huang released the [source code of their D3DX mesh parameterization library](https://uvatlas.codeplex.com/). Chuck announced it on [his blog](http://blogs.msdn.com/b/chuckw/archive/2014/11/14/uvatlas-return-of-the-isochart.aspx).

There’s a lot of good stuff in there, more than in any of the previous D3DX source code releases. I was never too happy with the k-means style clustering that we use in The Witness, top-down spectral clustering seems a much better approach. Also their stretch-minimization parameterization is certainly better than our plain LSCM.

I wrote about our implementation in [this article](http://the-witness.net/news/2010/03/graphics-tech-texture-parameterization/). A few people asked for our code and we released it [here](https://github.com/Thekla/thekla_atlas). However, today I’d recommend using Xin Huang’s as a better starting point.
