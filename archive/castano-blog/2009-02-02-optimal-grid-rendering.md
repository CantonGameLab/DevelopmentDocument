# Optimal Grid Rendering

- **作者**：Ignacio Castaño
- **日期**：2009-02-02（更新于 2019-01-17）
- **原文**：https://www.ludicon.com/castano/blog/2009/02/optimal-grid-rendering/
- **来源**：ludicon.com/castano/blog（WordPress REST API 全文）

---

This is a trick that I learned from [Matthias Wloka](http://www.linkedin.com/pub/matthias-wloka/0/376/b86) during my job interview at NVIDIA. I thought I had a good understanding of the behavior of the vertex post-transform cache, but embarrassingly it turned out it wasn’t good enough. I’m sure many people don’t know this either, so here it goes.

Rendering regular grids of triangles is common enough to make it worth spending some time thinking about how to do it most efficiently. They are used to render terrains, water effects, curved surfaces, and in general any regularly tessellated object.

It’s possible to simulate the native hardware tessellation by rendering a single grid multiple times, and the fastest way of doing that is using instancing. That idea was first proposed in [Generic Mesh Refinement on GPU](http://iparla.labri.fr/publications/2005/BS05/) and at NVIDIA we also have examples that show how to do that in [OpenGL](http://developer.download.nvidia.com/SDK/10.5/opengl/samples.html#instanced_tessellation) and [Direct3D](http://developer.download.nvidia.com/SDK/10.5/direct3d/samples.html#InstancedTessellation).

That’s enough for the motivation. Imagine we have a 4×4 grid. The first two rows would look like this:

```

* - * - * - * - *
| / | / | / | / |
* - * - * - * - *
| / | / | / | / |
* - * - * - * - *
```

With a vertex cache with 8 entries, the location of the vertices after rendering the first 6 triangles of the first row should be as follows:

```

7 - 5 - 3 - 1 - *
| / | / | / | / |
6 - 4 - 2 - 0 - *
| / | / | / | / |
* - * - * - * - *
```

And after the next two triangles:

```

* - 7 - 5 - 3 - 1
| / | / | / | / |
* - 6 - 4 - 2 - 0
| / | / | / | / |
* - * - * - * - *
```

Notice that the first two vertices are no longer in the cache. As we proceed to the next two triangles two of the vertices that were previously in the cache need to be loaded again:

```

* - * - * - 7 - 5
| / | / | / | / |
3 - 1 - * - 6 - 4
| / | / | / | / |
2 - 0 - * - * - *
```

Instead of using the straightforward traversal, it’s possible to traverse the triangles in Morton or Hilbert order, which are known to have better cache behavior. Another possibility is to feed the triangles to any of the standard mesh optimization algorithms.

All these options are better than not doing anything, but still produce results that are far from the optimal. In the table below you can see the results obtained for a 16×16 grid and with a FIFO cache with 20 entries:

```

Method          ACMR    ATVR
Scanline        1.062   1.882
NVTriStrip      0.818   1.450
Morton          0.719   1.273
K-Cache-Reorder	0.711   1.260
Hilbert         0.699   1.239
Forsyth         0.666   1.180
Tipsy           0.658   1.166
Optimal         0.564   1.000
```

Note that I’m using my own implementation for all of these methods. So, the results with the code from the original author might differ slightly.

The most important observation is that, for every row of triangles, the only vertices that are reused are the vertices that are at the bottom of the triangles, and these are the vertices that we would like to have in the cache when rendering the next row of triangles.

When traversing triangles in scanline order the cache interleaves vertices from the first and second row. However, we can avoid that by prefetching the first row of vertices:

```

4 - 3 - 2 - 1 - 0
| / | / | / | / |
* - * - * - * - *
|   |   |   |   |
* - * - * - * - *
```

That can be done issuing degenerate triangles. Once the first row of vertices is in the cache, you can continue adding the triangles in scanline order. The cool thing now is that the vertices that leave the cache are always vertices that are not going to be used anymore:

```

* - 7 - 6 - 5 - 4
| / | / | / | / |
3 - 2 - 1 - 0 - *
| / | / | / | / |
* - * - * - * - *
```

In general, the minimum cache size to render a W*W grid without transforming any vertex multiple times is W+2.

The degenerate triangles have a small overhead, so you also want to avoid them when the cache is sufficiently large to store two rows of vertices. When the cache is too small you also have to split the grid into smaller sections and apply this method to each of them. The following code accomplishes that:

`

```

void gridGen(int x0, int x1, int y0, int y1, int width, int cacheSize)
{
    if (x1 - x0 + 1  cacheSize)
        {
            for (int x = x0; x < x1; x++)
            {
                indices.push_back(x + 0);
                indices.push_back(x + 0);
                indices.push_back(x + 1);
            }
        }

        for (int y = y0; y < y1; y++)
        {
            for (int x = x0; x < x1; x++)
            {
                indices.push_back((width + 1) * (y + 0) + (x + 0));
                indices.push_back((width + 1) * (y + 1) + (x + 0));
                indices.push_back((width + 1) * (y + 0) + (x + 1));

                indices.push_back((width + 1) * (y + 0) + (x + 1));
                indices.push_back((width + 1) * (y + 1) + (x + 0));
                indices.push_back((width + 1) * (y + 1) + (x + 1));
            }
        }
    }
    else
    {
        int xm = x0 + cacheSize - 2;
        gridGen(x0, xm, y0, y1, width, cacheSize);
        gridGen(xm, x1, y0, y1, width, cacheSize);
    }
}
```

`

This may not be the most optimal grid partition, but the method still performs pretty well in those cases. Here are the results for a cache with 16 entries:

```

Method           ACMR   ATVR
Scanline         1.062  1.882
NVTriStrip       0.775  1.374
K-Cache-Reorder  0.766  1.356
Hilbert          0.754  1.336
Morton           0.750  1.329
Tipsy            0.711  1.260
Forsyth          0.699  1.239
Optimal          0.598  1.059
```

And for a cache with only 12 entries:

```

Method           ACMR   ATVR
Scanline         1.062  1.882
NVTriStrip       0.875  1.550
Forsyth          0.859  1.522
K-Cache-Reorder  0.807  1.491
Morton           0.812  1.439
Hilbert          0.797  1.412
Tipsy            0.758  1.343
Optimal          0.600  1.062
```

In all cases, the proposed algorithm is significantly faster than the other approaches. In the future it would interesting to take into account some of these observations in a general mesh optimization algorithm.
