# Testing the Jai Compiler

- **作者**：Abner Coimbre
- **日期**：2018-03-14 18:40 UTC
- **分类**：Engine Tech
- **原文**：http://the-witness.net/news/2018/03/testing-the-jai-compiler/
- **来源**：the-witness.net 官方开发博客（文章页全文）

---

*As the company [grows](https://twitter.com/thekla_inc) with projects beyond The Witness, we thought it'd be nice to show progress on something not too secretive. For those folks into technical posts, I'll discuss how we used our new programming language to create an automated framework to test the language itself.*

---

Jon wanted to convert his [demos](https://www.youtube.com/watch?v=TH9VCN6UkyQ&list=PLmV5I2fxaiCKfxMBrNsU1kgKJXD3PkyxO) into proper language tests, and add in new ones. Testing becomes increasingly important as we approach a closed-group release. As it turns out, the literature on compiler testing is scarce, and getting access to quality test suites is pricey (see [C](http://www.plumhall.com/cqs/price/standard.html) or [FORTRAN](http://www.fortran.com/f90tsl.html)). I've also disliked test frameworks in general, which added to the problem.

In the interest of feeling joyful and productive, I decided to sit and think about the specific reasons *why* I've been unhappy with frameworks, and to use the language to write one I'd enjoy using.

**How I Like to Test**

I like to ask personally interesting questions which the tests ought to help me answer. Often, they relate to the behavior of software at the threshold of cross-cutting concerns. For the jai compiler, they could be questions such as:

- Can we make a procedure's return type randomly change at compile-time?

- What if a polymorphic procedure is used as a constructor?

- How do we prevent certain structs from using a procedure as a constructor?

- Can we generate bytecode for a slightly different procedure because of the struct that is using it as a constructor?

*Note: We tend to use the term procedure instead of function.*

Don't worry if the questions seem bizarre (the language is new and hasn't been released yet). The common theme is they all require very different language features to interact with each other (i.e. cross-cutting). For example, the first item could be handled polymorphically with the [modify](https://youtu.be/BwqeFrlSpuI?t=2594) directive, enums, a switch statement, and some random bit generator. The answer to the second item is that nothing bad happens; in fact, this opens the door for multiple structs to use the same polymorphic procedure as their constructor. This observation naturally leads to questions three and four. When I wrote the tests for some of these, compiler bugs were uncovered naturally and without much effort.

Note how these questions are answered by just writing programs. *They* are the language tests. Anything not helping me towards that feels like noise, and that explains why I haven't been happy with many testing systems. Here's the criteria I want a framework to meet to feel good about writing tests:

- Ability to write tests as if they were real, independent programs.

- Simple asserts the tests can use.

- By default, virtually zero interaction with the test framework.

- Minimal test suite reports that are nice to look at.

By a minimal report I mean showing me which programs ran and when, how many test asserts were called and where to find them if they failed. The report should look good so I can help my brain enjoy the overall experience.

**Our Framework**

To showcase the framework we ended up creating, let's go through an example, transforming a program into a language test.

Here's the program that tackles one of the simpler inquiries from earlier: *What if a polymorphic procedure is used as a constructor?* While we're at it we'll ask the same of destructors.

```
#import "Basic";

Thing :: struct {
    mem : *u8;
    value := 42;
    #constructor init_thing;
    #destructor free_thing;
}

init_thing :: (using thing : *$T) {
    mem = alloc(1000);
}

free_thing :: (using thing: *$T) {
    free(mem);
    mem = null;
    print("Thing memory freed.\n");
}

main :: () {
    {
        our_thing : Thing; // Constructor fires off.
        print("%\n", our_thing);
    } // Destructor fires off.
}
```

If we compile it, we see that it's valid:

```
 >>> jai poly_constructor.jai
 >>> poly_constructor.exe
 Thing { value = 42; mem = 1e4e6b4f790; }
 Thing memory freed.
 >>>
```

As I had mentioned, this means multiple structs can use the procedure as their respective constructors.

```
 #import "Basic";

Thing :: struct {
    mem : *u8;
    value := 42;
    #constructor init_thing;
    #destructor free_thing;
}

AnotherThing :: struct {
    mem : *u8;
    message := "I don't hold the meaning of life.";
    #constructor init_thing;
    #destructor free_thing;
}

init_thing :: (using thing : *$T) {
    mem = alloc(1000);
}

free_thing :: (using thing: *$T) {
    free(mem);
    mem = null;
    print("Thing memory freed.\n");
}

main :: () {
    //
    // Test with multiple structs.
    //
    {
        our_thing : Thing;
        print("%\n", our_thing);

        different_thing : AnotherThing;
        print("%\n", different_thing);
    }
}
```

Output:

```
 >>> jai poly_constructor.jai
 >>> poly_constructor.exe
 Thing { mem = 1d7df5bf790; value = 42; }
 AnotherThing { mem = 1d7df5c0190; message = "I don't hold the meaning of life."; }
 Thing memory freed.
 Thing memory freed.
 >>>
```

Great! And remember: this is just a program. We can explore the possibility space even more, define any number of procedures, declare hundreds of complex structs, import 3rd-party modules—you name it. However, let's pretend we're done answering our polymorphic constructor questions. To turn this into a language test, let's make two straightforward modifications (we'll add a couple of asserts while we're at it):

```
polymorphic_constructor :: () {
    //
    // Test multiple things.
    //
    {
        our_thing : Thing; // Constructor fires off.
        assert(our_thing.mem, "Thing didn't get an memory address.");

        different_thing : AnotherThing;
        assert(different_thing.mem, "AnotherThing didn't get an memory address.");
     }
 } @TestProcedure
```

Notice I changed the name from *main* to something else and added the simple note *TestProcedure*.

Notes are essentially comments recognized by the compiler that do nothing by default.

Let's put that file in a *tests/* folder.

```
 >>> mv poly_constructor.jai tests/
 >>> ls
 tests/
 tests.jai
 >>>
```

Ah, the reader will notice I have a file conveniently called *tests.jai*. Let's compile it.

```
 >>> jai tests.jai
 >>> ls
 tests/
 tests.exe
 tests.jai
 >>>
```

That produced *tests.exe*; let's run it! We'll use some real screenshots this time.

![Running tests.exe](https://i.imgur.com/jyhfNMH.png)

And we just made a full test suite run.

*Note:* *The reader might ask why we have 82 more asserts than what we wrote, plus another test procedure*

*from a String file. More on that soon.*

Notice a log file was generated. Here's the summary portion of that report:

![Summary portion of report for poly_constructor.jai](https://i.imgur.com/5v7SpC0.png)

*Report format is based off Aras Pranckevicius'*[API doc](https://casual-effects.com/markdeep/apidoc.md.html)

That's a lot of useful output just by compiling a source file! In addition, we can have multiple test procedures on the same test file:

```
    polymorphic_constructor :: () {
        //
        // Test multiple things.
        //
        {
            our_thing : Thing; // Constructor fires off.
            assert(our_thing.mem != null, "Thing points to null.");

            different_thing : AnotherThing;
            assert(different_thing.mem != null, "AnotherThing points to null.");
        }
    } @TestProcedure

    polymorphic_constructor_uninit :: () {
        //
        // Control when the initializer and constructors
        // actually get called.
        //
        {
            our_thing : Thing = ---; // Uninitialized var.
            memset(*our_thing, 0, size_of(Thing));

            T :: type_of(our_thing);
            tis := cast(*Type_Info_Struct) type_info(Thing);
            initializer := cast((*T) -> void) tis.initializer;
            constructor := cast((*T) -> void) tis.constructor;

            initializer(*our_thing);

            assert(our_thing.value == 42, "Expected % but got %\n", 42, our_thing.value);
            assert(our_thing.mem == null, "Expected % but got %\n", null, our_thing.mem);

            constructor(*our_thing);

            assert(our_thing.value == 42, "Expected % but got %\n", 42, our_thing.value);
            assert(our_thing.mem != null, "Didn't want % but got % anyway", null, our_thing.mem);

            //
            // We can do the same for AnotherThing.
            //

            // ...
        }
} @TestProcedure
```

![Running tests.exe](https://i.imgur.com/oDHdGOD.png)

Opening the report we get:

![New summary portion for poly_constructor.jai](https://i.imgur.com/wh9QAKu.png)

If we wanted to, we could drop in more test files in the *tests/* folder, each containing their own sub-programs. Finally, if invariances in our tests don't hold (i.e. an assert fails), that will also be reported. Let's add a deliberate failure on the first test procedure:

```
    polymorphic_constructor :: () {
        //
        // Test multiple things.
        //
        {
            our_thing : Thing; // Constructor fires off.
            assert(our_thing.mem != null, "Thing points to null.");

            //
            // Deliberate failure.
            //
            assert(our_thing.value == 999, "Meaning of life isn't 999? It's %", our_thing.value);

             different_thing : AnotherThing;
             assert(different_thing.mem != null, "AnotherThing points to null.");
         }
} @TestProcedure
```

![Running tests.exe with a failed assert](https://i.imgur.com/nyT0SM1.png)

And we get that on the log file too:

![Summary portion of report notifying the failure](https://i.imgur.com/Jira64p.png)

If the test writer heads to the test files section, the procedure that failed would be made apparent.

**Library Tests**

So how do we explain that weird *String* file from the reports earlier? We didn't write that! Well, Ignacio found it useful to use this framework for the language's system modules. System modules are special *.jai* files we provide programmers. Users can import them to leverage OpenGL / D3D, font rendering, audio playback, and more.

The test file from earlier imported *Basic* (a catch-all module we use to experiment new features). *Basic*

happens to indirectly import the *String* module. When I opened up *String*, I noticed Ignacio had written this somewhere on the file:

```
string_tests :: () {

    assert(join(..{:string: "foo", "bar", "puf"}, ", ") == "foo, bar, puf");
    assert(join("foo", "bar", "puf", separator="/") == "foo/bar/puf");

    assert("foo/bar/puf" == join(..split("foo/bar/puf", "/"), "/"));
    assert("foo\\bar\\puf" == join(..split("foo/bar/puf", "/"), "\\"));
    assert("foo/bar/puf/grr" == join(..split("foo, bar, puf, grr", ", "), "/"));

    // More asserts
    // ...
} @TestProcedure
```

Which accounted for the 82 additional asserts. That's because the framework detects tests written in external modules, outside of our own test files. Now anyone on the team writing modules can write test procedures inside their module, tag them, and they're done. In fact, I have a file under *tests/* that just imports all the modules. The actual tests can live right next to the module code, outside of our folder, and we register them for free just as we automatically register the test files inside the folder for free. And fret not, a module being imported multiple times will still have its test recognized only once.

**Future Updates**

I'd like to note there are special settings and configurations the user doesn't know about (good! that's the point!), and those who care can open up the build file, which is just the *tests.jai* source file. Documentation amounts to a few well-placed comments.

Upon release (if we have time to make it happen), I'd like people to write their numerous test procedures, compile *tests.jai*, and have them witness Jon's [bananas.jai](https://youtu.be/OHZwYYW9koI?list=PLmV5I2fxaiCKfxMBrNsU1kgKJXD3PkyxO&t=476) but in the context of tests: A visualization of a growing tree of test files as branches, where each test procedure is a leaf from the branch.

**How It All Works**

A common theme back at Kennedy Space Center was that we wanted to automate most of the "bookkeeping" so the engineer's time and effort went into thinking about the real problem. Interacting with build systems was not in our best interest! Even so, sometimes we were stuck with what I think were high-friction tools. I can't properly express to the reader how great it's been to write a tool that reduces friction nontrivially.

Let's take a quick look at how the language played a part in letting me create this framework, as I think it has the right kind of features all statically-typed languages should have going forward.

**Minimizing Framework Interaction**

Initially, the main struggles in making the testing system work were psychological, working to unlearn years of how I was told automated test frameworks should be structured. My first attempt was writing a hybrid *C++/Jai* program with wacky command-line parameters. I think Jon nearly had a heart attack. It was difficult to implement something that met the criteria listed at the beginning of this post, because my model was tied to old-school software testing models.

The closest implementation I have ever found is [CxxTest](http://cxxtest.com/guide.html). What caught my interest was the second sentence on their homepage:

> CxxTest is easy to use because it does not require precompiling a CxxTest testing library, it employs no advanced features of C++ (e.g. RTTI) and it supports a very flexible form of test discovery.

Aha! It's trying to make itself invisible, and the term *test discovery* sounds like it's doing work on behalf of the user. Indeed, later the website goes on to say:

> Additionally, CxxTest supports test discovery. Tests are defined in C++ header files, which are parsed by CxxTest to automatically generate a test runner. Thus, CxxTest is somewhat easier to use than alternative C++ testing frameworks, since you do not need to register tests.

Aha por dos! Test discovery is the property I want frameworks to exhibit. With *CxxTest*, though, we still need to understand its build system steps to reap the benefits, but that's a difficult limitation to overcome with *C++*. In *jai*, however, we can specify our build system in the language.

So I made a source file, *tests.jai*. In said file, we can ask the compiler to compile any number of different files, and request it to open up its compilation stages to us as things get lexically scanned, parsed, and code generated. That's more than we care to ask for, so our entire build system can amount to compiling a single file, in the same way we compile any normal code.

**Tagging Procedures**

As I just said, in *tests.jai* we can ask the compiler to pause at any compilation stage for us to intervene in the process. So I used that for the test discovery. The current mechanism, as we have seen, is to tag procedures that want to behave like an independent test program with the note *@TestProcedure*. Then, once the compiler has finished type-checking all source files, I ask it to give me the declarations tagged with the note. Specifically:

```
for decl.notes {
    if it.text == {
        case "TestProcedure";
        proc_info := cast(*Type_Info_Procedure) type;
        if proc_info.argument_types.count > 0 {
            print("[Test Suite] WARNING: '%' tagged with @TestProcedure should take no arguments.\n", proc.name);
            continue;
        }
        user_test : TestProcedure;
        user_test.filename = decl.filename;
        user_test.procname = proc.name;
        array_add(*tests_to_register, user_test);

        //...
        case;
        // Do nothing.
    }
}
```

Where *decl* is the current code declaration we're inspecting from the *AST*.

In the past, I used to check for procedure names starting with *test*, but [Allen](https://twitter.com/allenwebster4th) and [Nico](https://twitter.com/kneeko) made me question whether that was too constraining. Turns out it was. The downside with the notes here, though, is there might be tests importing external modules that tagged some of their code with *@TestProcedure* for unrelated reasons. I mitigate that by ignoring structs with that tag, and by verifying whether the procedure acts as an entry point (i.e. *main* with no parameters). There are other options available to us, but for now this is a good-enough solution.

**Hidden Test Suite**

I register the discovered tests by creating *register_test* procedure calls on-the-fly--meaning I update the program's *AST* before things enter the bytecode pipeline. Where is the *register_test*procedure defined? Well, the dirty secret is I still wrote an actual test suite, contained in a single file living inside the *tests/* folder. The build file has access to that, as do people. If anyone wishes to avoid all the automatic magic and also believe editing the build file is not enough, they are free to ignore it altogether and figure out how the suite works. They can register tests manually, generate reports however they see fit, and perform the entire job of a framework themselves.

**Test Asserts**

As we can see from the *CxxTest* homepage, it has different types of asserts for us to use. I had something similar going, but Ignacio reminded me that Jon added an assertion handler as part of the [implicit context](https://youtu.be/ciGQCP6HgqI?t=837). That means we can override the behavior of regular asserts! This is what allows external modules to write officially-recognized tests inside their file and still compile anywhere--we're not requiring them to do anything special.

**What's Next**

I now enjoy writing tests whenever I need to, and I hope this straightforward style sounds appealing to some people.

In other news, for the purpose of testing a compiler, will an automated test suite suffice? Not really, though it's a necessary first step. Although we've uncovered dozens upon dozens of important compiler bugs, we're starting to hit the ceiling of what human-made tests can offer. It's no surprise we've started to seriously look into a different beast entirely—a compiler fuzzer.

But that's a story for another blog post!

P.S. Shoutout to [Josh](https://twitter.com/machinamentum), who among other things, helped write a bunch of the language tests and makes sure everything keeps running smoothly on Mac and Linux.
