# scope(exit) in C++11

- **作者**：Ignacio Castaño
- **日期**：2012-11-20 01:38 UTC
- **分类**：Engine Tech
- **原文**：http://the-witness.net/news/2012/11/scopeexit-in-c11/
- **来源**：the-witness.net 官方开发博客（文章页全文）

---

I really like the [scope(exit) statements in D](http://dlang.org/statement.html#ScopeGuardStatement). They allow you to keep the cleanup code next to the initialization code making it much easier to maintain and understand. I wish we had them in C++.

Turns out this can be implemented easily using some of the new C++ features. I'm not a big fan of C++11; for the most part I think it adds even more complexity to an already complex language. However, I have to admit that some of the features can be useful, when used with care and moderation.

I think this is one of such cases. If you can get past the weird syntax, lambdas can be very powerful. What I find most useful is to be able to define local functions (closures) that can access the local variables of the enclosing scope.

In our case, what we want to do is to define some code that is executed at the end of the scope to cleanup objects allocated in the current scope. This is easily achieved allocating an object on the stack that invokes a lambda function that wraps our custom cleanup code:

```
#include <functional>

struct ScopeExit {
    ScopeExit(std::function f) : f(f) {}
    ~ScopeExit() { f(); }
    std::function f;
};

#define STRING_JOIN2(arg1, arg2) DO_STRING_JOIN2(arg1, arg2)
#define DO_STRING_JOIN2(arg1, arg2) arg1 ## arg2
#define SCOPE_EXIT(code) \
    ScopeExit STRING_JOIN2(scope_exit_, __LINE__)([=](){code;})
```

Then you can write code like:

```
int * ip = new int[16];
SCOPE_EXIT(delete [] ip);

FILE * fp = fopen("test.out", "wb");
SCOPE_EXIT(fclose(fp));
```

I know you can go to greater lengths to mimic the D syntax, and that Boost also provides similar functionality, but this does all we need in less than 10 lines of code.

Sadly we cannot really use this on The Witness, because I'm not sure we are yet ready to drop support for platforms and compilers that do not implement the required C++11 functionality.

***Update:***

As mentioned by Daniel in the comments, you don't really want to use std::function in this case. A quick look at the assembly output confirms that the generated code is horrible. It makes a lot more sense to wrap the closure explicitly and rely on type inference to allocate the wrapper object on the stack:

```
template <typename F>
struct ScopeExit {
    ScopeExit(F f) : f(f) {}
    ~ScopeExit() { f(); }
    F f;
};

template <typename F>
ScopeExit<F> MakeScopeExit(F f) {
    return ScopeExit<F>(f);
};

#define SCOPE_EXIT(code) \
    auto STRING_JOIN2(scope_exit_, __LINE__) = MakeScopeExit([=](){code;})
```
