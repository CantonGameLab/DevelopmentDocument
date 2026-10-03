# Watertight Texture Sampling

- **作者**：Ignacio Castaño
- **日期**：2009-01-01（更新于 2019-01-17）
- **原文**：https://www.ludicon.com/castano/blog/2009/01/watertight-texture-sampling/
- **来源**：ludicon.com/castano/blog（WordPress REST API 全文）

---

One of the problems when implementing displacement mapping is dealing with texture seams.

Texture seams are discontinuities in the parameterization. These discontinuities are always necessary unless the mesh has the topology of a disk, but in general meshes need to be partitioned into charts that are then parameterized independently.

[missing image]

This problem is not new. When using color and normal maps, texture seams usually cause color and lighting discontinuities. Artists usually deal with these artifacts by placing the seams on areas of the model, where they are less visible, so that the artifacts become less noticeable. However, when using displacement maps, the seams cause holes in the mesh, which produce much more visible artifacts that are harder to hide.

#### A Simple Solution

A simple solution to this problem is to manually alter the geometry along the seams to make it self intersect. While that does not result in watertight surfaces, the resulting holes are not visible. The main problem of this approach is that it requires artist intervention, creates open meshes, and only works for opaque surfaces; it would be nice to have more robust solutions.

#### Seamless Parameterization Methods

Fortunately this problem has been studied extensively and seamless parameterization methods have been developed. These are automatic parameterizations in which the chart texels are properly aligned across boundaries.

