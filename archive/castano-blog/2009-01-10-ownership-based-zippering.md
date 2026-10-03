# Ownership-based Zippering

- **作者**：Ignacio Castaño
- **日期**：2009-01-10（更新于 2019-01-17）
- **原文**：https://www.ludicon.com/castano/blog/2009/01/ownership-based-zippering/
- **来源**：ludicon.com/castano/blog（WordPress REST API 全文）

---

Since [my Gamefest talk](http://developer.nvidia.com/object/gamefest-2008-subdiv.html) I’ve received numerous questions about the ownership-based zippering algorithm that I proposed. So, I’ll try to explain it in more detail. See my previous article on [watertight texture sampling](http://castano.ludicon.com/blog/?p=416) for more background info.

In the averaging method we would have to store the texture coordinate of every patch that contributes to a shared feature. Edges are shared by only two patches, but corners can be shared by many patches. By defining the ownership of the shared features (corners and edges), we only have to store the texture coordinates of the patch that owns the corresponding feature.

So, we have:

- 4 texture coordinates for the interior (4).

- 2 texture coordinates for each edge (8).

- 1 texture coordinate for each corner (4).

Therefore, the total number of texture coordinates per patch is: 4+8+4 = 16

Deciding what patch owns a certain edge or corner is done as a pre-process, so that the patch texture coordinates can be computed in advance. The way I store these texture coordinates is as follows:

[missing picture]

Each vertex has:

1 interior texture coordinate. (index 0)

1 edge texture coordinate for each of the edges. (index 1 and 2)

1 corner texture coordinate. (index 3)

On the interior, we interpolate the interior texture coordinates bilinearly:

`

```

float2 tc = bar.x * texCoord[0][0] +
            bar.y * texCoord[1][0] +
            bar.z * texCoord[2][0] +
            bar.w * texCoord[3][0];
```

`

where bar stands for the barycentric coordinates:

`

```

bar.x = (    uv.x) * (    uv.y);
bar.y = (1 - uv.x) * (    uv.y);
bar.z = (1 - uv.x) * (1 - uv.y);
bar.w = (    uv.x) * (1 - uv.y);
```

`

On the edges we interpolate the edge texture coordinates linearly:

`

```

if (uv.y == 1) tc = texCoord[0][1] * bar.x + texCoord[1][2] * bar.y;
if (uv.y == 0) tc = texCoord[2][1] * bar.z + texCoord[3][2] * bar.w;
if (uv.x == 1) tc = texCoord[3][1] * bar.w + texCoord[0][2] * bar.x;
if (uv.x == 0) tc = texCoord[1][1] * bar.y + texCoord[2][2] * bar.z;
```

`

And at the corners we simply select the appropriate corner texture coordinate:

`

```

if (bar.x == 1) tc = texCoord[0][3];
if (bar.y == 1) tc = texCoord[1][3];
if (bar.z == 1) tc = texCoord[2][3];
if (bar.w == 1) tc = texCoord[3][3];
```

`

The same thing can be done more efficiently using a single bilinear interpolation preceded by some predicated assignments:

`

```

// Interior
float2 t0 = texCoord[0][0];
float2 t1 = texCoord[1][0];
float2 t2 = texCoord[2][0];
float2 t3 = texCoord[3][0];

// Edges
if (uv.y == 1) { t0 = texCoord[0][1]; t1 = texCoord[1][2]; }
if (uv.y == 0) { t2 = texCoord[2][1]; t3 = texCoord[3][2]; }
if (uv.x == 1) { t3 = texCoord[3][1]; t0 = texCoord[0][2]; }
if (uv.x == 0) { t1 = texCoord[1][1]; t2 = texCoord[2][2]; }

// Corners
if (bar.x == 1) t0 = texCoord[0][3];
if (bar.y == 1) t1 = texCoord[1][3];
if (bar.z == 1) t2 = texCoord[2][3];
if (bar.w == 1) t3 = texCoord[3][3];

float2 tc = bar.x * t0 + bar.y * t1 + bar.z * t2 + bar.w * t3;
```

`

And finally, the predicated assignments can be simplified and replaced by an index calculation as I proposed in my previous article:

`

```

// Compute texture coordinate indices (0: interior, 1,2: edges, 3: corner)
int idx0 = 2 * (uv.x == 1) + (uv.y == 1);
int idx1 = 2 * (uv.y == 1) + (uv.x == 0);
int idx2 = 2 * (uv.x == 0) + (uv.y == 0);
int idx3 = 2 * (uv.y == 0) + (uv.x == 1);

float2 tc = bar.x * texCoord[0][idx0] +
            bar.y * texCoord[1][idx1] +
            bar.z * texCoord[2][idx2] +
            bar.w * texCoord[3][idx3];
```

`

The same idea also applies to triangles:

`

```

// Interior
float2 t0 = texCoord[0][0];
float2 t1 = texCoord[1][0];
float2 t2 = texCoord[2][0];

// Edges
if (bar.x == 0) { t1 = texCoord[1][1]; t2 = texCoord[2][2]; }
if (bar.y == 0) { t2 = texCoord[2][1]; t0 = texCoord[0][2]; }
if (bar.z == 0) { t0 = texCoord[0][1]; t1 = texCoord[1][2]; }

// Corners
if (bar.x == 1) t0 = texCoord[0][3];
if (bar.y == 1) t1 = texCoord[1][3];
if (bar.z == 1) t2 = texCoord[2][3];

float2 tc = bar.x * t0 + bar.y * t1 + bar.z * t2;
```

`

And the resulting code can be optimized the same way:

`

```

int idx0 = 2 * (bar.z == 0) + (bar.y == 0);
int idx1 = 2 * (bar.x == 0) + (bar.z == 0);
int idx2 = 2 * (bar.y == 0) + (bar.x == 0);

float2 tc = bar.x * texCoord[0][idx0] +
            bar.y * texCoord[1][idx1] +
            bar.z * texCoord[2][idx2];
```

`
