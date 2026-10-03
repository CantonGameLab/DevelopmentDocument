# Irradiance Caching – Part 1

- **作者**：Ignacio Castaño
- **日期**：2011-07-14
- **分类**：—
- **原文**：http://the-witness.net/news/http://the-witness.net/news/irradiance-caching-part-1/
- **来源**：the-witness.net 官方开发博客（文章页全文，2010–2012 技术帖，RSS 窗口之外）
- **公式**：原文用 WordPress 的 LaTeX 服务渲染成图片，本归档已从图片 URL 还原成 `$…$` 行内公式（37 条）

---

This is the first article I wanted to publish when I started writing about the technology behind [The Witness](http://the-witness.net). I had just spent a week or so implementing irradiance caching with rotation and translation gradients. Extending the equations of the gradient estimation to the hemicube sample distribution had proven to be tricky and had taken me a considerable amount of effort. So, I thought it would be cool to document my derivation, so that others would not have to do the same. However, for that article to make sense I first had to provide some background, hence the previous two articles:

- [Lightmap Parameterization](http://the-witness.net/news/?p=120)

- [Hemicube Rendering and Integration](http://the-witness.net/news/?p=244)

Unfortunately, by the time I was done with these, the work I had done on the gradients was not so fresh anymore, which is why it has taken me so long to complete this article.

[![](http://the-witness.net/news/wp-content/uploads/2011/06/irradiance_gradients_0-512x288.jpg)](http://the-witness.net/news/wp-content/uploads/2011/06/irradiance_gradients_0.jpg)

In [my previous post](http://the-witness.net/news/?p=244) I mentioned the need to find an algorithm that would allow us to extrapolate the irradiance to fill lightmap texels with invalid samples, to smooth the resulting lightmaps to reduce noise, and to sample the irradiance at a lower frequency to improve performance. As some avid readers suggested *Irradiance Caching* solves all these problems. However, at the time I didn't know that, and my initial attempts at a solution were misguided.

### Texture Space Approaches

I had some experience writing baker tools to capture normal and displacement maps from high resolution meshes. In that setting it is common to use various image filters to fill holes caused by sampling artifacts and extend sampled attributes beyond the boundaries of the mesh parameterization. [Hugo Elias' popular article](http://freespace.virgin.net/hugo.elias/radiosity/radiosity.htm) also proposes a texture space hierarchical sampling method, and that persuaded me that working in texture space would be a good idea.

However, in practice texture space methods had many problems. Extrapolation filters only provide accurate estimates close to chart boundaries, and even then, they only use information from one side of the boundary, which usually results in seams. Also, the effectiveness of irregular sampling and interpolation approaches in texture space is greatly reduced by texture discontinuities and did not reduce the number of samples as much as desired.

After trying various approaches, it became clear that the solution was to work in object space instead. I was about to implement my own solution, when I learned that this is what irradiance caching was about.

### Irradiance Caching

This technique has such a terrible name that I would have never learned about it if it wasn't due to a friend's suggestion. I think that a much more appropriate name would be adaptive irradiance sampling or irradiance interpolation. In fact, in the [paper that introduced the technique for the first time](http://radsite.lbl.gov/radiance/papers/sg88/paper.html) Greg Ward referred to it as *lazy irradiance evaluation*, which seems to me a much more appropriate name.

There's plenty of literature on the subject and I don't want to repeat what you can learn elsewhere. So, in this article I'm only going to provide a brief overview, focus on the unique aspects of our implementation, and point you to other sources for further reference.

The basic idea behind irradiance caching is to sample the irradiance adaptively based on a metric that predicts changes in the irradiance due to proximity to occluders and reflectors. This metric is based on the split sphere model, which basically models the worst possible illumination conditions in order to predict the necessary distance between irradiance samples based on their distance to the surrounding geometry.

Interpolation between these samples is then performed using radial basis functions, the radius associated to each sample is also based on this distance. Whenever the contribution of the nearby samples falls below a certain threshold a new irradiance record needs to be generated, in our case this is done by rendering an hemicube at that location. In order to perform interpolation efficiently the irradiance records are inserted in an octree, which allows us to efficiently query the nearby records at any given point.

For more details, the [Siggraph '08 course](http://cgg.mff.cuni.cz/~jaroslav/papers/2008-irradiance_caching_class/index.htm) on the topic is probably the most comprehensive reference. There's also a book based on the materials of the course; it's slightly augmented, but in my opinion it does not add much value to the freely available material.

The [Physically Based Rendering book by Matt Pharr & Greg Humphreys](http://www.pbrt.org/) is an excellent resource and the [accompanying source code](https://github.com/mmp/pbrt-v2) contains a good, albeit basic implementation.

Finally, Rory Driscoll provides a good introduction from a programmer's point of view: [part 1](http://www.rorydriscoll.com/2009/01/18/irradiance-caching-part-1/), [part 2](http://www.rorydriscoll.com/2009/01/24/irradiance-caching-part-2/).

Our implementation is fairly standard, there are however a two main differences: First, we are sampling the irradiance using hemicubes instead of a stratified Montecarlo distribution. As a result, the way the we compute the irradiance gradients for interpolation is somewhat different. Second, we use a record placement strategy more suited to our setting. In part 1 I'll focus on the estimation of the irradiance gradients, while in part 2 I'll write about our record placement strategies.

### Irradiance Gradients

When interpolating our discrete irradiance samples using radial basis functions the resulting images usually have spotty or smudgy appearance. This can be mitigated by increasing the number of samples and increasing the interpolation threshold, which effectively makes them overlap and smoothes out the result. However, this also increases the number of samples significantly, which defeats the purpose of using irradiance caching.

One of the most effective approaches to improve the interpolation is estimating the irradiance gradients at the sampling points, which basically tell how the irradiance changes when the position and orientation of the surface changes. We cannot evaluate the irradiance gradients exactly, but we can find reasonable approximations with the information that we already have from rendering an hemicube.

In my previous article I explained that the irradiance integral was just a weighted sum over the radiance samples, where the contribution of each sample is the product of the radiance through each of the hemicube texels

$L_i$

, the solid angle of the texel

$A_i$

, and the cosine term

$\cos_{\theta_i}$

. That is, the irradiance

$E(\mathbf{x})$

 at a point

$\mathbf{x}$

 is approximated as:

$E(\mathbf{x}) \simeq \sum_{i=0}^N A_i L_i \cos\theta_i$

The irradiance gradients consider how each these terms change under infinitesimal rotations and translations and can be obtained by differentiating

$E(\mathbf{x})$

.

$\nabla E(\mathbf{x}) \simeq \sum_{i=0}^N \nabla A_i L_i \cos\theta_i$

The radiance term is considered to be constant, so the equation reduces to:

$\nabla E(\mathbf{x}) \simeq \sum_{i=0}^N L_i \nabla A_i \cos\theta_i$

In reality, the radiance is not really constant, but the goal is to estimate the gradients without using any information in addition to what we have already obtained by rendering the scene on a hemicube. So that we can improve the quality of the interpolation by only doing some additional computations while integrating the hemicube.

#### Rotation Gradient

The rotation gradient expresses how the irradiance changes as the hemicube is rotated in any direction:

$\nabla_r E(\mathbf{x}) \simeq \sum_{i=0}^N L_i \nabla_r A_i \cos\theta_i$

The most important observation is that as the hemicube rotates, the solid angle of the texels with respect to the origin remains constant. So, the only factor that influences the gradient is the cosine term:

$\nabla_r A_i \cos\theta_i = A_i \nabla_r \cos\theta_i$

With this in mind, the rotation gradient is simply the rotation axis scaled by the rate of change, that is, the angle gradient:

$\frac{\partial }{\partial \theta_i} \cos\theta_i = -\sin\theta_i$

And the rotation axis is given by the cross product of the z axis and the texel direction

$\mathbf{d}_i$

:

$\mathbf{v}_i = \left| \mathbf{d}_i \times (0, 0, 1) \right|$

Therefore:

$\nabla_r \cos\theta_i = -\mathbf{v}_i \sin\theta_i$

This can be simplified further by noting that

$\sin\theta_i$

 is the length of

$\mathbf{v}_i$

 before normalization and that results in a very simple expression:

$\nabla_r \cos\theta_i = (\mathbf{d}_{yi}, -\mathbf{d}_{xi}, 0)$

Finally, the rotation gradient for the hemisphere is the sum of the gradients corresponding to each texel.

$\nabla E(\mathbf{x}) \simeq \sum_{i=0}^N L_i A_i (\mathbf{d}_{yi}, -\mathbf{d}_{xi}, 0)$

The resulting code is trivial:

```
foreach texel, color in hemicube {
    Vector2 v = texel.solid_angle * Vector2(texel.dir.y, -texel.dir.x);
    rotation_gradient[0] += v * color.x;
    rotation_gradient[1] += v * color.y;
    rotation_gradient[2] += v * color.z;
}
```

#### Translation Gradients

The derivation of the translation gradients is a bit more complicated than the rotation gradients because the solid angle term is not invariant under translations anymore.

My first approach was to simplify the expression of the solid angle term by using an approximation that is easier to differentiate. Instead of using the exact texel solid angle like I had been doing so far, I approximated it by the differential solid angle scaled by the constant area of the texel, which is a reasonable approximation if the texels are sufficiently small.

In general, the differential solid angle in a given direction

$\Theta$

 is given by:

$d\omega_\Theta = \frac{\mathbf{n}\cdot\Theta}{r^2} da$

For the particular case of the texels of the top face of the hemicube, **n** is equal to the z axis. So, the differential solid angle is:

$d\omega_\Theta = \frac{\cos\theta}{r^2} da$

We also know that:

$\cos\theta = 1/r$

which simplifies the expression further:

$d\omega_\Theta = (\cos\theta)^3 da$

Using this result and factoring the area of the texels out of the sum we obtain the following expression for the gradient:

$\nabla_t E_z(\mathbf{x}) \simeq 4 \sum_{i=0}^N L_i \nabla_t (\cos\theta_i)^4$

The remaining faces have similar expressions, slightly more complex, but still easy to differentiate along the x and y directions. We could continue along this path and we would obtain closed formulas that can be used to estimate the translation gradients. However, this simple approach did not produce satisfactory results. The problem is that these gradients assume that the only thing that changes under translation is the projected solid angle of the texels, but that ignores the parallax effect and the occlusion between neighboring texels. That is, samples that correspond to objects that are close to the origin of the hemicube should move faster than those that that are farther, and as they move they may occlude nearby samples.

As you can see in the following lightmap, the use of these gradients resulted in smoother results in areas that are away from occluders, but produced incorrect results whenever the occluders are nearby.

![](http://the-witness.net/news/wp-content/uploads/2011/01/translation_gradient_comparison_a.png)

Left: Reference. Middle: Irradiance caching without gradients. Right: Irradiance caching with flawed gradients

The hexagonal shape corresponds to the ceiling of a room that has walls along its sides and a window through which the light enters. The image on the left is a reference lightmap with one hemicube sample per pixel. The image on the middle is the same lightmap computed using irradiance caching taking only 2% of the samples. Note that the number of samples is artificially low to emphasize the artifacts. On the right side the same lightmap is computed using the proposed gradients. If you look closely you can notice that on the interior the lightmap looks smoother, but close to the walls the artifacts remain.

This is exactly the same flaw of the gradients that Krivanek et al proposed in [Radiance Caching for Efficient Global Illumination Computation](http://cgg.mff.cuni.cz/~jaroslav/papers/tvcg2005/krivanek05radiance_caching.pdf), but was later corrected in the followup paper [Improved Radiance Gradient Computation](http://cgg.mff.cuni.cz/~jaroslav/papers/sccg2005/sccg2005-krivanek.pdf) by approaching the problem the same way Greg Ward did in the original [original Irradiance Gradients paper](http://radsite.lbl.gov/radiance/papers/erw92/paper.pdf).

I then tried follow the same approach. The basic idea is to consider the cosine term invariant under translation so that only the area term needs to be differentiated, and to express the gradient of the cell area in terms of the marginal area changes between adjacent cells. The most important observation is that the motion of the boundary between cells is always determined by the closest sample, so this approach takes occlusion into account.

Unfortunately we cannot directly use Greg Ward's gradients, because they are closely tied to the stratified Montecarlo distribution and we are using a hemicube sampling distribution. However, we can still apply the same methodology to arrive to a formulation of the gradients that we can use in our setting.

In our case, the cells are the hemicube texels projected onto the hemisphere and the cell area is the texel solid angle. To determine the translation gradients of the texel's solid angle is equivalent to computing the sum of the marginal gradients corresponding to each of the texel walls.

These marginal gradients are the wall normals projected onto the translation plane, scaled by the length of the wall, and multiplied by the rate of motion of the wall in that direction.

Since the hemicube uses a gnomonic projection, where lines in the plane map to great circles in the sphere, the texel boundaries of the hemicubes map to great arcs in the hemisphere. So, the length of these arcs is very easy to compute. Given the direction of the two texel corners

$\mathbf{d}_0, \mathbf{d}_1$

, the length of their hemispherical projection is:

$arclength(\mathbf{d}_0, \mathbf{d}_1) = \arccos{\mathbf{d}_0 \cdot \mathbf{d}_1}$

The remaining problem is to compute the rate of motion of the wall, which as Greg Ward noted has to be proportional to the minimum distance of the two samples.

The key observation is that we can classify all the hemicube edges in wo categories: Edges with constant longitude (

$\theta$

 is invariant), and edges with constant latitude (

$\phi$

 is invariant).

In each of these cases we can estimate the rate of change of edges with respect to the normal direction by considering the analogous problem in the [canonical hemispherical parametrization](http://mathworld.wolfram.com/SphericalCoordinates.html):

$r = \sqrt{x^2+y^2+z^2}$

$\phi = \arctan\frac{y}{x}$

$\theta = \arccos\frac{z}{r}$

For longitudinal edges we can consider how

$\theta$

 changes with respect to motion along the x axis:

$\frac{\partial\theta}{\partial x} = \frac{-\cos\theta}{r}$

and for latitudinal edges we can consider how

$\phi$

 changes with respect to motion along the y axis:

$\frac{\partial\phi}{\partial y} = \frac{-1}{r \sin\theta}$

As we noted before, the rate of the motion is dominated by the nearest edge, so

$r$

 takes the value of the minimum depth of the two samples adjacent to the edge.

A detailed derivation for these formulas can be found in [Wojciech Jarosz's dissertation](http://zurich.disneyresearch.com/~wjarosz/publications/dissertation/), which is now publicly available online. His detailed explanation is very didactic and I highly recommend reading it to get a better understanding of how these formulas are obtained.

Note that these are just the same formulas used by Greg Ward and others. In practice, the only thing that changes is the layout of the cells and the length of the walls between them.

As can be seen in the following picture, the new gradients produce much better results. Note that the appearance on the interior of the lightmap is practically the same, but closer to the walls the results are now much smoother. Keep in mind that artifacts are still present, because the number of samples is artificially low.

![](http://the-witness.net/news/wp-content/uploads/2011/06/translation_gradient_comparison.png)

Left: No gradients. Middle: Flawed translation gradients. Right: Improved translation gradients.

In order to estimate the translation gradients efficiently we precompute the direction and magnitude of the marginal gradients corresponding to each texel edge without taking the distance to the edge into account:

```
// Compute the length of the edge walls multiplied by the rate of motion
// with respect to motion in the normal direction
foreach edge in hemicube {
    float wall_length = acos(dot(d0, d1));
    Vector2 projected_wall_normal = normalize(cross(d0, d1).xy);
    float motion_rate = (constant_altitude(d0,d1) ?
        -cos_theta(d0,d1) :      // d(theta)/dx = -cos(theta) / depth
        -1 / sin_theta(d0,d1);   // d(phi)/dy = -1 / (sin(theta) * depth)
 
    edge.translation_gradient = projected_wall_normal * wall_length * motion_rate;
}
```

Then, during integration we split the computations in two steps. First, we accumulate the marginal gradients of each of the edges scaled by the minimum edge distance:

```
foreach edge in hemicube {
    float depth0 = depth(edge.x0, edge.y0);
    float depth1 = depth(edge.x1, edge.y1);
    float min_depth = min(depth0, depth1);
 
    texel[edge.x0, edge.y0].translation_gradient -= edge.gradient / min_depth;
    texel[edge.x1, edge.y1].translation_gradient += edge.gradient / min_depth;
}
```

Once we have the per texel gradient, we compute the final irradiance gradient as the sum of the texel gradients weighted by the texel colors:

```
foreach texel, color in hemicube {
    Vector2 translation_gradient = texel.translation_gradient * texel.clamped_cosine;
    translation_gradient_sum[0] += translation_gradient * color.x;
    translation_gradient_sum[1] += translation_gradient * color.y;
    translation_gradient_sum[2] += translation_gradient * color.z;
}
```

### Conclusions

Irradiance Caching provides a very significant speedup to our lightmap baker. On typical meshes we only need to render about 10 to 20% of the samples to approximate the irradiance at very high quality, and for lower quality results or fast previews we can get away with as few as 3% of the samples.

The use of irradiance gradients for interpolation allows reducing the number of samples significantly, or for the same number of samples produces much higher quality results. The following picture compares the results without irradiance gradients and with them, in both cases the number of samples and their location is the same, note how the picture at the bottom has much smoother lightmaps.

[![](http://the-witness.net/news/wp-content/uploads/2011/06/ic_comparison_1-351x384.jpg)](http://the-witness.net/news/wp-content/uploads/2011/06/ic_comparison_1.jpg)

I think that without irradiance caching the hemicube rendering approach to global illumination would have not been practical. That said, implementing irradiance caching robustly is tricky and a lot of tuning and tweaking is required in order to obtain good results.

*Note: This article is also published on [#AltDevBlogADay](http://altdevblogaday.com/2011/07/14/irradiance-caching-part-1/).*
