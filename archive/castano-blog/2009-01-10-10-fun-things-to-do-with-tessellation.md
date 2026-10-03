# 10 Fun Things to do with Tessellation

- **作者**：Ignacio Castaño
- **日期**：2009-01-10（更新于 2019-01-17）
- **原文**：https://www.ludicon.com/castano/blog/2009/01/10-fun-things-to-do-with-tessellation/
- **来源**：ludicon.com/castano/blog（WordPress REST API 全文）

---

Hardware tessellation is probably the most notable feature of Direct3D11.

Direct3D11 was announced at the last [Gamefest](http://www.xnagamefest.com/conference_details08.htm) and a technical preview was released in the [November 2008 DirectX SDK](http://msdn.microsoft.com/en-us/directx/aa937788.aspx). Hardware implementations are expected to be available this year.

[missing image]

Direct3D11 extends the Direct3D10 pipeline with three new stages: Two programmable shader stages (the Hull and Domain Shaders), and a fixed function stage (the Tessellator). More details can be found [here](http://www.realtimerendering.com/blog/direct3d-11-details-part-ii-tessellation/) and [here](http://www.gamasutra.com/view/feature/3759/sponsored_feature_introducing_.php).

Rendering of Catmull-Clark subdivision surfaces is often mentioned as the primary application for the tessellation pipeline, but there are many other interesting uses that have not received that much attention.

I thought it would be interesting to take a closer look at those other applications, and submitted a proposal to do that at GDC’09. However, it seems that the organizers do not think tessellation is as interesting as I do, or they didn’t like my proposal, or maybe it’s just that they know I’m a lousy speaker. I will never know, because the gracious feedback of the GDC review committee can be represented by a single boolean.

In any case, here’s a brief overview of the 10 fun things that I was planning to talk about. I don’t get very deep into the technical details, but in future posts I may describe some of these applications more thoroughly. Please, leave your comments if there’s something you would like to learn more about.

#### PN-Triangles

[Curved PN Triangles](http://www.cise.ufl.edu/research/SurfLab/papers/00ati.pdf) is a triangle interpolation scheme that operates directly on triangle meshes whose vertices are composed of positions and normals (PN stands for Point-Normal).

[missing image – PN Triangles]

It’s an interesting way of improving visual quality that offers a simple migration path, since assets do not need to be heavily modified.

The PN Triangle evaluation consists of two steps: First, for every triangle of the input mesh a triangular cubic patch is derived solely from the vertex positions and normals; no adjacency information is required. Then, the resulting patch is subdivided or tessellated for rendering.

The resulting surface is smoother than the polygonal surface, but does not have tangent continuity in general, and that results in shading discontinuities. To hide these discontinuities normals are interpolated independently using either linear or quadratic interpolation. These normals are not the true surface normals, but they provide a smooth appearance to the surface.

This two-step evaluation maps very well to the Direct3D11 tessellation pipeline. The evaluation of the control points can be performed in the Hull Shader, the fixed function tessellator can produce a tessellation pattern in the triangle domain, and the actual surface can be evaluated for each of the tessellated vertices in the Domain Shader.

[missing image – Scalar Tagged PN Triangles]

In order to support sharp edges a rim of small triangles is added along the edges. That increases the number of patches, and it’s not entirely clear how to properly texture map them. [Scalar Tagged PN-Triangles](http://iparla.labri.fr/publications/2005/BRS05b/) solve that problem in a more elegant way by tagging each crease vertex with three scalar that act as shape controllers and modify the construction of the surface control points. However, this representation does not support crease corners.

#### Silhouette Refinement

When tessellation is enabled the only supported primitive type is the patch primitive. In Direct3D11 a patch is an abstract primitive with an arbitrary number of vertices. You can use patches to represent traditional primitives (ie. a triangle is just a patch with 3 vertices), but this also enables you to represent other input primitives with arbitrary topology and additional connectivity information.

An interesting extension of of PN-Triangle tessellation is to augment the input triangles with the neighbor vertices in order to perform silhouette refinement.

With this additional information it’s possible to compute tessellation factors in he Hull Shader based on whether an edge is on the silhouette or the interior of the mesh. Then the fixed function tessellator uses these edge tessellation factors to produce a semi-regular tessellation pattern and the Domain Shader transforms it to interpolate the surface.

#### Phong Tessellation

[missing image – phong tessellation]

[Phong Tessellation](http://user.cs.tu-berlin.de/~boubek/papers/PhongTessellation/) is a geometric version of Phong interpolation, but applied to vertex positions instead of normals.

First, points are interpolated linearly over each triangle using its barycentric coordinates, then the points are projected onto the planes defined by the corner position and normal, and finally the result of the three projections is interpolated again.

This procedure produces a smooth surface comparable to PN Triangles, but its evaluation is much cheaper, since no additional control points need to be computed.

#### Bezier Surfaces

Curved surfaces are not only useful for characters, but also for level geometry and objects.

[missing image – Quake 3 Arena]

[id Software](http://www.idsoftware.com/) introduced the use of quadratic Bezier patches for architectural geometry in [Quake 3 Arena](http://www.idsoftware.com/games/quake/quake3-arena/) and has been using them ever since.

Climax Brighton’s [Moto GP](http://www.gamasutra.com/features/20020626/hargreaves_02.htm) used cubic Bezier patches to model the motorcycles.

Bezier patches can be evaluated very efficiently, because they don’t need any information about the surrounding mesh. As these games show, tessellation hardware is not required to render these surfaces. However, hardware tessellation will allow doing it much more efficiently, and will facilitate the use of these and more complex surfaces.

#### Approximation to Subdivision Surfaces

Rendering of approximated Catmull-Clark subdivision surfaces is probably the most anticipated application of hardware accelerated tessellation. Several approximation methods exist.

[missing images]

Approximating Catmull-Clark Subdivision Surfaces with Bicubic Patches is the most popular one. This approximation constructs a geometry patch and a pair of tangent patches for each quadrilateral face of the control mesh. The geometry patch approximates the shape and silhouette, but does not provide tangent continuity. A smooth normal field is constructed using two additional tangent patches. The approximation supports boundaries and has also been extended to support creases in [Real-Time Creased Approximate Subdivision Surfaces](http://cs.nyu.edu/~kovacs/cgi-bin/moin.cgi/RealTimeCreasedACC).

[GPU Smoothing of Quad Meshes](http://www.cise.ufl.edu/research/SurfLab/papers/smi08.pdf) proposes an alternative approximation using piecewise quartic triangular patches that have tangent continuity and do not require additional tangent patches to provide a smooth appearance. In [Fast Parallel Construction of Smooth Surfaces from Meshes with Tri/Quad/Pent Facets](http://www.cise.ufl.edu/research/SurfLab/papers/08poly.pdf) the same approach is extended to approximate triangular and pentagonal faces.

[missing image]

(c) Kenneth Scott, id Software

Gregory patches are a more compact representation that also provides a very similar approximation, but only support quad and triangle control faces.

The availability of sculpting tools like [ZBrush](http://www.pixologic.com/) and [Mudbox](http://usa.autodesk.com/adsk/servlet/index?siteID=123112&id=10707763) makes it possible to create highly detailed meshes. Displaced subdivision surfaces provide a compact and efficient representation for these meshes.

#### Rendering Geometry Images

Another approach to render highly detailed surfaces is to use [geometry images](http://research.microsoft.com/~hoppe/gim.pdf). While geometry images can be rendered very efficiently, their video memory requirements are generally higher than displacement maps due to the lack of high precision texture compression formats. Traditional animation algorithms are not possible with this representation, and view dependent tessellation level evaluation is complicated, because geometry information is not directly available at the Hull Shader stage. However, geometry images may be the fastest approach to render small static objects at fixed tessellation levels.

#### Terrain Rendering

Terrain rendering is one of the most obvious applications for tessellation. The flexibility of the tessellation pipeline enables the use of [sophisticated algorithms](http://developer.nvidia.com/object/siggraph-2008-terrain.html) to evaluate the level of refinement of the terrain patches, and frees you from having to worry about many of the implementation details.

[missing image – Saga of Ryzom]

It’s also possible to extend traditional terrain engines with arbitrary topologies. Some MMORPGs are already doing that to create more rich environments.

For example [Saga of Ryzom](http://www.ryzom.com/en/), a game that is based on the Nevrax engine, uses cubic patches to model the terrain, which enables them to create impressive cliffs and overhangs.

[missing image – Saga of Ryzom]

Tessellation should make it possible to combine regular heightfields, with caves, cliffs, arches, and other interesting rock formations.

I think that ZBrush or Mudbox would be excellent tools to create natural looking rugged terrain.

#### Hair Rendering

Efficient hair rendering is one of the most interesting applications of the Direct3D11 tessellation pipeline. In addition to triangular and quad patches the fixed function tessellator can also generate lines, which are very useful for applications like hair and fur rendering.

[missing image – nalu]

The algorithm described in [Hair Animation and Rendering in the Nalu Demo](http://http.developer.nvidia.com/GPUGems2/gpugems2_chapter23.html) maps very well to the tessellation pipeline.

As shown in [Real-Time Rendering of Realistic Hair](http://developer.nvidia.com/object/siggraph-2008-hair.html), the use of the hardware tessellation pipeline makes it very easy to simulate and render realistic hair with high geometric complexity in real-time.

That’s possible, because the simulation is performed only on a few hundred guide hairs, that are expanded by the tessellator into thousands of hair strands.

#### Rendering Panoramas

Another application for tessellation is to perform arbitrary non linear projections, that is useful, for example, to create real-time panoramas.

Since graphics hardware relies on homogeneous linear interpolation for rasterization, arbitrary projections and deformations at the vertex level result in errors unless the surface is sufficiently refined.

[missing image – panquake]

The traditional image based approach is to render the scene to a cube map and then perform an arbitrary projection of the cubemap to screenspace relying on texture hardware to do the sampling and interpolation. This was the approach taken in [Fisheye Quake](http://strlen.com/gfxengine/fisheyequake/index.html) and [Pan Quake](http://strlen.com/gfxengine/panquake/).

While that works well, it requires rendering the scene to the 6 cube faces, and sometimes results in oversampling or undersampling of some areas of the scene.

[missing image – panorama]

Dynamic Mesh Refinement on GPU using Geometry Shaders proposes the use of the geometry shader to dynamically refine the surfaces to prevent linear interpolation artifacts. However, the Geometry Shader operates sequentially and is not well suited for this task. On the other side, the dynamic mesh refinement algorithm maps well to the Direct3D11 tessellation pipeline.

#### Rendering of 2D curved shapes

While GPUs can render simple polygons, they are not able to automatically handle complex concave and curved polygons with overlaps and self intersections, without prior triangulation and tessellation.

[missing image – svg tiger]

The Direct3D11 tessellation pipeline is not designed to perform triangulation. However, there’s a well known method to render arbitrary polygons using the stencil buffer that can be used in this case. This method was first described in the [OpenGL Red Book](http://glprogramming.com/red/chapter14.html#name13), but was recently popularized by its [implementation in the Qt graphic library](http://zrusin.blogspot.com/2006/07/hardware-accelerated-polygon-rendering.html).

It’s possible to combine this technique with hardware tessellation to render curved tessellated shapes without the need of expensive CPU tessellation and triangulation algorithms.

---

7 Comments

 repi

Posted 11/1/2009 at 10:31 am | Permalink

Excellent post Ignacio! Great inspiration for future geometry pipelines & usages in games

 cb

Posted 11/1/2009 at 11:36 am | Permalink

Do you think you could do Reyes-style motion blur?

Similar to the Rendering Panoramas method that you mention – tesselate triangles until they are near 1 pixel size and then extrude them based on their velocity (assume the engine is passing a velocity vector per vertex or something) ?

 castano

Posted 11/1/2009 at 1:27 pm | Permalink

> Do you think you could do Reyes-style motion blur?

I think that tessellation does not help much in this setting. There’s no tessellation mode that creates multiple copies of the same triangle. However, you can do that in the geometry shader. The problem is how to combine these copies. You can use some sort of order independent transparency, which might actually be possible in Direct3D11, since pixel shaders support arbitrary gather and scatter operations.

In a reyes style render shading is performed in object space. Fast moving objects do not need to be shaded exactly, so using tessellation you can dynamically change the shading frequency based on this and other factors.

 ren canjiang

Posted 7/2/2009 at 3:55 am | Permalink

thank you for so interesting topics. i’m using opengl for demos, i hope it can catch up with dx11?-?

 sonali joshi

Posted 21/6/2009 at 4:17 am | Permalink

it was just ok

 Slawa

Posted 24/7/2009 at 10:40 am | Permalink

gud gemacht ) weiter so !

 Sarah

Posted 12/3/2010 at 9:39 pm | Permalink

You’re an excellent speaker, and have an interesting article. It’s a shame you didn’t get to speak! =(
