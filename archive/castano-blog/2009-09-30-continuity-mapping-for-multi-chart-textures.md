# Continuity Mapping for Multi-Chart Textures

- **作者**：Ignacio Castaño
- **日期**：2009-09-30（更新于 2019-01-17）
- **原文**：https://www.ludicon.com/castano/blog/2009/09/continuity-mapping-for-multi-chart-textures/
- **来源**：ludicon.com/castano/blog（WordPress REST API 全文）

---

[![](http://castano.ludicon.com/blog/wp-content/uploads/2009/09/continuity_mapping.jpg)](http://ima.udg.edu/~gonzalez/continuityMapping/paper1/index.html)[Naty Hoffman](http://www.realtimerendering.com/blog/full-list-of-siggraph-asia-2009-papers/) references a paper from [Siggraph Asia](http://www.siggraph.org/asia2009/index.php) titled [Continuity Mapping for Multi-Chart Textures](http://ima.udg.edu/~gonzalez/continuityMapping/paper1/index.html).

The paper provides a solution to a problem that I’ve talked [before](http://castano.ludicon.com/blog/?p=416), that multi-chart parameterizations introduce seams over meshes, and that these seams can produce severe artifacts in some use cases such as displacement mapping. While the solution that I propose removes the cracks in the mesh, it does not eliminate the seams entirely, in only eliminates the holes, so for that reason I still suggested that the use of seamless parameterization remains valuable.

The most interesting thing about the *Continuity Mapping* solution is that it does not require a re-parameterization of the mesh, allowing you to preserve the uv-map created by the modeler, which is sometimes useful. It’s cool that they reference [my presentation at Siggraph 2008](http://developer.nvidia.com/object/siggraph-2008-Subdiv.html), although I first proposed that solution a few months before at [Gamefest](http://developer.nvidia.com/object/gamefest-2008-subdiv.html), and more detailed descriptions of the technique are available in my blog.

In general, I agree with Naty’s assessment that the technique is likely to be inefficient due to divergent branching. Although it may make sense for some applications, it’s unlikely it will be adopted for use in games. Naty describes some other issues, but one that I think is important as well is that it’s unclear how their sewing technique can handle tangent space normal maps. None of the examples in the paper appear to use normal maps, so I suspect the authors may be aware of the problem.

With tangent space normal maps each chart has a different tangent space. Tangent frames are defined at the vertices and interpolated over the triangles, and the tangent spaces do not agree along the seams of the charts.

Per texel normals are then stored with respect to the chart’s tangent space. You cannot interpolate normals that belong to different charts directly. Instead, you have to first transform them to the same space and do the interpolation afterward. That’s generally done in the pixel shader (although it would be more correct to do it before texture filtering). However, their sewing technique introduces new triangles over which the tangent space is simply not well defined since tangent frames at opposite sides of the seam could have completely arbitrary directions and their interpolation would likely result in degenerate frames.