Displacement maps are generally not painted using traditional image editing applications, but created in specialized sculpting tools (such us [ZBrush](http://www.zbrush.com/) and [Mudbox](http://www.mudbox.com/)) or generated procedurally in attribute capture tools like [xNormal](http://www.xnormal.net/1.aspx). That means that it’s possible to store displacements using automatic parameterizations, since the artist does not need to edit the texture manually.

The most straightforward seamless parameterization method is the one used by ZBrush, which is very similar to the ones proposed in [Meshed Atlases for Real-Time Procedural Solid Texturing](http://graphics.cs.uiuc.edu/~jch/papers/rtpst.pdf). ZBrush maps every face of the mesh to a quad in texture space, so that all edges are either vertical or horizontal, and have the same length.

This method is very easy to implement, but has several problems:

- It introduces a large number of seams in the mesh, which increments the number of vertex transforms.

- It does not make efficient use of the texture space, because all faces, independently of their area, are mapped to quads of the same size.

ZBrush provides an option to group faces into larger charts while preserving the edge length and orientation, which helps reducing the number of vertex transforms. It also has an option to scale the charts in proportion to their surface area, but that breaks the seamlessness.

[missing image]

In order to alleviate these problems, another solution is to use rectangular charts (instead of single faces) to map them to texture-space quads.

That was first proposed in [Seamless Texture Atlases](http://www.cs.jhu.edu/~bpurnomo/STA/index.html), where rectangular charts are created by first clustering polygons into arbitrary sided charts and then partitioning them into quadrilaterals using a Catmull-Clark-inspired scheme:

[missing image]

An entirely different approach is described in [Spectral Surface Quadrangulation](http://graphics.cs.uiuc.edu/~garland/papers/ssq.pdf). In this paper a quadrangulation is constructed from the optimized Morse-Smale complex of the natural harmonics of the surface. The main limitation of this approach is that it only handles closed surfaces, and requires manual selection of the eigenfunction to produce charts of the desired size. [Spectral Quadrangulation with Orientation and Alignment Control](http://www.cad.zju.edu.cn/home/hj/Huang08SpectralQuad/Huang08SpectralQuad.pdf) solves these problems and also adds support for explicit constraints.

[missing image]

These two methods create quadrangulations without T-Junctions. That seems like a nice property, but [Rectangular Multi-Chart Geometry Images](http://graphics.cs.uiuc.edu/~jch/papers/rmcgi.pdf) shows that it’s possible to remove that constraint and still achieve smooth parameterizations, resulting in better parameterizations with less distortion.

The most interesting method is probably the one described in [Designing Quadrangulations with Discrete Harmonic Forms](http://www.geometry.caltech.edu/pubs/TACD06.pdf). This method is even more flexible; instead of defining charts before the parameterization, it introduces singularity points in the mesh and computes the parameterization globally. Then the mesh can be cut connecting the singularity points arbitrarily.

Other methods try to achieve continuity between patches using constraints and parameterizing adjacent patches simultaneously. That’s for example the case of [Matchmaker: Constructing Constrained Texture Maps](http://www.cs.ubc.ca/~vlady/matchmaker/Matchmaker.pdf), but it only minimizes the discontinuities and does not fully remove them.

For more information about parameterization methods these two surveys are a great resource:

- [Surface Parameterization: a Tutorial and Survey](http://www2.in.tu-clausthal.de/~hormann/papers/Floater.2005.SPA.pdf) by Michael S. Floater and Kai Hormann

- Mesh Parameterization Methods and Their Applications by Alla Sheffer, Emil Praun, and Kenneth Rose

#### Watertightness and Floating Point Precision

Modern hardware uses a floating point representation to interpolate texture coordinates. However, when using programmable tessellation hardware as specified by Direct3D11, interpolation is performed explicitly in the domain shader (or in the vertex shader when using instanced tessellation on pre-Direct3D11 GPUs). This is done to enable the use of higher order interpolation, but also allows the use of fixed point interpolation.

[missing image]

That’s important, because the use of floating point for interpolation causes some problems. Floating point values have more precision closer to the origin than farther from it. As a result, interpolation of texture coordinates along an edge closer to the origin will produce a different set of samples than interpolation along an edge that is farther from it. This is exactly what happens on texture seams and will result in small cracks in the mesh even when using a seamless parameterization.

If that seems surprising, then I’d recommend reading [What Every Computer Scientist Should Know About Floating-Point Arithmetic](http://docs.sun.com/source/806-3568/ncg_goldberg.html).

It’s also important to note that a seamless parameterization and fixed point interpolation are not sufficient conditions to achieve watertightness. It’s also necessary to generate the displacement maps appropriately so that the values of the texels along the chart boundaries match exactly along both sides of the seams.

#### Zippering Methods

A different approach is to introduce a triangle strip connecting the vertices along the seam. These strips can be generated with the same tessellation unit used to generate the patches, by setting the tessellation level equal to 1 in one of the parametric directions. This solves the problem nicely, but requires rendering more patches, and introduces additional triangles that are almost degenerate.

[missing image]

Another interesting solution is the zippering method proposed in the [Multi-Chart Geometry Images](http://research.microsoft.com/en-us/um/people/hoppe/proj/mcgim/) paper. The idea that the paper proposes is to sample the displacement (or the geometry image) on both sides of the seam and to use the average of the two samples.

The main problem of this approach is that it requires two texture samples along the seams, which means you have to take two samples in all cases, or use branching to take an extra sample on the seam vertices only.

The averaging method does not work for corners. Along the edges there are only two possible displacement values, one for each side of the seam. However, on corners there are more than two. Storing an arbitrary number of texture coordinates, and taking an arbitrary number of texture samples would be too expensive. A simple solution is to snap the corner texture coordinates to the nearest texel, and make sure that the displacement value for that vertex is the same for all patches that meet at that corner.

A cheaper solution that only requires a single texture sample, and that handles corners more gracefully is to define patch ownership of the seams. This is what I have proposed at [Gamefest](http://developer.nvidia.com/object/gamefest-2008-subdiv.html) and [SIGGRAPH](http://developer.nvidia.com/object/siggraph-2008-Subdiv.html) last year.

By designating the patch owner for every edge and corner, all patches can agree what texture coordinate to use when sampling the displacement at those locations. That means that for every edge and for every corner we need to store the texture coordinates of the owner of those features. That’s a total of 4 texture coordinates per vertex, (16 for quads and 12 for triangles).

At runtime, only a single texture sample is needed; the corresponding texture coordinate can be selected with a simple calculation:

`

```

// Compute texture coordinate indices (0: interior, 1,2: edges, 3: corner)
int idx0 = 2 * (uv.x == 1) + (uv.y == 1);
int idx1 = 2 * (uv.y == 1) + (uv.x == 0);
int idx2 = 2 * (uv.x == 0) + (uv.y == 0);
int idx3 = 2 * (uv.y == 0) + (uv.x == 1);

// Barycentric interpolation of texture coordinates
float2 tc = bar.x * texCoord[0][idx0] +
            bar.y * texCoord[1][idx1] +
            bar.z * texCoord[2][idx2] +
            bar.w * texCoord[3][idx3];
```

`

#### Partition of Unity

The zippering methods produce watertight results independently of the parameterization. However, if the parameterization is not seamless or if the features of the displacement map are different on each side of the seam, then that will result in sharp discontinuities, not holes, but undesirable creases along the seams.

[missing image]

These problems can be avoided using a seamless parameterization and generating the displacement maps making sure that the displacements match along the seams. However, another solution is to use a [partition of unity](http://portal.acm.org/citation.cfm?id=344990).

A partition unity is a method to combine multiple texture parameterizations to produce smooth transitions between them. The idea is to define transition regions around the seams, so that on those regions both parameterizations are used to sample the texture and the results are blended smoothly.

The zippering methods described before are just a special case of a partition of unity in which the blend function is just the [unit step function](http://portal.acm.org/citation.cfm?id=344990).

#### Conclusions

There are many different solutions to achieve watertightness when sampling of displacement maps. I personally prefer the zippering methods, since they don’t impose any restriction on the parameterization of the mesh, and work with arbitrary displacement maps. They are easy to implement, and do not add much overhead to the shaders, even though they increase the number of texture coordinates. Note that even when using zippering methods to guarantee watertightness, the use of seamless (or nearly seamless) parameterizations is still useful, because they eliminate any visible crease or discontinuity along the seams.

 cb

Posted 1/1/2009 at 12:51 pm | Permalink

Very awesome post !!

It’s a shame that texture coordinates are true floats and not something like 16.16 fixed point. It basically forces you to use zippering. If you had fixed point you could make quadrilateral charts and put the corners exactly on pixels and make the edges the same length and I believe that would work.

 castano

Posted 1/1/2009 at 4:07 pm | Permalink

There’s actually nothing stopping you from representing texture coordinates using fixed point. The floating point precision problems only matter in the domain shader, where two instances of the same vertex at opposite sides of the seam must sample the same value from the texture. In the domain shader interpolation is done explicitly, and the math can be done in fixed point.

However, the problem is a bit more complicated than what I’ve described in the article. Hardware bilinear interpolation of texels is not symmetric. Sampling at 0.7 between A and B is not the same as sampling at 0.3 between B and A. Nearest filtering is not symmetric either, the result of sampling at 0.5 is undefined.

For this reason mapping the faces to equal-sized texture-space quads does not solve the problem entirely. It would also be necessary to make sure that seam edge vectors have the same sense.

All that is doable, but the zippering method is so much more simple and robust that I think is in most cases preferable.

 castano

Posted 1/1/2009 at 4:29 pm | Permalink

BTW, all that becomes even more complicated if you take mipmapping into account.

 cb

Posted 2/1/2009 at 5:29 pm | Permalink

Urg I wrote something but didn’t answer the challenge and when I hit back my comment was gone. >:|

 castano

Posted 2/1/2009 at 7:16 pm | Permalink

Ouch, that sucks. Posts that fail the challenge are discarded and do not go to the moderation queue, so I have no way of recovering it…
