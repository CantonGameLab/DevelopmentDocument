# HLSLParser

- **作者**：Ignacio Castaño
- **日期**：2014-08-29 08:21 UTC
- **分类**：Engine Tech
- **原文**：http://the-witness.net/news/2014/08/hlslparser/
- **来源**：the-witness.net 官方开发博客（文章页全文）

---

We just finished porting The Witness to D3D11. It took a little longer than I was hoping and one of the unexpected difficulties was getting our D3D9 HLSL shaders to work in D3D11.

The D3D shader compiler provides a backward compatibility flag (D3DCOMPILE_ENABLE_BACKWARDS_COMPATIBILITY) that I was hoping would allow us to use our shaders 'as is'. Unfortunately, it seems the backward compatibility mode has not received much love and things were not that simple. I run into several compiler internal errors, and even after finding workarounds most of our shaders did not actually compile, but would have required significant modifications, the resulting vertex and pixel shaders would often not link at runtime, and the use of register annotations on samplers only allowed us to control the layout of the samplers, but not of the associated textures.

For other targets (Cg & PSSL) we had been able to get away with some preprocessor macros and simple text transformations, but it seemed that was not going to be an option in this case. Not only that, having to write and adapt our shader code for the idiosyncrasies of each compiler was starting to become a challenge.

Instead, I thought it would be much cleaner and much more powerful to standardize on a fixed subset of HLSL and transform it to the shading language of the target by building a syntax tree, applying syntactic transformations, and generating shader code by traversing the resulting syntax tree.

This is essentially what we already do in the OpenGL backend to transform GLSL into HLSL. For that we use [HLSL2GLSL](https://github.com/aras-p/hlsl2glslfork) and [GLSLOptimizer](https://github.com/aras-p/glsl-optimizer). I considered using these same projects, either modifying HLSL2GLSL to output HLSL1x code instead of GLSL, or modifying GLSLOptimizer to accept and produce HLSL code. I avoided the former, because HLSL2GLSL's code was a big mess and it was not very attractive to work with it. The latter was more interesting, and I believe it's the approach taken by the UE4 engine. However, while much cleaner, GLSLOptimizer is still a fairly large project and I did not care too much about the optimization aspects that it offered.

Another option that I had just come across is Max McGuire's [HLSLParser](https://github.com/unknownworlds/hlslparser). HLSLParser was a lot smaller and cleaner than either of those code bases. It was pretty much the code I would have written if I were to do this from scratch, so it seemed like the best possible starting point.

One of the main annoyances when working in the OpenGL backend is that GLSL errors are extremely hard to track down. They can be reported by either HLSL2GLSL, GLSLOptimizer, or the driver's GLSL compiler. Each of the inputs to these compilers has different file and line information and none of them matches the original source code. Whenever an error occurs we have to dump the intermediate code and figure out from there what's going on. It's usually a waste of time and if D3D11 is to become our primary backend I did not want to have to deal with this issue.

I was happy to see that HLSLParser handled this correctly associating file and line info to the tree nodes and producing correct #file preprocessor statements in the generated output.

In order to parse our shaders with HLSLParser we had to extend it in several ways, here's a partial list of the features I added:

- Support for 3D, 2DMS and shadow samplers, and most of the associated intrinsics.

- Added support for many missing intrinsics.

- out argument modifier.

- Default argument values.

- Block statements.

- Attribute annotations.

- Static, inline, uniform and other type modifiers.

- Bitwise operators.

- Hex literals.

- Full declaration syntax, including multiple declarations in the statement.

- Add support for full declarations in buffer fields.

- Effect syntax (techniques, passes, sampler states, state assignments).

I'm very thankful for the work Max McGuire did on HLSLParser and the least I can do is to release these our improvements to the public as well. You can find our fork of the project in our github repository:

[https://github.com/Thekla/hlslparser](https://github.com/Thekla/hlslparser)

Once we have the syntax tree in memory we can do many cool code transformations. In particular, we do:

- Dead code elimination.

- Determine used parameters and resources.

- Assign registers/offsets explicitly to control layout of parameters and resources.

- Sort resource registers and group parameters in buffers based on frequency of change.

- Rename semantics.

- Reorder pixel shader arguments so that vertex shader outputs match pixel shader inputs and avoid linkage errors.

The shaders that result from these transformations are minimal, that is, they only contain the definitions and declarations that are necessary for a specific entry point. We have complete control of the layout of resources and parameters and extract all the necessary information about the shader from the tree instead of relying on the platform-specific reflection APIs. The shader transformation is very fast and the resulting shaders compile faster than the original ones. Our new D3D11 shader processor and compiler is about 4 times faster than its D3D9 counterpart.

While it currently accepts all of our shaders, HLSLParser still has some limitations. Here are a few that come to mind:

- No type inference for sampler types. It assumes sampler == sampler2D.

- No support for {} initializers. Instead of float2 p = {0, 0} you have to write float2 p = float2(0, 0). This particular case is not complicated, but it does get more hairy when initializing structures. For now, I've simply modified our shaders to avoid this.

- No support for rectangular matrices. We did not support them in the GLSL translators either, so we avoided their use in our shaders. It would be nice to add this eventually.

- No support for do, while or switch statements. These should be easy to add, but we just didn't need them!

- No proper error recovery. We stop reporting errors after first one. This would be nice, but is not critical.

- Semantic analysis is incomplete. The parser does some, but not a complete semantic check. The generated shader is not guaranteed to be correct in the absence of errors, but since we have proper file/line annotations, this usually doesn't really matter.

Looking forward, I expect we will add code generators to target other platforms. It should be really easy to bring the existing GLSLGenerator up to date, or add new generators for PSSL and Metal.

I'm not particularly fond of our shader code. On one side, we abuse the preprocessor to generate shader variations and the result is often a mess that is hard to read and modify. On the other, our code is often highly repetitive, but there doesn't seem to be a clean way to share it across different materials or structure it in a way that's more compact. I'm particularly interested in experimenting with higher level code transformations, or coming up with new constructs to facilitate writing and sharing shader code.
