# Engine Tech: Concurrent world editing

- **作者**：Jonathan Blow
- **日期**：2011-12-25
- **分类**：—
- **原文**：http://the-witness.net/news/http://the-witness.net/news/engine-tech-concurrent-world-editing/
- **来源**：the-witness.net 官方开发博客（文章页全文，2010–2012 技术帖，RSS 窗口之外）

---

### Summary

A small team with limited manpower, we wanted a low-effort way to use our existing version control system (svn) to facilitate concurrent world editing for our open-world 3D game (i.e. we desire that multiple users can edit the world at the same time and merge their changes).  We developed a system wherein the data for each entity is stored as an individual text file.  This sounds crazy, but it works well: the use of individual files gives us robustness in the face of merge conflicts, and despite the large number of files, the game starts up quickly.  Entities are identified using integer serial numbers.  We have a scheme for allocating ranges of these numbers to individual users so there is no overlap (though this scheme could certainly be better).  The system seems now to be robust enough to last us through shipping the game, with seven people and one automated build process concurrently editing the world across 18 different computers.

We don't know whether this method would work for AAA-sized teams, though it seems that it might with some straightforward extensions.  But for us the method works surprisingly well, given how low-tech it is.

### About the Game

We have been developing a 3D open-world game called [The Witness](http://the-witness.net) since late 2008.  For much of that time, development happened in a preproduction kind of way, where not many people were working on the game.  Recently, though, we went into more of a shipping mode, so the number of developers has grown: we're up to about 10 or 11 people now (pretty big for a non-high-budget, independent game).  Not all of these people directly touch the game data, but about 7 do now, and this number will rise to 9 in the near future.

The design of the game requires the world to be spatially compact, relative to other open-world games, so it is far from Skyrim-esque in terms of area or number of entities.  At the time of this writing, there are 10,422 entities in the game world.  I expect this number to grow before the game is done, but probably not by more than 2x or 3x the current amount.

Because the world is not too big, and some game-level events require entities to coordinate across the length of the world, it makes sense to keep all the entities in one space, that is to say, there is no zoning of the world or partitioning of it into separate sets of data.  This makes the engine simpler, and it reduces the number of implementation details that we need to think about when editing the world.  It also introduces a bit of a challenge, because it requires us to support concurrent editing of the world without an explicit control structure governing who can edit what.  One such control structure might be: if you imagine the world were divided into a 10x10 grid; so there are 100 different zones; and where anyone editing the world must lock whatever zones they want to edit, make their changes, check them in, then unlock those zones; this would provide a very clear method of ordering world edits.  (Because of the locking mechanism, two people would not be able to change the same world entity at the same time, so there doesn't have to be any resolution process to decide whose changes are authoritative). However, the straightforward implementation of such a control scheme would make for inconvenient workflow, as it is tedious to lock and unlock things.  Even with further implementation work and a well-streamlined UI, there would still be big inconveniences (I really want to finish building a particular puzzle right now, but a corner of that puzzle just borders on some region that a different user has locked, and he is sick this week so he probably won't finish his work and unlock it until next week.  Or, if my network connection is flaky then I may not be able to edit; if I am off the net then I definitely could not edit.)

Thus, rather than implementing some kind of manual locking, I found it preferable to envision a system that Just Magically Works.  Since we already used the Subversion source-control system to manage source code and binary source assets such as texture maps and meshes, it didn't seem like too big of a stretch for Subversion to handle entity data as well.

### The World Editor and Entity Data

Our world editor is built into the game; you press a key to open it at any time.  Here's what it looks like:

[![](http://the-witness.net/news/wp-content/uploads/2011/12/editor_shot-512x288.png)](http://the-witness.net/news/wp-content/uploads/2011/12/editor_shot.png)

The editor view is rendered in exactly the same way as the gameplay view, but you fly the camera around and select entities (I have selected the red metal door at the center of the scene, so it is surrounded by a violet wireframe).  In the upper right, I have a panel where I can edit all the relevant properties of this Door; the properties are organized into four tabs and here you can see only one, the "Common" properties.

These properties, which you can edit by typing into the fields of this Entity panel, are all that the game needs to instantiate and render this particular entity (apart from heavier-weight shared assets like meshes and texture maps).  If you serialize all these fields, then you can unserialize them and generate a duplicate of this Door.  That's how the editor saves the world state: serialize every entity, and for each entity, serialize all fields.

Originally, the game saved all entities into one file in a binary format.  This is most efficient, CPU-performance-wise, and the natural thing that most performance-minded programmers would do first.  Unfortunately, though, svn can't make sense of such a file, so if two people make edits, even to disjoint parts of the world, svn is likely to produce a conflict; once that happens, it's basically impossible to resolve the situation without throwing away someone's changes or taking drastic data recovery steps.

Our natural first step was to change this file from binary into a textual format.  Originally I had worries about the load-time performance of parsing a textual file, but this turned out not to be an issue.  I decided to use a custom file format, because the demands in this case are very simple, and we have maximum control over the format and can modify it to suit our tastes.

Many modern programmers seem to have some kind of knee-jerk inclination to use XML whenever a textual format is desired, but I think XML is one of the worst file formats ever created, and I have no idea why anyone uses it for anything at all, except that perhaps they drank the XML Kool-Aid or have XML Stockholm Syndrome.  Yes, there are XML-specific tools out there in the world, and whatever, but I didn't see how any such tool would be of practical use to us.  One of our primary concerns is human-readability, so that people can make intelligent decisions when attempting to resolve revision control conflicts.  XML is not particularly readable, but we can modify our own format to be as readable as it needs to be in response to whatever real-world problems arise.  You'll see a snippet below of the format we use.

### Evolution of the Textual Format

The first version of our textual format was a straightforward adaptation of our binary format.  The gameplay-level code that saves and loads entities is the same for either format; the only difference is just a boolean parameter, choosing textual or binary, which is passed to the lower-level buffering code.  After the buffer is done being packed, it's written to a file.

In our engine, entities are generally referenced using integer serial numbers (that act as handles).  These numbers are the same when serialized as they are at runtime.  Originally, in the binary file, the order in which the entities were written didn't matter.  But if we want to handle concurrent edits, we want to make merging as easy as possible for the source control system, so we sort entities by serial number, writing them into the file in increasing order.  Thus we didn't generate any spurious file changes due to haphazardly-changing serialization order.

In theory, Subversion could now handle simultaneous world edits and just merge them, the same way it does with our source code.  Unsurprisingly, though, this initial attempt was not sufficient.  Though the file was now textual, it contained a bare minimum of annotations and concessions to readability.  Though I knew I would eventually want to add more annotations, I didn't want to go overboard if it wasn't necessary, because these inflate the file size and the time required to parse the files (though I never measured by how much, so it's likely the increases are negligible performance-wise and I was engaging in classic premature optimization).  As it happens, the kind of redundant information that increases human-readability also helps the source control system understand file changes unambiguously, so as we made the format more-readable, the number of conflicts fell.

Here's what our file format currently looks like, for entity #6555 (the Door we had selected in the editor screenshot).

```
Door
72
6555
; position
    46.103531 : 42386a04
    108.079681 : 42d828cc
    8.694907 : 410b1e57
; orientation
    0.000000 : 0
    0.000000 : 0
    -0.069125 : bd8d9184
    0.997608 : 3f7f633d
; entity_flags
    160
; entity_name
    !
; group_id
    4059
; mount_parent_id
    6554
; mount_position
    0.035274 : 3d107ba5
    0.006069 : 3bc6e19c
    0.000038 : 381ffffc
; mount_orientation
    0.000000 : 0
    0.000000 : 0
    0.000027 : 37e5f004
    1.000000 : 3f800000
```

(The first line, "Door", is the type name; 72 is the entity data version, which is used to load older versions of entities as their properties change over time; 6555 is the entity's ID.  root_z and cluster_id (seen in the screenshot) are not saved into the file, because these properties have metadata that say they are only saved or loaded under certain conditions which are not true here.  For the sake of making the listing short, I've shown only the properties listed on that first tab in the screenshot.)

You'll note that the floating-point numbers are written out a bit oddly, as in this first line under 'position':

```
    46.103531 : 42386a04
```

This is how we preserve the exact values of floating-point numbers despite saving and loading them in a text file.  If you do not take some kind of precaution, and use naive string formatting and parsing, your floating-point values are likely to change by an LSB or two, which can be troublesome.

The number on the left is a straightforward decimal representation of the value, written with a reasonable number of digits.  The : tells us that we have another representation to look at; the number on the right, which the : introduces, is the hexadecimal representation of the same number.  The IEEE 754 floating-point standard defines this representation very specifically, so we can use this hexadecimal representation to reproduce the number exactly, even across different hardware platforms.  The decimal representation is mostly just here to aid readability.  However, if we decide we want to hand-edit the file, we can just delete the : and everything after it, changing that first number to a 47.5 or something; seeing no :, the game will parse the decimal representation and use that instead.

There are other ways to solve this floating-point exactness problem; for example, you can implement an algorithm that reads and writes the decimal representation in a manner that carefully preserves the values.  This is complicated, but if you're interested in that kind of thing, here's what Chris Hecker says:

> Everybody just uses David Gay's code: [http://www.netlib.org/fp/dtoa.c](http://www.netlib.org/fp/dtoa.c)[http://www.netlib.org/fp/g_fmt.c](http://www.netlib.org/fp/g_fmt.c) You need to get the flags set right on the compiler for it to work. /fp:precise at least, I also do #pragma optimize ("p",on), and make sure you write a test program for it with your compiler settings.

(Twitchy, and look at how much code that is!  What we did is a couple of lines.) In [a document](http://cbloom.com/3d/game_tech_04.zip) on his [web site](http://www.cbloom.com/3d/), Charles Bloom discusses a scheme that was in use at Oddworld Inhabitants, similar to what we're doing in The Witness but involving a comparison between the two representations:

> ... Plain text extraction of floats drifts because of the ASCII conversions; to prevent this, we simply store the binary version in the text file in addition to the human readable version; if they are reasonably close to each other, we use the binary version instead so that floats can be persisted exactly.

### Subversion Confusion

After switching to this format, conflicts still happened.  I categorize conflicts into two types: "legitimate", where two people edit the same entity in contradictory ways and the source control system doesn't know who to believe; and "illegitimate", where Subversion was just getting confused.  We did have a number of legitimate conflicts for a while, yet which were not the users' fault, because our world editor tended to do things that are bad in a concurrent-editing environment.  (See the Logistics section at the end of this article for some examples).  But even after we ironed these out, we still found that Subversion was still getting confused.

Here's an example of a common problem: suppose we start with a world containing data on entities A, B, and D, so our file contains: ABD.  You edit the file and delete entity B.  I edit the file and also delete entity B, but add another entity C.  (That we both deleted B may be a very common use-case, especially if this is due to some automatic editor function).  So, you want to check in a file that just says: ABD - B = AD, so the new result is AD.  I want to check in a file that says: ABD - B + C = ACD (the C goes in the middle, because remember, the entities are sorted!)  In theory this is an easy merge: the correct result is just ACD.  But Subversion would get confused in cases like this, requiring the user to hand-merge the file.

This is a disaster, because even with a visual merge tool such as the one that comes with TortoiseSVN, you don't want non-engine-programmers trying to merge your entity data file.  Even if that file is extremely readable, at some point someone will make a mistake; the file will fail to parse, and then you have a data recovery problem that requires the attention of an engine programmer.  When this happens it kills the productivity of two people (the engine guy, because he has to merge the data, and also the guy who generated the conflict, because until it gets resolved his game is in an un-runnable state, and anyway, the engine guy has probably commandeered the other guy's computer to fix this).

After we had this problem a few times too many, Ignacio suggested moving to a more-structured file format like JSON, which, in theory, source-control systems would handle more solidly.  But I thought that this would only reduce the frequency of the problem, but not solve anything fundamental; even if we achieved a situation of only generating legitimate conflicts, each conflict would still be a potential game-crippling disaster.

### Splitting the File

It occurred to me, finally, that it could hardly get cleaner than to store each entity in its own file.  This initial thought might cause a performance-oriented programmer to recoil in horror; we have 10,422 entities right now, and it must be very slow to parse and load 10,000 text files every time the game starts up!

But I knew that we already had over 4,000 individual files laying around for assets like meshes and texture maps, currently loaded individually, the idea being that at ship time we would combine these into one package so as to avoid extra disk seeks and the like.  But on our development machines, these files still loaded quickly.  I figured that if we can already load 4,000 big files, why not try loading an extra 10,000 small files?  If loading all these files turned out to be slow, we could resort to this only when entity data has changed via a source control update; after loading all the text files, we can save out a single binary file containing all the entity data, which would be much faster to load, just like we used to do before we supported concurrent editing.

I tried this and it worked great.  So, now we have a data folder called 'entities', which holds one file per serialized entity.  The Door selected in the editor screenshot is stored in a file named after its entity ID, "6555.entity_text", which contains the text you see in the listing above.

As mentioned, there are currently 10422 entity files; the text files take up about 8MB of space, whereas the binary file is 1.4MB.  We're not making any effort to compress either of these formats; they are very small compared to the rest of our data.

[![](http://the-witness.net/news/wp-content/uploads/2011/12/dos_box_file_list-512x333.png)](http://the-witness.net/news/wp-content/uploads/2011/12/dos_box_file_list.png)

### Benefits of Using Individual Files

Storing each entity in a separate file solved our problems with merging: both the illegitimate source control confusions as well as the problems due to hand-guided file merging.

The illegitimate conflicts go away because transactions become very clear.  If I delete an entity, and you delete an entity, then we both just issue a file delete command, and it's very easy for the source control system to see that we agree on the action.  Furthermore, if we both delete B but I add C, because the change to C is happening in a completely separate file, there is no way for the system to get confused about what happened.

Legitimate conflicts do still happen, as multiple people edit the same entities, but these cases are much easier to handle than they were before.  The usual response is to either revert one whole entity or stomp it with your own.  Because we usually want to treat individual entities atomically -- using either one person's version of that entity or the other's -- individual files are a great match, because now the usual actions we want to perform are top-level source control commands (usually from the TortoiseSVN pulldown menu); before, this wasn't true, and merging a single entity in an atomic way required careful use of the merge tool.  If an entity ever gets corrupted somehow, for whatever reason, we can just revert that one file, knowing the damage is very limited in scope; before we've reverted it, the worst that can happen is that that single entity will not load; it won't prevent the rest of the entities in the world from loading.

It would be difficult to overemphasize the robustness gained.  I feel that these sentences do not quite convey the subtle magic; it feels a little like the state change when a material transitions from a liquid to a solid.

Sometimes, someone will update their game data in a non-vigilant way; not noticing that a conflict happened, so they won't resolve it; and then they will run the game.  Before, this would have been a disaster; Subversion inserts annotations into text files to try to help humans manually resolve conflicts (this is an unfortunate throwback to programs like SCCS), which would have caused much of the world to fail to parse.  Now, though, the damage from these annotations is constrained to individual entities. It's also easier to detect: if there is a conflict in the file for our Door #6555, then in addition to writing these annotations into 6555.entity_text (making it unparseable by the game), Subversion will also write out files 6555.entity_text.mine and 6555.entity_text.theirs, which contain the two intact but conflicting versions of the file.  The game can detect these very straightforwardly, put an error message on the HUD, and even choose one to load by default.  It is all very clean.

This is one of those interesting cases where reality-in-practice is starkly different from computer-science-in-theory.  In theory, a directory is just a data structure organizing a bunch of black-box data, and we happen to view this organization in a way that looks like a list of files; we could just do the same thing interior to our own file format, and it would be no big deal.  In practice, due to the way our tools work, these two arrangements are tremendously different.  The individual files just feel solid and reliable to work with, whereas one big structured file is always going to be precarious.

### Startup Procedure

When the game starts up, we need to load all the entities from disk.  In the simplest case, this is straightforward: we just iterate through every file in the entities directory and load it.  However, as I mentioned, we wanted to keep a binary version of the entities that is preferred by the game if it exists and is up to date; partly, this might help startup speed a little (we don't have to parse all these strings), but mainly, that is the file format and code path we are going to use when the game ships, and we don't want that code to rot in the meantime.  Using it every day is the best way to prevent it from rotting.

So: when the game first starts up, we check for the binary entity package.  If it's not there, we load all the individual entities files, then immediately save out the binary package.  (This binary package is a private, local file; if we were to add it to source control, everyone would always conflict with everyone else.)  But suppose we start up and the binary package is already there (which it usually will be).  We need then to determine if any of the textual entities have changed since the binary package was built.  The most-general way to do this is just by looking at the file timestamps; if we were to rely on some other signal being written to the disk that says "hey, entity data has changed," then we would only be allowed to modify the entity files using sanctioned and customized tools; that would be annoying and would cause all kinds of robustness issues.

In concrete terms: we want to know the timestamp of the newest .entity_text file, inclusive of the directory containing these files (if we just did a Subversion update that only deleted entities, then all the .entity_text timestamps will be old, but the directory timestamp will be new; we want to ensure we properly rebuild the binary file in this case!)  To find the newest timestamp, we just iterate through all the timestamps in a brute-force way:

```
bool os_get_newest_file_modification_time(char *input_dir_name, Gamelib_Int64 *file_time_return) {
    //
    // We include the modification time of the directory as well.
    //

    char *dir_name = mprintf("%s/*", input_dir_name);
    Free_On_Return(dir_name);
    if (strlen(dir_name) >= MY_MAX_PATH - 5) return false;

    //
    // best_time starts as the time for the directory (if it exists!)
    //
    Gamelib_Int64 best_time = 0;
    bool success = get_file_modification_time(input_dir_name, &best_time);
    if (!success) {
        Log::print("Unable to get modification time for directory '%s'!\n", input_dir_name);
    }

    //
    // Now consider the file timestamps.
    //
    WIN32_FIND_DATA find_data;
    HANDLE handle = FindFirstFile(dir_name, &find_data);
    if (handle == INVALID_HANDLE_VALUE) return false;

    while (1) {
        if (find_data.dwFileAttributes & FILE_ATTRIBUTE_DIRECTORY) {
        } else {
            Gamelib_Int64 file_time = to64(find_data.ftLastWriteTime);
            if (file_time > best_time) best_time = file_time;
        }

        BOOL success = FindNextFile(handle, &find_data);
        if (!success) break;
    }

    FindClose(handle);

    if (file_time_return) *file_time_return = best_time;

    return true;
}

bool get_file_modification_time(const char *name, Gamelib_Int64 *result_return) {
    HANDLE h = CreateFile(name, 0, FILE_SHARE_READ | FILE_SHARE_WRITE | FILE_SHARE_DELETE,
                          NULL, OPEN_EXISTING, FILE_ATTRIBUTE_READONLY | FILE_FLAG_BACKUP_SEMANTICS,
                          NULL);
    if (h == INVALID_HANDLE_VALUE) return false;

    FILETIME write_time;
    GetFileTime(h, NULL, NULL, &write_time);
    CloseHandle(h);

    if (result_return) *result_return = to64(write_time);
    return true;
}
```

You'll notice that this is Windows-specific code, but we don't have to worry about porting it, because we only run the world editor on Windows.  Fortunately, in Windows, the file timestamp is right there in the directory data, so we don't have to open each file.  (At least in NTFS this is true, rather than being an API illusion; the timestamps are stored in the Master File Table [MFT].)

What's the performance like?  I typically run the game on two different machines: a high-performance Tower PC (CPU: Intel Core i7-970, hard drive: OCZ Vertex 3 SSD, RAM: 12GB) and a gaming Laptop (CPU: Intel Core i7-2820QM, hard drive: Intel SSD 500 [SSDSC2MH250A2], RAM: 12GB).

The time spent in os_get_newest_file_modification_time is:  Tower:**.0095 sec, +/- .0015 sec**; Laptop: **.039 sec, +/- .005 sec**.  (Timings were computed by averaging six trials, after a discarded warm-up run.)  This is definitely one of those cases where I'm glad I didn't prematurely optimize, as I would have expected this to be much slower!

We typically install SSDs in all our work machines, but even when people have home machines that use spinning-platter hard drives, startup times are not much slower (likely due to the MFT data staying in cache).

If for a large enough number of entities this timestamp-gathering process becomes too slow, we can always write some code to read the timestamps out of the MFT directly, avoiding all the API call overhead, as in [this forum posting](http://www.autoitscript.com/forum/topic/94269-mft-access-reading-parsing-the-master-file-table-on-ntfs-filesystems/).  To date we've had no need to do this.

Some people have reported performance problems when Windows has more than 100,000 files in one directory, but this can be worked around: just make 10 directories, with IDs ending with each digit from 0-9 grouped in common directories.  (Why use the least-significant "ending" digit, rather than the most-significant "starting" digit, which might be the impulsive choice?  Because if you do it that way, [Benford's Law](http://en.wikipedia.org/wiki/Benford) says your entities are likely to be unevenly distributed across the directories.  Why not just hash them into a folder?  Because it's useful to be able to manually navigate to the entity you want, without searching.  (However, partitioning by least-significant digit may be inconvenient if you want to manually edit a sequential range of entities for some reason, because that range will span many directories.  If this is an important use case, perhaps there's a good compromise like using the tens digit or hundreds digit -- though I have the itching feeling that a clearly superior solution would exist.))

As things stand in terms of editing the game world, we are probably not yet at the peak entity count, but there's unlikely to be more than 3x the number of entities we have now.  Given how low the timing measurements are now, it's clear that performance will not be a factor in the ability to use this system up until shipping the game.

### Partitioning the ID Space

As I mentioned, in our engine, entity IDs are integer serial numbers.  We like this because they are easy to type (we have to type them in the editor sometimes) and at runtime, looking up an entity compiles to a fast indexing of a flat array, with a bounds check.

This introduces another problem for us to deal with in world editing, though: we need to ensure that two users, who are both creating new entities, do not both try to use the same number.  This would result in both users attempting to add completely incompatible .entity_text files with the same name.

One obvious and bulletproof solution is to have the editor connect to the network and atomically grab an ID from a central server each time one is needed.  But again, we don't want to require users to be on the network in order to edit.

My solution was a somewhat lazy one: we allocate a range of IDs to each computer that edits the world.  These are kept in a file called "id_ranges"; at startup time, the game queries its machine's MAC address, then looks in the file for the corresponding ID range; if not found, it claims a new range and adds a new line to the file:

```
 6000 10000 BC-AE-C5-66-28-E9 #Jonathan_office
10000 13000 BC-AE-C5-66-28-48 #Ignacio_office
13000 16000 00-1C-7B-75-00-D8 #Jonathan_laptop
16000 19000 BC-AE-C5-66-28-93 #Shannon_office
19000 22000 BC-AE-C5-56-42-51 #Jonathan_home
22000 25000 C0-3F-0E-AA-F3-F2 #icastano_home
25000 28000 F4-6D-04-1F-D4-36 #Shannon_home
28000 31000 Baker #Baker
31000 34000 BC-AE-C5-56-43-FE #Misc_PC_office
34000 37000 00-E0-81-B0-7A-A9 #eaa
37000 40000 00-21-00-A0-8F-E3 #Orsi
40000 43000 64-99-5D-FD-97-64 #Jonathan
43000 46000 08-86-3B-42-0B-8D #Misc
46000 49000 90-E6-BA-88-9B-B7 #andrewlackey
49000 52000 48-5B-39-8C-80-5E #eaa
52000 55000 50-E5-49-55-64-BF #facaelectrica
55000 58000 00-FF-D4-C7-15-A3 #facaelectrica
58000 70000 Clusters #Clusters
71000 75000 Overflow #Overflow
75000 78000 F4-6D-04-1F-CC-77 #Nacho
78000 81000 BC-AE-C5-74-7B-A3 #Thekla
```

On each line, everything after the # is just a comment telling us in a human-readable way whose machine is responsible for that range (it defaults to the Windows username, but we can hand-edit that if we want).

("Baker" is for an automated process, so I made a special case that uses the string "Baker" instead of the MAC address, just to minimize the potential for the build machine to claim a new range without us noticing and failing to check that in; see below.  "Clusters" is for an editor operation that is also run in an automated process, but which can also be done manually by anyone; cluster generation removes all previous clusters from the world, so if clusters didn't have their own space, you would end up frequently deleting entities in other peoples' ranges; this seems like it might be a bad idea, though maybe, in reality, it's fine and there would be no problem.  But as it stands we know that anything in the Clusters range is completely disposable, so if a conflict ever arises there we can just revert or delete those entities without a second thought.)

This ID space is naturally going to have a lot of big holes in it, but before we ship we will renumber the entities so that we can pack them tightly into an array.  In the meantime, it is sparse but not pathologically so; we can still get away with using a linear array to index the entities, though it will use more memory now than at ship.

This id_ranges file is a bit of a lazy solution, and it causes a few annoyances.  The most annoying thing is that, any time someone runs the editor for the first time on a new machine, they need to immediately check in the id_ranges file to publish their allocation to the rest of the team; and they need to coordinate so that nobody else is trying to do the same thing.  Because the editor just allocates the next 3000 IDs starting with the highest ID in the file, if two people try to allocate IDs simultaneously, they will both claim the same range.  We could solve this by requiring the editor to hold a source control lock to modify the id_ranges file, but I just haven't gotten around to it, because this hasn't been a big-enough problem.  Furthermore, we could have the editor automatically commit the changes to the file; but currently, nothing is ever published to the rest of the team automatically -- publishing always requires manual action, and this seems like it may be a good thing to preserve.

But, not having implemented these solutions, we have been taken by surprise a couple of times by interactions with a second lazy choice of this system: the fact that we file only records one MAC address per computer.

Most modern computers have multiple MAC addresses (for example: if your computer has a Wifi adapter and two Ethernet ports, it's probably got at least 3 MAC addresses).  My lazy code just asks Windows to iterate the MAC addresses and reports the first one for use in the file.  Sometimes, though, the reported address will change, which causes someone's machine to modify the id_ranges file when they didn't expect it; we had this problem once when an audio contractor, who works offsite, installed some VPN software.  If that user is not vigilant about source control (which non-technical people often aren't), it can be a while before this problem is discovered; meanwhile, that user has been creating entities that may conflict with someone else's.

Most or all occurrences of this problem could be solved by recording all of the user's MAC addresses in the file, instead of one; I just haven't done so.

If we weren't using integer serial numbers, we wouldn't really need id_ranges at all.  For example, if we looked up entities at runtime by hashing unique string identifiers, then we would only need to ensure that each user has a unique string prefix.  We take a slight overkill approach, where each entity ID is a somewhat long string starting with the user's MAC address; or we could even generate a Windows GUID for each entity.  MAC addresses are 48 bits wide.  If you concatenate the MAC address with a 4-byte integer, that's just 10 bytes per entity ID, which isn't much (we currently use 4, already!).  Of course encoding these as strings and storing them in a hash table is going to require more space, but it isn't ridiculous.  Looking things up in a hash table all the time is slower than indexing a flat array, so we are sticking with the way we do things for now; but this would solve some problems and simplify the overall system, so it sounds like the kind of decision I would change my mind on later, as computers get even faster than they currently are.  So if you implement a scheme like this, you can ignore everything I said about id_ranges.  The biggest problem becomes making it easy to type longer entity IDs into the in-game editor.

### Logistical Issues in Editor and File Format Design

In closing, I want to discuss changes we made to the editor and file format, in order to make them compatible with the paradigm of concurrent editing.

#### Arrays

Just about every game wants to serialize arrays into files.  When transitioning from a binary format, the most natural thing for a performance-minded programmer is to write the array length out first, then write each member of the array.  That way, when reading the file back, we know how much memory to allocate, and we avoid all the slow things one has to do when reading an array of unknown length.  However, encoding arrays in this way results in a textual format that always conflicts, because even when people are making compatible edits to an array, nobody is going to agree on what that array count should be; also, it becomes impossible to manually edit conflicts without typing the count in: if two people add elements to an array, the merged array will contain all the items, but neither version of the file will contain the correct count!

To solve this, of course, we go to the common text-file convention of using a syntactic designation that an array is now over, rather than pre-declaring how many elements there are.  This is obvious, but I mention it here because it is a relatively universal concern.

#### Automatic Changes

You will also want to minimize or work around cases where the editor automatically changes entity properties without user intervention, because often these will lead to conflicts.  A simple example from our game world: the sun is represented by a few entities that are instantiated in the world, a glowing disc and a couple of particle systems.  Every frame, the gameplay code positions these entities with respect to the current camera transform so that, when the player moves around the world, the sun will seem to be infinitely far away.  This happens in the editor too, because when editing we want to see the world exactly the way it will look in-game.  So, as soon as we enabled concurrent editing, everyone was checking in different coordinates for the sun (depending on where the camera happened to be when they saved!) and this caused a lot of conflicts.  My first solution was to add a hack that zeroes the position of sun entities when saving, but upon loading, this interacted badly with the way particle systems interpolate their positions.  Instead, I added an entity flag that signifies that an entity's pose doesn't matter, with respect to thinking about whether it has changed or not, so we will only modify the sun's .entity_text files if some more-important properties are modified.  (This article is already long, but I'll say that in general, we detect differences between an entity's current state and its state when it was loaded, and we only write out .entity_text files when properties have changed.)

#### Relative Transforms

In our engine, all entities have 'position' and 'orientation' properties, which always represent the entity's frame in worldspace, flat and non-hierarchically.  If we want an entity to be attached to another entity's transform, we set the properties 'mount_parent_id', 'mount_position', and 'mount_orientation' (you can see all these properties in the listing for Door #6555 above); once per frame, the game engine computes the entity's new worldspace transform based on its mount information, properly handling long dependency chains.  Once we started using textual entity files, we found that entities' worldspace coordinates would often differ by an LSB or two, even when their parents had not moved (differences especially happening, for example, between Debug and Release builds of the game).  Even without concurrent editing, it's good to clean this up as a matter of basic hygiene, because otherwise you're checking in spurious changes all the time, increasing load on the source control system and making it harder for a human to see useful information in the change list.  I chose to solve this problem by making the mount-update code more complex: it detects whether an entity has moved of its own accord, and only updates child entities' worldspace positions if the parent entity really moved (or if the child entity really moved!).

#### Terrain Editing

There is one piece of editing workflow that used to make sense before concurrent editing, but which now does not.  We have a terrain system wherein we can move control points around in worldspace, then select a terrain entity, which has a height-field mesh, and press a key to recompute that height field with respect to the new control points.  I originally made this recomputation happen only on manually-selected entities, rather than automatically on the entire world, for UI smoothness purposes: the recomputation takes some time.  But when you only recompute one block of terrain and not its neighbors, you get discontinuities in the terrain; the longer things go on, the more discontinuities you get.  Once in a while I would fix this by selecting all terrain entities in the world, recomputing them simultaneously.

[![](http://the-witness.net/news/wp-content/uploads/2011/12/discontinuity-512x322.png)](http://the-witness.net/news/wp-content/uploads/2011/12/discontinuity.png)

A terrain discontinuity

The catch is that when terrain changes, it affects other entities.  We re-plant grass, so that the grass matches the new elevations; we change the positions of trees and rocks and other objects that are rooted to the terrain at a predetermined height.  Whenever you recompute some terrain, we collect all grass/trees/rocks within a conservative bounding radius, as these are all the things that might possibly change.  When dealing with small groups of terrain blocks, this already is a bit of a recipe for trouble (it is not too hard to overlap someone else's edits this way); but it also means that if I recompute the entire terrain to eliminate those discontinuities, I am in turn editing all grass, trees, and rocks in the world, and will inevitably conflict with anyone else who has moved any of them. For now, we simply shy away from this kind of global operation; when you get a conflict in some entity that you probably didn't care about, like grass, it is easy just to accept the remote version of the file.  Long-term, I expect some kind of heavier-weight solution would have to happen here, though I hope it does not involve much locking.

#### Issuing Source Control Commands

Our editor automatically issues source control commands when entities are created or destroyed, because it would be extremely tedious and error-prone to expect users to do this.  Initially we had some problems with source control commands unexpectedly failing, which quickly leads to chaos.  After some work, issuing source control commands seems to work with full consistency, but we are still a little wary of it; so we don't, for example, want to issue the commands via a background process, adding more complexity to the system.  The problem with this is that svn commands are a bit slow.  Sometimes when I have been editing the world for a while, it can take 15 to 30 seconds to save my changes, which would have happened instantaneously without the svn commands.

### Conclusion

We've put together a system that lets us concurrently edit an open world, using source control to manage our world edits.  It works well enough for us to ship the game, so I am happy with it.  If the scheme ever fails in some way, or requires heavy modification, I will post an update!
