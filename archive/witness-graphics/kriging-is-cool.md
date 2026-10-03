# Kriging is cool.

- **作者**：Jonathan Blow
- **日期**：2010-05-24
- **分类**：—
- **原文**：http://the-witness.net/news/http://the-witness.net/news/kriging-is-cool/
- **来源**：the-witness.net 官方开发博客（文章页全文，2010–2012 技术帖，RSS 窗口之外）

---

In *The Witness* we decided that it's a good idea to have a heightfield terrain making up the bulk of the island surface.  The advantages of this are in rendering performance and in ease of texturing (it is relatively easy, with one continuously-parameterized terrain block, to get rid of seams; if your terrain is a bunch of otherwise-unrelated meshes, then what do you do?)   When we made this decision it seemed clear to me that the biggest disadvantage, for this game at least, was authoring the terrain.  There are typically a few different ways that large heightfields are built:

- Use an external terrain editing tool and then write an importer for its file format

- Build a terrain editing tool into the game's editor (this will require a bunch of work to do a good job, and will have fewer features than an external tool but they may be more appropriate for your game; also, you can make reasonable things happen to entities placed in the world when you interactively move the terrain around)

- Paint heightmaps in an image editor like Photoshop and hotload those from the game engine (requires much less programming; doesn't provide many features, but you have very fine control over the results; unfortunately, the editing process becomes pretty cumbersome)

These seemed to be the main approaches on offer.  However, I wasn't enthusiastic about doing any of the traditional things; I have written a number of terrain systems for games, and what bugged me, with respect to this game, was the way in which terrain handling tends to be very different from laying out objects in the world, and how this creates an extremely disjoint work process.

In concrete terms, this means that terrain was not going to be as malleable as the other objects in the world.  I am taking a very rough-drafty approach to the game; we are building areas, then moving them across the world if we feel they will work better somewhere else, rotating them as a group, etc.  The goal is to build a very-cohesive game world in which carefully-tuned gameplay is the most important thing -- where we more-or-less have a rough draft of the whole world set up before we go in and try to get serious about how everything looks.

This kind of approach just dies when you have elements that behave very differently, and are difficult to manipulate together, such as terrain and objects.  If I have two hills with a path winding between them, a bench by the path with a book upon the bench, and a signpost nearby, what happens when I want to move that scene across the map and then rotate it by 30 degrees?  With the entities, it is no problem, we just do that in the editor.  But with the terrain it just becomes a mess to move the hills at all, regardless of which of the above approaches are used.  And if you want to move and rotate the hills in sync with the entities so that the whole scene is intact... **good luck!**

To solve this problem, terrain needed to be built in the in-game editor, in a way that would be maximally malleable -- so that I can pick up a hill and rotate and drag it.  Because of the requirement for rotation, you can't really be manipulating samples directly; it has to be control surfaces of some kind (because if you are just blitting samples around, a few rotation operations are going to mangle whatever original shapes you made).

As for control surfaces, the first ideas that come to mind are things like spline patches.  But the problem with spline patches is that you have to be very careful managing the control points in a patch, and they ultimately aren't that malleable -- what if I want to split a patch in half without changing the shapes of areas near the edges?  What if I want to move one small, high-detail terrain area so that it overlaps somewhat with a big, low-detail area?  How is that going to work?  And if I have spline patches, then any time I instantiate a new grid of patches, I have to manage a bunch of individual control points, which is labor-intensive.  If I am rough-drafting, I want to do the minimum possible work to lay out a given area.  If I just generally want to build a hill but don't care much about its shape, I ought to be able to do that with just 2 or 3 control points, arbitrarily-placed.

Clearly what I wanted was a system that would just look at a set of unstructured control points -- no topology or anything -- and generate a terrain from those points in the local area.  When there is no topology or parameterization, you can merge and split groups of control points at will; you can have them overlap; you can do whatever you want.

I started putting together an ad hoc scheme for doing this, but did not take it very far before discovering that the mathematics for doing a good job at exactly this problem had already been invented decades ago.  The method is called [Kriging](http://en.wikipedia.org/wiki/Kriging), and it is well known in geostatistics.  If you've got a survey of height field data (or any other field data -- the density of a mineral at certain points, for instance), and that data is missing values for some locations, Kriging will give you a reasonable guess at the values of the field at the unknown points.

For rough-draft terrain modeling, we can turn the idea around; if we give a Kriging function only a small set of known data points, it will do a quite fantastic job of filling in the values at all the other points.  The basic math involves the inverse of an n by n matrix, where n is the number of known data points.  In theory that could become a huge computation, but for the number of points we may typically have in one local area of the map, the computation is easy for modern CPUs.  Kriging is not hard to implement; I started with some public domain code written at a university and modified it for our needs (though this basically involved rewriting it, as it was messy and had some serious bugs!  If anyone wants our version of the Kriging code, drop me a line).

Here's how we have it integrated into our game engine.  There's a type of object that exists as a set of terrain control points, which can be moved around the world arbitrarily, just like anything else.  It looks like this:

			    	[![untitled-1](http://the-witness.net/news/wp-content/gallery/kriging/dynamic/untitled-1.jpg-nggid0275-ngg0dyn-400x300x100-00f0w010c010r110f110r010t010.jpg)](http://the-witness.net/news/wp-content/gallery/kriging/untitled-1.jpg)

The only meaningful data in this object, with respect to terrain shaping, are the positions of the control points (purple boxes).  The surface is just a visualization; it tells you what surface these points would define if they were the only control points in the universe.  (Though actually, the surface defined by those points would extend infinitely in all directions; this visualization stays within the convex hull of the control points, which helps you see what you are doing when editing).

Right now these control points haven't actually been applied to the game's terrain (green surface below); they are just hovering above it.  Here's a shot from another angle:

			    	[![untitled-2](http://the-witness.net/news/wp-content/gallery/kriging/dynamic/untitled-2.jpg-nggid0280-ngg0dyn-400x300x100-00f0w010c010r110f110r010t010.jpg)](http://the-witness.net/news/wp-content/gallery/kriging/untitled-2.jpg)

I can press a key to add a new control point to this object:

			    	[![untitled-3](http://the-witness.net/news/wp-content/gallery/kriging/dynamic/untitled-3.jpg-nggid0281-ngg0dyn-400x300x100-00f0w010c010r110f110r010t010.jpg)](http://the-witness.net/news/wp-content/gallery/kriging/untitled-3.jpg)

The new control point doesn't affect the shape of the old surface in any way, which is very convenient.  I can drag the new control point at will:

			    	[![untitled-4](http://the-witness.net/news/wp-content/gallery/kriging/dynamic/untitled-4.jpg-nggid0282-ngg0dyn-400x300x100-00f0w010c010r110f110r010t010.jpg)](http://the-witness.net/news/wp-content/gallery/kriging/untitled-4.jpg)

Or add many more control points:

			    	[![untitled-5](http://the-witness.net/news/wp-content/gallery/kriging/dynamic/untitled-5.jpg-nggid0283-ngg0dyn-400x300x100-00f0w010c010r110f110r010t010.jpg)](http://the-witness.net/news/wp-content/gallery/kriging/untitled-5.jpg)

Here's that same visualization surface, with the control points and gridding turned off, so you can see it better:

			    	[![untitled-6](http://the-witness.net/news/wp-content/gallery/kriging/dynamic/untitled-6.jpg-nggid0284-ngg0dyn-400x300x100-00f0w010c010r110f110r010t010.jpg)](http://the-witness.net/news/wp-content/gallery/kriging/untitled-6.jpg)

Then, when I decide I like the shape, I can press another key to apply these control points to the game's terrain:

			    	[![untitled-7](http://the-witness.net/news/wp-content/gallery/kriging/dynamic/untitled-7.jpg-nggid0285-ngg0dyn-400x300x100-00f0w010c010r110f110r010t010.jpg)](http://the-witness.net/news/wp-content/gallery/kriging/untitled-7.jpg)

(Now there's a lot of z-fighting between the control surface and the terrain because they are in pretty much the same place.)

Here is the terrain with the control surface hidden.  Note that the terrain values have been smoothly interpolated, even in areas outside the control object:

			    	[![untitled-8](http://the-witness.net/news/wp-content/gallery/kriging/dynamic/untitled-8.jpg-nggid0286-ngg0dyn-400x300x100-00f0w010c010r110f110r010t010.jpg)](http://the-witness.net/news/wp-content/gallery/kriging/untitled-8.jpg)

*(By the way, those seams you see in the previous two pictures are lighting seams. These don't have anything to do with Kriging, it's just that the terrain blocks don't know how to look up their neighbors' height values when generating their surface normals. Any block-based terrain system has to solve a similar problem. It's easy to solve, but at a low priority on the to-do list, hence it hasn't been done yet. The distance between seams tells you how big the terrain blocks are, so the seams are sort of useful in this image!)*

*Suppose this control surface is part of a scene that I want to reorient. I'll rotate it about 70 degrees clockwise (now you'll see the surface intercutting more-heavily with the existing terrain values):*

			    	[![untitled-9](http://the-witness.net/news/wp-content/gallery/kriging/dynamic/untitled-9.jpg-nggid0287-ngg0dyn-400x300x100-00f0w010c010r110f110r010t010.jpg)](http://the-witness.net/news/wp-content/gallery/kriging/untitled-9.jpg)

And then once again, I apply Kriging to the terrain, generating the same hills in a rotated orientation:

			    	[![untitled-10](http://the-witness.net/news/wp-content/gallery/kriging/dynamic/untitled-10.jpg-nggid0276-ngg0dyn-400x300x100-00f0w010c010r110f110r010t010.jpg)](http://the-witness.net/news/wp-content/gallery/kriging/untitled-10.jpg)

To illustrate the way that interpolation is not confined to a single control object, and that in fact this is a control point soup, here I've created three control objects:

			    	[![untitled-11](http://the-witness.net/news/wp-content/gallery/kriging/dynamic/untitled-11.jpg-nggid0277-ngg0dyn-400x300x100-00f0w010c010r110f110r010t010.jpg)](http://the-witness.net/news/wp-content/gallery/kriging/untitled-11.jpg)

And here's what the terrain looks like with them applied:

			    	[![untitled-12](http://the-witness.net/news/wp-content/gallery/kriging/dynamic/untitled-12.jpg-nggid0278-ngg0dyn-400x300x100-00f0w010c010r110f110r010t010.jpg)](http://the-witness.net/news/wp-content/gallery/kriging/untitled-12.jpg)

And here's the final terrain along with the control objects (lots of z-fighting again):

			    	[![untitled-13](http://the-witness.net/news/wp-content/gallery/kriging/dynamic/untitled-13.jpg-nggid0279-ngg0dyn-400x300x100-00f0w010c010r110f110r010t010.jpg)](http://the-witness.net/news/wp-content/gallery/kriging/untitled-13.jpg)

Hopefully that's enough screenshots to illustrate the point.  Compared to splines, Kriging has the following highly beneficial properties (aside from the huge benefits of not requiring a topology, discussed above):

- Always interpolates every control point exactly

- Adding a new control point does not change the existing surface at all.

- No funny spline-like behavior (curves appearing in strange places, huge overshoots, etc)

**Hacking In Compact Support**

When doing Kriging in a video game, you probably don't want to compute the terrain for the entire world at once for every change, because that would be very expensive, and it also is a little bit unintuitive (since a change to a control point very far away could change some interpolated terrain nearby, even if only slightly).  However, the vanilla Kriging algorithm would require global computation and thus behave nonlocally.  For *The Witness* we clearly wanted our control points to affect only nearby areas, *i.e.* have compact support.  My first attempt at this was:

- Pick a radius r0 at which any control point has maximum effect, and a larger radius r1 at which the point has no effect, with smooth interpolation in-between.

- Terrain consists of contiguous blocks 33x33 samples in size.

- For each block of terrain you want to Krige, find all control points whose distance in the XY plane from any sample in the block is less than r1 (these are all the control points that could possibly affect any sample in the block).

- Pass all these points to the Kriging routine, which computes every sample in the block. It does this by building an inverse variogram matrix -- square with dimension (n+1) -- and performing one matrix-vector multiply for each terrain sample, which is pretty fast.

- For each sample, the Kriging routine gives us the set of weights we would use to blend each control point if the control points did not have compact support. To provide compact support, just compute an additional factor that is (distance - r1) / (r0 - r1) clamped to [0, 1], multiply all the weights by these factors, and then re-normalize the weights (ensure they all add to 1).

This almost works, but not quite; we get discontinuities between terrain blocks (which should not happen if everything is correct, since two vertices at the same XY position should always get the same Z value).  At first I thought this was a programming error, but after looking more closely at the situation I convinced myself that the reason is mathematical.  My assumption had been that a control point with a weight of 0 will have the same effect as a control point that never enters into the calculation, but this seems not to be true.

The step that I added, multiplying the compact-support factors against the weights provided by the matrix-vector multiply, is -- by the distributive property -- the same as multiplying each row of the matrix by the support factor before doing the matrix-vector multiply.  If a support factor is 0, then this makes the matrix rank-deficient, *i.e.* it could not have been the result of an inversion, which means that this step is not compatible with the mathematical technique being applied.  The idea of a 0 blend factor just isn't valid.  *(This also brings into question whether the idea of multiplying by the support factors is valid at all, but for now I will just observe that it produces very useful and convenient behavior. However, there are some small stepping artifacts that I see in some locations. I think these may be due to having too-low a density of control points in the world (some terrain samples having 0 control points inside r1) but there's a possibility that they aren't, and have something to do with the weighting procedure itself. I haven't investigated yet.)*

Now, as I type this, I am not 100% convinced that it is the right reasoning, and that something more like a typical programming error might be the problem.  My math is pretty rusty these days.  However, my updated version of the routine does not have discontinuities.  

Unfortunately, the fix for discontinuities has made the Kriging a bit slower.  What I do is, instead of building just one inverse variogram for the entire terrain block, I build a new variogram for every vertex, and include in that variogram only the control points that have nonzero support factors.  Thus the dimensions of the matrix will change from sample to sample, and I am inverting a new matrix for each output sample.

Unoptimized, this version of the algorithm takes between 5 and 25 seconds to recompute the terrain for the entire world, depending on how large r1 is.  This is fine for now, especially since editing operations only hit about 1/50 of the world or less at any given time.  However, it'll get slower as more control points are added to the world.

Fortunately, this first version of the discontinuity-fixing was intended to be slow -- I programmed it in the most straightforward way possible, to maximize the likelihood that it would work.  It is easy to think of ways to make it faster by caching the matrices, but it's unclear which of these would be fastest.  For example, if you just cache one copy of the matrix and invalidate it any time a new control point comes into or out of range, then you might easily find yourself in a situation where you oscillate between recomputing two different matrices as you work your way along the sample grid.  This is a little reminiscent of the kinds of problems that 3D hardware has, which store images in a non-linear way so that they can be cache-efficient when sampled along lines in arbitrary directions... but it's not clear to me how far to take that analogy or whether any applicable wisdom can be derived from it.

So I intend to optimize it, or come up with a faster solution to the discontinuity problem, but it's not clear yet what form that will take.
