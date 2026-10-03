# Approximate Subdivision Shading

- **作者**：Ignacio Castaño
- **日期**：2009-01-07（更新于 2019-01-17）
- **原文**：https://www.ludicon.com/castano/blog/2009/01/approximate-subdivision-shading/
- **来源**：ludicon.com/castano/blog（WordPress REST API 全文）

---

[Subdivision Shading](http://perso.telecom-paristech.fr/~boubek/papers/SuSh/) is a new approach to compute normal fields of subdivision surfaces that was presented at SIGGRAPH Asia 2008.

![Subdivision Shading](http://www.ludicon.com/castano/blog/wp-content/uploads/2010/10/subdivision-shading-small.jpg)

It’s a very simple idea that provides surprisingly good results. The idea is to interpolate the subdivision surface normals using the same procedure used for positions. The resulting normal field is not the actual surface normal, but looks smooth and doesn’t exhibit some of the artifacts characteristic of subdivision surfaces at the extraordinary vertices.

The main disadvantage is that it looks too smooth compared to the real surface normal, but I’m not sure that’s necessarily bad. To avoid that problem the paper suggests blending the surface normals and the interpolated vertex normals so that the interpolated normals are used only in the proximity of extraordinary vertices.

![](http://www.ludicon.com/castano/blog/wp-content/uploads/2009/01/acc_nosush_pixolator-267x300.png)

![](http://www.ludicon.com/castano/blog/wp-content/uploads/2009/01/acc_sush_pixolator-267x300.png)

The same idea can also be applied to the [Approximate Catmull-Clark Subdivision Surfaces (Bezier ACC)](http://faculty.cs.tamu.edu/schaefer/research/acc.pdf) proposed by Loop and Schaefer. Instead of constructing the normal from the cross product of the tangent patches, the normal can be interpolated directly using the same approximation used to evaluate positions. The resulting surface has G1 discontinuities around extraordinary vertices in both the geometry and the normal field. However, I haven’t been able to notice any artifact due to that in any of our test models.

![](http://www.ludicon.com/castano/blog/wp-content/uploads/2009/01/acc_nosush_testmonster-267x201.png)

![](http://www.ludicon.com/castano/blog/wp-content/uploads/2009/01/acc_sush_testmonster-267x201.png)

This approach is quite efficient. It requires the same number of control points as Bezier ACC, but only one half of the stencil weights, because positions and normals are evaluated exactly the same way. The evaluation of the surface normal itself is also more efficient; evaluating a single 4×4 Bezier patch is faster than evaluating two 3×4 Bezier patches and computing a cross product.

However, the nicest thing about this scheme is that it facilitates watertightness when using displacement maps.

At [Gamefest 2008](http://developer.nvidia.com/object/gamefest-2008-subdiv.html) I mentioned that in order to achieve watertight surfaces when using displacement maps it was necessary to:

a) [Sample textures in a watertight way](http://castano.ludicon.com/blog/?p=416).

b) Construct a watertight normal field.

[[acc tangents]] (right aligned)

In order to obtain a watertight normal field, adjacent patches need to compute the normals along their edges consistently.

The approach proposed in the ACC paper produces a smooth and continuous normal field, but the normals at extraordinary vertices and along the edges that surround them are not consistent. Patches around the extraordinary vertices have tangents that lie on the same plane, but their cross product does not yield exactly the same normal.

There are several ways of to solve that problem, but all of them too complicated to cover them in this post. On the other side, the normal interpolation approach does not suffer from that problem and provides a much more simple solution.
